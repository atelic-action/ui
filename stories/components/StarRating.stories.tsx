import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { StarRating, type StarRatingProps } from "../../src/components";
import { knownIssues } from "../support/known-issues";
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
 * the rating; given `onChange`, it is one slider to a keyboard, and each
 * star two pointer targets.
 */
const meta = {
	title: "Components/StarRating",
	component: StarRating,
	parameters: { layout: "padded" },
	args: { value: 4.5, label: "The morning bun" },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The slider holds its half star buttons (stories/findings/primitives.md). */
const nestedButtons = {
	parameters: { ...knownIssues("star-rating-nested-buttons") },
} satisfies Story;

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
	tags: ["known-issue"],
	...nestedButtons,
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
 * By pointer each star is two targets: its left half picks the half star.
 * Picking the rating already set clears it.
 */
export const EditableByPointer: Story = {
	tags: ["known-issue"],
	...nestedButtons,
	args: { value: null, onChange: fn() },
	render: (args) => <Held {...args} />,
	play: async ({ canvas, userEvent, args }) => {
		const slider = canvas.getByRole("slider", { name: "The morning bun" });
		const half = canvas.getByRole("button", { hidden: true, name: "3.5 stars" });
		await userEvent.click(half);
		await expect(args.onChange).toHaveBeenLastCalledWith(3.5);
		await expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
		await userEvent.click(half);
		await expect(args.onChange).toHaveBeenLastCalledWith(null);
		await expect(slider).toHaveAttribute("aria-valuetext", "Not rated");
		await userEvent.click(canvas.getByRole("button", { hidden: true, name: "5 stars" }));
		await expect(slider).toHaveAttribute("aria-valuenow", "5");
	},
};

/** On a phone the editable row keeps its targets inside the screen. */
export const EditableOnPhone: Story = {
	tags: ["known-issue"],
	...nestedButtons,
	globals: pin("phone"),
	args: { value: 4, onChange: fn(), max: 10, size: 32 },
	render: (args) => <Held {...args} />,
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
