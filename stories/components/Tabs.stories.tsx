import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { Tabs, type TabsItem } from "../../src/components";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const tabs: TabsItem[] = [
	{
		id: "bread",
		label: "Bread",
		content: (
			<p>
				Country sourdough daily; seeded rye on Thursdays and Saturdays. <a href="/menu">The menu</a>
			</p>
		),
	},
	{
		id: "pastry",
		label: "Pastry",
		content: (
			<>
				<p>Morning buns and croissants, gone by ten.</p>
				<p id="morning-buns">The morning buns are rolled in orange sugar.</p>
			</>
		),
	},
	{ id: "cakes", label: "Cakes", content: <p>Cakes to order, two days ahead.</p> },
];

/**
 * Clears the page's hash before a story and again after it, so no story
 * opens on a hash another left, this file's or the next one's.
 */
function clearHash() {
	const clear = () =>
		history.replaceState(null, "", window.location.pathname + window.location.search);
	clear();
	return clear;
}

/**
 * Splits a page into panels behind a row of tabs when a reader needs one panel
 * at a time, every panel staying in the page. Panels behind a row of tabs: the
 * arrows move between tabs, only the open tab takes a stop in the tab order,
 * and every panel stays in the page, hidden until found. A hash opens the tab
 * it names.
 */
const meta = {
	title: "Components/Tabs",
	component: Tabs,
	decorators: [inWrap],
	args: { tabs, ariaLabel: "What the bakery bakes" },
	beforeEach: clearHash,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A named tab list; the first tab open, its panel labeled by it, the rest hidden until found. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const list = canvas.getByRole("tablist", { name: "What the bakery bakes" });
		const [bread, pastry] = within(list).getAllByRole("tab");
		await expect(bread).toHaveAttribute("aria-selected", "true");
		await expect(pastry).toHaveAttribute("aria-selected", "false");
		const panel = canvas.getByRole("tabpanel", { name: "Bread" });
		await expect(bread).toHaveAttribute("aria-controls", panel.id);
		await expect(panel).toHaveAttribute("aria-labelledby", bread?.id);
		const hidden = document.getElementById("pastry-panel") as HTMLElement;
		await expect(hidden.getAttribute("hidden")).toBe("until-found");
	},
};

/**
 * The keyboard: Tab lands on the open tab, the arrows move and open, Home
 * and End jump to the ends, and Tab from the row goes to the panel.
 */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const [bread, pastry, cakes] = canvas.getAllByRole("tab") as HTMLElement[];
		await step("Tab lands on the open tab, the one stop in the row", async () => {
			await userEvent.tab();
			await expect(bread).toHaveFocus();
			await expect(bread).toHaveAttribute("tabindex", "0");
			await expect(pastry).toHaveAttribute("tabindex", "-1");
		});
		await step("the right arrow moves to the next tab and opens it", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(pastry).toHaveFocus();
			await expect(pastry).toHaveAttribute("aria-selected", "true");
			await expect(canvas.getByRole("tabpanel", { name: "Pastry" })).toBeVisible();
		});
		await step("End jumps to the last and Home to the first", async () => {
			await userEvent.keyboard("{End}");
			await expect(cakes).toHaveFocus();
			await expect(cakes).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{Home}");
			await expect(bread).toHaveFocus();
		});
		await step("the left arrow wraps from the first to the last", async () => {
			await userEvent.keyboard("{ArrowLeft}");
			await expect(cakes).toHaveFocus();
		});
		await step("the open tab is the row's one stop, and its panel the next", async () => {
			await expect(cakes).toHaveAttribute("tabindex", "0");
			await expect(bread).toHaveAttribute("tabindex", "-1");
			await expect(canvas.getByRole("tabpanel", { name: "Cakes" })).toHaveAttribute(
				"tabindex",
				"0",
			);
			await expect(document.getElementById("bread-panel")).toHaveAttribute("tabindex", "-1");
		});
		await step("a link in a panel hidden until found cannot take focus", async () => {
			// The test's Tab does not know `hidden="until-found"` hides a panel's
			// content, so ask the browser directly.
			const hidden = canvas.getByRole("link", { hidden: true, name: "The menu" });
			hidden.focus();
			await expect(hidden).not.toHaveFocus();
		});
	},
};

