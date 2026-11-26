import type { Meta, StoryObj } from "@storybook/react-vite";
import { Croissant } from "lucide-react";
import { expect } from "storybook/test";
import { Bubble } from "../../src/primitives";
import { onDarkBand } from "./support";

/**
 * Holds an icon or a step number in a round tile beside a heading, as
 * decoration. A round tile holding an icon or a step number, set beside a
 * heading. It is decoration, hidden from a screen reader, so the heading
 * beside it carries the meaning.
 */
const meta = {
	title: "Primitives/Bubble",
	component: Bubble,
	parameters: { layout: "padded" },
	args: { icon: <Croissant size={22} /> },
} satisfies Meta<typeof Bubble>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An icon, the default 48 pixel size, hidden from assistive tech. */
export const Icon: Story = {
	play: async ({ canvasElement }) => {
		const bubble = canvasElement.querySelector("[aria-hidden='true']") as HTMLElement;
		await expect(bubble).toBeInTheDocument();
		await expect(bubble.getBoundingClientRect().width).toBe(48);
	},
};

/** A step number alone, set in the middle. */
export const StepNumber: Story = {
	args: { icon: undefined, num: "01" },
};

/** Given both, the icon sits inside and the number rides a badge on the lower right rim. */
export const IconWithBadge: Story = {
	args: { num: "03" },
	play: async ({ canvas, canvasElement }) => {
		const bubble = canvasElement.querySelector("[aria-hidden='true']") as HTMLElement;
		const badge = canvas.getByText("03");
		const outer = bubble.getBoundingClientRect();
		const rim = badge.getBoundingClientRect();
		await expect(rim.right).toBeGreaterThan(outer.right - 8);
		await expect(rim.bottom).toBeGreaterThan(outer.bottom - 8);
	},
};

export const Small: Story = {
	args: { size: "sm", icon: undefined, num: "02" },
};

export const Large: Story = {
	args: { size: "lg", num: "12" },
};

/** On a dark band the fill lifts and the badge's ring takes the band's color. */
export const OnDark: Story = {
	args: { onDark: true, num: "04" },
	decorators: [onDarkBand],
};

/** Neither an icon nor a number: an empty round tile. */
export const Empty: Story = {
	args: { icon: undefined, num: undefined },
	play: async ({ canvasElement }) => {
		const bubble = canvasElement.querySelector("[aria-hidden='true']") as HTMLElement;
		await expect(bubble.textContent).toBe("");
	},
};

/** The sizes side by side, each beside the heading that carries its meaning. */
export const BesideHeadings: Story = {
	render: () => (
		<div style={{ display: "grid", gap: 16 }}>
			{(["sm", "md", "lg"] as const).map((size, i) => (
				<div key={size} style={{ display: "flex", alignItems: "center", gap: 14 }}>
					<Bubble size={size} num={`0${i + 1}`} />
					<h3 style={{ margin: 0 }}>Step {i + 1}: feed the starter</h3>
				</div>
			))}
		</div>
	),
	play: async ({ canvasElement }) => {
		const sizes = Array.from(canvasElement.querySelectorAll("[aria-hidden='true']")).map(
			(el) => el.getBoundingClientRect().width,
		);
		await expect(sizes).toEqual([36, 48, 60]);
	},
};
