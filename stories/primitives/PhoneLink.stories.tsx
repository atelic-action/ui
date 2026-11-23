import type { Meta, StoryObj } from "@storybook/react-vite";
import { Phone as PhoneIcon } from "lucide-react";
import { expect } from "storybook/test";
import { PhoneLink } from "../../src/primitives";
import { phone } from "../fixtures/bakery";
import { pin } from "../support/viewports";

/**
 * A phone number as a link that dials it: the one way the package draws one
 * (Component Rules 17). A number that is not one to dial shows as words.
 */
const meta = {
	title: "Primitives/PhoneLink",
	component: PhoneLink,
	args: { phone },
	parameters: { layout: "padded" },
	globals: pin("desktop"),
} satisfies Meta<typeof PhoneLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The site's phone: its display as the words, its E.164 as the href, the same tab. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "(555) 555-0142" });
		await expect(link).toHaveAttribute("href", "tel:+15555550142");
		await expect(link).not.toHaveAttribute("target");
	},
};

/** A number as a visitor typed it, read into E.164 for the href and shown as typed. */
export const TypedNumber: Story = {
	args: { phone: "555.555.0199" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "555.555.0199" })).toHaveAttribute(
			"href",
			"tel:+15555550199",
		);
	},
};

/** Its own words and an accessible name: an icon alone, named by the call. */
export const IconAlone: Story = {
	args: {
		"aria-label": "Call (555) 555-0142",
		className: "btn btn-ghost btn-call",
		children: <PhoneIcon size={18} aria-hidden="true" />,
	},
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Call (555) 555-0142" });
		await expect(link).toHaveAttribute("href", "tel:+15555550142");
	},
};

/** A number that is not one to dial: plain words, no dead tel: link. */
export const NotANumber: Story = {
	args: { phone: { e164: "555-CAKE", display: "555-CAKE" } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.getByText("555-CAKE")).toBeVisible();
	},
};
