import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, type Mock, spyOn, waitFor, within } from "storybook/test";
import { ContactForm, type ContactFormProps } from "../../src/sections";
import { exampleProvider } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { layerOpened } from "../support/settle";
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
 */
const meta = {
	title: "Sections/ContactForm",
	component: ContactForm,
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
		await step("an empty status region waits on the page before anything is sent", async () => {
			await expect(canvas.getByRole("status")).toBeEmptyDOMElement();
		});
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
		// The thank you lands in a status region that was on the page, empty,
		// before the send, so a screen reader watching it announces it once.
		await step("the thank you is announced", async () => {
			await expect(canvas.getByRole("status")).toHaveTextContent(/Thank you/);
		});
	},
};

/**
 * Sent empty: each required field says what it needs, is marked invalid and
 * described by its message, focus goes to the first of them, and nothing is
 * sent. Then fixed one at a time, each message leaves with its fix.
 */
export const Validation: Story = {
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
		await step("focus moves to the first refused field", async () => {
			await expect(canvas.getByLabelText("Your name")).toHaveFocus();
			await expect(canvas.getByLabelText("Your name")).toHaveAccessibleDescription(
				"Please enter your name.",
			);
		});
		await step("an address with no domain is still refused", async () => {
			await userEvent.type(canvas.getByLabelText("Your name"), "Robin Ash");
			await userEvent.type(canvas.getByLabelText("Email"), "robin@");
			await userEvent.click(send(canvas));
			await expect(canvas.getByText("Please enter your name.")).not.toBeVisible();
			await expect(canvas.getByText("Please enter a valid email.")).toBeVisible();
		});
		await step(
			"a refused field is marked invalid and names its message; a fixed one is not",
			async () => {
				const email = canvas.getByLabelText("Email");
				await expect(email).toHaveAttribute("aria-invalid", "true");
				await expect(email).toHaveAccessibleDescription("Please enter a valid email.");
				await expect(email).toHaveFocus();
				await expect(canvas.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
			},
		);
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

/** The relay refuses: the error is announced, what was written stays, and no lead is counted. */
export const RelayRefuses: Story = {
	beforeEach: answering(() => Promise.resolve(new Response("{}", { status: 500 }))),
	args: { errorMessage: "That did not go through. Call us at (555) 555-0142 instead." },
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		await userEvent.click(send(canvas));
		await expect(await canvas.findByText(/That did not go through/)).toBeVisible();
		await expect(canvas.getByRole("status")).toHaveTextContent(/That did not go through/);
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

/** Lets a held relay answer, in the story that holds it. */
let releaseRelay = () => {};

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
		releaseRelay = () => release(new Response("{}", { status: 200 }));
		return () => {
			releaseRelay = () => {};
			restore();
		};
	},
	play: async ({ canvas, userEvent }) => {
		await fillIn(canvas, userEvent);
		await userEvent.click(send(canvas));
		const sending = await canvas.findByRole("button", { name: /Sending/ });
		await userEvent.click(sending);
		await expect(relay).toHaveBeenCalledOnce();
		releaseRelay();
		await expect(await canvas.findByText(/Thank you/)).toBeVisible();
		await expect(send(canvas)).toBeVisible();
	},
};

/** No endpoint and no inbox: a send fails rather than vanishing. */
export const NowhereToSend: Story = {
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

/**
 * Two forms on one page keep apart: every label names its own form's
 * field, every id is unique, and a refusal in one marks nothing in the other.
 */
export const TwoForms: Story = {
	render: (args) => (
		<>
			<ContactForm {...args} />
			<h2>Or ask about wholesale</h2>
			<ContactForm {...args} />
		</>
	),
	play: async ({ canvas, userEvent, step }) => {
		const forms = canvas
			.getAllByRole("button", { name: /Send Message/ })
			.map((button) => within(button.closest("form") as HTMLElement));
		const [first, second] = forms as [ReturnType<typeof within>, ReturnType<typeof within>];
		await step("each label names its own form's field", async () => {
			await expect(first.getByLabelText("Your name")).not.toBe(second.getByLabelText("Your name"));
			const ids = Array.from(document.querySelectorAll("form [id]"), (element) => element.id);
			await expect(new Set(ids).size).toBe(ids.length);
		});
		await step("a refusal in the second form marks only the second", async () => {
			await userEvent.click(second.getByRole("button", { name: /Send Message/ }));
			await expect(second.getByLabelText("Your name")).toHaveAttribute("aria-invalid", "true");
			await expect(second.getByLabelText("Your name")).toHaveFocus();
			await expect(first.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
		});
	},
};

/** On a phone the form fills the column, the button as wide as the fields. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const field = canvas.getByLabelText("Message").getBoundingClientRect();
		const button = send(canvas).getBoundingClientRect();
		await expect(Math.round(button.width)).toBe(Math.round(field.width));
		await expectNoSidewaysScroll();
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
		await expectNoSidewaysScroll();
	},
};

// ---- A service business's shape (8.5.0) ----

const consentText =
	"By checking this box, you agree that Kestrel Hollow Bakehouse may text you about this order: when it is ready, a change to its pickup time, and nothing else. We never share your number for marketing. You can opt out at any time by replying STOP. Message and data rates may apply. Consent is not a condition of any order.";

/** Every opt in prop on, in the bakery's own words. */
const serviceShape = {
	splitName: true,
	phone: "required" as const,
	address: {
		provider: exampleProvider(),
		attribution: "Suggestions by Example Maps",
		states: ["CO", "WY", "NM"],
	},
	services: ["Sandwich loaves", "Celebration cakes", "Wholesale", "Catering"],
	consent: {
		text: consentText,
		links: [
			{ label: "Terms", href: "/terms" },
			{ label: "Privacy policy", href: "/privacy" },
		],
	},
	labels: {
		addressSearch: "Delivery address",
		services: "What can we bake for you?",
		servicesHint: "(check all that apply)",
		servicesCount: (count) => `${count} kinds chosen`,
		message: "Tell us about the order",
	},
	placeholders: { addressSearch: "Start typing your address", services: "Choose any" },
	errorSummary: (count) =>
		count === 1
			? "One thing needs fixing before we can send this."
			: `${count} things need fixing before we can send this.`,
	footnote: (
		<>
			Need it today? <a href="tel:+15555550142">Call (555) 555-0142</a>
		</>
	),
	topics: undefined,
} satisfies Partial<ContactFormProps>;

const thanks: ContactFormProps["thanks"] = {
	title: (values) => `We have your order, ${values.firstName}.`,
	lead: (values) => `A copy is on its way to ${values.email}.`,
	summary: { address: "Deliver to", contact: "Reach you" },
	stepsHeading: "What happens next",
	steps: ["You get an email with a copy of the order.", "We call within a day to settle the date."],
};

async function fillService(canvas: Canvas, userEvent: User) {
	await userEvent.type(canvas.getByLabelText("First name"), "Robin");
	await userEvent.type(canvas.getByLabelText("Last name"), "Ash");
	await userEvent.type(canvas.getByLabelText("Phone"), "(555) 555-0199");
	await userEvent.type(canvas.getByLabelText("Email"), "robin@example.com");
	await userEvent.type(canvas.getByLabelText("Tell us about the order"), "Two tiers, lemon.");
}

/**
 * The whole shape: a split name, a phone beside the email, the address
 * search over the four address fields, the services picker, and the
 * consent line. A pick fills the fields, and the relay gets every new key
 * beside the five it always got.
 */
export const ServiceBusiness: Story = {
	args: serviceShape,
	play: async ({ canvas, userEvent, step }) => {
		await step("the names share a line, as do the phone and the email", async () => {
			const first = canvas.getByLabelText("First name").getBoundingClientRect();
			const last = canvas.getByLabelText("Last name").getBoundingClientRect();
			await expect(Math.round(first.top)).toBe(Math.round(last.top));
			const phone = canvas.getByLabelText("Phone").getBoundingClientRect();
			const email = canvas.getByLabelText("Email").getBoundingClientRect();
			await expect(Math.round(phone.top)).toBe(Math.round(email.top));
		});
		await step("filled in", async () => {
			await fillService(canvas, userEvent);
		});
		await step("a picked address fills street, city, state, and ZIP", async () => {
			await userEvent.type(canvas.getByRole("combobox", { name: /Delivery address/ }), "Cedar");
			await userEvent.click(await canvas.findByRole("option", { name: /4180 Cedar Hollow Road/ }));
			await waitFor(() =>
				expect(canvas.getByLabelText("Street address")).toHaveValue("4180 Cedar Hollow Road"),
			);
			await expect(canvas.getByLabelText("City")).toHaveValue("Fairhaven");
			await expect(canvas.getByLabelText("State")).toHaveValue("WY");
			await expect(canvas.getByLabelText("ZIP")).toHaveValue("82000");
		});
		await step("two services chosen, and the consent ticked", async () => {
			await userEvent.click(canvas.getByRole("button", { name: /What can we bake/ }));
			await layerOpened(() => canvas.getByRole("dialog", { name: /What can we bake/ }));
			await userEvent.click(canvas.getByRole("checkbox", { name: "Celebration cakes" }));
			await userEvent.click(canvas.getByRole("checkbox", { name: "Catering" }));
			await userEvent.keyboard("{Escape}");
			await userEvent.click(canvas.getByRole("checkbox", { name: /By checking this box/ }));
		});
		await step("sent: the relay gets the five keys and every new one", async () => {
			await userEvent.click(send(canvas));
			await waitFor(() => expect(relay).toHaveBeenCalledOnce());
			await expect(sent()).toEqual({
				name: "Robin Ash",
				email: "robin@example.com",
				topic: "Celebration cakes, Catering",
				message: "Two tiers, lemon.",
				company: "",
				firstName: "Robin",
				lastName: "Ash",
				phone: "(555) 555-0199",
				address: { street: "4180 Cedar Hollow Road", city: "Fairhaven", state: "WY", zip: "82000" },
				services: ["Celebration cakes", "Catering"],
				consent: true,
			});
			await expect(onLead).toHaveBeenCalledOnce();
		});
		await step("by default the thanks shows over the cleared form", async () => {
			await expect(await canvas.findByText(/Thank you. We answer within a day/)).toBeVisible();
			await expect(canvas.getByLabelText("Street address")).toHaveValue("");
			await expect(canvas.getByRole("button", { name: /What can we bake/ })).toHaveTextContent(
				"Choose any",
			);
		});
	},
};

/**
 * Sent empty: a count of the fields to fix over the form, a message under
 * each, focus on the first, and nothing sent. A bad phone is refused on its
 * own once the rest is right.
 */
export const ServiceBusinessRefused: Story = {
	args: serviceShape,
	play: async ({ canvas, userEvent, step }) => {
		await step("sent empty", async () => {
			await userEvent.click(send(canvas));
			await expect(canvas.getByRole("alert")).toHaveTextContent(
				"5 things need fixing before we can send this.",
			);
			await expect(canvas.getByLabelText("First name")).toHaveFocus();
			await expect(canvas.getByLabelText("Phone")).toHaveAccessibleDescription(
				"Please enter a 10 digit phone number.",
			);
			await expect(canvas.getByLabelText("Street address")).not.toHaveAttribute("aria-invalid");
			await expect(relay).not.toHaveBeenCalled();
		});
		await step("all but the phone fixed: one thing, and focus on the phone", async () => {
			await fillService(canvas, userEvent);
			await userEvent.clear(canvas.getByLabelText("Phone"));
			await userEvent.type(canvas.getByLabelText("Phone"), "555-0199");
			await userEvent.click(send(canvas));
			await expect(canvas.getByRole("alert")).toHaveTextContent(
				"One thing needs fixing before we can send this.",
			);
			await expect(canvas.getByLabelText("Phone")).toHaveFocus();
			await expect(relay).not.toHaveBeenCalled();
		});
	},
};

/**
 * With `thanks`, the form is replaced once sent: the heading greets by
 * name and takes focus, what was sent is read back, the next steps follow,
 * and Send another message brings back an empty form, focus on its first
 * field.
 */
export const ServiceBusinessThanks: Story = {
	args: { ...serviceShape, thanks },
	play: async ({ canvas, userEvent, step }) => {
		await step("filled in, with an address typed by hand, and sent", async () => {
			await fillService(canvas, userEvent);
			await userEvent.type(canvas.getByLabelText("Street address"), "418 Alder Street");
			await userEvent.type(canvas.getByLabelText("City"), "Fairhaven");
			await userEvent.type(canvas.getByLabelText("ZIP"), "80000");
			await userEvent.click(send(canvas));
		});
		await step("the thanks replaces the form, its heading focused", async () => {
			const title = await canvas.findByRole("heading", { name: "We have your order, Robin." });
			await expect(title).toHaveFocus();
			await expect(canvas.queryByRole("button", { name: /Send Message/ })).toBeNull();
			await expect(canvas.getByText("A copy is on its way to robin@example.com.")).toBeVisible();
		});
		await step("what was sent, read back, and what happens next", async () => {
			await expect(canvas.getByText("Deliver to")).toBeVisible();
			await expect(canvas.getByText("418 Alder Street, Fairhaven, CO 80000")).toBeVisible();
			await expect(canvas.getByText("(555) 555-0199, robin@example.com")).toBeVisible();
			await expect(canvas.queryByText("Services")).toBeNull();
			await expect(canvas.getByRole("heading", { name: "What happens next" })).toBeVisible();
			await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
		});
		await step("Send another message brings the form back, empty", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Send another message" }));
			await waitFor(() => expect(canvas.getByLabelText("First name")).toHaveFocus());
			await expect(canvas.getByLabelText("First name")).toHaveValue("");
			await expect(canvas.getByLabelText("Street address")).toHaveValue("");
		});
	},
};

/**
 * The consent line shows two lines and a Show more; opened, the whole
 * wording and its links show. The checkbox is named by every word either way.
 */
export const ConsentOpens: Story = {
	args: serviceShape,
	play: async ({ canvas, userEvent }) => {
		const box = canvas.getByRole("checkbox", { name: /By checking this box/ });
		await expect(box).toHaveAccessibleName(consentText);
		await expect(canvas.queryByRole("link", { name: "Terms" })).toBeNull();
		const more = canvas.getByRole("button", { name: "Show more" });
		await expect(more).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(more);
		await expect(more).toHaveAttribute("aria-expanded", "true");
		await expect(canvas.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
			"href",
			"/privacy",
		);
		await expect(box).not.toBeChecked();
	},
};

/** An address with no provider: the four fields alone, the street marked optional. */
export const AddressWithoutSearch: Story = {
	args: { address: {}, phone: "optional" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("combobox", { name: /address/i })).toBeNull();
		await expect(canvas.getByLabelText(/Street address/)).toHaveAccessibleName(
			"Street address (optional)",
		);
		await expect(canvas.getByLabelText(/Phone/)).toHaveAccessibleName("Phone (optional)");
		await expect(canvas.getByLabelText("State")).toHaveValue("");
	},
};

/** The whole shape on a phone: one field to a line, and the page never scrolls sideways. */
export const ServiceBusinessPhone: Story = {
	args: serviceShape,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const first = canvas.getByLabelText("First name").getBoundingClientRect();
		const last = canvas.getByLabelText("Last name").getBoundingClientRect();
		await expect(last.top).toBeGreaterThan(first.bottom);
		const city = canvas.getByLabelText("City").getBoundingClientRect();
		const zip = canvas.getByLabelText("ZIP").getBoundingClientRect();
		await expect(Math.round(zip.right)).toBeLessThanOrEqual(Math.round(window.innerWidth));
		await expect(city.width).toBeGreaterThan(0);
		await expectNoSidewaysScroll();
	},
};

/** The thanks on a phone: the read back wraps and the page never scrolls sideways. */
export const ServiceBusinessThanksPhone: Story = {
	args: { ...serviceShape, thanks },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await fillService(canvas, userEvent);
		await userEvent.click(send(canvas));
		await canvas.findByRole("heading", { name: "We have your order, Robin." });
		await expectNoSidewaysScroll();
	},
};
