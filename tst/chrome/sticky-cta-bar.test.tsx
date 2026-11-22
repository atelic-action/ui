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

	it("is there from the top when asked, with no scroll", () => {
		const { container } = render(<StickyCTABar primaryCTA={primaryCTA} fromTop />);
		const bar = container.querySelector(".sticky-cta");
		expect(bar).toHaveClass("show");
		expect(bar).not.toHaveAttribute("inert");
	});

	it("hands the space back to the listener it told, when the caller swaps listeners", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const first = vi.fn();
		const second = vi.fn();
		const { rerender, unmount } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={first} />,
		);
		expect(first).toHaveBeenLastCalledWith(64);

		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={second} />);
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});
		// The first gives its space back, and the second is told the height.
		expect(first).toHaveBeenLastCalledWith(0);
		expect(second).toHaveBeenLastCalledWith(64);

		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={first} />);
		unmount();
		// The second held the space when the bar went, so it is the one released.
		expect(second).toHaveBeenLastCalledWith(0);
		expect(first).toHaveBeenLastCalledWith(0);
		height.mockRestore();
	});

	it("tells a swapped in listener the height at once, with no resize to wait for", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const first = vi.fn();
		const second = vi.fn();
		const { rerender, unmount } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={first} />,
		);
		expect(first).toHaveBeenCalledTimes(1);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={second} />);
		expect(first).toHaveBeenLastCalledWith(0);
		expect(second).toHaveBeenCalledExactlyOnceWith(64);
		// A render that keeps the listener reports nothing again.
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={second} />);
		expect(second).toHaveBeenCalledTimes(1);
		unmount();
		height.mockRestore();
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
