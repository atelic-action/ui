import { act, render, screen } from "@testing-library/react";
import { StickyCTABar } from "../../src/chrome";
import { phone, primaryCTA } from "../fixtures";

function scrollTo(y: number) {
	act(() => {
		Object.defineProperty(window, "scrollY", { configurable: true, value: y });
		window.dispatchEvent(new Event("scroll"));
	});
}

describe("StickyCTABar", () => {
	afterEach(() => scrollTo(0));

	it("renders the primary CTA and a call shortcut", () => {
		render(<StickyCTABar primaryCTA={primaryCTA} phone={phone} />);
		expect(screen.getByRole("link", { name: "Book Now" })).toHaveAttribute("href", primaryCTA.href);
		expect(screen.getByRole("link", { name: "Call us" })).toHaveAttribute(
			"href",
			`tel:${phone.e164}`,
		);
	});

	it("renders the call shortcut as an icon, not an emoji", () => {
		render(<StickyCTABar primaryCTA={primaryCTA} phone={phone} />);
		const call = screen.getByRole("link", { name: "Call us" });
		expect(call.querySelector("svg")).not.toBeNull();
		expect(call.textContent?.trim()).toBe("");
	});

	it("drops the call shortcut for a business with no public phone", () => {
		render(<StickyCTABar primaryCTA={primaryCTA} />);
		expect(screen.queryByRole("link", { name: "Call us" })).toBeNull();
	});

	it("slides in once the page scrolls past the threshold", () => {
		const { container } = render(<StickyCTABar primaryCTA={primaryCTA} threshold={300} />);
		const bar = container.querySelector(".sticky-cta");
		expect(bar).not.toHaveClass("show");
		expect(bar).toHaveAttribute("inert");

		scrollTo(301);
		expect(bar).toHaveClass("show");
		expect(bar).not.toHaveAttribute("inert");
	});
});
