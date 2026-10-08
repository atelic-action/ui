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
