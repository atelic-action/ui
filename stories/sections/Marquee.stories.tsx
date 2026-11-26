import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { StarRow } from "../../src/primitives";
import { Marquee, ProofFact } from "../../src/sections";
import { longProofFacts, proofFacts } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { withReducedMotion } from "../support/motion";
import { pin } from "../support/viewports";

const facts = [
	<ProofFact
		key="rating"
		value={
			<>
				4.9 <StarRow rating={5} size={15} />
			</>
		}
		label="212 reviews"
	/>,
	...proofFacts.map((fact) => <ProofFact key={fact.value} value={fact.value} label={fact.label} />),
];

/**
 * Scrolls a row of anything (short facts, logos, lines, links) without end,
 * for proof a visitor should register without stopping to read each item.
 * Each child is one item, set apart by a hairline; the row repeats until the
 * loop shows no gap, moves at a pace in pixels a second, stops under a quiet
 * toggle or a resting pointer, and stands still for a reader who asks for
 * less motion.
 */
const meta = {
	title: "Sections/Marquee",
	component: Marquee,
	args: { ariaLabel: "Why the line is long", children: facts },
	globals: pin("desktop"),
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

const band = (canvas: ReturnType<typeof within>, name = "Why the line is long") =>
	canvas.getByRole("region", { name });
const running = (element: HTMLElement) =>
	element
		.getAnimations({ subtree: true })
		.filter((animation: Animation) => animation.playState === "running");
/** The row's lists: the one read aloud first, then its copies. */
const rows = (element: HTMLElement) =>
	[...element.querySelectorAll("ul")].filter((list) => !list.closest("li"));

/** Proof facts scrolling across the band, each read once, with no gap in the loop. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		const region = band(canvas);
		await step("the row is moving", async () => {
			await expect(running(region).length).toBeGreaterThan(0);
		});
		await step("a screen reader hears each fact once, in one list", async () => {
			await expect(within(region).getAllByRole("list")).toHaveLength(1);
			await expect(within(region).getAllByRole("listitem")).toHaveLength(facts.length);
			const drawn = within(region).getAllByText("Since 2014");
			await expect(drawn.length).toBeGreaterThanOrEqual(2);
			await expect(drawn.filter((fact) => !fact.closest("[aria-hidden='true']"))).toHaveLength(1);
		});
		await step("the copies cover the band and one row more, so the loop never gaps", async () => {
			const lists = rows(region);
			const width = lists[0].getBoundingClientRect().width;
			const total = lists.reduce((sum, list) => sum + list.getBoundingClientRect().width, 0);
			await expect(total).toBeGreaterThanOrEqual(region.getBoundingClientRect().width + width - 1);
		});
		await step("one loop takes the row's width over the pace, 60 pixels a second", async () => {
			const first = rows(region)[0];
			const seconds = Number.parseFloat(getComputedStyle(first).animationDuration);
			await expect(seconds).toBeCloseTo(first.getBoundingClientRect().width / 60, 1);
		});
		await step("the band stays inside the page", async () => {
			await expectNoSidewaysScroll();
		});
	},
};

/** Twice the pace: a loop takes half as long for the same row. */
export const Faster: Story = {
	args: { speed: 120 },
	play: async ({ canvas }) => {
		const first = rows(band(canvas))[0];
		const seconds = Number.parseFloat(getComputedStyle(first).animationDuration);
		await expect(seconds).toBeCloseTo(first.getBoundingClientRect().width / 120, 1);
	},
};

/** The longest facts: a longer row, at the same pace, so its loop simply takes longer. */
export const LongestContent: Story = {
	args: {
		children: longProofFacts.map((fact) => (
			<ProofFact key={fact.value} value={fact.value} label={fact.label} />
		)),
	},
	play: async ({ canvas }) => {
		const lists = rows(band(canvas));
		const width = lists[0].getBoundingClientRect().width;
		await expect(width).toBeGreaterThan(window.innerWidth);
		// Wider than the band, the loop needs only its pair.
		await expect(lists).toHaveLength(2);
		const seconds = Number.parseFloat(getComputedStyle(lists[0]).animationDuration);
		await expect(seconds).toBeCloseTo(width / 60, 1);
		await expectNoSidewaysScroll();
	},
};

/** Without dividers the items sit apart on space alone. */
export const NoDividers: Story = {
	args: { dividers: false },
	play: async ({ canvas }) => {
		const item = within(band(canvas)).getAllByRole("listitem")[0];
		await expect(getComputedStyle(item).borderRightStyle).toBe("none");
	},
};

/** A single short item still loops, drawn as often as the band needs. */
export const OneItem: Story = {
	args: { children: <ProofFact value="Since 2014" label="On Alder Street" /> },
	play: async ({ canvas }) => {
		const region = band(canvas);
		const lists = rows(region);
		await expect(lists.length).toBeGreaterThan(2);
		await expect(within(region).getAllByRole("listitem")).toHaveLength(1);
		await expect(running(region).length).toBeGreaterThan(0);
	},
};

/** The band's name when a page gives none. */
export const DefaultName: Story = {
	args: { ariaLabel: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "Highlights" })).toBeVisible();
	},
};

