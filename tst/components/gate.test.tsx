import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GateLogin, readCookie, Watermark } from "../../src/components";

function clearCookies() {
	for (const pair of document.cookie.split(";")) {
		const name = pair.split("=")[0].trim();
		if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
	}
}

describe("GateLogin", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		window.history.replaceState(null, "", "/");
	});

	const submit = (email: string) => {
		fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
		fireEvent.submit(screen.getByLabelText("Your email").closest("form") as HTMLFormElement);
	};

	it("names who the page is for, and wears the default copy", () => {
		render(<GateLogin brandName="Summit Movement Studio" />);
		expect(screen.getByText("Summit Movement Studio")).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"A first look, by invitation.",
		);
		expect(screen.queryByText("Preview")).not.toBeInTheDocument();
	});

	it("takes its copy and fine print from props, and tags the brand when an eyebrow is set", () => {
		render(
			<GateLogin
				brandName="Summit"
				eyebrow="Private"
				headline="Your writeup is ready."
				lead="Enter the address it was sent to."
				builtBy="Atelic"
				contactEmail="matt@atelic.me"
			/>,
		);
		expect(screen.getByText("Private")).toBeInTheDocument();
		expect(screen.getByText("Preview")).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your writeup is ready.");
		expect(screen.getByText("Enter the address it was sent to.")).toBeInTheDocument();
		expect(screen.getByText(/Built by Atelic/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "matt@atelic.me" })).toHaveAttribute(
			"href",
			"mailto:matt@atelic.me",
		);
	});

	it("posts the email and the next path, then says to check the inbox", async () => {
		window.history.replaceState(null, "", "/login?next=%2Fwriteup");
		const send = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", send);
		render(<GateLogin brandName="Summit" />);
		submit("sharon@example.com");
		await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
		expect(send).toHaveBeenCalledWith(
			"/api/auth/request-link",
			expect.objectContaining({ method: "POST" }),
		);
		expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({
			email: "sharon@example.com",
			next: "/writeup",
		});
		expect(screen.getByText("sharon@example.com")).toBeInTheDocument();
	});

	it("posts to the endpoint a site names", async () => {
		const send = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", send);
		render(<GateLogin brandName="Summit" endpoint="/proto/api/auth/request-link" />);
		submit("sharon@example.com");
		await waitFor(() => expect(send).toHaveBeenCalled());
		expect(send.mock.calls[0][0]).toBe("/proto/api/auth/request-link");
	});

	it("sends nothing for something that is not an email", () => {
		const send = vi.fn();
		vi.stubGlobal("fetch", send);
		render(<GateLogin brandName="Summit" />);
		submit("not an email");
		expect(send).not.toHaveBeenCalled();
	});

	it("says so when the request fails, and lets the reader try again", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
		render(<GateLogin brandName="Summit" />);
		submit("sharon@example.com");
		await waitFor(() => expect(screen.getByText(/Something went wrong/)).toBeInTheDocument());
		expect(screen.getByLabelText("Your email")).toBeInTheDocument();
	});

	it("says a link has expired when the wall sent the reader back", async () => {
		window.history.replaceState(null, "", "/login?e=expired");
		render(<GateLogin brandName="Summit" />);
		await waitFor(() => expect(screen.getByText(/That link has expired/)).toBeInTheDocument());
	});

	it("starts over from the confirmation", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
		render(<GateLogin brandName="Summit" />);
		submit("sharon@example.com");
		await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", { name: "Start over" }));
		expect(screen.getByLabelText("Your email")).toBeInTheDocument();
	});
});

describe("Watermark", () => {
	afterEach(clearCookies);

	it("renders nothing with no session", () => {
		const { container } = render(<Watermark />);
		expect(container).toBeEmptyDOMElement();
	});

	it("carries the signed in reader's email in a corner pill", async () => {
		document.cookie = `gate_email=${encodeURIComponent("josh@example.com")}; path=/`;
		const { container } = render(<Watermark />);
		await waitFor(() => expect(screen.getByText("josh@example.com")).toBeInTheDocument());
		expect(container.querySelector(".gate-wm-tile-layer")).toBeNull();
	});

	it("tiles the page as well in tiled mode", async () => {
		document.cookie = `gate_email=${encodeURIComponent("josh@example.com")}; path=/`;
		document.cookie = "gate_wm=tiled; path=/";
		const { container } = render(<Watermark />);
		await waitFor(() => expect(container.querySelectorAll(".gate-wm-tile")).toHaveLength(32));
	});
});

describe("readCookie", () => {
	afterEach(clearCookies);

	it("reads and decodes a cookie the page can see", () => {
		document.cookie = `gate_email=${encodeURIComponent("josh@example.com")}; path=/`;
		expect(readCookie("gate_email")).toBe("josh@example.com");
	});

	it("returns an empty string for a cookie that is not set", () => {
		expect(readCookie("gate_email")).toBe("");
	});

	it("returns an empty string for a value that will not decode", () => {
		document.cookie = "gate_email=%E0%A4%A; path=/";
		expect(readCookie("gate_email")).toBe("");
	});
});

