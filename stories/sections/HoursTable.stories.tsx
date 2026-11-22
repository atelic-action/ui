import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { HoursTable } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { pin } from "../support/viewports";

/** The week's hours as rows: the days on the left, the times on the right in mono. */
const meta = {
	title: "Sections/HoursTable",
	component: HoursTable,
	args: { hours: site.hours },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>Hours</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof HoursTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const top = (element: Element) => Math.round(element.getBoundingClientRect().top);

/** The 12 hour clock, the default: each day's times on its own line beside it, and a closed day says so. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const day = canvas.getByText("Tuesday to Friday");
		const times = canvas.getByText("7:00a to 3:00p");
		await expect(top(day)).toBe(top(times));
		await expect(times.getBoundingClientRect().left).toBeGreaterThan(
			day.getBoundingClientRect().right,
		);
		await expect(canvas.getByText("8:00a to 2:00p")).toBeVisible();
		await expect(canvas.getByText("Closed")).toBeVisible();
	},
};

/** The 24 hour clock, with leading zeros. */
export const TwentyFourHour: Story = {
	args: { clock: "24h" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("07:00 to 15:00")).toBeVisible();
		await expect(canvas.getByText("08:00 to 14:00")).toBeVisible();
	},
};

/** A row with no times prints its note instead of Closed. */
export const NoteInsteadOfClosed: Story = {
	args: {
		hours: [
			...site.hours.slice(0, 2),
			{ label: "Monday", labelShort: "Mon", days: [], note: "Wholesale pickup only" },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Wholesale pickup only")).toBeVisible();
		await expect(canvas.queryByText("Closed")).toBeNull();
	},
};

/** No rows at all: nothing drawn, and nothing breaks. */
export const Empty: Story = {
	args: { hours: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/to/)).toBeNull();
	},
};

/** Every day its own row, on a phone, with the longest labels a site writes. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		hours: [
			...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
				label: `${day}, and the holiday weeks in between`,
				labelShort: day.slice(0, 3),
				days: [day],
				opens: "06:30",
				closes: "15:30",
			})),
			{
				label: "Saturday",
				labelShort: "Sat",
				days: ["Saturday"],
				note: "By appointment for cake tastings and wholesale pickups",
			},
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getAllByText("6:30a to 3:30p")).toHaveLength(5);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
