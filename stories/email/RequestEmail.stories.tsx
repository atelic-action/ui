import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { RequestEmail } from "../../src/email";
import { schedule } from "../fixtures/sections";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

const visit = {
	kindLabel: "A wedding cake",
	materialLabel: "Buttercream",
	mode: "visit" as const,
	minutes: 60,
	day: "2026-12-02",
	time: "09:00",
	firstName: "Robin",
	phone: "(555) 555-0177",
	where: "418 Alder Street, Fairhaven, CO 80000",
};

/**
 * Confirms a visitor's schedule request to them by email, saying it arrived
 * and is not a booked appointment. The customer's confirmation of a schedule
 * request, the card the endpoint mails: it says the request arrived and is not
 * a booked appointment, reads back what was asked for, says what happens next
 * and when the office confirms, and offers the phone. It offers no add to
 * calendar, since no time is set.
 */
const meta = {
	title: "Email/RequestEmail",
	component: RequestEmail,
	decorators: [inColumn],
	args: {
		request: visit,
		config: schedule,
		options: {
			brandName: "Kestrel Hollow Bakehouse",
			address: ["418 Alder Street", "Fairhaven, CO 80000"],
		},
	},
	globals: pin("desktop"),
} satisfies Meta<typeof RequestEmail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A visit, with nothing the visitor typed repeated: the default. */
export const Visit: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "We have your request." })).toBeVisible();
		await expect(
			canvas.getByText(
				/This is a request, not a booked appointment yet\. Our office will confirm your time within 2 business days/,
			),
		).toBeVisible();
		await expect(canvas.getByText("A visit at your venue, about 1 hour")).toBeVisible();
		await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		await expect(canvas.queryByText(/418 Alder Street, Fairhaven/)).toBeNull();
	},
};

/** With the copy turned on: the greeting by name and the address, as the design draws it. */
export const VisitWithCopy: Story = {
	args: { options: { brandName: "Kestrel Hollow Bakehouse", copy: true } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("heading", { name: "We have your request, Robin." }),
		).toBeVisible();
		await expect(canvas.getByText("418 Alder Street, Fairhaven, CO 80000")).toBeVisible();
	},
};

/** A call, with the copy on: the number to call in place of the address. */
export const Call: Story = {
	args: {
		request: { ...visit, mode: "call", minutes: 30 },
		options: { brandName: "Kestrel Hollow Bakehouse", copy: true },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Call you at")).toBeVisible();
		await expect(canvas.getByText("We call you at the confirmed time.")).toBeVisible();
	},
};

/** A phone: the card keeps to the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
