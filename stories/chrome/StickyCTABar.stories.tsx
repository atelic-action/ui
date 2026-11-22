import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { StickyCTABar } from "../../src/chrome";
import { cta, phone } from "../fixtures/bakery";
import { knownIssues } from "../support/known-issues";
import { PageBehind } from "../support/page";
import { pin } from "../support/viewports";

/** The phone's bottom bar: the primary CTA and a call shortcut. */
const meta = {
	title: "Chrome/StickyCTABar",
	component: StickyCTABar,
	tags: ["known-issue"],
	parameters: { ...knownIssues("primary-button-contrast") },
	args: { primaryCTA: cta, phone },
	decorators: [
		(Story) => (
			<>
				<PageBehind tall />
				<Story />
			</>
		),
	],
	globals: pin("phone"),
} satisfies Meta<typeof StickyCTABar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The home page's bar: out of reach at the top, sliding in past the threshold. */
export const SlidesIn: Story = {
	play: async ({ canvas, step }) => {
		const order = canvas.getByRole("link", { name: "Order ahead" });
		await step("held below the screen and out of the tab order at the top", async () => {
			await expect(order.getBoundingClientRect().top).toBeGreaterThanOrEqual(window.innerHeight);
			order.focus();
			await expect(order).not.toHaveFocus();
		});
		await step("in reach once scrolled past 520 pixels", async () => {
			window.scrollTo({ top: 600, behavior: "instant" });
			await waitFor(() =>
				expect(order.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
			);
			order.focus();
			await expect(order).toHaveFocus();
			await expect(canvas.getByRole("link", { name: "Call us" })).toHaveAttribute(
				"href",
				`tel:${phone.e164}`,
			);
		});
		await step("held back again on the way up", async () => {
			window.scrollTo({ top: 0, behavior: "instant" });
			await waitFor(() =>
				expect(order.getBoundingClientRect().top).toBeGreaterThanOrEqual(window.innerHeight),
			);
		});
	},
};

/** An interior page's bar: there from the first paint. */
export const FromTop: Story = {
	args: { fromTop: true },
	play: async ({ canvas }) => {
		const order = canvas.getByRole("link", { name: "Order ahead" });
		await waitFor(() =>
			expect(order.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
		);
	},
};

/** A business with no public phone: the CTA alone, filling the bar. */
export const NoPhone: Story = {
	args: { fromTop: true, phone: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Call us" })).toBeNull();
	},
};

/** The call shortcut's name is the site's to set. */
export const CallLabel: Story = {
	args: { fromTop: true, callLabel: "Call the shop" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Call the shop" })).toBeVisible();
	},
};

/** A desktop never shows the bar: the header carries the CTA there. */
export const Desktop: Story = {
	args: { fromTop: true },
	globals: pin("desktop"),
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Order ahead" })).toBeNull();
	},
};

export const LongLabel: Story = {
	args: {
		fromTop: true,
		primaryCTA: { label: "Order a cake for Saturday pickup", href: "/order" },
	},
};
