import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ScheduleConfig } from "../../src/forms/scheduleConfig";
import { ScheduleRequestForm } from "../../src/sections/ScheduleRequestForm";

const CONFIG: ScheduleConfig = {
	kinds: [
		{ id: "repair", label: "A repair", materials: true, visit: 30, call: 20 },
		{ id: "storm", label: "Storm damage", visit: 30, note: "This one starts with a visit." },
		{ id: "remodel", label: "A remodel", visit: 60, call: 30 },
	],
	materials: [
		{ id: "shingle", label: "Shingle" },
		{ id: "tile", label: "Tile", only: "call", note: "A tile roof starts with a call." },
	],
	materialLabel: "Roof material",
	hours: { open: "08:00", close: "17:00" },
	timeZone: "America/Denver",
	phone: { display: "(555) 555-0100", e164: "+15555550100" },
	source: {
		label: "How did you hear about us?",
		options: ["Google", { label: "Other", detail: { label: "Where did you hear?" } }],
	},
};

const TODAY = "2026-11-25";

function renderForm(props: Partial<Parameters<typeof ScheduleRequestForm>[0]> = {}) {
	return render(
		<ScheduleRequestForm
			config={CONFIG}
			endpoint="/api/schedule"
			today={TODAY}
			onLead={() => {}}
			{...props}
		/>,
	);
}

/** The step's own button beside the step; the phone's bar holds its twin. */
const continueButton = (name: RegExp | string = "Continue") =>
	screen.getAllByRole("button", { name })[0] as HTMLElement;

function chooseWhat(kind = "repair", mode = "At your property") {
	fireEvent.change(screen.getByLabelText("What do you need help with?"), {
		target: { value: kind },
	});
	if (mode) fireEvent.click(screen.getByLabelText(new RegExp(mode)));
	fireEvent.click(continueButton());
}

function chooseWhen(day = "Wednesday, December 2", time = "09:00") {
	// The calendar opens on the week of the first day, Monday, November 30.
	fireEvent.click(screen.getByRole("button", { name: "Later month" }));
	fireEvent.click(screen.getByRole("button", { name: day }));
	fireEvent.change(screen.getByLabelText("What time?"), { target: { value: time } });
	fireEvent.click(continueButton());
}

function fillWho() {
	fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Dana" } });
	fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Whitfield" } });
	fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "(555) 555-0142" } });
	fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dana@example.com" } });
	fireEvent.change(screen.getByLabelText("Street address"), {
		target: { value: "418 Alder Street" },
	});
}

