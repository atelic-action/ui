import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button } from "../../src/primitives";
import { knownIssues } from "../support/known-issues";

const meta = {
	title: "Primitives/Button",
	component: Button,
	parameters: { layout: "padded" },
	args: { children: "Order ahead" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A primary button's white words fail contrast on this theme (FINDINGS.md). */
const primaryContrast = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("white-on-primary") },
} satisfies Story;

/** The default: a medium primary, rendered as a real button when it has no `href`. */
export const Primary: Story = {
	...primaryContrast,
	args: { onClick: fn() },
	play: async ({ canvas, userEvent, args }) => {
		const button = canvas.getByRole("button", { name: "Order ahead" });
		await userEvent.click(button);
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

export const Dark: Story = { args: { variant: "dark" } };

export const Ghost: Story = { args: { variant: "ghost" } };

/** The ghost on a dark band, where it inverts to light words and a light ring. */
export const GhostOnDark: Story = {
	args: { variant: "ghost", onDark: true },
	decorators: [
		(Story) => (
			<div style={{ background: "var(--surface-dark)", padding: 24, borderRadius: 12 }}>
				<Story />
			</div>
		),
	],
};

export const Large: Story = {
	...primaryContrast,
	args: { size: "lg" },
};

/** The arrow is decoration: it is hidden from the accessible name. */
export const WithArrow: Story = {
	...primaryContrast,
	args: { size: "lg", arrow: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Order ahead" })).toBeVisible();
	},
};

/** With an `href` it is a link, carrying the base path and never a new tab on a protocol link. */
export const AsLink: Story = {
	...primaryContrast,
	args: { href: "/order" },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Order ahead" });
		await expect(link).toHaveAttribute("href", "/order");
		await expect(link).not.toHaveAttribute("target");
	},
};

export const PhoneLinkIgnoresNewTab: Story = {
	...primaryContrast,
	args: { href: "tel:+15555550142", newTab: true, children: "Call (555) 555-0142" },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Call (555) 555-0142" });
		await expect(link).not.toHaveAttribute("target");
	},
};

export const ExternalNewTab: Story = {
	...primaryContrast,
	args: { href: "https://order.example.com", newTab: true },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Order ahead" });
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	},
};

/** An icon only control names itself through `ariaLabel`. */
export const NamedByAriaLabel: Story = {
	...primaryContrast,
	args: { ariaLabel: "Order a loaf ahead", children: "→" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Order a loaf ahead" })).toBeVisible();
	},
};

/** The longest label a page is likely to give it. */
export const LongLabel: Story = {
	...primaryContrast,
	args: { size: "lg", arrow: true, children: "Order a cake for Saturday pickup at the counter" },
};
