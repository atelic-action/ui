import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, type Mock, spyOn, waitFor } from "storybook/test";
import { ContactForm } from "../../src/sections";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/*
 * Every send goes to a mock: `window.fetch` is replaced for the story by a
 * `fn` that answers the way a site's relay would, so no story makes a real
 * request. Each story says how the relay answers.
 */
let relay: Mock<typeof fetch>;

const answering = (respond: () => Promise<Response>) => () => {
	relay = fn(respond) as unknown as Mock<typeof fetch>;
	const spy = spyOn(window, "fetch").mockImplementation(relay);
	return () => spy.mockRestore();
};

const accepted = () => Promise.resolve(new Response("{}", { status: 200 }));

/** What the form sent, as the relay received it. */
const sent = (call = 0) => {
	const init = relay.mock.calls[call]?.[1] as RequestInit | undefined;
	return JSON.parse(String(init?.body));
};

const onLead = fn();

/**
 * The contact form: a name, an email, a topic, and a message, checked in
 * the browser and sent to the site's relay, with a honeypot no person sees.
 * The send button, the primary, fails contrast on this theme
 * (stories/findings/primitives.md).
 */
const meta = {
	title: "Sections/ContactForm",
	component: ContactForm,
	tags: ["known-issue"],
	parameters: { ...knownIssues("primary-button-contrast") },
	args: {
		endpoint: "/api/contact",
		topics: ["An order", "A cake", "Wholesale", "Something else"],
		successMessage: "Thank you. We answer within a day, from seven to three.",
		footnote: "We never share your address.",
		onLead,
	},
	beforeEach: () => {
		onLead.mockClear();
		return answering(accepted)();
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap" style={{ maxWidth: 560 }}>
					<h2>Send us a note</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];
type User = Parameters<NonNullable<Story["play"]>>[0]["userEvent"];

async function fillIn(canvas: Canvas, userEvent: User) {
	await userEvent.type(canvas.getByLabelText("Your name"), "Robin Ash");
	await userEvent.type(canvas.getByLabelText("Email"), "robin@example.com");
	await userEvent.selectOptions(canvas.getByLabelText("What can we help with?"), "A cake");
	await userEvent.type(canvas.getByLabelText("Message"), "A round cake for Saturday, please.");
}

const send = (canvas: Canvas) => canvas.getByRole("button", { name: /Send Message/ });

/**
 * A human's send: the relay gets the fields and an empty honeypot, the thank
 * you shows, the form clears, and one lead is counted.
 */
export const SendsAndThanks: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("filled in and sent", async () => {
			await fillIn(canvas, userEvent);
			await userEvent.click(send(canvas));
		});
		await step("the relay got one POST of the fields, the honeypot empty", async () => {
			await waitFor(() => expect(relay).toHaveBeenCalledOnce());
			const [url, init] = relay.mock.calls[0] as [string, RequestInit];
			await expect(url).toBe("/api/contact");
			await expect(init.method).toBe("POST");
			await expect(sent()).toEqual({
				name: "Robin Ash",
				email: "robin@example.com",
				topic: "A cake",
				message: "A round cake for Saturday, please.",
				company: "",
			});
		});
		await step("the thank you shows, the form clears, one lead counted", async () => {
			await expect(await canvas.findByText(/Thank you. We answer within a day/)).toBeVisible();
			await expect(canvas.getByLabelText("Your name")).toHaveValue("");
			await expect(onLead).toHaveBeenCalledOnce();
			await expect(onLead).toHaveBeenCalledWith();
		});
		// The thank you is a plain block, so a screen reader is never told the
		// note went: nothing announces it and focus stays on the button.
		await step("the thank you is announced", async () => {
			await knownBug("contact-status-unannounced", async () => {
				await expect(canvas.getByRole("status")).toHaveTextContent(/Thank you/);
			});
		});
	},
};

