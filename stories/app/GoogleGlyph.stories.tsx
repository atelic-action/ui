import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { GoogleGlyph } from "../../src/app";
import { Button } from "../../src/app/ui";

/**
 * Marks a Google sign in button with Google's own G. Google's four color G for
 * a sign in button. It is decorative: the button carries the name.
 */
const meta = {
	title: "App/GoogleGlyph",
	component: GoogleGlyph,
	parameters: { layout: "padded" },
	args: { className: "h-6 w-6" },
} satisfies Meta<typeof GoogleGlyph>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On its own, sized by the class it is given. */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		const glyph = canvasElement.querySelector("svg");
		await expect(glyph).toHaveAttribute("aria-hidden", "true");
		await expect(Math.round(glyph?.getBoundingClientRect().width ?? 0)).toBe(24);
	},
};

/** Large, for a sign in page's hero. */
export const Large: Story = {
	args: { className: "h-12 w-12" },
	play: async ({ canvasElement }) => {
		await expect(
			Math.round(canvasElement.querySelector("svg")?.getBoundingClientRect().width ?? 0),
		).toBe(48);
	},
};

/** In the sign in button, where the button's words are its name. */
export const InASignInButton: Story = {
	render: () => (
		<Button variant="outline" size="lg">
			<GoogleGlyph className="h-5 w-5" />
			Continue with Google
		</Button>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Continue with Google" })).toBeVisible();
	},
};
