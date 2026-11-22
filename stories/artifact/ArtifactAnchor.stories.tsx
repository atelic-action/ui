import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ArtifactAnchor } from "../../src/artifact";

/**
 * A link inside a document's running text: one leaving the page opens in a
 * new tab, an anchor or a mail link opens in place.
 */
const meta = {
	title: "Artifact/ArtifactAnchor",
	component: ArtifactAnchor,
	parameters: { layout: "padded" },
	args: { href: "https://kestrelhollow.example.com/menu", children: "the menu page" },
	render: (args) => (
		<p>
			Start with <ArtifactAnchor {...args} />.
		</p>
	),
} satisfies Meta<typeof ArtifactAnchor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Out of the page: a new tab, with no opener. */
export const External: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "the menu page" });
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	},
};

/** The scheme is matched in any case. */
export const ExternalUpperCase: Story = {
	args: { href: "HTTPS://kestrelhollow.example.com/menu" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link")).toHaveAttribute("target", "_blank");
	},
};

/** An anchor on the page opens in place. */
export const Anchor: Story = {
	args: { href: "#hours", children: "the hours" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "the hours" })).not.toHaveAttribute("target");
	},
};

/** A mail link opens in place, never a dead blank tab. */
export const Mail: Story = {
	args: { href: "mailto:hello@kestrelhollow.example.com", children: "write to the bakery" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "write to the bakery" })).not.toHaveAttribute(
			"target",
		);
	},
};

/** A path on the same site opens in place. */
export const SamePath: Story = {
	args: { href: "/the-read", children: "the read" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "the read" })).not.toHaveAttribute("target");
	},
};
