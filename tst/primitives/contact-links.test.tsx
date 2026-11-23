import { render, screen } from "@testing-library/react";
import { EmailLink } from "../../src/primitives/EmailLink";
import { PhoneLink } from "../../src/primitives/PhoneLink";

describe("PhoneLink", () => {
	afterEach(() => vi.restoreAllMocks());

	it("links the site's phone, its display as the words, never in a new tab", () => {
		render(<PhoneLink phone={{ e164: "+15555550142", display: "(555) 555-0142" }} className="x" />);
		const link = screen.getByRole("link", { name: "(555) 555-0142" });
		expect(link).toHaveAttribute("href", "tel:+15555550142");
		expect(link).toHaveClass("x");
		expect(link).not.toHaveAttribute("target");
	});

	it("reads a typed number into E.164, and passes the anchor's own props", () => {
		render(<PhoneLink phone="555.555.0199" aria-label="Call the shop" />);
		const link = screen.getByRole("link", { name: "Call the shop" });
		expect(link).toHaveAttribute("href", "tel:+15555550199");
		expect(link).toHaveTextContent("555.555.0199");
	});

	it("shows a number it cannot dial as words, unlinked, and warns once in development", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { rerender } = render(
			<PhoneLink phone={{ e164: "555-0142", display: "555-0142" }} className="x" />,
		);
		rerender(<PhoneLink phone={{ e164: "555-0142", display: "555-0142" }} className="x" />);
		expect(screen.queryByRole("link")).toBeNull();
		expect(screen.getByText("555-0142")).toHaveClass("x");
		expect(warn).toHaveBeenCalledOnce();
	});
});

describe("EmailLink", () => {
	afterEach(() => vi.restoreAllMocks());

	it("links the address, breakable after the @ and before each dot by default", () => {
		const { container } = render(<EmailLink email="hello@kestrelhollow.example.com" />);
		// jsdom reads each <wbr> as a space in the accessible name; a browser does
		// not (stories/primitives/EmailLink.stories.tsx), so the words are read here.
		const link = screen.getByRole("link");
		expect(link).toHaveTextContent("hello@kestrelhollow.example.com");
		expect(link).toHaveAttribute("href", "mailto:hello@kestrelhollow.example.com");
		expect(link).not.toHaveAttribute("target");
		expect(container.querySelectorAll("wbr")).toHaveLength(3);
	});

	it("takes its own words", () => {
		render(<EmailLink email="hello@example.com">Write to us</EmailLink>);
		expect(screen.getByRole("link", { name: "Write to us" })).toHaveAttribute(
			"href",
			"mailto:hello@example.com",
		);
	});

	it("shows an address it cannot write to as words, unlinked, and warns once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		render(<EmailLink email="hello@nowhere">hello@nowhere</EmailLink>);
		expect(screen.queryByRole("link")).toBeNull();
		expect(screen.getByText("hello@nowhere")).toBeInTheDocument();
		expect(warn).toHaveBeenCalledOnce();
	});
});