/** The toggle stops and restarts the row (WCAG 2.2.2), named by `pauseLabel`. */
export const Pause: Story = {
	args: { pauseLabel: "Pause the facts" },
	play: async ({ canvas, userEvent, step }) => {
		const region = band(canvas);
		const toggle = within(region).getByRole("button", { name: "Pause the facts" });
		await step("pressed, the row stands still", async () => {
			await userEvent.click(toggle);
			await expect(toggle).toHaveAttribute("aria-pressed", "true");
			await expect(running(region)).toHaveLength(0);
		});
		await step("pressed again by keyboard, it moves again", async () => {
			toggle.focus();
			await userEvent.keyboard("{Enter}");
			await expect(toggle).toHaveAttribute("aria-pressed", "false");
			await expect(running(region).length).toBeGreaterThan(0);
		});
	},
};

const links = [
	<a key="order" href="/order">
		Order ahead
	</a>,
	<a key="menu" href="/menu">
		See the menu
	</a>,
	<a key="visit" href="/visit">
		Visit the shop
	</a>,
];

/**
 * A row of links: only the first copy takes focus, and focus inside the row
 * holds it still, as a resting pointer does, so a link never slides away
 * from the reader.
 */
export const Links: Story = {
	args: { ariaLabel: "Ways in", children: links },
	play: async ({ canvas, step }) => {
		const region = band(canvas, "Ways in");
		await step("each link is reachable once", async () => {
			await expect(within(region).getAllByRole("link", { name: "Order ahead" })).toHaveLength(1);
			const copy = [...region.querySelectorAll("a")].filter((link) =>
				link.closest("[aria-hidden='true']"),
			)[0];
			copy.focus();
			await expect(copy).not.toHaveFocus();
		});
		await step("focus inside the row holds it still", async () => {
			within(region).getByRole("link", { name: "Order ahead" }).focus();
			await expect(running(region)).toHaveLength(0);
		});
	},
};

/** With `pauseOnHover` off, focus inside the row leaves it moving. */
export const NoPauseOnHover: Story = {
	args: { ariaLabel: "Ways in", children: links, pauseOnHover: false },
	play: async ({ canvas }) => {
		const region = band(canvas, "Ways in");
		within(region).getByRole("link", { name: "Order ahead" }).focus();
		await expect(running(region).length).toBeGreaterThan(0);
	},
};

/** A phone clips the moving row to the band, never the page. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * Under reduced motion nothing moves: one copy shows, the toggle goes, and a
 * row wider than the band scrolls sideways inside it, taking focus so a
 * keyboard can scroll it too.
 */
export const ReducedMotion: Story = {
	globals: pin("phone"),
	beforeEach: withReducedMotion,
	play: async ({ canvas, step }) => {
		const region = band(canvas);
		await step("nothing moves, and there is nothing to pause", async () => {
			await expect(region.getAnimations({ subtree: true })).toHaveLength(0);
			await expect(within(region).queryByRole("button")).toBeNull();
		});
		await step("each fact shows once", async () => {
			const shown = within(region)
				.getAllByText("Since 2014")
				.filter((fact) => fact.getBoundingClientRect().width > 0);
			await expect(shown).toHaveLength(1);
		});
		await step("the row scrolls sideways inside its band, and takes focus", async () => {
			const scroller = rows(region)[0].parentElement?.parentElement as HTMLElement;
			await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
			await expect(scroller).toHaveAttribute("tabindex", "0");
			await expectNoSidewaysScroll();
		});
	},
};

/** Under reduced motion a row that fits its band takes no focus, since there is nothing to scroll. */
export const ReducedMotionFits: Story = {
	args: { children: <ProofFact value="Since 2014" label="On Alder Street" /> },
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		const region = band(canvas);
		const scroller = rows(region)[0].parentElement?.parentElement as HTMLElement;
		await expect(scroller).not.toHaveAttribute("tabindex");
	},
};
