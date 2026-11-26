import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { ContactDock } from "../../src/chrome";
import { dock } from "../fixtures/bakery";
import { expectNoSidewaysScroll, lines } from "../support/geometry";
import { PageBehind } from "../support/page";
import { pin } from "../support/viewports";

/**
 * Keeps a way to reach the business floating within reach on every page, for a
 * site that wants contact one press away. The floating launcher and its panel
 * of the ways to reach the business. How it rides above the sticky bar and the
 * footer is proven on a whole page, in SiteShell's stories; these cover the
 * launcher and the panel on their own.
 */
const meta = {
	title: "Chrome/ContactDock",
	component: ContactDock,
	args: { ...dock, avoid: null },
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ContactDock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The launcher, by its words: "Talk to us" closed, "Close" open. The panel's
 * own close button is "Close panel", so the two never share a name.
 */
const launcher = (canvas: ReturnType<typeof within>, name = "Talk to us") =>
	canvas.getByRole("button", { name, expanded: name !== "Talk to us" });

export const Closed: Story = {
	play: async ({ canvas }) => {
		await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
		await expect(canvas.queryByRole("region", { name: "How can we help?" })).toBeNull();
		// The corner inset on a desktop: 24 pixels from the right and the bottom.
		const box = launcher(canvas).getBoundingClientRect();
		await expect(Math.round(window.innerWidth - box.right)).toBe(24);
		await expect(Math.round(window.innerHeight - box.bottom)).toBe(24);
	},
};

export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const panel = () => canvas.getByRole("region", { name: "How can we help?" });
		await step("the launcher opens the panel and focus moves into it", async () => {
			await userEvent.click(launcher(canvas));
			await expect(panel()).toBeVisible();
			await expect(launcher(canvas, "Close")).toHaveAttribute("aria-expanded", "true");
			await waitFor(() =>
				expect(within(panel()).getByRole("button", { name: "Close panel" })).toHaveFocus(),
			);
			await expect(within(panel()).getAllByRole("listitem")).toHaveLength(4);
		});
		await step("the panel's close button closes it and focus returns to the launcher", async () => {
			await userEvent.click(within(panel()).getByRole("button", { name: "Close panel" }));
			await expect(canvas.queryByRole("region", { name: "How can we help?" })).toBeNull();
			await expect(launcher(canvas)).toHaveFocus();
		});
		await step("the launcher, open, closes it again", async () => {
			await userEvent.click(launcher(canvas));
			await userEvent.click(launcher(canvas, "Close"));
			await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
		});
		await step("Escape closes it and focus returns to the launcher", async () => {
			await userEvent.click(launcher(canvas));
			await userEvent.keyboard("{Escape}");
			await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(launcher(canvas)).toHaveFocus();
		});
		await step("a click outside closes it", async () => {
			await userEvent.click(launcher(canvas));
			await userEvent.click(canvas.getByRole("heading", { level: 1 }));
			await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
		});
		await step("following an item closes it", async () => {
			await userEvent.click(launcher(canvas));
			const order = within(panel()).getByRole("link", { name: /Order ahead/ });
			await expect(order).toHaveAttribute("href", "/order");
			await userEvent.click(order);
			await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
		});
		await step("the call item is a tel link that never opens a tab", async () => {
			await userEvent.click(launcher(canvas));
			const call = within(panel()).getByRole("link", { name: /Call \(555\) 555-0142/ });
			await expect(call).toHaveAttribute("href", "tel:+15555550142");
			await expect(call).not.toHaveAttribute("target");
		});
	},
};

/** An item with `onSelect` is a button for something already on the page, such as a chat window. */
export const SelectItem: Story = {
	args: {
		items: [
			{
				label: "Chat with us",
				description: "Usually answers in minutes",
				icon: "chat",
				onSelect: fn(),
			},
			...dock.items.slice(1),
		],
	},
	play: async ({ canvas, userEvent, args }) => {
		await userEvent.click(launcher(canvas));
		await userEvent.click(canvas.getByRole("button", { name: /Chat with us/ }));
		await expect(args.items[0]?.onSelect).toHaveBeenCalledOnce();
		await expect(launcher(canvas)).toHaveAttribute("aria-expanded", "false");
	},
};

/** On a phone the launcher is its icon (still named) and the panel a sheet across the bottom. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		const button = launcher(canvas);
		const box = button.getBoundingClientRect();
		await expect(Math.round(box.width)).toBe(52);
		await expect(Math.round(window.innerWidth - box.right)).toBe(16);
		await userEvent.click(button);
		const sheet = canvas.getByRole("region", { name: "How can we help?" }).getBoundingClientRect();
		await expect(Math.round(sheet.left)).toBe(0);
		await expect(Math.round(sheet.right)).toBe(window.innerWidth);
		await expect(Math.round(sheet.bottom)).toBe(window.innerHeight);
	},
};

/** A preview of the open state: open from the first paint, with focus left where it was. */
export const DefaultOpen: Story = {
	args: { defaultOpen: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "How can we help?" })).toBeVisible();
		await expect(document.body).toHaveFocus();
	},
};

/** The heading falls back to the launcher's words, and the footnote is optional. */
export const Minimal: Story = {
	args: { title: undefined, subtitle: undefined, footnote: undefined, defaultOpen: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "Talk to us" })).toBeVisible();
	},
};

/** The longest realistic panel: long words on every item. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		defaultOpen: true,
		items: dock.items.map((item) => ({
			...item,
			description: `${item.description}, and on holiday weekends by appointment at the counter`,
		})),
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * A call row whose line is long: the row wraps its words inside the panel,
 * and only the number in it holds whole.
 */
export const CallRowLongDescription: Story = {
	args: {
		defaultOpen: true,
		items: [
			{
				label: "Call (555) 555-0142",
				description:
					"Seven to three, Tuesday to Sunday, and a baker answers whenever the ovens allow it",
				icon: "phone",
				href: "tel:+15555550142",
				lead: true,
			},
			...dock.items.slice(2),
		],
	},
	play: async ({ canvas }) => {
		const panel = canvas.getByRole("region", { name: "How can we help?" });
		const row = within(panel).getByRole("link", { name: /Call \(555\) 555-0142/ });
		const line = within(row).getByText(/Seven to three/);
		const edge = panel.getBoundingClientRect().right;
		await expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
		await expect(lines(line)).toBeGreaterThan(1);
		// The number, and the number alone, holds on one line.
		await expect(lines(within(row).getByText("(555) 555-0142"))).toBe(1);
	},
};

/**
 * Under a brand's headline tokens (here every heading set uppercase and
 * light), the panel's title keeps its own case and weight: it is a heading
 * by role, a small label the page's heading style never reaches.
 */
export const TitleUnderHeadingTokens: Story = {
	args: { defaultOpen: true },
	decorators: [
		(Story) => (
			<div
				style={{ "--heading-transform": "uppercase", "--heading-weight": "300" } as CSSProperties}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { name: "How can we help?", level: 2 });
		await expect(getComputedStyle(title).textTransform).toBe("none");
		await expect(getComputedStyle(title).fontWeight).toBe("700");
		await expect(canvas.getByRole("region", { name: "How can we help?" })).toBeVisible();
	},
};
