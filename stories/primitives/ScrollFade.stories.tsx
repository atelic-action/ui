import type { Meta, StoryObj } from "@storybook/react-vite";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, waitFor } from "storybook/test";
import { ScrollFade } from "../../src/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const longText =
	"Every loaf on the shelf was mixed the night before and baked from four in the morning, so the first ones out of the oven are still warm when the door opens at seven. We bake rye on Tuesdays and Fridays, the seeded spelt on weekends, and a short run of sweet buns whenever the plums are good. A standing order holds your loaves behind the counter until noon, and a call before ten moves it to the next day. The cafes on Alder Street take the morning bake at five, sliced or whole, with a note of what changed since the day before. When the ovens went down for a week in the summer we called every standing order ourselves, and the loaf that came back was better than the one before.";

const shortText = "The rye is the best in town, and the line is worth it.";

/**
 * Holds text that may run long in a box of fixed greatest height, scrolling
 * inside it rather than growing the page, for a card that must keep one
 * height. The box shows its lines (or a length), scrolls the rest with no
 * scrollbar drawn, and fades each edge that has more beyond it; while it
 * scrolls it is a named region a keyboard can reach.
 */
const meta = {
	title: "Primitives/ScrollFade",
	component: ScrollFade,
	args: { children: <p>{longText}</p>, lines: 4, ariaLabel: "The bakery's note" },
	decorators: [
		(Story) => (
			<div className="wrap" style={{ maxWidth: 520, paddingBlock: 24 }}>
				<button type="button">Before</button>
				<div style={{ marginBlock: 16 }}>
					<Story />
				</div>
				<button type="button">After</button>
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ScrollFade>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];

/** The scrolling box, reached from its words: a box that fits has no role to find it by. */
const boxOf = (canvas: Canvas, words: RegExp) =>
	canvas.getByText(words).closest("[style]") as HTMLElement;

/** Which edges the mask fades, read from the stops it is drawn with. */
const fades = (box: HTMLElement) => {
	const style = getComputedStyle(box);
	return {
		top: style.getPropertyValue("--_sf-from").trim() !== "0px",
		bottom: style.getPropertyValue("--_sf-to").trim() !== "100%",
	};
};

/**
 * Longer than its four lines: the box holds them, the rest scrolls inside
 * it, the bottom fades, and it is a named tab stop between the two buttons.
 */
export const Overflowing: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const region = await canvas.findByRole("region", { name: "The bakery's note" });
		await step("four lines show, and more waits below, faded", async () => {
			const lineHeight = Number.parseFloat(getComputedStyle(region).lineHeight);
			await expect(region.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 4 + 1);
			await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
			await expect(fades(region)).toEqual({ top: false, bottom: true });
		});
		await step("no scrollbar takes any room", async () => {
			await expect(region.offsetWidth - region.clientWidth).toBe(0);
		});
		await step("Tab reaches it after the first button, and goes on to the next", async () => {
			canvas.getByRole("button", { name: "Before" }).focus();
			await userEvent.tab();
			await expect(region).toHaveFocus();
			await userEvent.tab();
			await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
		});
	},
};

/** Scrolled partway, both edges fade; at the end, only the top does. */
export const Scrolled: Story = {
	play: async ({ canvas, step }) => {
		const region = await canvas.findByRole("region", { name: "The bakery's note" });
		await step("partway down, more lies above and below", async () => {
			region.scrollTo({ top: 20, behavior: "instant" });
			await waitFor(() => expect(fades(region)).toEqual({ top: true, bottom: true }));
		});
		await step("at the end, only the top fades", async () => {
			region.scrollTo({ top: region.scrollHeight, behavior: "instant" });
			await waitFor(() => expect(fades(region)).toEqual({ top: true, bottom: false }));
		});
		await step("back at the top, only the bottom fades", async () => {
			region.scrollTo({ top: 0, behavior: "instant" });
			await waitFor(() => expect(fades(region)).toEqual({ top: false, bottom: true }));
		});
	},
};

/** Text that fits: no fade at either edge, no region, and no tab stop. */
export const Fits: Story = {
	args: { children: <p>{shortText}</p> },
	play: async ({ canvas, userEvent }) => {
		const box = boxOf(canvas, /The rye is the best/);
		await expect(fades(box)).toEqual({ top: false, bottom: false });
		await expect(canvas.queryByRole("region")).toBeNull();
		canvas.getByRole("button", { name: "Before" }).focus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
	},
};

/** A length in place of lines: the box stops at 6rem. */
export const MaxHeight: Story = {
	args: { maxHeight: "6rem" },
	play: async ({ canvas }) => {
		const region = await canvas.findByRole("region", { name: "The bakery's note" });
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		await expect(Math.round(region.getBoundingClientRect().height)).toBe(Math.round(6 * rem));
	},
};

/** On a dark band: the fade is a mask, so the words fade into whatever ground is behind them. */
export const OnDark: Story = {
	decorators: [
		(Story) => (
			<div data-ground="dark" style={{ background: "var(--ink)", color: "var(--on-dark)" }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const region = await canvas.findByRole("region", { name: "The bakery's note" });
		await expect(fades(region)).toEqual({ top: false, bottom: true });
	},
};

/** On a phone the box keeps its lines and the page never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await canvas.findByRole("region", { name: "The bakery's note" });
		await expectNoSidewaysScroll();
	},
};

/**
 * Prerendered, before the script runs: a box that fits shows every word
 * with no fade, and one that overflows already scrolls. Hydrating changes
 * neither box's size.
 */
export const BeforeHydration: Story = {
	args: { children: <p>{shortText}</p> },
	play: async ({ canvas, step }) => {
		// Beside the story's own box, inside the frame the package's sheets style.
		const holder = document.createElement("div");
		canvas.getByRole("button", { name: "After" }).before(holder);
		const element = (
			<>
				<ScrollFade lines={4}>
					<p>{shortText}</p>
				</ScrollFade>
				<ScrollFade lines={4}>
					<p>{longText}</p>
				</ScrollFade>
			</>
		);
		holder.innerHTML = renderToString(element);
		const [fits, overflows] = Array.from(holder.querySelectorAll<HTMLElement>("[style]"));
		const heights = () => [fits, overflows].map((box) => box.getBoundingClientRect().height);
		const before = heights();
		await step("the box that fits shows its words with no fade", async () => {
			await expect(fades(fits)).toEqual({ top: false, bottom: false });
			await expect(fits.scrollHeight).toBe(fits.clientHeight);
		});
		await step("the box that overflows is unfaded and already scrolls", async () => {
			await expect(fades(overflows)).toEqual({ top: false, bottom: false });
			overflows.scrollTop = 30;
			await expect(overflows.scrollTop).toBeGreaterThan(0);
			overflows.scrollTop = 0;
		});
		await step("hydrated, only the overflowing box fades, and neither moves", async () => {
			const root = hydrateRoot(holder, element);
			await waitFor(() => expect(fades(overflows)).toEqual({ top: false, bottom: true }));
			await expect(fades(fits)).toEqual({ top: false, bottom: false });
			await expect(heights()).toEqual(before);
			root.unmount();
			holder.remove();
		});
	},
};
