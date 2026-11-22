import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ProcessSteps } from "../../src/sections";
import { image, processSteps } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * A dark band: numbered steps beside a supporting photo. Each step's title
 * sits one heading level under the band's, whatever level the band takes.
 */
const meta = {
	title: "Sections/ProcessSteps",
	component: ProcessSteps,
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

/**
 * The outline: the band's title an `h2` and each step's an `h3` by default;
 * set inside a deeper outline (`headingLevel: 3`), an `h3` and `h4`s, each
 * step's title looking as it does at the default.
 */
export const HeadingLevels: Story = {
	play: async ({ canvas, step }) => {
		const size = (heading: HTMLElement) => getComputedStyle(heading).fontSize;
		await step("an h2 over h3s by default", async () => {
			await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(
				"Three steps, two days",
			);
			await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(3);
			await expect(canvas.queryByRole("heading", { level: 4 })).toBeNull();
		});
		await step("each step's title is 1.25rem, whatever its level", async () => {
			for (const heading of canvas.getAllByRole("heading", { level: 3 })) {
				await expect(size(heading)).toBe("20px");
			}
		});
	},
};

/** The band one level deeper. */
export const DeeperOutline: Story = {
	args: { headingLevel: 3 },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
		await expect(canvas.getByRole("heading", { level: 3 })).toHaveTextContent(
			"Three steps, two days",
		);
		const titles = canvas.getAllByRole("heading", { level: 4 });
		await expect(titles).toHaveLength(3);
		await expect(getComputedStyle(titles[0] as HTMLElement).fontSize).toBe("20px");
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
		await expectNoSidewaysScroll();
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
		await expectNoSidewaysScroll();
	},
};
