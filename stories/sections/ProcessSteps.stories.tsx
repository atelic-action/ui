import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ProcessSteps } from "../../src/sections";
import { image, processSteps } from "../fixtures/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A dark band: numbered steps beside a supporting photo. Each step's title
 * skips a heading level (stories/findings/sections.md).
 */
const meta = {
	title: "Sections/ProcessSteps",
	component: ProcessSteps,
	tags: ["known-issue"],
	parameters: { ...knownIssues("process-step-heading-order") },
	args: {
		id: "how",
		eyebrow: "How a loaf is made",
		title: "Three steps, two days",
		steps: processSteps,
		image: { src: image("ovens"), alt: "The ovens at dawn" },
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ProcessSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list")).getAllByRole("listitem");

/** The steps in order, numbered, with the photo beside them. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const items = steps(canvas);
		await expect(items).toHaveLength(3);
		await expect(within(items[0]).getByText("1")).toBeVisible();
		await expect(within(items[2]).getByRole("heading", { name: "Bake at dawn" })).toBeVisible();
		const photo = canvas.getByRole("img", { name: "The ovens at dawn" }).getBoundingClientRect();
		await expect(photo.left).toBeGreaterThan(items[0].getBoundingClientRect().right);
	},
};

/** Before the photography exists: the shot brief in the frame. */
export const Placeholder: Story = {
	args: { image: undefined, placeholder: "Photo: the levain at ten at night" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Photo: the levain at ten at night")).toBeVisible();
	},
};

/** No eyebrow, and many steps. */
export const ManySteps: Story = {
	args: {
		eyebrow: undefined,
		steps: [
			...processSteps,
			{ title: "Cool on the rack", description: "An hour before it is cut." },
			{ title: "On the counter", description: "From seven until it is gone." },
		],
	},
	play: async ({ canvas }) => {
		await expect(steps(canvas)).toHaveLength(5);
	},
};

/** On a phone the photo stacks under the steps. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const items = steps(canvas);
		const photo = canvas.getByRole("img", { name: "The ovens at dawn" }).getBoundingClientRect();
		await expect(photo.top).toBeGreaterThanOrEqual(
			items[items.length - 1].getBoundingClientRect().bottom,
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** The longest realistic steps, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		title: "From the levain at night to the counter at seven in the morning",
		steps: processSteps.map((step) => ({
			title: `${step.title}, every day but Monday`,
			description: `${step.description} The same way since the shop opened on Alder Street in 2014.`,
		})),
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
