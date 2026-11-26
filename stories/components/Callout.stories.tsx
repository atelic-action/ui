import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Callout } from "../../src/components";
import { longURL } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Presents one finding, a title and an explainer in a tone, in a report or an
 * app; it is not `CalloutPanel`, the business's headline claims. One finding:
 * an icon in its tone beside the title, the explainer under it. Plain, it sits
 * in a list of findings; boxed, it is the one a reader must not miss. The icon
 * is named for a screen reader, so the tone is never color alone.
 */
const meta = {
	title: "Components/Callout",
	component: Callout,
	decorators: [inWrap],
	args: {
		title: "The order form posts to an address that bounces.",
		children: "Every order sent through it since March has gone nowhere; the shop never saw them.",
	},
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A warning by default, its icon named "Needs work". */
export const Warn: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Needs work" })).toBeVisible();
		await expect(canvas.getByText(/Every order sent through it/)).toBeVisible();
	},
};

export const Good: Story = {
	args: { tone: "good", title: "Every page that matters is in the index." },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Working" })).toBeVisible();
	},
};

export const Bad: Story = {
	args: { tone: "bad" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Broken" })).toBeVisible();
	},
};

export const Info: Story = {
	args: { tone: "info", title: "The map listing was claimed in June." },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Note" })).toBeVisible();
	},
};

export const Muted: Story = {
	args: { tone: "muted", title: "Analytics is read once the access lands." },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Note" })).toBeVisible();
	},
};

/** A caller's own word for the icon. */
export const CustomToneLabel: Story = {
	args: { tone: "bad", toneLabel: "Losing orders" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Losing orders" })).toBeVisible();
	},
};

/** Boxed, on a tinted ground, for something missing or owed. */
export const Box: Story = { args: { variant: "box" } };

export const BoxGood: Story = { args: { variant: "box", tone: "good" } };

export const BoxBad: Story = { args: { variant: "box", tone: "bad" } };

export const BoxInfo: Story = { args: { variant: "box", tone: "info" } };

export const BoxMuted: Story = { args: { variant: "box", tone: "muted" } };

/** The title alone, with no explainer. */
export const TitleOnly: Story = {
	args: { children: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/Every order/)).toBeNull();
	},
};

/**
 * The longest finding, with a bare address in it, boxed on a phone: it wraps
 * inside the screen, the address breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		variant: "box",
		title:
			"The order form posts to an address that bounces, so every order sent through it since March has gone nowhere.",
		children: `The form sends to ${longURL}, which answers with an error page; the shop never saw a single one of them.`,
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
