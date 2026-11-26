import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { StickyCTABar } from "../../src/chrome";
import { cta, phone } from "../fixtures/bakery";
import { PageBehind } from "../support/page";
import { pin } from "../support/viewports";

/** The phone's bottom bar: the primary CTA and a call shortcut. */
const meta = {
	title: "Chrome/StickyCTABar",
	component: StickyCTABar,
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

const first = fn();
const second = fn();

/** A caller that swaps the bar's listener at a button press. */
function SwappingCaller() {
	const [listener, setListener] = useState(() => first);
	return (
		<>
			<button type="button" onClick={() => setListener(() => second)}>
				Swap the listener
			</button>
			<StickyCTABar primaryCTA={cta} phone={phone} fromTop onSpaceChange={listener} />
		</>
	);
}

/**
 * A caller that swaps listeners is one caller: the height the first was told
 * stands, and a swap tells nothing, so the swap can never loop (9.7.0).
 */
export const SwappedListener: Story = {
	beforeEach: () => {
		first.mockClear();
		second.mockClear();
	},
	render: () => <SwappingCaller />,
	play: async ({ canvas, userEvent, step }) => {
		await step("the first listener hears the bar's height", async () => {
			await waitFor(() => expect(first).toHaveBeenLastCalledWith(expect.any(Number)));
			await expect(first.mock.lastCall?.[0]).toBeGreaterThan(0);
		});
		await step("a swap tells neither listener anything", async () => {
			const told = first.mock.calls.length;
			await userEvent.click(canvas.getByRole("button", { name: "Swap the listener" }));
			window.dispatchEvent(new Event("resize"));
			await expect(first.mock.calls.length).toBe(told);
			await expect(second).not.toHaveBeenCalled();
		});
	},
};

/** A caller whose inline listener stores the height in an object, made anew each render. */
function ObjectStateCaller() {
	const [space, setSpace] = useState({ pixels: 0 });
	return (
		<>
			<p data-testid="reserved">{space.pixels}</p>
			<StickyCTABar
				primaryCTA={cta}
				phone={phone}
				fromTop
				onSpaceChange={(pixels) => setSpace({ pixels })}
			/>
		</>
	);
}

/**
 * The listener a caller makes anew every render, storing an object, still
 * holds the reserved height, where the old swap cap left it at 0 (9.7.0).
 */
export const InlineObjectListener: Story = {
	render: () => <ObjectStateCaller />,
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(Number(canvas.getByTestId("reserved").textContent)).toBeGreaterThan(0),
		);
	},
};
