import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, type Mock, spyOn, waitFor, within } from "storybook/test";
import { ScheduleRequestForm } from "../../src/sections";
import { exampleProvider } from "../fixtures/primitives";
import { schedule, scheduleToday } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/*
 * Every send goes to a mock: `window.fetch` is replaced for the story by a
 * `fn` that answers the way the site's endpoint would, so no story makes a
 * real request.
 */
let endpoint: Mock<typeof fetch>;

const answering = (status: number, body: unknown) => () => {
	endpoint = fn(() =>
		Promise.resolve(new Response(JSON.stringify(body), { status })),
	) as unknown as Mock<typeof fetch>;
	const spy = spyOn(window, "fetch").mockImplementation(endpoint);
	return () => spy.mockRestore();
};

/** What the form posted, as the endpoint received it. */
const posted = () =>
	JSON.parse(String((endpoint.mock.calls[0]?.[1] as RequestInit | undefined)?.body));

const onLead = fn();

const consent = {
	text: "By checking, you agree that we may text you about your request. We never share your information for marketing. You can opt out at any time. Message and data rates apply. Consent is not a condition of purchase.",
	links: [
		{ label: "Terms and conditions", href: "/terms" },
		{ label: "Privacy Policy", href: "/privacy" },
	],
};

const who = {
	firstName: "Robin",
	lastName: "Ash",
	phone: "(555) 555-0177",
	email: "robin@example.com",
	address: { street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" },
};

/**
 * Lets a visitor ask for a visit or a call at a time they choose, without
 * booking one; use `ContactForm` for a plain message. A request for a visit or
 * a call, taken in three steps on the StepForm shell, then the request
 * received. What can be asked for, the ways, the lengths, the office day, and
 * the calendar all come from the business's one config; the calendar offers no
 * weekend, holiday, or too soon day, and the times finish by closing. It never
 * says booked.
 */
const meta = {
	title: "Sections/ScheduleRequestForm",
	component: ScheduleRequestForm,
	args: {
		config: schedule,
		endpoint: "/api/schedule",
		today: scheduleToday,
		address: { provider: exampleProvider(), states: ["CO", "WY", "KS"] },
		consent,
		onLead,
	},
	beforeEach: () => {
		onLead.mockClear();
		return answering(200, { ok: true, receipt: true })();
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ScheduleRequestForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first step: what the request is for, and a visit or a call as cards, the summary beside it. */
export const WhatStep: Story = {
	play: async ({ canvas, step }) => {
		await step("the summary beside the step says nothing is chosen yet", async () => {
			const summary = canvas.getByRole("complementary", { name: "Your request so far" });
			await expect(summary).toHaveTextContent("Not chosen yet");
			await expect(summary).toHaveTextContent(
				"This is a request. Our office confirms your time within 2 business days.",
			);
		});
		await step("the step names show the first as current", async () => {
			const names = within(canvas.getByRole("list", { name: "Steps" })).getAllByRole("listitem");
			await expect(names[0]).toHaveAttribute("aria-current", "step");
			await expect(names[1]).not.toHaveAttribute("aria-current");
		});
	},
};

/**
 * The whole way through by keyboard and pointer: each step refuses to go on
 * until it is answered, focus lands on each new step's heading, and the send
 * ends on the request received, read back.
 */
export const WalkThrough: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Continue with nothing chosen says what to fix and focuses it", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
			await expect(canvas.getByRole("alert")).toHaveTextContent(
				"One thing needs fixing before you can go on.",
			);
			await expect(canvas.getByLabelText("What do you need help with?")).toHaveFocus();
		});
		await step("a kind and a way, then on to When, its heading focused", async () => {
			await userEvent.selectOptions(
				canvas.getByLabelText("What do you need help with?"),
				"Catering for an event",
			);
			await userEvent.click(canvas.getByRole("radio", { name: /By phone/ }));
			await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
			await expect(canvas.getByRole("heading", { name: "When works for you?" })).toHaveFocus();
		});
		await step("the calendar offers no weekend and no holiday", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Later month" }));
			await expect(
				canvas.getByRole("button", { name: "Friday, December 25, not available" }),
			).toBeDisabled();
			await expect(
				canvas.getByRole("button", { name: "Saturday, December 5, not available" }),
			).toBeDisabled();
		});
		await step("a day by the arrows and Enter, then a time", async () => {
			const first = canvas.getByRole("button", { name: "Tuesday, December 1" });
			first.focus();
			await userEvent.keyboard("{ArrowRight}{Enter}");
			await expect(canvas.getByRole("button", { name: "Wednesday, December 2" })).toHaveAttribute(
				"aria-pressed",
				"true",
			);
			await userEvent.selectOptions(canvas.getByLabelText("What time?"), "10:30");
			await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
		});
		await step("who to reach, the address optional for a call", async () => {
			await expect(canvas.getByRole("heading", { name: "Who should we contact?" })).toHaveFocus();
			await userEvent.type(canvas.getByLabelText("First name"), "Robin");
			await userEvent.type(canvas.getByLabelText("Last name"), "Ash");
			await userEvent.type(canvas.getByLabelText("Phone"), "5555550177");
			await userEvent.type(canvas.getByLabelText("Email"), "robin@example.com");
			await userEvent.selectOptions(
				canvas.getByLabelText(/How did you hear about us/),
				"Our venue",
			);
			await userEvent.type(canvas.getByLabelText(/Which venue/), "The Fairhaven Grange");
			await userEvent.click(canvas.getByRole("button", { name: "Send Request" }));
		});
		await step("the endpoint got the request, the way, the day, and the time", async () => {
			await waitFor(() => expect(endpoint).toHaveBeenCalledOnce());
			await expect(posted()).toMatchObject({
				kind: "catering",
				mode: "call",
				day: "2026-12-02",
				time: "10:30",
				source: "Our venue",
				sourceDetail: "The Fairhaven Grange",
				company: "",
			});
		});
		await step("the request received, never booked, its heading focused", async () => {
			const title = await canvas.findByRole("heading", { name: "We have your request, Robin." });
			await expect(title).toHaveFocus();
			await expect(
				canvas.getByText(/This is a request, not a booked appointment yet\./),
			).toBeVisible();
			await expect(canvas.getByText("Wednesday, December 2 at 10:30 am")).toBeVisible();
			await expect(onLead).toHaveBeenCalledOnce();
		});
	},
};

