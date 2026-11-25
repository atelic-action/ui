import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Source } from "../../src/forms/source";
import {
	TURNSTILE_SCRIPT_URL,
	type TurnstileAPI,
	type TurnstileRenderOptions,
} from "../../src/lib/turnstile";
import { CATCHER_GLOBAL, type Catcher } from "../../src/monitoring/catcher";
import { ContactForm, type ContactFormProps } from "../../src/sections/ContactForm";

const BASE: ContactFormProps = {
	endpoint: "/api/contact",
	successMessage: "Thank you.",
	errorMessage: "Sending failed.",
	onLead: vi.fn(),
};

const SOURCE: Source = {
	label: "How did you hear about us?",
	options: ["Google", "A friend", "Instagram"],
};

const GUARD = { siteKey: "1x00000000000000000000BB" };

const change = (label: string | RegExp, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
const send = () => fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
const posted = (call = 0) => JSON.parse(String(vi.mocked(fetch).mock.calls[call]?.[1]?.body));

function fillIn() {
	change("Your name", "Robin Ash");
	change("Email", "robin@example.com");
	change("Message", "A round cake");
}

function answering(status: number, body: unknown = {}) {
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

function scripts(): HTMLScriptElement[] {
	return Array.from(document.head.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`));
}

/** A stand in for Turnstile's API, answering each run with the next token. */
function fakeTurnstile() {
	let options: TurnstileRenderOptions | undefined;
	let runs = 0;
	const api = {
		render: vi.fn((_container: HTMLElement, given: TurnstileRenderOptions) => {
			options = given;
			return "widget-1";
		}),
		execute: vi.fn(() => {
			runs += 1;
			options?.callback(`token-${runs}`);
		}),
		reset: vi.fn(),
		remove: vi.fn(),
	};
	window.turnstile = api as unknown as TurnstileAPI;
	return api;
}

/** A catcher already wired to the SDK, so a report lands in `report`. */
function listening() {
	const report = vi.fn();
	(window as unknown as Record<string, Catcher>)[CATCHER_GLOBAL] = {
		q: [],
		max: 20,
		dropped: 0,
		push: vi.fn(),
		onError: vi.fn(),
		onRejection: vi.fn(),
		report,
	};
	return report;
}

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	delete window.turnstile;
	delete (window as unknown as Record<string, unknown>)[CATCHER_GLOBAL];
	for (const script of scripts()) script.remove();
});

describe("ContactForm with a Source Selector", () => {
	beforeEach(() => answering(200, { ok: true, receipt: false }));

	it("draws the question after the topic and before the message, with an empty first row", () => {
		render(<ContactForm {...BASE} topics={["Orders"]} source={SOURCE} />);
		const select = screen.getByLabelText(/How did you hear about us\?/) as HTMLSelectElement;
		const fields = Array.from(document.querySelectorAll("select, textarea"));
		expect(fields.indexOf(select)).toBeGreaterThan(
			fields.indexOf(screen.getByLabelText("What can we help with?")),
		);
		expect(fields.indexOf(select)).toBeLessThan(fields.indexOf(screen.getByLabelText("Message")));
		expect(Array.from(select.options).map((option) => option.text)).toEqual([
			"Choose one",
			"Google",
			"A friend",
			"Instagram",
		]);
		expect(screen.getByText("(optional)")).toBeInTheDocument();
	});

	it("posts the chosen answer as source", async () => {
		render(<ContactForm {...BASE} source={SOURCE} />);
		fillIn();
		change(/How did you hear about us\?/, "A friend");
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted().source).toBe("A friend");
	});

	it("posts an empty source when none was chosen, and no source key without the prop", async () => {
		const { unmount } = render(<ContactForm {...BASE} source={SOURCE} />);
		fillIn();
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted().source).toBe("");
		unmount();
		render(<ContactForm {...BASE} />);
		fillIn();
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
		expect(posted(1)).not.toHaveProperty("source");
	});

	it("refuses a required question left unanswered, in the site's words, and sends nothing", () => {
		render(
			<ContactForm
				{...BASE}
				source={{ ...SOURCE, required: true }}
				errorText={{ source: "Tell us how you found us." }}
			/>,
		);
		fillIn();
		send();
		const select = screen.getByLabelText("How did you hear about us?");
		expect(fetch).not.toHaveBeenCalled();
		expect(select).toHaveAttribute("aria-invalid", "true");
		expect(select).toHaveAccessibleDescription("Tell us how you found us.");
		expect(select).toHaveFocus();
		expect(screen.queryByText("(optional)")).toBeNull();
	});

	it("says a required question needs an answer in neutral words by default", () => {
		render(<ContactForm {...BASE} source={{ ...SOURCE, required: true }} />);
		fillIn();
		send();
		expect(screen.getByText("Please choose an answer.")).toBeInTheDocument();
	});

	it("clears the answer once the message is sent", async () => {
		render(<ContactForm {...BASE} source={SOURCE} />);
		fillIn();
		change(/How did you hear about us\?/, "Google");
		send();
		await screen.findByText("Thank you.");
		expect(screen.getByLabelText(/How did you hear about us\?/)).toHaveValue("");
	});
});

describe("ContactForm with the guard", () => {
	beforeEach(() => answering(200, { ok: true, receipt: false }));

	it("loads nothing at render, and the script on the first focus inside the form", () => {
		render(<ContactForm {...BASE} guard={GUARD} />);
		expect(scripts()).toHaveLength(0);
		fireEvent.focus(screen.getByLabelText("Your name"));
		expect(scripts()).toHaveLength(1);
	});

	it("loads nothing on focus without a guard", () => {
		render(<ContactForm {...BASE} />);
		fireEvent.focus(screen.getByLabelText("Your name"));
		expect(scripts()).toHaveLength(0);
	});

	it("posts the challenge's token as turnstile, and spends it after every submit", async () => {
		const api = fakeTurnstile();
		render(<ContactForm {...BASE} guard={GUARD} />);
		fillIn();
		send();
		await screen.findByText("Thank you.");
		expect(posted().turnstile).toBe("token-1");
		expect(api.render.mock.calls[0]?.[1]).toMatchObject({
			sitekey: GUARD.siteKey,
			execution: "execute",
		});
		await waitFor(() => expect(api.reset).toHaveBeenCalledWith("widget-1"));
	});

	it("gets a token promptly on a send after the thanks, from a widget in the new form", async () => {
		// Like the real one, a widget answers only while its container is on the page.
		const containers: HTMLElement[] = [];
		const callbacks: TurnstileRenderOptions[] = [];
		const api = {
			render: vi.fn((container: HTMLElement, options: TurnstileRenderOptions) => {
				containers.push(container);
				callbacks.push(options);
				return `widget-${containers.length}`;
			}),
			execute: vi.fn((id: string) => {
				const at = Number(id.split("-")[1]) - 1;
				if (containers[at]?.isConnected) callbacks[at]?.callback(`token-${at + 1}`);
			}),
			reset: vi.fn(),
			remove: vi.fn(),
		};
		window.turnstile = api as unknown as TurnstileAPI;
		render(<ContactForm {...BASE} guard={GUARD} thanks={{ title: "Sent" }} />);
		fillIn();
		send();
		await screen.findByRole("button", { name: "Send another message" });
		expect(posted().turnstile).toBe("token-1");

		fireEvent.click(screen.getByRole("button", { name: "Send another message" }));
		fillIn();
		send();
		// Well inside the ten seconds a stranded widget would cost.
		await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2), { timeout: 1000 });
		expect(posted(1).turnstile).toBe("token-2");
		expect(api.render).toHaveBeenCalledTimes(2);
		// The second widget went into the new form's own container; token-2
		// arriving at all says that container was on the page when it ran.
		expect(containers[1]).not.toBe(containers[0]);
		await waitFor(() => expect(api.remove).toHaveBeenCalledWith("widget-1"));
	});

	it("posts no turnstile key without a guard", async () => {
		render(<ContactForm {...BASE} />);
		fillIn();
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted()).not.toHaveProperty("turnstile");
	});

	it("reports a script that fails to load once, and still sends with an empty token", async () => {
		const report = listening();
		render(<ContactForm {...BASE} guard={GUARD} />);
		fillIn();
		send();
		await waitFor(() => expect(scripts()).toHaveLength(1));
		scripts()[0]?.dispatchEvent(new Event("error"));
		await screen.findByText("Thank you.");
		expect(fetch).toHaveBeenCalledOnce();
		expect(posted().turnstile).toBe("");
		expect(report).toHaveBeenCalledOnce();
		const [error, kind] = report.mock.calls[0] ?? [];
		expect(kind).toBe("handled");
		expect(String((error as Error).message)).toContain("The Turnstile script did not load");
		expect(String((error as Error).message)).not.toContain("robin@example.com");
	});

	it("reports a challenge that errors, and still sends", async () => {
		const report = listening();
		const api = fakeTurnstile();
		api.execute.mockImplementation(() => {
			api.render.mock.calls[0]?.[1]["error-callback"]("300030");
		});
		render(<ContactForm {...BASE} guard={GUARD} />);
		fillIn();
		send();
		await screen.findByText("Thank you.");
		expect(posted().turnstile).toBe("");
		expect(report).toHaveBeenCalledOnce();
	});

	it("sends with an empty token when no token arrives within ten seconds", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const report = listening();
		const api = fakeTurnstile();
		api.execute.mockImplementation(() => {});
		render(<ContactForm {...BASE} guard={GUARD} />);
		fillIn();
		send();
		await vi.advanceTimersByTimeAsync(9_999);
		expect(fetch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		vi.useRealTimers();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted().turnstile).toBe("");
		expect(report).toHaveBeenCalledOnce();
	});
});

describe("ContactForm stopped as a bot's", () => {
	it.each([
		["a 403 from the guard", 403, { ok: false, code: "guard", error: "x" }],
		["a rate limit's 429", 429, {}],
	])("shows the blocked message on %s, posting nothing further", async (_name, status, body) => {
		answering(status, body);
		const onError = vi.fn();
		render(<ContactForm {...BASE} onError={onError} />);
		fillIn();
		send();
		await screen.findByText("We could not send this from your browser. Please call us instead.");
		expect(screen.queryByText("Sending failed.")).toBeNull();
		expect(fetch).toHaveBeenCalledOnce();
		expect(onError).toHaveBeenCalledOnce();
		// A site showing failures itself can tell a blocked send from the rest.
		expect(onError).toHaveBeenCalledWith(undefined, { blocked: true });
		expect(screen.getByRole("status")).toHaveTextContent("call us instead");
	});

	it("shows the site's own words, a phone link among them", async () => {
		answering(403, { ok: false, code: "guard" });
		render(
			<ContactForm
				{...BASE}
				blockedMessage={
					<>
						Please call us at <a href="tel:+15555550142">(555) 555-0142</a>.
					</>
				}
			/>,
		);
		fillIn();
		send();
		expect(await screen.findByRole("link", { name: "(555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
	});

	it("keeps the general message for a 403 that is not the guard's, and says it was not blocked", async () => {
		answering(403, { ok: false });
		const onError = vi.fn();
		render(<ContactForm {...BASE} onError={onError} />);
		fillIn();
		send();
		expect(await screen.findByText("Sending failed.")).toBeInTheDocument();
		expect(onError).toHaveBeenCalledWith(undefined, { blocked: false });
	});

	it("leaves the blocked message to the site when inlineError is off", async () => {
		answering(429);
		const onError = vi.fn();
		render(<ContactForm {...BASE} onError={onError} inlineError={false} />);
		fillIn();
		send();
		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(screen.queryByText(/call us instead/)).toBeNull();
	});

	it("clears the blocked message on the next send that works", async () => {
		answering(429);
		render(<ContactForm {...BASE} />);
		fillIn();
		send();
		await screen.findByText(/call us instead/);
		answering(200, { ok: true });
		send();
		await screen.findByText("Thank you.");
		expect(screen.queryByText(/call us instead/)).toBeNull();
	});
});

describe("ContactForm's thanks and the receipt", () => {
	it.each([
		[true, "A copy is on its way to robin@example.com."],
		[false, "We have it."],
	])("hands the thanks whether a receipt went (%s)", async (receipt, words) => {
		answering(200, { ok: true, receipt });
		const lead = vi.fn((values: { email: string }, sent: { receipt: boolean }) =>
			sent.receipt ? `A copy is on its way to ${values.email}.` : "We have it.",
		);
		const title = vi.fn((_values: unknown, sent: { receipt: boolean }) =>
			sent.receipt ? "Sent, with a copy" : "Sent",
		);
		render(<ContactForm {...BASE} thanks={{ title, lead }} />);
		fillIn();
		send();
		expect(await screen.findByText(words)).toBeInTheDocument();
		expect(screen.getByRole("heading")).toHaveTextContent(receipt ? "Sent, with a copy" : "Sent");
		expect(lead.mock.calls.at(-1)?.[1]).toEqual({ receipt });
	});

	it("draws no lead at all when the lead's function answers none", async () => {
		answering(200, { ok: true, receipt: false });
		const { container } = render(
			<ContactForm
				{...BASE}
				thanks={{
					title: "Sent",
					lead: (_values, sent) => (sent.receipt ? "A copy is on its way." : null),
				}}
			/>,
		);
		fillIn();
		send();
		expect(await screen.findByRole("heading")).toHaveTextContent("Sent");
		expect(container.querySelector(".contact-thanks-lead")).toBeNull();
	});

	it("reads an answer with no receipt flag as no receipt", async () => {
		answering(200, {});
		const lead = vi.fn((_values: unknown, sent: { receipt: boolean }) => String(sent.receipt));
		render(<ContactForm {...BASE} thanks={{ title: "Sent", lead }} />);
		fillIn();
		send();
		expect(await screen.findByText("false")).toBeInTheDocument();
	});
});
