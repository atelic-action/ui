import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { MonthCalendar } from "../../src/components";
import { isWorkingDay } from "../../src/forms/calendar";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const RULES = { timeZone: "America/Denver", open: "08:00", close: "17:00" };
const onChange = fn();

function Controlled(props: ComponentProps<typeof MonthCalendar>) {
	const [value, setValue] = useState(props.value);
	return (
		<MonthCalendar
			{...props}
			value={value}
			onChange={(day) => {
				setValue(day);
				props.onChange(day);
			}}
		/>
	);
}

/**
 * Lets a visitor pick one day from the days a business works, as the When step
 * of a request does. A month of days to pick one from. Only the days between
 * the first and the last that the business works can be picked; the rest are
 * greyed and named so. One tab stop, the arrows between the days that can be
 * picked.
 */
const meta = {
	title: "Components/MonthCalendar",
	component: MonthCalendar,
	args: {
		value: "",
		first: "2026-11-30",
		last: "2027-01-29",
		isAvailable: (day: string) => isWorkingDay(day, RULES),
		onChange,
	},
	beforeEach: () => {
		onChange.mockClear();
	},
	render: (args) => <Controlled {...args} />,
	decorators: [
		(Story) => (
			<div className="wrap" style={{ paddingBlock: 24, maxWidth: 560 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof MonthCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** December, a day chosen, Christmas and the weekends greyed. */
export const Default: Story = {
	args: { value: "2026-12-02" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("December 2026")).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Wednesday, December 2" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(
			canvas.getByRole("button", { name: "Friday, December 25, not available" }),
		).toBeDisabled();
	},
};

/** The keyboard: one stop, the arrows to the next day that can be picked, Page Down a month. */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Tab reaches the later month, then the first day that can be picked", async () => {
			await userEvent.tab();
			await expect(canvas.getByRole("button", { name: "Later month" })).toHaveFocus();
			await userEvent.tab();
			await expect(canvas.getByRole("button", { name: "Monday, November 30" })).toHaveFocus();
		});
		await step("right crosses into December, and Enter picks", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(canvas.getByText("December 2026")).toBeVisible();
			await expect(canvas.getByRole("button", { name: "Tuesday, December 1" })).toHaveFocus();
			await userEvent.keyboard("{Enter}");
			await expect(onChange).toHaveBeenLastCalledWith("2026-12-01");
		});
		await step("Page Down moves to the next month's first open day", async () => {
			await userEvent.keyboard("{PageDown}");
			await expect(canvas.getByText("January 2027")).toBeVisible();
			// New Year's Day is a holiday, so the first open day is Monday the 4th.
			await expect(canvas.getByRole("button", { name: "Monday, January 4" })).toHaveFocus();
		});
	},
};

/** Refused with no day: the group is described by why. */
export const WithError: Story = {
	args: { error: "Pick a day." },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("group", { name: "Preferred day" })).toHaveAccessibleDescription(
			"Pick a day.",
		);
	},
};

/** A phone: seven columns that fit the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	args: { value: "2026-12-02" },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