describe("ScheduleRequestForm", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("keeps the request's id across a resubmit, and makes a new one once a field changes", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(async () => new Response("{}", { status: 502 })),
		);
		renderForm();
		chooseWhat();
		chooseWhen();
		fillWho();
		const idOf = (call: number) =>
			JSON.parse(String(vi.mocked(fetch).mock.calls[call]?.[1]?.body)).submissionID as string;
		const send = async (calls: number) => {
			fireEvent.click(continueButton(/Send Request/));
			await waitFor(() => expect(fetch).toHaveBeenCalledTimes(calls));
			await waitFor(() => expect(continueButton(/Send Request/)).not.toBeDisabled());
		};
		await send(1);
		await send(2);
		expect(idOf(0)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		expect(idOf(1)).toBe(idOf(0));
		fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Dane" } });
		await send(3);
		expect(idOf(2)).not.toBe(idOf(0));
	});

	it("offers a visit or a call as cards, with each one's length", () => {
		renderForm();
		fireEvent.change(screen.getByLabelText("What do you need help with?"), {
			target: { value: "remodel" },
		});
		const group = screen.getByRole("group", { name: "How would you like to meet?" });
		expect(within(group).getAllByRole("radio")).toHaveLength(2);
		expect(group).toHaveTextContent("About 1 hour. We come out and take a look.");
		expect(group).toHaveTextContent("About 30 minutes. We call you and talk it through.");
	});

	it("shows one way as a line, never a choice, for a kind or a material that allows one", () => {
		renderForm();
		fireEvent.change(screen.getByLabelText("What do you need help with?"), {
			target: { value: "storm" },
		});
		expect(screen.queryByRole("radio")).toBeNull();
		expect(screen.getByText("This one starts with a visit.")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("What do you need help with?"), {
			target: { value: "repair" },
		});
		fireEvent.change(screen.getByLabelText(/Roof material/), { target: { value: "tile" } });
		expect(screen.queryByRole("radio")).toBeNull();
		expect(screen.getByText("A tile roof starts with a call.")).toBeInTheDocument();
	});

	it("refuses to go on without a kind and a way, and says what to fix", () => {
		renderForm();
		fireEvent.click(continueButton());
		expect(screen.getByRole("alert")).toHaveTextContent(
			"One thing needs fixing before you can go on.",
		);
		expect(screen.getByLabelText("What do you need help with?")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(screen.getByLabelText("What do you need help with?")).toHaveFocus();
	});

	it("offers no weekend, holiday, or too soon day, and times that finish by closing", () => {
		renderForm();
		chooseWhat("remodel");
		// The first month opens on the first day's week: no row of nothing to pick.
		expect(screen.getByRole("heading", { name: "When works for you?" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /November 26/ })).toBeNull();
		expect(
			screen.getByRole("button", { name: "Sunday, November 29, not available" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Monday, November 30" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Earlier month" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Later month" }));
		expect(
			screen.getByRole("button", { name: "Saturday, December 5, not available" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Friday, December 25, not available" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Thursday, December 24" })).toBeEnabled();
		expect(
			screen.getByText(/The first day you can ask for is Monday, November 30/),
		).toBeInTheDocument();
		const times = within(screen.getByLabelText("What time?")).getAllByRole("option");
		// A remodel visit takes an hour: 08:00 through 16:00, after the empty row.
		expect(times[1]).toHaveValue("08:00");
		expect(times.at(-1)).toHaveValue("16:00");
	});

	it("needs the address for a visit and not for a call", () => {
		renderForm();
		chooseWhat("repair", "By phone");
		chooseWhen();
		expect(screen.getByLabelText(/Street address/)).not.toHaveAttribute("aria-invalid");
		fireEvent.click(continueButton(/Send Request/));
		expect(screen.getByLabelText("First name")).toHaveFocus();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"4 things need fixing before we can send this.",
		);
	});

	it("sends the request, then says it was received and never booked", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ ok: true, receipt: true }), { status: 200 }),
				),
		);
		const onLead = vi.fn();
		renderForm({ onLead });
		chooseWhat();
		chooseWhen();
		fillWho();
		fireEvent.change(screen.getByLabelText(/How did you hear about us/), {
			target: { value: "Other" },
		});
		fireEvent.change(screen.getByLabelText(/Where did you hear/), {
			target: { value: "The fall fair" },
		});
		fireEvent.click(continueButton(/Send Request/));

		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "We have your request, Dana." }),
			).toBeInTheDocument(),
		);
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body).toMatchObject({
			kind: "repair",
			mode: "visit",
			day: "2026-12-02",
			time: "09:00",
			firstName: "Dana",
			address: { street: "418 Alder Street" },
			source: "Other",
			sourceDetail: "The fall fair",
			company: "",
		});
		expect(
			screen.getByText(
				/This is a request, not a booked appointment yet\. A copy is on its way to your email address\./,
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Our office confirms your time within 2 business days, by phone or text."),
		).toBeInTheDocument();
		expect(document.body).not.toHaveTextContent(/is booked|your appointment is/i);
		expect(onLead).toHaveBeenCalledOnce();
	});

	it("says no copy is coming when the endpoint sent none", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ ok: true, receipt: false }), { status: 200 }),
				),
		);
		renderForm();
		chooseWhat();
		chooseWhen();
		fillWho();
		fireEvent.click(continueButton(/Send Request/));
		await waitFor(() =>
			expect(
				screen.getByText("This is a request, not a booked appointment yet."),
			).toBeInTheDocument(),
		);
		expect(screen.queryByText(/You get an email with a copy/)).toBeNull();
	});

	it("goes back to When with the endpoint's words when it refuses the day", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						ok: false,
						code: "when",
						error: "Our office is closed that day. Please pick another day.",
					}),
					{
						status: 400,
					},
				),
			),
		);
		renderForm();
		chooseWhat();
		chooseWhen();
		fillWho();
		fireEvent.click(continueButton(/Send Request/));
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent("Our office is closed that day."),
		);
		expect(screen.getByRole("heading", { name: "When works for you?" })).toBeInTheDocument();
	});

	it("moves focus to each new step's heading, and a finished step is a button back", () => {
		renderForm();
		chooseWhat();
		expect(screen.getByRole("heading", { name: "When works for you?" })).toHaveFocus();
		fireEvent.click(screen.getByRole("button", { name: "Back to What" }));
		expect(screen.getByRole("heading", { name: "What can we help with?" })).toHaveFocus();
		expect(screen.getByLabelText(/At your property/)).toBeChecked();
	});
});
