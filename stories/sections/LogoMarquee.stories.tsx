import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LogoMarquee } from "../../src/sections";
import { marqueeItems } from "../fixtures/sections";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { withReducedMotion } from "./motion";

/** A dark band with a row of credential chips scrolling across it, on a loop. */
const meta = {
	title: "Sections/LogoMarquee",
	component: LogoMarquee,
	args: { items: marqueeItems, ariaLabel: "What we hold" },
	globals: pin("desktop"),
} satisfies Meta<typeof LogoMarquee>;

export default meta;
type Story = StoryObj<typeof meta>;

const band = (canvas: ReturnType<typeof within>) =>
	canvas.getByRole("region", { name: "What we hold" });

/** The row moves on its own, and every credential is read once. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("the row is moving", async () => {
			const running = band(canvas)
				.getAnimations({ subtree: true })
				.filter((animation: Animation) => animation.playState === "running");
			await expect(running.length).toBeGreaterThan(0);
		});
		await step("the band stays inside the page", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
		// The track repeats every chip for the seamless loop, and nothing
		// hides the copy, so a screen reader hears each credential twice.
		await step("a screen reader hears each credential once", async () => {
			await knownBug("marquee-reads-twice", async () => {
				for (const item of marqueeItems) {
					await expect(within(band(canvas)).getAllByText(item)).toHaveLength(1);
				}
			});
		});
	},
};

/** The default name for the band, when a page names none. */
export const DefaultName: Story = {
	args: { ariaLabel: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "Credentials" })).toBeVisible();
	},
};

/**
 * Under reduced motion the row stops and wraps to a still, centered block.
 * The test run sets the reader's setting through the browser, so the sheet's
 * own media query applies.
 */
export const ReducedMotion: Story = {
	beforeEach: withReducedMotion,
	play: async ({ canvas, step }) => {
		await step("nothing moves", async () => {
			await expect(band(canvas).getAnimations({ subtree: true })).toHaveLength(0);
		});
		await step("the still block shows each credential once", async () => {
			// The loop's copy of the row is still drawn, so the still block
			// shows every chip twice.
			await knownBug("marquee-reads-twice", async () => {
				const shown = within(band(canvas))
					.getAllByText(marqueeItems[0])
					.filter((chip) => chip.getBoundingClientRect().width > 0);
				await expect(shown).toHaveLength(1);
			});
		});
	},
};

/** A phone clips the moving row to the band, never the page. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** Reduced motion on a phone: the still block wraps inside the page. */
export const ReducedMotionPhone: Story = {
	globals: pin("phone"),
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		await expect(band(canvas).getAnimations({ subtree: true })).toHaveLength(0);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** One credential: the loop still runs on a single chip. */
export const OneItem: Story = {
	args: { items: ["Since 2014"] },
};