/** A click opens a tab and hides the panel it leaves. */
export const Click: Story = {
	args: { onSelect: fn() },
	play: async ({ canvas, userEvent, args }) => {
		await userEvent.click(canvas.getByRole("tab", { name: "Cakes" }));
		await expect(args.onSelect).toHaveBeenCalledWith("cakes");
		await expect(canvas.getByRole("tabpanel", { name: "Cakes" })).toBeVisible();
		await expect(document.getElementById("bread-panel")?.getAttribute("hidden")).toBe(
			"until-found",
		);
		// A click on the tab already open asks nothing. (The test's click fires
		// the press and the focus in one task, so the first pick may report
		// twice; see stories/findings/primitives.md, Checker Limits.)
		const calls = (args.onSelect as ReturnType<typeof fn>).mock.calls.length;
		await userEvent.click(canvas.getByRole("tab", { name: "Cakes" }));
		await expect(args.onSelect).toHaveBeenCalledTimes(calls);
		await expect(
			(args.onSelect as ReturnType<typeof fn>).mock.calls.every(([id]) => id === "cakes"),
		).toBe(true);
	},
};

/** `defaultId` opens a tab other than the first; one naming no tab falls back to the first. */
export const DefaultId: Story = {
	args: { defaultId: "pastry" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("tab", { name: "Pastry" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	},
};

export const UnknownDefaultId: Story = {
	args: { defaultId: "pies" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("tab", { name: "Bread" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	},
};

/** Held by the caller: the open tab follows `selectedId`, and a pick only asks. */
export const Held: Story = {
	render: (args) => {
		const [id, setId] = useState("cakes");
		return (
			<Tabs
				{...args}
				selectedId={id}
				onSelect={(next) => {
					args.onSelect?.(next);
					setId(next);
				}}
			/>
		);
	},
	args: { onSelect: fn() },
	play: async ({ canvas, userEvent, args }) => {
		await expect(canvas.getByRole("tab", { name: "Cakes" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await userEvent.click(canvas.getByRole("tab", { name: "Bread" }));
		await expect(args.onSelect).toHaveBeenCalledWith("bread");
		await expect(canvas.getByRole("tab", { name: "Bread" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	},
};

/** A hash naming a tab opens it; a hash naming an element inside a panel opens that panel. */
export const OpensFromHash: Story = {
	play: async ({ canvas, step }) => {
		await step("#cakes opens the cakes tab", async () => {
			window.location.hash = "cakes";
			await waitFor(() =>
				expect(canvas.getByRole("tab", { name: "Cakes" })).toHaveAttribute("aria-selected", "true"),
			);
		});
		await step("#morning-buns opens the panel that holds it", async () => {
			window.location.hash = "morning-buns";
			await waitFor(() =>
				expect(canvas.getByRole("tab", { name: "Pastry" })).toHaveAttribute(
					"aria-selected",
					"true",
				),
			);
			await expect(canvas.getByText(/orange sugar/)).toBeVisible();
		});
	},
};

/** On a phone a row of many tabs wraps rather than scrolling the page sideways. */
export const ManyTabsOnPhone: Story = {
	globals: pin("phone"),
	args: {
		tabs: [
			...tabs,
			{ id: "wholesale", label: "Wholesale for cafes", content: <p>Standing orders.</p> },
			{ id: "catering", label: "Catering", content: <p>Trays for twenty.</p> },
			{ id: "allergens", label: "Allergens and ingredients", content: <p>Every loaf, listed.</p> },
		],
	},
	play: async ({ canvas }) => {
		const [first, , , , , last] = canvas.getAllByRole("tab") as HTMLElement[];
		await expect(last?.getBoundingClientRect().top).toBeGreaterThan(
			first?.getBoundingClientRect().top ?? 0,
		);
		await expectNoSidewaysScroll();
	},
};
