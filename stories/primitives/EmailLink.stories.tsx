import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { EmailLink } from "../../src/primitives";
import { email } from "../fixtures/bakery";
import { brokenWords, expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Draws an email address as a link that writes to it, the one way the package
 * does. An email address as a link that writes to it: the one way the package
 * draws one (Component Rules 17). An address that is not one shows as words.
 */
const meta = {
	title: "Primitives/EmailLink",
	component: EmailLink,
	args: { email },
	parameters: { layout: "padded" },
	globals: pin("desktop"),
} satisfies Meta<typeof EmailLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The address as its own words and its href, read whole, in the same tab. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: email });
		await expect(link).toHaveAttribute("href", `mailto:${email}`);
		await expect(link).not.toHaveAttribute("target");
	},
};

/** In a column too narrow for it, it breaks after the @ and before a dot, never inside a word. */
export const NarrowColumn: Story = {
	decorators: [
		(Story) => (
			<div style={{ width: 120 }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: email });
		await expect(link.getClientRects().length).toBeGreaterThan(1);
		await expect(brokenWords(link)).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/** Its own words. */
export const OwnWords: Story = {
	args: { children: "Write to the bakery" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Write to the bakery" })).toHaveAttribute(
			"href",
			`mailto:${email}`,
		);
	},
};

/** No address: plain words, no dead mailto: link. */
export const NoAddress: Story = {
	args: { email: "", children: "No address yet" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.getByText("No address yet")).toBeVisible();
	},
};
