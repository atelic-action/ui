import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LogoMarquee } from "../../src/sections";
import { marqueeItems } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { withReducedMotion } from "../support/motion";
import { pin } from "../support/viewports";

/**
 * Shows a set of short proofs (credentials, clients, press) a visitor should
 * register without stopping to read each one. A dark band with a row of
 * credential chips scrolling across it, on a loop.
 */
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
			await expectNoSidewaysScroll();
		});
		// The row is drawn twice for the seamless loop; the copy is hidden
		// from assistive tech, so of the two chips bearing each credential,
		// exactly one is in the accessibility tree.
		await step("a screen reader hears each credential once", async () => {
			for (const item of marqueeItems) {
				const drawn = within(band(canvas)).getAllByText(item);
				await expect(drawn).toHaveLength(2);
				await expect(drawn.filter((chip) => !chip.closest("[aria-hidden='true']"))).toHaveLength(1);
			}
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
 * The story turns the reader's setting on for its own page, so the sheet's
 * own reduced motion rules apply.
 */
export const ReducedMotion: Story = {
	beforeEach: withReducedMotion,
	play: async ({ canvas, step }) => {
		await step("nothing moves", async () => {
			await expect(band(canvas).getAnimations({ subtree: true })).toHaveLength(0);
		});
		await step("the still block shows each credential once", async () => {
			// The loop's copy is not drawn when nothing moves.
			const shown = within(band(canvas))
				.getAllByText(marqueeItems[0])
				.filter((chip) => chip.getBoundingClientRect().width > 0);
			await expect(shown).toHaveLength(1);
		});
	},
};

/** A phone clips the moving row to the band, never the page. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/** Reduced motion on a phone: the still block wraps inside the page. */
export const ReducedMotionPhone: Story = {
	globals: pin("phone"),
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		await expect(band(canvas).getAnimations({ subtree: true })).toHaveLength(0);
		// With nothing moving there is nothing to pause.
		await expect(within(band(canvas)).queryByRole("button")).toBeNull();
		await expectNoSidewaysScroll();
	},
};

/**
 * The moving row can be stopped (WCAG 2.2.2): a quiet toggle at the band's
 * edge, pressed while the row stands still, named by `pauseLabel`.
 */
export const Pause: Story = {
	args: { pauseLabel: "Pause the credentials" },
	play: async ({ canvas, userEvent, step }) => {
		const toggle = within(band(canvas)).getByRole("button", { name: "Pause the credentials" });
		const running = () =>
			band(canvas)
				.getAnimations({ subtree: true })
				.filter((animation: Animation) => animation.playState === "running");
		await step("the row moves, and the toggle is not pressed", async () => {
			await expect(toggle).toHaveAttribute("aria-pressed", "false");
			await expect(running().length).toBeGreaterThan(0);
		});
		await step("pressed, the row stands still", async () => {
			await userEvent.click(toggle);
			await expect(toggle).toHaveAttribute("aria-pressed", "true");
			await expect(running()).toHaveLength(0);
		});
		await step("pressed again by keyboard, it moves again", async () => {
			toggle.focus();
			await userEvent.keyboard("{Enter}");
			await expect(toggle).toHaveAttribute("aria-pressed", "false");
			await expect(running().length).toBeGreaterThan(0);
		});
	},
};

/** Every style rule in a list, inside its layers and media blocks. */
function styleRules(list: CSSRuleList): CSSStyleRule[] {
	return [...list].flatMap((rule) =>
		rule instanceof CSSStyleRule
			? [rule]
			: "cssRules" in rule
				? styleRules((rule as CSSGroupingRule).cssRules)
				: [],
	);
}

/**
 * Hovered, the toggle's ring brightens and its collar stays, so a chip
 * still slides under it whole rather than showing beside its edge. The test
 * browser's pointer never sets `:hover`, so the sheet's hover rule is
 * painted on the toggle itself, where it resolves against the same theme.
 */
export const PauseHovered: Story = {
	play: async ({ canvas }) => {
		const toggle = within(band(canvas)).getByRole("button", { name: "Pause" });
		const rules = [...document.styleSheets].flatMap((sheet) => styleRules(sheet.cssRules));
		const hover = rules.find((rule) => rule.selectorText === ".atelic-ui .marquee-pause:hover");
		if (!hover) throw new Error("No hover rule for the pause toggle in the page's sheets.");
		const collar = "0px 0px 0px 6px";
		const resting = getComputedStyle(toggle).boxShadow;
		await expect(resting).toContain(collar);
		toggle.style.boxShadow = hover.style.getPropertyValue("box-shadow");
		try {
			const hovered = getComputedStyle(toggle).boxShadow;
			await expect(hovered).not.toBe(resting);
			await expect(hovered).toContain(collar);
		} finally {
			toggle.style.boxShadow = "";
		}
	},
};

/** The toggle's default name, when a page names none. */
export const PauseDefaultName: Story = {
	play: async ({ canvas }) => {
		await expect(within(band(canvas)).getByRole("button", { name: "Pause" })).toBeVisible();
	},
};

/** One credential: the loop still runs on a single chip. */
export const OneItem: Story = {
	args: { items: ["Since 2014"] },
};
