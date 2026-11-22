import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, waitFor } from "storybook/test";
import { GateLogin } from "../../src/components";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const reader = "rosa@quillandfern.example.com";

/**
 * Stands in for the request link function: every post the form makes is
 * answered here, never by the network. `status` is the answer's status;
 * `hold` leaves the request in flight.
 */
function answering(status: number, hold = false) {
	return () => {
		const spy = spyOn(window, "fetch").mockImplementation(() =>
			hold ? new Promise<Response>(() => {}) : Promise.resolve(new Response("{}", { status })),
		);
		return () => spy.mockRestore();
	};
}

/** The fetch spy a story's `beforeEach` installed. */
const fetchSpy = () => window.fetch as unknown as ReturnType<typeof spyOn>;

/** Adds a query parameter to the page's address for a story, and takes it off after. */
function withQuery(query: string) {
	return () => {
		const before = window.location.href;
		const url = new URL(before);
		for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value);
		history.replaceState(history.state, "", url);
		return () => history.replaceState(history.state, "", before);
	};
}

/**
 * The access gate's sign in screen: an email in, and the same "check your
 * inbox" answer whoever asks.
 */
const meta = {
	title: "Components/GateLogin",
	component: GateLogin,
	args: {
		brandName: "Kestrel Hollow Bakehouse",
		eyebrow: "Private preview",
		builtBy: "Larkmoor Studio",
		contactEmail: "hello@studio.example.com",
	},
	beforeEach: answering(200),
} satisfies Meta<typeof GateLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The screen: the brand with its Preview tag, the headline, the field, and the fine print. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
			"A first look, by invitation.",
		);
		await expect(canvas.getByText("Preview")).toBeVisible();
		await expect(canvas.getByRole("textbox", { name: "Your email" })).toHaveAttribute(
			"autocomplete",
			"email",
		);
		await expect(canvas.getByRole("button", { name: /Email me my link/ })).toBeEnabled();
		await expect(canvas.getByRole("link", { name: "hello@studio.example.com" })).toHaveAttribute(
			"href",
			"mailto:hello@studio.example.com",
		);
	},
};

/** No eyebrow and no fine print: the brand alone over the default words. */
export const Plain: Story = {
	args: { eyebrow: undefined, builtBy: undefined, contactEmail: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("Preview")).toBeNull();
		await expect(canvas.queryByText(/Built by/)).toBeNull();
	},
};

/** The artifact's own headline and lead. */
export const CustomWords: Story = {
	args: {
		headline: "The bakery's read, for its owners.",
		lead: "Enter the address the read was sent to.",
		contactEmail: undefined,
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Built by Larkmoor Studio")).toBeVisible();
	},
};

/**
 * An address that is not one: nothing is sent, the field is marked invalid
 * and described by the alert, and focus goes back to it.
 */
export const Invalid: Story = {
	play: async ({ canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Your email" });
		await userEvent.type(field, "rosa at the cafe");
		await userEvent.click(canvas.getByRole("button", { name: /Email me my link/ }));
		const alert = canvas.getByRole("alert");
		await expect(alert).toHaveTextContent(/does not look like an email address/);
		await expect(field).toHaveAttribute("aria-invalid", "true");
		await expect(field).toHaveAccessibleDescription(/does not look like an email address/);
		await expect(field).toHaveFocus();
		await expect(fetchSpy()).not.toHaveBeenCalled();
	},
};

/**
 * A good address posts once, to the function, with where to go next; the
 * answer swaps in the confirmation, focused so a screen reader hears it.
 * "Start over" brings the form back with focus in the field.
 */
export const Sent: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("the form posts the address and the next path", async () => {
			await userEvent.type(canvas.getByRole("textbox", { name: "Your email" }), `  ${reader} `);
			await userEvent.keyboard("{Enter}");
			await waitFor(() => expect(fetchSpy()).toHaveBeenCalledOnce());
			const [url, init] = fetchSpy().mock.calls[0] as [string, RequestInit];
			await expect(url).toBe("/api/auth/request-link");
			await expect(init.method).toBe("POST");
			await expect(JSON.parse(String(init.body))).toEqual({ email: reader, next: "/" });
		});
		await step("the confirmation replaces the form, and takes focus", async () => {
			const heading = await canvas.findByRole("heading", { name: "Check your inbox." });
			await expect(heading).toHaveFocus();
			await expect(canvas.getByText(reader)).toBeVisible();
			await expect(canvas.queryByRole("textbox")).toBeNull();
		});
		await step("Start over brings the form back, focus in the field", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Start over" }));
			const field = await canvas.findByRole("textbox", { name: "Your email" });
			await waitFor(() => expect(field).toHaveFocus());
		});
	},
};

/** The function fails: the form stays, with an alert to try again. */
export const Failed: Story = {
	beforeEach: answering(500),
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("textbox", { name: "Your email" }), reader);
		await userEvent.click(canvas.getByRole("button", { name: /Email me my link/ }));
		const alert = await canvas.findByRole("alert");
		await expect(alert).toHaveTextContent("Something went wrong. Please try again in a moment.");
		await expect(canvas.getByRole("textbox", { name: "Your email" })).toBeVisible();
	},
};

/** After a failure, a bad address clears the failure: only the new problem is shown. */
export const FailedThenInvalid: Story = {
	beforeEach: answering(500),
	play: async ({ canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Your email" });
		await userEvent.type(field, reader);
		await userEvent.click(canvas.getByRole("button", { name: /Email me my link/ }));
		await canvas.findByText(/Something went wrong/);
		await userEvent.clear(field);
		await userEvent.type(field, "rosa");
		await userEvent.click(canvas.getByRole("button", { name: /Email me my link/ }));
		await expect(canvas.queryByText(/Something went wrong/)).toBeNull();
		await expect(canvas.getAllByRole("alert")).toHaveLength(1);
	},
};

/** While the request is in flight the button says so and is disabled, and a second submit posts nothing. */
export const Sending: Story = {
	beforeEach: answering(200, true),
	play: async ({ canvas, canvasElement, userEvent }) => {
		await userEvent.type(canvas.getByRole("textbox", { name: "Your email" }), reader);
		await userEvent.click(canvas.getByRole("button", { name: /Email me my link/ }));
		const button = await canvas.findByRole("button", { name: /Sending/ });
		await expect(button).toBeDisabled();
		(canvasElement.querySelector("form") as HTMLFormElement).requestSubmit();
		await expect(fetchSpy()).toHaveBeenCalledOnce();
	},
};

/** A site under a base path posts to its own path, and the reader's next page rides along. */
export const EndpointAndNext: Story = {
	args: { endpoint: "/proto/api/auth/request-link" },
	beforeEach: [answering(200), withQuery("next=/the-read")],
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("textbox", { name: "Your email" }), reader);
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(fetchSpy()).toHaveBeenCalledOnce());
		const [url, init] = fetchSpy().mock.calls[0] as [string, RequestInit];
		await expect(url).toBe("/proto/api/auth/request-link");
		await expect(JSON.parse(String(init.body)).next).toBe("/the-read");
	},
};

/** Arriving from an expired link: an alert says so; a fresh link clears it. */
export const Expired: Story = {
	beforeEach: [answering(200), withQuery("e=expired")],
	play: async ({ canvas }) => {
		const alert = await canvas.findByRole("alert");
		await expect(alert).toHaveTextContent(/That link has expired/);
	},
};

/** On a phone, with the fine print, nothing scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
