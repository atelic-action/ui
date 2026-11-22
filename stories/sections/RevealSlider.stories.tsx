import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, type within } from "storybook/test";
import { RevealSlider } from "../../src/sections";
import { image } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Drag to compare: the old page on the left, revealed over the rebuilt one
 * by a handle that drags, steps by the arrow keys, and says where it stands.
 */
const meta = {
	title: "Sections/RevealSlider",
	component: RevealSlider,
	args: {
		before: { src: image("old-site"), alt: "The bakery's old home page", label: "Today" },
		after: { src: image("new-site"), alt: "The bakery's rebuilt home page", label: "The rebuild" },
		ariaLabel: "Drag to compare the old home page and the rebuild",
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>Before and after</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof RevealSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

const handle = (canvas: Canvas) =>
	canvas.getByRole("slider", { name: "Drag to compare the old home page and the rebuild" });

/** How much of the old page shows, read off the reader's view: its visible width over the frame's. */
function shownBefore(canvas: Canvas) {
	const before = canvas.getByRole("img", { name: "The bakery's old home page" });
	const frame = before.getBoundingClientRect();
	const inset = /inset\(0px ([\d.]+)%/.exec(getComputedStyle(before).clipPath);
	return { frame, percent: inset ? 100 - Number(inset[1]) : 100 };
}

/** Starts at the middle: half the old page showing, the handle saying 50 of 0 to 100. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const slider = handle(canvas);
		await expect(slider).toHaveAttribute("aria-valuenow", "50");
		await expect(slider).toHaveAttribute("aria-valuemin", "0");
		await expect(slider).toHaveAttribute("aria-valuemax", "100");
		await expect(shownBefore(canvas).percent).toBe(50);
		const { frame } = shownBefore(canvas);
		const box = slider.getBoundingClientRect();
		await expect(
			Math.abs((box.left + box.right) / 2 - (frame.left + frame.width / 2)),
		).toBeLessThan(2);
		await expect(canvas.getByText("Today")).toBeVisible();
		await expect(canvas.getByText("The rebuild")).toBeVisible();
	},
};

/**
 * The keyboard, by the platform's slider convention: Left and Down step the
 * divider back by three, Right and Up forward, Page Down and Page Up by ten,
 * Home and End to the ends, and it stops at both ends.
 */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const slider = handle(canvas);
		await step("Tab reaches the handle", async () => {
			await userEvent.tab();
			await expect(slider).toHaveFocus();
		});
		await step("Right steps to 53, Left back to 50 and on to 47", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(slider).toHaveAttribute("aria-valuenow", "53");
			await expect(shownBefore(canvas).percent).toBe(53);
			await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
			await expect(slider).toHaveAttribute("aria-valuenow", "47");
		});
		await step("held left, it stops at 0 and goes no further", async () => {
			for (let i = 0; i < 20; i++) await userEvent.keyboard("{ArrowLeft}");
			await expect(slider).toHaveAttribute("aria-valuenow", "0");
			await expect(shownBefore(canvas).percent).toBe(0);
		});
		await step("held right, it stops at 100", async () => {
			for (let i = 0; i < 40; i++) await userEvent.keyboard("{ArrowRight}");
			await expect(slider).toHaveAttribute("aria-valuenow", "100");
		});
		await step("Home and End jump to the ends", async () => {
			await userEvent.keyboard("{Home}");
			await expect(slider).toHaveAttribute("aria-valuenow", "0");
			await userEvent.keyboard("{End}");
			await expect(slider).toHaveAttribute("aria-valuenow", "100");
		});
		await step("Down and Up step by three, Page Down and Page Up by ten", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(slider).toHaveAttribute("aria-valuenow", "97");
			await userEvent.keyboard("{PageDown}{PageDown}");
			await expect(slider).toHaveAttribute("aria-valuenow", "77");
			await userEvent.keyboard("{ArrowUp}{PageUp}");
			await expect(slider).toHaveAttribute("aria-valuenow", "90");
			await expect(shownBefore(canvas).percent).toBe(90);
			await userEvent.keyboard("{PageUp}{PageUp}");
			await expect(slider).toHaveAttribute("aria-valuenow", "100");
		});
	},
};

/**
 * What the value means, said with it: each side's share by its corner label
 * by default, kept current as the divider moves, or the page's own words.
 */
export const ValueText: Story = {
	play: async ({ canvas, userEvent }) => {
		const slider = handle(canvas);
		await expect(slider).toHaveAttribute("aria-valuetext", "50% Today, 50% The rebuild");
		slider.focus();
		await userEvent.keyboard("{PageDown}");
		await expect(slider).toHaveAttribute("aria-valuetext", "40% Today, 60% The rebuild");
	},
};