/** A material that allows one way shows it as a line, never a choice. */
export const OneWayByMaterial: Story = {
	args: { initial: { kind: "wedding", material: "fondant" } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("radio")).toBeNull();
		await expect(canvas.getByText("A fondant cake starts with a call.")).toBeVisible();
		await expect(
			canvas.getByRole("complementary", { name: "Your request so far" }),
		).toHaveTextContent("A phone call");
	},
};

/** A kind that allows one way shows it as a line too. */
export const OneWayByKind: Story = {
	args: { initial: { kind: "tasting" } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("radio")).toBeNull();
		await expect(
			canvas.getByText("A tasting starts with a visit, so we can bring the samples."),
		).toBeVisible();
	},
};

/** The second step: the month, opening on the first day's week, and the times. */
export const WhenStep: Story = {
	args: { initial: { kind: "wedding", material: "buttercream", mode: "visit" }, initialStep: 1 },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByText(
				"The first day you can ask for is Monday, November 30. We work Monday to Friday, except federal holidays.",
			),
		).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Monday, November 30" })).toBeEnabled();
		await expect(canvas.getByRole("button", { name: "Earlier month" })).toBeDisabled();
	},
};

/** The third step sent with nothing filled in: a count of what to fix, each field saying why. */
export const WhoWithErrors: Story = {
	args: {
		initial: {
			kind: "wedding",
			material: "buttercream",
			mode: "visit",
			day: "2026-12-02",
			time: "09:00",
		},
		initialStep: 2,
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Send Request" }));
		await expect(canvas.getByRole("alert")).toHaveTextContent(
			"5 things need fixing before we can send this.",
		);
		await expect(canvas.getByLabelText("First name")).toHaveFocus();
		await expect(canvas.getByLabelText("Street address")).toHaveAccessibleDescription(
			"Enter the address we are visiting.",
		);
		await expect(endpoint).not.toHaveBeenCalled();
	},
};

