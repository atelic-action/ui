import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SkipLink } from "../../src/chrome";

/**
 * Lets a keyboard user jump past the header straight to the page's content.
 * The keyboard user's first stop: hidden until focused, then a jump past the
 * chrome.
 */
const meta = {
	title: "Chrome/SkipLink",
	component: SkipLink,
	decorators: [
		(Story) => (
			<>
				<Story />
				<nav aria-label="Primary">
					<a href="/menu">Menu</a>
				</nav>
				<main id="main" tabIndex={-1}>
					<h1>Country sourdough, rye, and the morning buns.</h1>
				</main>
			</>
		),
	],
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const skip = canvas.getByRole("link", { name: "Skip to content" });
		await step("offscreen until it has focus", async () => {
			await expect(skip.getBoundingClientRect().right).toBeLessThanOrEqual(0);
		});
		await step("the first tab stop, shown on focus", async () => {
			await userEvent.tab();
			await expect(skip).toHaveFocus();
			const box = skip.getBoundingClientRect();
			await expect(box.left).toBeGreaterThanOrEqual(0);
			await expect(box.top).toBeGreaterThanOrEqual(0);
		});
		await step("it jumps to the main landmark", async () => {
			await expect(skip).toHaveAttribute("href", "#main");
		});
	},
};

/** The site's own words and anchor. */
export const Custom: Story = {
	args: { href: "#menu-list", children: "Skip to the menu" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Skip to the menu" })).toHaveAttribute(
			"href",
			"#menu-list",
		);
	},
};
