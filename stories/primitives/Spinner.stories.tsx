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

/** The three sizes: small beside a line of text or in a button, the default, and large for a wait that holds a space. */
export const Sizes: Story = {
	render: () => (
		<div style={{ display: "flex", alignItems: "center", gap: 32 }}>
			<Spinner size="sm" label="Loading small" />
			<Spinner label="Loading medium" />
			<Spinner size="lg" label="Loading large" />
		</div>
	),
	play: async ({ canvas }) => {
		const ring = (label: string) =>
			(canvas.getByText(label).previousElementSibling as HTMLElement).getBoundingClientRect();
		await expect(ring("Loading small").width).toBe(20);
		await expect(ring("Loading medium").width).toBe(32);
		await expect(ring("Loading large").width).toBe(72);
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

/** Reduced motion is the same at every size: still rings, each with its label shown. */
export const SizesReducedMotion: Story = {
	render: () => (
		<div style={{ display: "flex", alignItems: "center", gap: 32 }}>
			<Spinner size="sm" label="Loading small" />
			<Spinner label="Loading medium" />
			<Spinner size="lg" label="Loading large" />
		</div>
	),
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		for (const label of ["Loading small", "Loading medium", "Loading large"]) {
			const words = canvas.getByText(label);
			await expect(
				(words.parentElement as HTMLElement).getAnimations({ subtree: true }),
			).toHaveLength(0);
			await expect(words.getBoundingClientRect().width).toBeGreaterThan(1);
		}
	},
};
