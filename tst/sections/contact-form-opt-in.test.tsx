import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AddressProvider } from "../../src/primitives/AddressSearch";
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
		expect(Object.keys(posted()).sort()).toEqual(["company", "email", "message", "name", "topic"]);
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
			"Please enter a 10 digit phone number.",
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
