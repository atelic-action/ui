import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { StarRating, type StarRatingProps } from "../../src/components";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/** An editable row held by its caller, reporting each change to the story's spy. */
function Held(props: StarRatingProps) {
	const [value, setValue] = useState(props.value);
	return (
		<StarRating
			{...props}
			value={value}
			onChange={(next) => {
				props.onChange?.(next);
				setValue(next);
			}}
		/>
	);
}

/**
 * A row of stars in half star steps. Read only, it is one picture named by
 * the rating; given `onChange`, it is one slider, to a keyboard, a pointer,
 * and a screen reader alike, holding no control of its own.
 */
const meta = {
	title: "Components/StarRating",
	component: StarRating,
	parameters: { layout: "padded" },
	args: { value: 4.5, label: "The morning bun" },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read only: a picture named by the rating, with no buttons in it. */
export const ReadOnly: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "The morning bun: 4.5 stars" })).toBeVisible();
		await expect(canvas.queryAllByRole("button")).toHaveLength(0);
	},
};

export const OneStar: Story = {
	args: { value: 1 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "The morning bun: 1 star" })).toBeVisible();
	},
};

/** Unrated. */
export const NotRated: Story = {
	args: { value: null },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "The morning bun: Not rated" })).toBeVisible();
	},
};

/** Larger stars on a ten star scale, in the caller's own colors. */
export const CustomScale: Story = {
	args: { value: 7.5, max: 10, size: 32, fillColor: "#b3261e", outlineColor: "#8a8272" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "The morning bun: 7.5 stars" })).toBeVisible();
	},
};

/**
 * Editable: one slider, one stop in the tab order. The arrows move half a
 * star, Home clears, End is the top, and the value text says the rating the
 * way a person would.
 */
export const EditableByKeyboard: Story = {
	args: { value: 3, onChange: fn() },
	render: (args) => <Held {...args} />,
	play: async ({ canvas, userEvent, args, step }) => {
		const slider = canvas.getByRole("slider", { name: "The morning bun" });
		await step("Tab lands on the row once; the halves are not stops", async () => {
			await userEvent.tab();
			await expect(slider).toHaveFocus();
			await expect(slider).toHaveAttribute("aria-valuenow", "3");
			await expect(slider).toHaveAttribute("aria-valuetext", "3 stars");
			await expect(slider).toHaveAttribute("aria-valuemax", "5");
		});
		await step("the right and up arrows add half a star", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
			await userEvent.keyboard("{ArrowUp}");
			await expect(args.onChange).toHaveBeenLastCalledWith(4);
		});
		await step("the left and down arrows take half a star off", async () => {
			await userEvent.keyboard("{ArrowLeft}{ArrowDown}");
			await expect(slider).toHaveAttribute("aria-valuenow", "3");
		});
		await step("End is the top of the scale, and the right arrow stops there", async () => {
			await userEvent.keyboard("{End}");
			await expect(slider).toHaveAttribute("aria-valuenow", "5");
			const calls = (args.onChange as ReturnType<typeof fn>).mock.calls.length;
			await userEvent.keyboard("{ArrowRight}");
			await expect(args.onChange).toHaveBeenCalledTimes(calls);
		});
		await step("Home clears it to unrated", async () => {
			await userEvent.keyboard("{Home}");
			await expect(args.onChange).toHaveBeenLastCalledWith(null);
			await expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
			await expect(slider).toHaveAttribute("aria-valuenow", "0");
		});
		await step("from half a star, the left arrow clears it", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(slider).toHaveAttribute("aria-valuetext", "0.5 stars");
			await userEvent.keyboard("{ArrowLeft}");
			await expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
		});
		await step("Tab leaves the row", async () => {
			await userEvent.tab();
			await expect(slider).not.toHaveFocus();
		});
	},
};

/**
 * Where a pointer lands to pick a rating, found the way a pointer finds it:
 * the element at the point inside the slider over that half star. The halves
 * are plain areas with no role, since a slider's children are presentational,
 * so there is no name to find them by.
 */
function pointAt(slider: HTMLElement, rating: number, max = 5) {
	const box = slider.getBoundingClientRect();
	const star = box.width / max;
	const x = box.left + (Math.ceil(rating) - 1) * star + (rating % 1 ? star * 0.25 : star * 0.75);
	return document.elementFromPoint(x, box.top + box.height / 2) as HTMLElement;
}

/**
 * By pointer each star is two halves: its left half picks the half star.
 * Picking the rating already set clears it. The slider holds no button: a
 * screen reader meets one control, never ten.
 */
export const EditableByPointer: Story = {
	args: { value: null, onChange: fn() },
	render: (args) => <Held {...args} />,
	play: async ({ canvas, userEvent, args, step }) => {
		const slider = canvas.getByRole("slider", { name: "The morning bun" });
		await step("one control, no buttons inside it", async () => {
			await expect(canvas.queryAllByRole("button", { hidden: true })).toHaveLength(0);
		});
		await step("the fourth star's left half picks 3.5, and again clears it", async () => {
			await userEvent.click(pointAt(slider, 3.5));
			await expect(args.onChange).toHaveBeenLastCalledWith(3.5);
			await expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
			await userEvent.click(pointAt(slider, 3.5));
			await expect(args.onChange).toHaveBeenLastCalledWith(null);
			await expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
		});
		await step("the last star's right half picks 5", async () => {
			await userEvent.click(pointAt(slider, 5));
			await expect(slider).toHaveAttribute("aria-valuenow", "5");
		});
	},
};

/** On a phone the editable row keeps its targets inside the screen. */
export const EditableOnPhone: Story = {
	globals: pin("phone"),
	args: { value: 4, onChange: fn(), max: 10, size: 32 },
	render: (args) => <Held {...args} />,
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