/**
 * Sent empty: each required field says what it needs, and nothing is sent.
 * Then fixed one at a time, each message leaves with its fix.
 */
export const Validation: Story = {
	parameters: { ...knownIssues("primary-button-contrast", "form-error-contrast") },
	play: async ({ canvas, userEvent, step }) => {
		await step("before a send, no field complains", async () => {
			await expect(canvas.getByText("Please enter your name.")).not.toBeVisible();
		});
		await step("sent empty, every required field complains and nothing is sent", async () => {
			await userEvent.click(send(canvas));
			await expect(canvas.getByText("Please enter your name.")).toBeVisible();
			await expect(canvas.getByText("Please enter a valid email.")).toBeVisible();
			await expect(canvas.getByText("Please add a short message.")).toBeVisible();
			await expect(relay).not.toHaveBeenCalled();
			await expect(onLead).not.toHaveBeenCalled();
		});
		await step("an address with no domain is still refused", async () => {
			await userEvent.type(canvas.getByLabelText("Your name"), "Robin Ash");
			await userEvent.type(canvas.getByLabelText("Email"), "robin@");
			await userEvent.click(send(canvas));
			await expect(canvas.getByText("Please enter your name.")).not.toBeVisible();
			await expect(canvas.getByText("Please enter a valid email.")).toBeVisible();
		});
		// The messages are drawn, but no field is marked invalid or described
		// by its message, so a screen reader hears none of them.
		await step("a refused field is marked invalid and names its message", async () => {
			await knownBug("contact-errors-unannounced", async () => {
				const email = canvas.getByLabelText("Email");
				await expect(email).toHaveAttribute("aria-invalid", "true");
				await expect(email).toHaveAccessibleDescription("Please enter a valid email.");
			});
		});
		await step("whitespace alone is not a name or a message", async () => {
			await userEvent.clear(canvas.getByLabelText("Your name"));
			await userEvent.type(canvas.getByLabelText("Your name"), "   ");
			await userEvent.clear(canvas.getByLabelText("Email"));
			await userEvent.type(canvas.getByLabelText("Email"), "robin@example.com");
			await userEvent.type(canvas.getByLabelText("Message"), "  ");
			await userEvent.click(send(canvas));
			await expect(canvas.getByText("Please enter your name.")).toBeVisible();
			await expect(canvas.getByText("Please add a short message.")).toBeVisible();
			await expect(canvas.getByText("Please enter a valid email.")).not.toBeVisible();
			await expect(relay).not.toHaveBeenCalled();
		});
	},
};

/**
 * The honeypot is out of a person's reach: hidden from a screen reader,
 * skipped by Tab, and empty on every human send.
 */
export const HoneypotStaysEmpty: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Tab walks the four fields and the button, never the honeypot", async () => {
			const order = ["Your name", "Email", "What can we help with?", "Message"];
			for (const label of order) {
				await userEvent.tab();
				await expect(canvas.getByLabelText(label)).toHaveFocus();
			}
			await userEvent.tab();
			await expect(send(canvas)).toHaveFocus();
		});
		await step("a screen reader finds no Company field", async () => {
			await expect(canvas.queryByRole("textbox", { name: "Company" })).toBeNull();
		});
		await step("a human send carries it empty", async () => {
			await fillIn(canvas, userEvent);
			await userEvent.click(send(canvas));
			await waitFor(() => expect(relay).toHaveBeenCalledOnce());
			await expect(sent().company).toBe("");
		});
	},
};

/**
 * A bot fills the honeypot: the relay still gets it (and answers with the
 * same quiet success), the bot sees the thank you, and no lead is counted.
 */
export const HoneypotCatchesABot: Story = {
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		const company = canvas.getByLabelText("Company", { selector: "input" });
		await userEvent.type(company, "Spam Co");
		await userEvent.click(send(canvas));
		await waitFor(() => expect(relay).toHaveBeenCalledOnce());
		await expect(sent().company).toBe("Spam Co");
		await expect(await canvas.findByText(/Thank you/)).toBeVisible();
		await expect(onLead).not.toHaveBeenCalled();
	},
};

