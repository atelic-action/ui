import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, type within } from "storybook/test";
import { ClosingBar, Copyright } from "../../src/chrome";
import { expectNoSidewaysScroll, lines, textLeft } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Closes every page with a thin line whose two sides each take anything, by
 * default the copyright and the credit. The line that closes every page: two
 * sides, each taking anything.
 */
const meta = {
	title: "Chrome/ClosingBar",
	component: ClosingBar,
	args: { name: "Kestrel Hollow Bakehouse" },
} satisfies Meta<typeof ClosingBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default sides: the copyright with the name, and the practice's credit. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
		const credit = canvas.getByRole("link", { name: "Atelic" });
		await expect(credit).toHaveAttribute("href", "https://atelic.me");
		await expect(credit).toHaveAttribute("target", "_blank");
	},
};

/** With nothing on the left, the credit sits alone, centered. */
export const CreditAlone: Story = {
	args: { name: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/©/)).toBeNull();
		const credit = canvas.getByText(/Made with/);
		const { left, right } = credit.getBoundingClientRect();
		const middle = (left + right) / 2;
		await expect(Math.abs(middle - window.innerWidth / 2)).toBeLessThan(2);
	},
};

/** `null` empties a side: the copyright alone. */
export const CopyrightAlone: Story = {
	args: { right: null },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Atelic" })).toBeNull();
	},
};

/** Each side takes anything: an attribution on the left and a site's own note on the right. */
export const CustomSides: Story = {
	args: {
		left: <Copyright name="Kestrel Hollow Bakehouse" attribution="A family bakery" />,
		right: "Baked in Fairhaven since 2014",
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Baked in Fairhaven since 2014")).toBeVisible();
	},
};

/** Both sides empty renders nothing at all. */
export const Empty: Story = {
	args: { name: undefined, right: null },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.textContent).toBe("");
	},
};

/** The credit's link sits in a sentence, so it is underlined, not marked by color alone. */
export const CreditLinkUnderlined: Story = {
	play: async ({ canvas }) => {
		const credit = canvas.getByRole("link", { name: "Atelic" });
		await expect(getComputedStyle(credit).textDecorationLine).toBe("underline");
	},
};

/** A copyright long enough to wrap inside itself on a phone. */
const longCopyright = (
	<Copyright
		name="Kestrel Hollow Bakehouse"
		attribution="A family bakery on Alder Street, run by the same two bakers since the ovens first lit"
	/>
);

/**
 * Checks the two sides stacked: the right side under the left, and both
 * starting at one edge, the copyright first. Each side is reached by its
 * words, since a side has no role of its own.
 */
async function expectStacked(canvas: ReturnType<typeof within>, right: RegExp) {
	const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
	const other = canvas.getByText(right);
	await expect(copyright.getBoundingClientRect().bottom).toBeLessThanOrEqual(
		other.getBoundingClientRect().top,
	);
	await expect(Math.abs(textLeft(copyright) - textLeft(other))).toBeLessThan(1);
	await expectNoSidewaysScroll();
}

/** On a desktop the two sides share one line, the copyright at the start and the credit at the end. */
export const OneLineDesktop: Story = {
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
		const credit = canvas.getByText(/Made with/);
		await expect(Math.round(copyright.getBoundingClientRect().top)).toBe(
			Math.round(credit.getBoundingClientRect().top),
		);
		await expect(credit.getBoundingClientRect().left).toBeGreaterThan(window.innerWidth / 2);
	},
};

/**
 * On a phone the two sides do not fit one line, so the credit wraps under
 * the copyright and both start at one edge, where the credit used to sit at
 * the right of its own line and the two lines zigzagged.
 */
export const StackedPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectStacked(canvas, /Made with/);
	},
};

/** The same at 320. */
export const StackedSmallPhone: Story = {
	globals: pin("smallPhone"),
	play: async ({ canvas }) => {
		await expectStacked(canvas, /Made with/);
	},
};

/** A long copyright with its attribution wraps inside itself, and the credit still starts at its edge. */
export const LongCopyrightPhone: Story = {
	args: { left: longCopyright },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(lines(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/))).toBeGreaterThan(1);
		await expectStacked(canvas, /Made with/);
	},
};

/** The same at 320. */
export const LongCopyrightSmallPhone: Story = {
	...LongCopyrightPhone,
	globals: pin("smallPhone"),
};

/** A site's note in place of the credit stacks the same way. */
export const NotePhone: Story = {
	args: { right: "Baked in Fairhaven since 2014, every day but Monday" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expectStacked(canvas, /Baked in Fairhaven/);
	},
};

/** The note at 320, under a long copyright. */
export const NoteSmallPhone: Story = {
	args: { left: longCopyright, right: "Baked in Fairhaven since 2014, every day but Monday" },
	globals: pin("smallPhone"),
	play: async ({ canvas }) => {
		await expectStacked(canvas, /Baked in Fairhaven/);
	},
};

/** With neither a credit nor a note, the copyright alone starts at the page's edge, as a stacked one does. */
export const CopyrightAlonePhone: Story = {
	args: { left: longCopyright, right: null },
	globals: pin("smallPhone"),
	play: async ({ canvas, canvasElement }) => {
		const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
		const line = canvasElement.querySelector(".closing-bar") as HTMLElement;
		await expect(textLeft(copyright)).toBeLessThan(line.getBoundingClientRect().width / 4);
		await expectNoSidewaysScroll();
	},
};

/** The rule above the bar, which has no role; reached from the bar's own words. */
function rule(canvasElement: HTMLElement) {
	const bar = canvasElement.querySelector(".closing-bar") as HTMLElement;
	return { bar, before: getComputedStyle(bar, "::before") };
}

/** The rule runs the bar's full width by default, as before. */
export const RuleFullWidth: Story = {
	globals: pin("desktop"),
	play: async ({ canvasElement }) => {
		const { bar, before } = rule(canvasElement);
		await expect(before.left).toBe("0px");
		await expect(Number.parseFloat(before.width)).toBeCloseTo(bar.getBoundingClientRect().width, 0);
		await expect(before.height).toBe("1px");
	},
};

/**
 * `--closing-rule-inset` sets the rule in from each side; at the wrap's edge
 * it starts where the copyright's words do.
 */
export const RuleInsideTheContent: Story = {
	globals: pin("desktop"),
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--closing-rule-inset":
							"max(var(--gutter), calc((100% - var(--max-width)) / 2 + var(--gutter)))",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, canvasElement }) => {
		const { bar, before } = rule(canvasElement);
		const copyright = canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/);
		const ruleLeft = bar.getBoundingClientRect().left + Number.parseFloat(before.left);
		await expect(Math.abs(ruleLeft - textLeft(copyright))).toBeLessThan(1);
	},
};
