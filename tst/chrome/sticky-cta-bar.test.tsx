import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
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

	it("tells each listener of a chain of swaps the height at once, A to B to C, with no resize", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const [a, b, c] = [vi.fn(), vi.fn(), vi.fn()];
		const { rerender, unmount } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={a} />,
		);
		expect(a).toHaveBeenCalledExactlyOnceWith(64);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={b} />);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={c} />);
		expect(a.mock.calls).toEqual([[64], [0]]);
		expect(b.mock.calls).toEqual([[64], [0]]);
		expect(c.mock.calls).toEqual([[64]]);
		// A resize with nothing changed tells no one, and the bar's going releases C.
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});
		expect(c).toHaveBeenCalledTimes(1);
		unmount();
		expect(c).toHaveBeenLastCalledWith(0);
		height.mockRestore();
	});

	it("tells a listener taken away 0, and a listener that stays never hears one value twice", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const listener = vi.fn();
		const { rerender } = render(
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={listener} />,
		);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={listener} />);
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});
		expect(listener.mock.calls).toEqual([[64]]);
		rerender(<StickyCTABar primaryCTA={primaryCTA} fromTop />);
		expect(listener.mock.calls).toEqual([[64], [0]]);
		height.mockRestore();
	});

	it("never loops on an inline listener that stores the height in an object, a new one each render", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		let renders = 0;
		function Page() {
			const [space, setSpace] = useState({ pixels: 0 });
			renders += 1;
			if (renders > 50) throw new Error("looped");
			return (
				<>
					<p>{space.pixels}</p>
					<StickyCTABar
						primaryCTA={primaryCTA}
						fromTop
						onSpaceChange={(pixels) => setSpace({ pixels })}
					/>
				</>
			);
		}
		const { unmount } = render(<Page />);
		// Cut off at the cap, the space it held is handed back rather than
		// left standing; it never loops.
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(renders).toBeLessThanOrEqual(7);
		unmount();
		height.mockRestore();
	});

	it("past the cap, tells the outgoing listener 0 and makes the arrival wait for the next measure", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const chain = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
		const bar = (listener: (pixels: number) => void) => (
			<StickyCTABar primaryCTA={primaryCTA} fromTop onSpaceChange={listener} />
		);
		const { rerender, unmount } = render(bar(chain[0] as (pixels: number) => void));
		// Three swaps in a row, each told; the fourth trips the cap.
		for (const listener of chain.slice(1)) rerender(bar(listener));
		const [a, b, c, d, e, f] = chain as [
			ReturnType<typeof vi.fn>,
			ReturnType<typeof vi.fn>,
			ReturnType<typeof vi.fn>,
			ReturnType<typeof vi.fn>,
			ReturnType<typeof vi.fn>,
			ReturnType<typeof vi.fn>,
		];
		for (const told of [a, b, c]) expect(told.mock.calls).toEqual([[64], [0]]);
		// D held the space when E arrived past the cap: it gives it back.
		expect(d.mock.calls).toEqual([[64], [0]]);
		// E was never told a height, so its leaving tells it nothing.
		expect(e).not.toHaveBeenCalled();
		expect(f).not.toHaveBeenCalled();
		// The next measure tells the listener now in place.
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});
		expect(f.mock.calls).toEqual([[64]]);
		unmount();
		expect(f).toHaveBeenLastCalledWith(0);
		height.mockRestore();
	});

	it("lets an inline listener that stores the height settle, never looping", () => {
		const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(64);
		const heard = vi.fn();
		let renders = 0;
		function Page() {
			const [space, setSpace] = useState(0);
			renders += 1;
			return (
				<>
					<p>{space}</p>
					<StickyCTABar
						primaryCTA={primaryCTA}
						fromTop
						onSpaceChange={(pixels) => {
							heard(pixels);
							setSpace(pixels);
						}}
					/>
				</>
			);
		}
		const { unmount } = render(<Page />);
		expect(screen.getByText("64")).toBeInTheDocument();
		expect(heard).toHaveBeenLastCalledWith(64);
		expect(renders).toBeLessThanOrEqual(4);
		const settled = heard.mock.calls.length;
		act(() => {
			window.dispatchEvent(new Event("scroll"));
		});
		expect(heard.mock.calls.length).toBe(settled);
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
