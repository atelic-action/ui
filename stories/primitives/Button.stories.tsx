import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button } from "../../src/primitives";

const meta = {
	title: "Primitives/Button",
	component: Button,
	parameters: { layout: "padded" },
	args: { children: "Order ahead" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a medium primary, rendered as a real button when it has no `href`. */
export const Primary: Story = {
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
	args: { size: "lg" },
};

/** The arrow is decoration: it is hidden from the accessible name. */
export const WithArrow: Story = {
	args: { size: "lg", arrow: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Order ahead" })).toBeVisible();
	},
};

/** With an `href` it is a link, carrying the base path and never a new tab on a protocol link. */
export const AsLink: Story = {
	args: { href: "/order" },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Order ahead" });
		await expect(link).toHaveAttribute("href", "/order");
		await expect(link).not.toHaveAttribute("target");
	},
};

export const PhoneLinkIgnoresNewTab: Story = {
	args: { href: "tel:+15555550142", newTab: true, children: "Call (555) 555-0142" },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Call (555) 555-0142" });
		await expect(link).not.toHaveAttribute("target");
	},
};

export const ExternalNewTab: Story = {
	args: { href: "https://order.example.com", newTab: true },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Order ahead" });
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	},
};

/** An icon only control names itself through `ariaLabel`. */
export const NamedByAriaLabel: Story = {
	args: { ariaLabel: "Order a loaf ahead", children: "→" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Order a loaf ahead" })).toBeVisible();
	},
};

/** The longest label a page is likely to give it. */
export const LongLabel: Story = {
	args: { size: "lg", arrow: true, children: "Order a cake for Saturday pickup at the counter" },
};

/** Every rule in the page's sheets, layers and media blocks opened. */
function allRules(list: CSSRuleList): CSSStyleRule[] {
	return [...list].flatMap((rule) =>
		rule instanceof CSSStyleRule
			? [rule]
			: "cssRules" in rule
				? allRules((rule as CSSGroupingRule).cssRules)
				: [],
	);
}

/**
 * The fill behind a primary button's words is `--primary-fill`, which this
 * theme sets to what was the hover shade. The hover and the press darken the
 * fill itself, so each still reads apart from the rest state and from each
 * other. The test browser's pointer is synthetic and never sets `:hover` or
 * `:active`, so each state's own rule from the sheet is painted on a probe
 * inside the button, where it resolves against the same theme.
 */
export const FillHoverAndPress: Story = {
	play: async ({ canvas, step }) => {
		const button = canvas.getByRole("button", { name: "Order ahead" });
		const rules = [...document.styleSheets].flatMap((sheet) => allRules(sheet.cssRules));
		const stateFill = (selector: string) => {
			const rule = rules.find((candidate) => candidate.selectorText === selector);
			if (!rule) throw new Error(`No rule for ${selector} in the page's sheets.`);
			const probe = document.createElement("span");
			probe.style.backgroundColor = rule.style.getPropertyValue("background");
			button.append(probe);
			const color = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return color;
		};
		const rest = getComputedStyle(button).backgroundColor;
		await step("at rest the button wears the theme's fill", async () => {
			await expect(rest).toBe(stateFill(".atelic-ui .btn-primary"));
		});
		await step("the hover darkens the fill", async () => {
			await expect(stateFill(".atelic-ui .btn-primary:hover")).not.toBe(rest);
		});
		await step("the press darkens it further", async () => {
			const hover = stateFill(".atelic-ui .btn-primary:hover");
			const press = stateFill(".atelic-ui .btn-primary:active");
			await expect(press).not.toBe(hover);
			await expect(press).not.toBe(rest);
		});
	},
};
