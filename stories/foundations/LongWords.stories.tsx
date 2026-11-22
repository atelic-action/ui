import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { brokenWords, expectNoSidewaysScroll, lines } from "../support/geometry";
import { pin } from "../support/viewports";

const ordinary =
	"Sourdough, rye, and the morning buns come out of the oven at seven, and the counter opens at half past, every day but Monday.";
const token = "orders-and-wholesale-questions@kestrelhollowbakehouse.example.com";

/**
 * The root's `overflow-wrap: anywhere` (base.css, Long words), proved on a
 * phone: a word longer than its line breaks where it must, and the page
 * stays still, while an ordinary sentence still wraps only at its spaces,
 * never inside a word.
 */
const meta = {
	title: "Foundations/LongWords",
	render: () => (
		<section className="section">
			<div className="wrap">
				<h2>Ordering ahead</h2>
				<p className="probe-ordinary">{ordinary}</p>
				<p className="probe-token">Write to {token} for a standing order.</p>
			</div>
		</section>
	),
	globals: pin("phone"),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnAPhone: Story = {
	play: async ({ canvasElement, step }) => {
		const paragraph = (name: string) => canvasElement.querySelector(`.${name}`) as HTMLElement;
		await step("an ordinary sentence wraps at its spaces, no word cut in two", async () => {
			await expect(lines(paragraph("probe-ordinary"))).toBeGreaterThan(1);
			await expect(brokenWords(paragraph("probe-ordinary"))).toEqual([]);
		});
		await step("a token longer than the line breaks inside itself, and only it", async () => {
			await expect(brokenWords(paragraph("probe-token"))).toEqual([token]);
		});
		await step("the page stays still", async () => {
			await expectNoSidewaysScroll();
		});
	},
};
