import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { AddressSearch, GoogleMapsAttribution } from "../../src/primitives";
import { exampleAddresses, exampleProvider } from "../fixtures/primitives";
import { expectNoSidewaysScroll, lines } from "../support/geometry";
import { pin } from "../support/viewports";

const onPick = fn();

/**
 * A text field that offers addresses as they are typed and, on a pick,
 * hands back the street, city, state, and ZIP. The suggestions come from
 * the provider a site passes; these stories use a made up one over a few
 * Fairhaven addresses.
 */
const meta = {
	title: "Primitives/AddressSearch",
	component: AddressSearch,
	args: {
		provider: exampleProvider(),
		label: "Delivery address",
		hint: "(optional)",
		placeholder: "Start typing your address",
		attribution: "Suggestions by Example Maps",
		onPick,
	},
	beforeEach: () => {
		onPick.mockClear();
	},
	decorators: [
		(Story) => (
			<div className="wrap" style={{ maxWidth: 560, paddingBlock: 24, minHeight: 360 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof AddressSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];
const field = (canvas: Canvas) => canvas.getByRole("combobox", { name: /Delivery address/ });
const alder = exampleAddresses[0] as (typeof exampleAddresses)[number];

/**
 * Typed, the suggestions drop beneath the field with the provider's credit
 * under them; the arrows move the highlight and Enter picks, filling the
 * field and handing the four parts back.
 */
export const PicksByKeyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("nothing is offered before anything is typed", async () => {
			await expect(field(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(canvas.queryByRole("listbox")).toBeNull();
		});
		await step("typing offers the matching addresses, announced by count", async () => {
			await userEvent.type(field(canvas), "418");
			const list = await canvas.findByRole("listbox", { name: "Suggestions" });
			await expect(list).toBeVisible();
			await expect(canvas.getAllByRole("option")).toHaveLength(2);
			await expect(field(canvas)).toHaveAttribute("aria-expanded", "true");
			await expect(canvas.getByText("Suggestions by Example Maps")).toBeVisible();
			await expect(canvas.getByRole("status")).toHaveTextContent("2 suggestions");
		});
		await step("the arrows move the highlight while focus stays in the field", async () => {
			await userEvent.keyboard("{ArrowDown}");
			const [first] = canvas.getAllByRole("option");
			await expect(first).toHaveAttribute("aria-selected", "true");
			await expect(field(canvas)).toHaveAttribute("aria-activedescendant", first?.id);
			await expect(field(canvas)).toHaveFocus();
		});
		await step(
			"Enter picks it: the field reads it, the list closes, the parts come back",
			async () => {
				await userEvent.keyboard("{Enter}");
				await expect(field(canvas)).toHaveValue("418 Alder Street, Fairhaven, CO 80000");
				await expect(field(canvas)).toHaveAttribute("aria-expanded", "false");
				await waitFor(() =>
					expect(onPick).toHaveBeenCalledWith({
						street: alder.street,
						city: alder.city,
						state: alder.state,
						zip: alder.zip,
					}),
				);
			},
		);
	},
};

/** A click on a suggestion picks it, and the field keeps focus. */
export const PicksByClick: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "Birch");
		await userEvent.click(await canvas.findByRole("option", { name: /12 Birch Lane/ }));
		await expect(field(canvas)).toHaveValue("12 Birch Lane, Fairhaven, CO 80001");
		await expect(field(canvas)).toHaveFocus();
		await waitFor(() => expect(onPick).toHaveBeenCalledOnce());
	},
};

/** Escape closes the list and keeps what was typed; a click elsewhere closes it too. */
export const Closes: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Escape", async () => {
			await userEvent.type(field(canvas), "418");
			await canvas.findByRole("listbox");
			await userEvent.keyboard("{Escape}");
			await expect(field(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(field(canvas)).toHaveValue("418");
			await expect(field(canvas)).toHaveFocus();
		});
		await step("Arrow Down brings the same suggestions back", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(field(canvas)).toHaveAttribute("aria-expanded", "true");
		});
		await step("a click outside", async () => {
			await userEvent.click(document.body);
			await expect(field(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(onPick).not.toHaveBeenCalled();
		});
	},
};

/**
 * An answer that comes back after a newer question was asked is dropped:
 * the first lookup here takes a second, the second a moment, and only the
 * second's suggestions ever show.
 */
export const DropsALateAnswer: Story = {
	args: { provider: exampleProvider((query) => (query === "418" ? 1000 : 0)), debounceMs: 50 },
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "418");
		await new Promise((resolve) => setTimeout(resolve, 150));
		await userEvent.type(field(canvas), "0 Cedar");
		await canvas.findByRole("option", { name: /4180 Cedar Hollow Road/ });
		await new Promise((resolve) => setTimeout(resolve, 1200));
		await expect(canvas.getAllByRole("option")).toHaveLength(1);
		await expect(canvas.queryByRole("option", { name: /418 Alder/ })).toBeNull();
	},
};

/** Nothing matches: no list, and a screen reader hears so. */
export const NothingMatches: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "Juniper");
		await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("No suggestions"));
		await expect(field(canvas)).toHaveAttribute("aria-expanded", "false");
	},
};

/** No provider: nothing renders, so the plain address fields beside it stand alone. */
export const NoProvider: Story = {
	args: { provider: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("combobox")).toBeNull();
		await expect(canvas.queryByText("Delivery address")).toBeNull();
	},
};

/** No attribution: the list ends with its last suggestion. */
export const NoAttribution: Story = {
	args: { attribution: undefined },
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "418");
		await canvas.findByRole("listbox");
		await expect(canvas.queryByText("Suggestions by Example Maps")).toBeNull();
	},
};

/** On a phone the list is as wide as the field and the page never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "418");
		const list = await canvas.findByRole("listbox");
		const fieldBox = field(canvas).getBoundingClientRect();
		const listBox = list.getBoundingClientRect();
		await expect(listBox.top).toBeGreaterThanOrEqual(fieldBox.bottom);
		await expect(listBox.right).toBeLessThanOrEqual(fieldBox.right + 1);
		await expectNoSidewaysScroll();
	},
};

/**
 * With Google's suggestions a site credits them as Google's terms ask: the
 * words "Google Maps", left untranslated, on one line, in a regular weight
 * at 12 to 16 pixels, inside the list. The suggestions here are the made up
 * provider's; no story calls Google.
 */
export const GoogleAttribution: Story = {
	args: { attribution: <GoogleMapsAttribution /> },
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(field(canvas), "418");
		const list = await canvas.findByRole("listbox");
		const credit = canvas.getByText("Google Maps");
		await expect(credit).toBeVisible();
		await expect(credit).toHaveAttribute("translate", "no");
		await expect(lines(credit)).toBe(1);
		const style = getComputedStyle(credit);
		const size = Number.parseFloat(style.fontSize);
		await expect(size).toBeGreaterThanOrEqual(12);
		await expect(size).toBeLessThanOrEqual(16);
		await expect(Number(style.fontWeight)).toBe(400);
		// In the same box as the suggestions it credits.
		await expect(list.parentElement?.contains(credit)).toBe(true);
	},
};