/** The relay refuses: the error shows, what was written stays, and no lead is counted. */
export const RelayRefuses: Story = {
	parameters: { ...knownIssues("primary-button-contrast", "form-error-contrast") },
	beforeEach: answering(() => Promise.resolve(new Response("{}", { status: 500 }))),
	args: { errorMessage: "That did not go through. Call us at (555) 555-0142 instead." },
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		await userEvent.click(send(canvas));
		await expect(await canvas.findByText(/That did not go through/)).toBeVisible();
		await expect(canvas.getByLabelText("Message")).toHaveValue(
			"A round cake for Saturday, please.",
		);
		await expect(canvas.queryByText(/Thank you/)).toBeNull();
		await expect(onLead).not.toHaveBeenCalled();
	},
};

/** The network fails outright: the default error, and a second try that works clears it. */
export const NetworkFailsThenRetries: Story = {
	beforeEach: answering(() => Promise.reject(new TypeError("Failed to fetch"))),
	play: async ({ canvas, userEvent, step }) => {
		await step("the send fails with the default words", async () => {
			await fillIn(canvas, userEvent);
			await userEvent.click(send(canvas));
			await expect(
				await canvas.findByText(/Something went wrong sending your message/),
			).toBeVisible();
		});
		await step("a second try that the relay accepts shows the thank you instead", async () => {
			relay.mockImplementation(accepted);
			await userEvent.click(send(canvas));
			await expect(await canvas.findByText(/Thank you/)).toBeVisible();
			await expect(canvas.queryByText(/Something went wrong/)).toBeNull();
			await expect(onLead).toHaveBeenCalledOnce();
		});
	},
};

/** While the relay answers, the button says so and a second press sends nothing. */
export const SendingOnce: Story = {
	beforeEach: () => {
		let release: (response: Response) => void = () => {};
		const restore = answering(
			() =>
				new Promise<Response>((resolve) => {
					release = resolve;
				}),
		)();
		(window as unknown as { releaseRelay: () => void }).releaseRelay = () =>
			release(new Response("{}", { status: 200 }));
		return restore;
	},
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		await userEvent.click(send(canvas));
		const sending = await canvas.findByRole("button", { name: /Sending/ });
		await userEvent.click(sending);
		await expect(relay).toHaveBeenCalledOnce();
		(window as unknown as { releaseRelay: () => void }).releaseRelay();
		await expect(await canvas.findByText(/Thank you/)).toBeVisible();
		await expect(send(canvas)).toBeVisible();
	},
};

/** No endpoint and no inbox: a send fails rather than vanishing. */
export const NowhereToSend: Story = {
	parameters: { ...knownIssues("primary-button-contrast", "form-error-contrast") },
	args: { endpoint: undefined, toEmail: undefined },
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		await userEvent.click(send(canvas));
		await expect(await canvas.findByText(/Something went wrong/)).toBeVisible();
		await expect(relay).not.toHaveBeenCalled();
	},
};

/**
 * No endpoint, an inbox instead: the form hands off to the reader's mail
 * app. The handoff navigates the page, which a story cannot follow, so this
 * shows the form as it stands (stories/findings/sections.md, Checker Limits).
 */
export const MailHandoff: Story = {
	args: { endpoint: undefined, toEmail: "hello@kestrelhollow.example.com", footnote: undefined },
};

/** On a phone the form fills the column, the button as wide as the fields. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const field = canvas.getByLabelText("Message").getBoundingClientRect();
		const button = send(canvas).getBoundingClientRect();
		await expect(Math.round(button.width)).toBe(Math.round(field.width));
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** A long topic name in the menu, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		topics: [
			"A standing wholesale order for a cafe, a grocer, or a restaurant kitchen",
			"Something else",
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
