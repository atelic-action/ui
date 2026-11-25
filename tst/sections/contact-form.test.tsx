import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContactForm } from "../../src/sections/ContactForm";

// The Google tag a site loads; the package declares no global of its own.
declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

const PROPS = {
	endpoint: "/api/contact",
	topics: ["Booking", "Something else"],
	successMessage: "Your message is on its way!",
	errorMessage: "Sending failed.",
};

function fillForm() {
	fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Jane" } });
	fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
	fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there" } });
}

describe("ContactForm (endpoint mode)", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("POSTs the submission and shows the success message", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
		const call = vi.mocked(fetch).mock.calls[0];
		expect(call?.[0]).toBe("/api/contact");
		const body = JSON.parse(String(call?.[1]?.body));
		expect(body).toMatchObject({ name: "Jane", email: "jane@example.com", company: "" });
	});

	it("shows the error message and keeps field values on failure", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Sending failed.")).toBeInTheDocument();
		});
		expect(screen.getByLabelText("Your name")).toHaveValue("Jane");
	});

	it("hands a failure up to the site, beside its own message", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
		const onError = vi.fn();
		render(<ContactForm {...PROPS} onError={onError} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(onError).toHaveBeenCalledWith();
		expect(screen.getByText("Sending failed.")).toBeInTheDocument();
	});

	it("keeps its own failure message off when the site shows the failure itself", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
		const onError = vi.fn();
		render(<ContactForm {...PROPS} onError={onError} inlineError={false} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(screen.queryByText("Sending failed.")).toBeNull();
		expect(screen.getByLabelText("Your name")).toHaveValue("Jane");
	});

	it("still shows its own message with the message turned off and nothing to hand the failure to", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
		render(<ContactForm {...PROPS} inlineError={false} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(screen.getByText("Sending failed.")).toBeInTheDocument());
	});

	it("never calls onError for a send that worked or a press that failed validation", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		const onError = vi.fn();
		render(<ContactForm {...PROPS} onError={onError} />);
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
		expect(onError).not.toHaveBeenCalled();
	});

	it("shows the endpoint's own words when it refuses what was written", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response('{"ok":false,"error":"Message is over 5000 characters."}', { status: 400 }),
				),
		);
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Message is over 5000 characters.")).toBeInTheDocument();
		});
		expect(screen.queryByText("Sending failed.")).toBeNull();
	});

	it("keeps the general message for a failure that is not the visitor's to fix", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response('{"ok":false,"error":"Sending failed upstream."}', { status: 502 }),
				),
		);
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(screen.getByText("Sending failed.")).toBeInTheDocument());
		expect(screen.queryByText("Sending failed upstream.")).toBeNull();
	});

	it("tells the visitor a delivered message was sent even when the lead event throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		const onError = vi.fn();
		render(
			<ContactForm
				{...PROPS}
				onError={onError}
				onLead={() => {
					throw new Error("no analytics here");
				}}
			/>,
		);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
		expect(onError).not.toHaveBeenCalled();
		expect(screen.queryByText("Sending failed.")).toBeNull();
	});

	it("hands up the failure of a form with nowhere to send", () => {
		const onError = vi.fn();
		render(
			<ContactForm
				successMessage="Sent."
				errorMessage="Sending failed."
				onError={onError}
				inlineError={false}
			/>,
		);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		expect(onError).toHaveBeenCalledOnce();
	});

	it("shows it is working, and takes no second press, for as long as the relay takes to answer", async () => {
		let answer: (response: Response) => void = () => {};
		const pending = new Promise<Response>((resolve) => {
			answer = resolve;
		});
		const fetchMock = vi.fn().mockReturnValue(pending);
		vi.stubGlobal("fetch", fetchMock);
		render(<ContactForm {...PROPS} labels={{ sending: "Sending" }} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		const working = await screen.findByRole("button", { name: /Sending/ });
		fireEvent.click(working);
		expect(fetchMock).toHaveBeenCalledOnce();
		// Still working however long the relay's two tries take.
		expect(screen.getByRole("button", { name: /Sending/ })).toBeInTheDocument();

		answer(new Response('{"ok":true}', { status: 200 }));
		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
	});

	it("validates before sending anything", () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		render(<ContactForm {...PROPS} />);
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		expect(fetchMock).not.toHaveBeenCalled();
		expect(screen.getByText("Please enter your name.")).toBeVisible();
	});

	it("includes the honeypot field, hidden from real users", () => {
		render(<ContactForm {...PROPS} />);
		const honeypot = document.querySelector('input[name="company"]');
		expect(honeypot).not.toBeNull();
		expect(honeypot?.closest(".hp-field")).toHaveAttribute("aria-hidden", "true");
	});
});

describe("ContactForm generate_lead", () => {
	let gtag: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		gtag = vi.fn();
		window.gtag = gtag;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		delete window.gtag;
	});

	const leadCalls = () => gtag.mock.calls.filter((call) => call[1] === "generate_lead");

	it("fires once the endpoint accepts the submission, carrying no personal data", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(leadCalls()).toHaveLength(1));
		const params = leadCalls()[0]?.[2];
		expect(params).toEqual({ form_name: "contact", transport_type: "beacon" });
		const sent = JSON.stringify(params);
		for (const secret of ["Jane", "jane@example.com", "Hello there"]) {
			expect(sent).not.toContain(secret);
		}
	});

	it("does not fire when the endpoint rejects the submission", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(screen.getByText("Sending failed.")).toBeInTheDocument());
		expect(leadCalls()).toHaveLength(0);
	});

	it("does not fire when the network fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => expect(screen.getByText("Sending failed.")).toBeInTheDocument());
		expect(leadCalls()).toHaveLength(0);
	});

	it("does not fire for a honeypot catch the relay answered with success", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Totally Real LLC" } });
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.company).toBe("Totally Real LLC");
		expect(leadCalls()).toHaveLength(0);
	});

	it("does not fire on a press that fails validation", () => {
		vi.stubGlobal("fetch", vi.fn());
		render(<ContactForm {...PROPS} />);
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		expect(leadCalls()).toHaveLength(0);
	});

	it("still shows success when the Google tag is absent", async () => {
		delete window.gtag;
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));
		render(<ContactForm {...PROPS} />);
		fillForm();
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

		await waitFor(() => {
			expect(screen.getByText("Your message is on its way!")).toBeInTheDocument();
		});
	});
});
