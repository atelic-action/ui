import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Shot } from "../../src/artifact";
import { shotPortrait, shotWide } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../primitives/support";
import { pin } from "../support/viewports";

/** A document's column, which sizes the shot the way a document's own sheet does. */
const column: Decorator = (Story) => (
	<div className="wrap" style={{ paddingBlock: 32, maxWidth: 640 }}>
		<Story />
	</div>
);

/**
 * The owner's own screen: the crop, opening the full picture in a new tab
 * when it has one, over its caption. A crop taller than it is wide is held
 * far narrower than its column once its size is known.
 */
const meta = {
	title: "Artifact/Shot",
	component: Shot,
	decorators: [column],
	args: { shot: shotWide },
} satisfies Meta<typeof Shot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Linked: the crop opens the full picture in a new tab and says so on hover. */
export const Linked: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: shotWide.alt });
		await expect(link).toHaveAttribute("href", shotWide.href);
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("title", "Open the full picture");
		await expect(canvas.getByRole("figure")).toHaveTextContent(shotWide.caption);
	},
};

/** The crop alone, with no link. */
export const CropAlone: Story = {
	args: { shot: { ...shotWide, href: undefined } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.getByRole("img", { name: shotWide.alt })).toBeVisible();
	},
};

/** A wide crop fills its column. */
export const Wide: Story = {
	play: async ({ canvas }) => {
		const img = canvas.getByRole("img") as HTMLImageElement;
		await waitFor(() => expect(img.naturalWidth).toBeGreaterThan(0), { timeout: 5000 });
		const figure = canvas.getByRole("figure");
		await expect(figure.getBoundingClientRect().width).toBeGreaterThan(400);
	},
};

/** A portrait crop, once it loads, is held far narrower than its column. */
export const Portrait: Story = {
	args: { shot: shotPortrait },
	play: async ({ canvas }) => {
		const img = canvas.getByRole("img") as HTMLImageElement;
		await waitFor(() => expect(img.naturalWidth).toBeGreaterThan(0), { timeout: 5000 });
		const figure = canvas.getByRole("figure");
		await waitFor(() => expect(figure.getBoundingClientRect().width).toBeLessThanOrEqual(200));
	},
};

/** A picture that fails to load is never marked portrait, and the caption still reads. */
export const Broken: Story = {
	args: { shot: { ...shotPortrait, src: "/images/primitives/missing.png" } },
	play: async ({ canvas }) => {
		const figure = canvas.getByRole("figure");
		await expect(figure).toHaveTextContent(shotPortrait.caption);
		await expect(figure.getBoundingClientRect().width).toBeGreaterThan(400);
	},
};

/** On a phone, a wide crop and its caption stay inside the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
