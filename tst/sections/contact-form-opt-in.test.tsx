import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AddressParts, AddressProvider } from "../../src/primitives/AddressSearch";

const ALDER: AddressParts = {
	street: "418 Alder Street",
	city: "Fairhaven",
	state: "CO",
	zip: "80000",
};

import { ContactForm, type ContactFormProps } from "../../src/sections/ContactForm";

const BASE: ContactFormProps = {
	endpoint: "/api/contact",
	successMessage: "Thank you.",
	onLead: vi.fn(),
};

const change = (label: string | RegExp, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
const send = () => fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
const posted = () => JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));

describe("ContactForm with the opt in fields", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("draws no new field, alert, or key with no opt in prop", async () => {
		render(<ContactForm {...BASE} topics={["Orders"]} />);
		expect(screen.queryByLabelText("First name")).toBeNull();
		expect(screen.queryByLabelText("Phone")).toBeNull();
		expect(screen.queryByRole("checkbox")).toBeNull();
		send();
		expect(screen.queryByRole("alert")).toBeNull();
		change("Your name", "Robin Ash");
		change("Email", "robin@example.com");
		change("Message", "Hello");
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(Object.keys(posted()).sort()).toEqual([
			"company",
			"email",
			"message",
			"name",
			"submissionId",
			"topic",
		]);
	});

	it("posts the split name, the phone, the address, and the consent, keeping name for an old relay", async () => {
		render(
			<ContactForm
				{...BASE}
				splitName
				phone="required"
				address={{ states: ["CO", "WY"] }}
				consent={{ text: "You may text me about this request." }}
			/>,
		);
		change("First name", "Robin");
		change("Last name", "Ash");
		change("Phone", "(555) 555-0142");
		change("Email", "robin@example.com");
		change(/Street address/, "418 Alder Street");
		change("City", "Fairhaven");
		change("State", "WY");
		change("ZIP", "80000");
		change("Message", "A round cake");
		fireEvent.click(screen.getByRole("checkbox", { name: /You may text me/ }));
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted()).toEqual({
			name: "Robin Ash",
			firstName: "Robin",
			lastName: "Ash",
			phone: "(555) 555-0142",
			email: "robin@example.com",
			topic: "",
			address: { street: "418 Alder Street", city: "Fairhaven", state: "WY", zip: "80000" },
			message: "A round cake",
			consent: true,
			company: "",
			submissionId: expect.any(String),
		});
	});

	it("counts the refused fields when asked, marks each, and focuses the first", () => {
		render(<ContactForm {...BASE} splitName phone="required" errorSummary />);
		send();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"5 fields need fixing before this can be sent.",
		);
		expect(screen.getByLabelText("First name")).toHaveFocus();
		expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription(
			"Please enter a phone number with its area code.",
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("takes the site's words for the count, the labels, and the messages", () => {
		render(
			<ContactForm
				{...BASE}
				phone="required"
				errorSummary={(count) => `Fix ${count}.`}
				labels={{ phone: "Best number" }}
				errorText={{ phone: "We need a number to call." }}
			/>,
		);
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		expect(screen.getByRole("alert")).toHaveTextContent("Fix 1.");
		expect(screen.getByLabelText("Best number")).toHaveAccessibleDescription(
			"We need a number to call.",
		);
	});

	it("marks an optional address and phone as optional, and never refuses them empty", async () => {
		render(<ContactForm {...BASE} phone="optional" address={{}} />);
		expect(screen.getByLabelText(/Phone/)).not.toBeRequired();
		// Beside the phone, and beside the street when there is no search.
		expect(screen.getAllByText("(optional)")).toHaveLength(2);
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted().address).toEqual({ street: "", city: "", state: "", zip: "" });
	});

	it("posts no state for an optional address left empty, though the select shows one", async () => {
		render(<ContactForm {...BASE} address={{ states: ["CO", "WY"] }} />);
		expect(screen.getByLabelText("State")).toHaveValue("CO");
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted().address).toEqual({ street: "", city: "", state: "", zip: "" });
	});

	it("draws the address search with Google's attribution from a key, loading nothing before focus", () => {
		render(<ContactForm {...BASE} address={{ googlePlacesKey: "test-key-form" }} />);
		const search = screen.getByRole("combobox", { name: /Address/ });
		expect(document.head.querySelector("script[src*='maps.googleapis.com']")).toBeNull();
		const credit = screen.getByText("Google Maps");
		expect(credit).toHaveAttribute("translate", "no");
		fireEvent.focus(search);
		const script = document.head.querySelector("script[src*='maps.googleapis.com']");
		expect(script?.getAttribute("src")).toContain("key=test-key-form");
		script?.remove();
	});

	it("lets a site's own provider and attribution win over a key", () => {
		const provider: AddressProvider = {
			suggest: async () => [],
			resolve: async () => ({ street: "", city: "", state: "", zip: "" }),
		};
		render(
			<ContactForm
				{...BASE}
				address={{ googlePlacesKey: "test-key-unused", provider, attribution: "Our own lookup" }}
			/>,
		);
		expect(screen.getByText("Our own lookup")).toBeInTheDocument();
		expect(screen.queryByText("Google Maps")).toBeNull();
	});

	it("refuses a required address part by part", () => {
		render(<ContactForm {...BASE} address={{ required: true }} />);
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		expect(screen.getByLabelText("Street address")).toHaveFocus();
		for (const label of ["Street address", "City", "State", "ZIP"]) {
			expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "true");
		}
	});

	it("fills the four fields from a picked address, and they stay editable", async () => {
		vi.useFakeTimers();
		const provider: AddressProvider = {
			suggest: async () => [{ id: "a", text: "418 Alder Street", secondary: "Fairhaven, CO" }],
			resolve: async () => ({
				street: "418 Alder Street",
				city: "Fairhaven",
				state: "NM",
				zip: "80000",
			}),
		};
		render(<ContactForm {...BASE} address={{ provider, states: ["CO"] }} />);
		screen.getByRole("combobox", { name: /Address/ }).focus();
		fireEvent.change(screen.getByRole("combobox", { name: /Address/ }), {
			target: { value: "418" },
		});
		act(() => vi.advanceTimersByTime(250));
		await act(async () => {});
		fireEvent.click(screen.getByRole("option", { name: /418 Alder Street/ }));
		await act(async () => {});
		expect(screen.getByLabelText("Street address")).toHaveValue("418 Alder Street");
		expect(screen.getByLabelText("City")).toHaveValue("Fairhaven");
		// A state the list lacks is offered rather than lost.
		expect(screen.getByLabelText("State")).toHaveValue("NM");
		expect(screen.getByLabelText("ZIP")).toHaveValue("80000");
		change("City", "Fairhaven Heights");
		expect(screen.getByLabelText("City")).toHaveValue("Fairhaven Heights");
	});

	describe("a pick", () => {
		/** A provider offering one address whose parts arrive when the test says. */
		function slowProvider(parts: AddressParts) {
			let finish: () => void = () => {};
			const provider: AddressProvider = {
				suggest: async () => [{ id: "a", text: "418 Alder Street", secondary: "Fairhaven" }],
				resolve: () =>
					new Promise((resolve) => {
						finish = () => resolve(parts);
					}),
			};
			return { provider, finish: () => act(async () => finish()) };
		}
		const choose = async () => {
			const search = screen.getByRole("combobox", { name: /Address/ });
			search.focus();
			fireEvent.change(search, { target: { value: "418" } });
			act(() => vi.advanceTimersByTime(250));
			await act(async () => {});
			fireEvent.click(screen.getByRole("option", { name: /418 Alder Street/ }));
		};

		beforeEach(() => {
			vi.useFakeTimers();
		});

		it("that lands after a hand edit to an address field is dropped", async () => {
			const { provider, finish } = slowProvider(ALDER);
			render(<ContactForm {...BASE} address={{ provider }} />);
			await choose();
			change(/Street address/, "12 Birch Lane");
			await finish();
			expect(screen.getByLabelText(/Street address/)).toHaveValue("12 Birch Lane");
			expect(screen.getByLabelText("City")).toHaveValue("");
		});

		it("that is dropped puts the search back to what was typed, never the address the form refused", async () => {
			const { provider, finish } = slowProvider(ALDER);
			render(<ContactForm {...BASE} address={{ provider }} />);
			await choose();
			change(/Street address/, "12 Birch Lane");
			await finish();
			expect(screen.getByRole("combobox", { name: /Address/ })).toHaveValue("418");
		});

		it("clears only the refusals of the fields it filled with a valid value", async () => {
			const { provider, finish } = slowProvider({ ...ALDER, zip: "800" });
			render(<ContactForm {...BASE} address={{ provider, required: true }} />);
			send();
			await choose();
			await finish();
			expect(screen.getByLabelText("Street address")).not.toHaveAttribute("aria-invalid");
			expect(screen.getByLabelText("City")).not.toHaveAttribute("aria-invalid");
			expect(screen.getByLabelText("ZIP")).toHaveAttribute("aria-invalid", "true");
		});

		it("with no state keeps the state the select shows, and posts it", async () => {
			const { provider, finish } = slowProvider({ ...ALDER, state: "" });
			render(<ContactForm {...BASE} address={{ provider, states: ["CO", "WY"] }} />);
			change("State", "WY");
			await choose();
			await finish();
			expect(screen.getByLabelText("State")).toHaveValue("WY");
			vi.useRealTimers();
			change("Your name", "Robin");
			change("Email", "robin@example.com");
			change("Message", "Hi");
			send();
			await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
			expect(posted().address.state).toBe("WY");
		});
	});

	it("reads the visitor's phone and email back as links in the thanks", async () => {
		render(<ContactForm {...BASE} phone="optional" thanks={{ title: "Thanks." }} />);
		change("Your name", "Robin");
		change(/Phone/, "(555) 555-0199");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		await screen.findByRole("heading", { name: "Thanks." });
		expect(screen.getByRole("link", { name: "(555) 555-0199" })).toHaveAttribute(
			"href",
			"tel:+15555550199",
		);
		expect(screen.getByRole("link", { name: "robin@example.com" })).toHaveAttribute(
			"href",
			"mailto:robin@example.com",
		);
	});

	it("replaces the form with the thanks when asked, focuses it, and brings the form back", async () => {
		const onLead = vi.fn();
		render(
			<ContactForm
				{...BASE}
				onLead={onLead}
				splitName
				phone="optional"
				thanks={{
					title: (values) => `Thanks, ${values.firstName}.`,
					steps: ["We read it today."],
					stepsHeading: "Next",
				}}
			/>,
		);
		change("First name", "Robin");
		change("Last name", "Ash");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		const title = await screen.findByRole("heading", { name: "Thanks, Robin." });
		expect(title).toHaveFocus();
		expect(screen.queryByRole("button", { name: /Send Message/ })).toBeNull();
		expect(screen.getByText("Thank you.")).toBeInTheDocument();
		expect(screen.getByText("robin@example.com")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Next" })).toBeInTheDocument();
		expect(onLead).toHaveBeenCalledOnce();
		fireEvent.click(screen.getByRole("button", { name: "Send another message" }));
		expect(screen.getByLabelText("First name")).toHaveValue("");
		await waitFor(() => expect(screen.getByLabelText("First name")).toHaveFocus());
	});

	it("brings back an empty address after a mail handoff's thanks", async () => {
		render(
			<ContactForm
				{...BASE}
				endpoint={undefined}
				toEmail="hello@kestrelhollow.example.com"
				address={{ states: ["CO", "WY"] }}
				thanks={{ title: "Thanks." }}
			/>,
		);
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		change(/Street address/, "418 Alder Street");
		change("City", "Fairhaven");
		change("State", "WY");
		change("ZIP", "80000");
		send();
		await screen.findByRole("heading", { name: "Thanks." });
		fireEvent.click(screen.getByRole("button", { name: "Send another message" }));
		expect(screen.getByLabelText(/Street address/)).toHaveValue("");
		expect(screen.getByLabelText("City")).toHaveValue("");
		expect(screen.getByLabelText("State")).toHaveValue("CO");
		expect(screen.getByLabelText("ZIP")).toHaveValue("");
	});

	it("keeps the thanks in the status region by default", async () => {
		render(<ContactForm {...BASE} splitName />);
		change("First name", "Robin");
		change("Last name", "Ash");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Thank you."));
		expect(screen.getByRole("button", { name: /Send Message/ })).toBeInTheDocument();
	});

	it("draws no topic select for an empty list of topics, as for none", () => {
		render(<ContactForm {...BASE} topics={[]} />);
		expect(screen.queryByRole("combobox")).toBeNull();
		expect(screen.queryByLabelText("What can we help with?")).toBeNull();
	});

	it("posts services as an array and as the topic", async () => {
		render(<ContactForm {...BASE} services={["Bread", "Cakes"]} topics={["Ignored"]} />);
		expect(screen.queryByLabelText("What can we help with?")).toBeNull();
		change("Your name", "Robin");
		change("Email", "robin@example.com");
		change("Message", "Hi");
		send();
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
		expect(posted()).toMatchObject({ services: [], topic: "" });
	});
});
