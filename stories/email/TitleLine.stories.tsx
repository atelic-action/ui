import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
	accentInk,
	Card,
	contrastRatio,
	EmailThemeProvider,
	type Palette,
	Row,
	TitleLine,
} from "../../src/email";
import { atelicPalette } from "../../src/tokens";
import { lines } from "../support/geometry";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** A computed `rgb(r, g, b)` as a hex color. */
function hex(rgb: string): string {
	const [r, g, b] = (rgb.match(/\d+/g) ?? []).map(Number);
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** The color an element's words are painted on: its nearest ancestor with a fill. */
function groundOf(element: Element): string {
	for (let node: Element | null = element; node; node = node.parentElement) {
		const fill = getComputedStyle(node).backgroundColor;
		if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") return hex(fill);
	}
	return "#ffffff";
}

/** The ratio of an element's words to what they sit on, as painted. */
function painted(element: Element) {
	const ink = hex(getComputedStyle(element).color);
	return { ink, ratio: contrastRatio(ink, groundOf(element)) ?? 0 };
}

/** A client palette that names an accent and no ink for its words; the accent fails as words. */
const accentOnly: Palette = { ...atelicPalette, accentInk: undefined, accent: "#1FA38A" };

/**
 * A name on the left and the one value that matters on the right, in the
 * accent's ink: the palette's `accentInk`, since the bright accent fails as
 * small words. On a card by default; `parameters.onGround` sets it straight
 * on the email's ground.
 */
const meta = {
	title: "Email/TitleLine",
	component: TitleLine,
	decorators: [
		(Story, context) =>
			context.parameters.onGround ? (
				<tr>
					<td style={{ padding: "0 8px" }}>
						<Story />
					</td>
				</tr>
			) : (
				<Card>
					<Row last>
						<Story />
					</Row>
				</Card>
			),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { name: "Larkspur Coffee Bar", right: "4 trays" },
	globals: pin("desktop"),
} satisfies Meta<typeof TitleLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name and the value share the line, the value at the right edge. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const name = canvas.getByText("Larkspur Coffee Bar").getBoundingClientRect();
		const value = canvas.getByText("4 trays").getBoundingClientRect();
		await expect(value.left).toBeGreaterThanOrEqual(name.right);
		await fitsTheColumn(canvasElement);
	},
};

/** On a phone a long name wraps and the value stays whole on the right. */
export const LongNamePhone: Story = {
	args: {
		name: "The Alder Street Reading Room and Tea House at the Old Mill",
		right: "paused 41d",
	},
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await expect(lines(canvas.getByText("paused 41d"))).toBe(1);
		await expect(lines(canvas.getByText(/The Alder Street/))).toBeGreaterThan(1);
		await fitsTheColumn(canvasElement);
	},
};

/** The value is set in the accent's ink, 5.86 to 1 on the card's paper. */
export const InkOnPaper: Story = {
	play: async ({ canvas }) => {
		const { ink, ratio } = painted(canvas.getByText("4 trays"));
		await expect(ink).toBe(atelicPalette.accentInk?.toLowerCase());
		await expect(groundOf(canvas.getByText("4 trays"))).toBe(atelicPalette.paper.toLowerCase());
		await expect(ratio).toBeGreaterThanOrEqual(4.5);
	},
};

/** Straight on the email's ground, the deeper cream, the ink still reads 5.38 to 1. */
export const InkOnTheGround: Story = {
	parameters: { onGround: true },
	play: async ({ canvas }) => {
		const { ink, ratio } = painted(canvas.getByText("4 trays"));
		await expect(ink).toBe(atelicPalette.accentInk?.toLowerCase());
		await expect(groundOf(canvas.getByText("4 trays"))).toBe(atelicPalette.ground.toLowerCase());
		await expect(ratio).toBeGreaterThanOrEqual(4.5);
	},
};

/**
 * A client palette that names only its accent, a bright teal that fails as
 * words, gets an ink derived from it: the same hue darkened until it reads
 * 4.5 to 1 on both the paper and the ground.
 */
export const AccentOnlyPalette: Story = {
	decorators: [
		(Story) => (
			<EmailThemeProvider palette={accentOnly}>
				<Story />
			</EmailThemeProvider>
		),
	],
	play: async ({ canvas }) => {
		await expect(contrastRatio(accentOnly.accent, accentOnly.paper)).toBeLessThan(4.5);
		const derived = accentInk(accentOnly);
		const { ink, ratio } = painted(canvas.getByText("4 trays"));
		await expect(ink).toBe(derived.toLowerCase());
		await expect(ink).not.toBe(accentOnly.accent.toLowerCase());
		await expect(ratio).toBeGreaterThanOrEqual(4.5);
		await expect(contrastRatio(derived, accentOnly.ground)).toBeGreaterThanOrEqual(4.5);
	},
};
