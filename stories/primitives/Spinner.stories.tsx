import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Spinner } from "../../src/primitives";
import { withReducedMotion } from "../support/motion";

/**
 * A turning ring that says something is on its way. Its label is heard, not
 * seen, until reduced motion stops the ring and shows the words beside it.
 */
const meta = {
	title: "Primitives/Spinner",
	component: Spinner,
	parameters: { layout: "padded" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ring turns, and the label is there for a screen reader alone. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const label = canvas.getByText("Loading");
		await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		// The ring has no role of its own; it is the label's neighbor.
		const ring = label.previousElementSibling as HTMLElement;
		await expect(ring).toHaveAttribute("aria-hidden", "true");
		await expect(ring.getAnimations().length).toBeGreaterThan(0);
	},
};

/** The label says what is loading. */
export const CustomLabel: Story = {
	args: { label: "Loading the estimator" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Loading the estimator")).toBeInTheDocument();
	},
};

/** Under reduced motion nothing turns, and the label shows beside the ring. */
export const ReducedMotion: Story = {
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		const label = canvas.getByText("Loading");
		const spinner = label.parentElement as HTMLElement;
		await expect(spinner.getAnimations({ subtree: true })).toHaveLength(0);
		await expect(label.getBoundingClientRect().width).toBeGreaterThan(1);
	},
};