describe("GateLogin, what a reader is told", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		window.history.replaceState(null, "", "/");
	});

	const type = (email: string) =>
		fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
	const form = () => screen.getByLabelText("Your email").closest("form") as HTMLFormElement;

	it("says an address is not an email, marks the field, and puts focus back in it", () => {
		vi.stubGlobal("fetch", vi.fn());
		render(<GateLogin brandName="Summit" />);
		type("not an email");
		fireEvent.submit(form());
		expect(screen.getByRole("alert")).toHaveTextContent(/does not look like an email/);
		const field = screen.getByLabelText("Your email");
		expect(field).toHaveAttribute("aria-invalid", "true");
		expect(field).toHaveAccessibleDescription(/does not look like an email/);
		expect(field).toHaveFocus();
		type("sharon@example.com");
		fireEvent.submit(form());
		expect(screen.queryByText(/does not look like an email/)).not.toBeInTheDocument();
	});

	it("sends once however many times the form is submitted while the first is in flight", async () => {
		let settle: (response: Response) => void = () => {};
		const send = vi.fn(() => new Promise<Response>((resolve) => (settle = resolve)));
		vi.stubGlobal("fetch", send);
		render(<GateLogin brandName="Summit" />);
		type("sharon@example.com");
		fireEvent.submit(form());
		await waitFor(() => expect(screen.getByRole("button", { name: /Sending/ })).toBeDisabled());
		fireEvent.submit(form());
		fireEvent.submit(form());
		expect(send).toHaveBeenCalledTimes(1);
		settle(new Response("{}", { status: 200 }));
		await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
	});

	it("moves focus to the confirmation, so it is read out and focus is not lost", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
		render(<GateLogin brandName="Summit" />);
		type("sharon@example.com");
		fireEvent.submit(form());
		await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus());
	});

	it("announces a failure and an expired link as alerts", async () => {
		window.history.replaceState(null, "", "/login?e=expired");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
		render(<GateLogin brandName="Summit" />);
		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/has expired/));
		type("sharon@example.com");
		fireEvent.submit(form());
		await waitFor(() =>
			expect(
				screen
					.getAllByRole("alert")
					.some((alert) => /Something went wrong/.test(alert.textContent ?? "")),
			).toBe(true),
		);
	});

	it("keeps the arrow out of the button's name", () => {
		render(<GateLogin brandName="Summit" />);
		expect(screen.getByRole("button", { name: "Email me my link" })).toBeInTheDocument();
	});
});

describe("readCookie, a name with pattern characters", () => {
	afterEach(clearCookies);

	it("reads the cookie of that exact name and no near miss", () => {
		document.cookie = "axb=wrong; path=/";
		document.cookie = "a.b=right; path=/";
		expect(readCookie("a.b")).toBe("right");
		clearCookies();
		document.cookie = "axb=wrong; path=/";
		expect(readCookie("a.b")).toBe("");
	});

	it("does not throw on a name that is no valid pattern", () => {
		expect(readCookie("gate[")).toBe("");
		expect(readCookie("")).toBe("");
	});

	it("does not read a cookie whose name merely ends with the one asked for", () => {
		document.cookie = "not_gate_email=wrong; path=/";
		expect(readCookie("gate_email")).toBe("");
	});
});

describe("GateLogin, the way back", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const type = (email: string) =>
		fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
	const form = () => screen.getByLabelText("Your email").closest("form") as HTMLFormElement;

	it("drops an earlier failure when the next submit is not an email at all", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
		render(<GateLogin brandName="Summit" />);
		type("sharon@example.com");
		fireEvent.submit(form());
		await waitFor(() => expect(screen.getByText(/Something went wrong/)).toBeInTheDocument());
		type("not an email");
		fireEvent.submit(form());
		expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
		expect(screen.getAllByRole("alert")).toHaveLength(1);
		expect(screen.getByRole("alert")).toHaveTextContent(/does not look like an email/);
	});

	it("hands focus to the field when the reader starts over", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
		render(<GateLogin brandName="Summit" />);
		type("sharon@example.com");
		fireEvent.submit(form());
		await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
		fireEvent.click(screen.getByRole("button", { name: "Start over" }));
		await waitFor(() => expect(screen.getByLabelText("Your email")).toHaveFocus());
	});

	it("posts once for two submits in the same tick", async () => {
		const send = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", send);
		render(<GateLogin brandName="Summit" />);
		type("sharon@example.com");
		const target = form();
		fireEvent.submit(target);
		fireEvent.submit(target);
		await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
		expect(send).toHaveBeenCalledTimes(1);
	});

	it("gives each screen on a page its own error id", () => {
		vi.stubGlobal("fetch", vi.fn());
		render(
			<>
				<GateLogin brandName="One" />
				<GateLogin brandName="Two" />
			</>,
		);
		for (const field of screen.getAllByLabelText("Your email")) {
			fireEvent.change(field, { target: { value: "nope" } });
			fireEvent.submit(field.closest("form") as HTMLFormElement);
		}
		const ids = screen.getAllByRole("alert").map((alert) => alert.id);
		expect(new Set(ids).size).toBe(2);
	});
});