/** The page names what the value means in its own words. */
export const OwnValueText: Story = {
	args: { startAt: 30, valueText: (value: number) => `${value} percent of the old page showing` },
	play: async ({ canvas }) => {
		await expect(handle(canvas)).toHaveAttribute(
			"aria-valuetext",
			"30 percent of the old page showing",
		);
	},
};

/** A drag on the handle moves the divider with the pointer, and stops when let go. */
export const Drag: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const slider = handle(canvas);
		const { frame } = shownBefore(canvas);
		const y = frame.top + frame.height / 2;
		const at = (fraction: number) => ({ clientX: frame.left + frame.width * fraction, clientY: y });
		await step("pressed and dragged to a quarter, the divider follows", async () => {
			await userEvent.pointer([
				{ keys: "[MouseLeft>]", target: slider, coords: at(0.5) },
				{ target: slider, coords: at(0.25) },
			]);
			await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "25"));
			await expect(Math.round(shownBefore(canvas).percent)).toBe(25);
		});
		await step("dragged past the right edge, it holds at 100", async () => {
			await userEvent.pointer({ target: slider, coords: at(1.2) });
			await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "100"));
		});
		await step("let go, a pointer passing over moves nothing", async () => {
			await userEvent.pointer({ keys: "[/MouseLeft]", target: slider, coords: at(1) });
			await userEvent.pointer({ target: slider, coords: at(0.3) });
			await expect(slider).toHaveAttribute("aria-valuenow", "100");
		});
	},
};

/** Started at a third: the divider and the value begin there. */
export const StartAt: Story = {
	args: { startAt: 30 },
	play: async ({ canvas }) => {
		await expect(handle(canvas)).toHaveAttribute("aria-valuenow", "30");
		await expect(shownBefore(canvas).percent).toBe(30);
	},
};

/** A phone shot's shape: the frame takes the ratio asked for. */
export const PortraitRatio: Story = {
	args: { aspectRatio: "9/16" },
	play: async ({ canvas }) => {
		const { frame } = shownBefore(canvas);
		await expect(Math.abs(frame.width / frame.height - 9 / 16)).toBeLessThan(0.01);
	},
};

/** The handle's default name, neutral, when a page names none. */
export const DefaultName: Story = {
	args: { ariaLabel: undefined },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("slider", { name: "Drag to compare before and after" }),
		).toBeVisible();
	},
};

/**
 * Before the shots exist: each side its own brief in its own tone, so a drag
 * still moves something a reader can see.
 */
export const Placeholders: Story = {
	args: {
		before: { label: "Today", placeholder: "Screenshot: the old home page on a laptop" },
		after: { label: "The rebuild", placeholder: "Screenshot: the rebuilt home page on a laptop" },
	},
	play: async ({ canvas }) => {
		const before = canvas.getByText("Screenshot: the old home page on a laptop");
		const after = canvas.getByText("Screenshot: the rebuilt home page on a laptop");
		const tone = (element: Element) =>
			getComputedStyle(element.parentElement as Element).backgroundColor;
		await expect(tone(before)).not.toBe(tone(after));
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** A side with no brief shows its label instead. */
export const PlaceholderLabelsOnly: Story = {
	args: { before: { label: "Today" }, after: { label: "The rebuild" } },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByText("Today").length).toBeGreaterThanOrEqual(1);
	},
};

/** On a phone the frame fills the column, and a drag still works. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		const slider = handle(canvas);
		const { frame } = shownBefore(canvas);
		await userEvent.pointer([
			{
				keys: "[MouseLeft>]",
				target: slider,
				coords: { clientX: frame.left + frame.width / 2, clientY: frame.top + 10 },
			},
			{
				target: slider,
				coords: { clientX: frame.left + frame.width * 0.8, clientY: frame.top + 10 },
			},
			{ keys: "[/MouseLeft]", target: slider },
		]);
		await waitFor(() => expect(slider).toHaveAttribute("aria-valuenow", "80"));
		await expectNoSidewaysScroll();
	},
};

/** Long corner labels and briefs, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		before: {
			label: "The home page today, on a phone",
			placeholder: "Screenshot: the old home page on a phone, the menu as a scanned picture",
		},
		after: {
			label: "The rebuild, on the same phone",
			placeholder: "Screenshot: the rebuilt home page on a phone, the order button first",
		},
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