/** The request received, read back, with what happens next and the phone. */
export const RequestReceived: Story = {
	args: {
		initial: {
			kind: "wedding",
			material: "buttercream",
			mode: "visit",
			day: "2026-12-02",
			time: "09:00",
			...who,
		},
		initialStep: 2,
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Send Request" }));
		await expect(
			await canvas.findByRole("heading", { name: "We have your request, Robin." }),
		).toBeVisible();
		await expect(canvas.getByText("You get an email with a copy of this request.")).toBeVisible();
		await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
	},
};

/**
 * The endpoint refused the day (a tab left open across a holiday the office
 * added): the form goes back to When with the endpoint's own words.
 */
export const DayRefused: Story = {
	beforeEach: answering(400, {
		ok: false,
		code: "when",
		error: "Our office is closed that day. Please pick another day.",
	}),
	args: {
		initial: {
			kind: "wedding",
			material: "buttercream",
			mode: "visit",
			day: "2026-12-02",
			time: "09:00",
			...who,
		},
		initialStep: 2,
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Send Request" }));
		await expect(await canvas.findByRole("alert")).toHaveTextContent(
			"Our office is closed that day.",
		);
		await expect(canvas.getByRole("heading", { name: "When works for you?" })).toBeVisible();
	},
};

/** A tablet: one column, the summary in the bar at the foot of the screen. */
export const Tablet: Story = {
	globals: pin("tablet"),
	args: { initial: { kind: "wedding", material: "buttercream", mode: "visit" }, initialStep: 1 },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("complementary", { name: "Your request so far" })).toBeNull();
		await expect(
			canvas.getByRole("button", { name: /Your request so far: A wedding cake, a visit/ }),
		).toBeVisible();
		await expectNoSidewaysScroll();
	},
};

/**
 * A phone: before anything is chosen the bar offers the phone; once a kind
 * is chosen its two lines open the whole summary as a sheet, a modal dialog
 * that closes by its button and gives focus back.
 */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent, step }) => {
		await step("before anything is chosen, the bar offers the phone", async () => {
			await expect(canvas.getByRole("link", { name: /Rather talk now\?/ })).toHaveAttribute(
				"href",
				"tel:+15555550142",
			);
			await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).toBeVisible();
		});
		await step("a kind chosen, the bar says it in a line", async () => {
			await userEvent.selectOptions(
				canvas.getByLabelText("What do you need help with?"),
				"A tasting for a group",
			);
			await expect(
				canvas.getByRole("button", { name: "Your request so far: A tasting for a group, a visit" }),
			).toBeVisible();
		});
		await step(
			"the line opens the summary as a modal sheet, and its button closes it",
			async () => {
				const opener = canvas.getByRole("button", { name: /Your request so far:/ });
				await userEvent.click(opener);
				const sheet = await canvas.findByRole("dialog", { name: "Your request so far" });
				await expect(sheet).toBeVisible();
				await expect(opener).toHaveAttribute("aria-expanded", "true");
				await expect(sheet).toHaveTextContent("A visit at your venue");
				await userEvent.click(canvas.getByRole("button", { name: "Close" }));
				await expect(opener).toHaveAttribute("aria-expanded", "false");
				await waitFor(() => expect(opener).toHaveFocus());
			},
		);
		await step("the page never scrolls sideways", async () => {
			await expectNoSidewaysScroll();
		});
	},
};
