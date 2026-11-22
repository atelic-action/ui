import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ContactDock } from "../../src/chrome";
import { dockPlacement } from "../../src/chrome/ContactDock";
import type { ContactDockItem } from "../../src/types";

const items: ContactDockItem[] = [
	{ label: "Chat with us", icon: "chat", onSelect: vi.fn(), lead: true },
	{ label: "Call (555) 555-0100", icon: "phone", href: "tel:+15555550100" },
	{ label: "Send a message", icon: "mail", href: "/contact", description: "A short form" },
];

function launcher(): HTMLElement {
	const button = document.querySelector<HTMLElement>(".cd-launch");
	if (!button) throw new Error("the dock rendered no launcher");
	return button;
}

describe("dockPlacement", () => {
	it("sits the same inset from the right and the bottom: 24 above a phone, 16 on one", () => {
		expect(
			dockPlacement({ viewportWidth: 1280, viewportHeight: 800, barHeight: 0, avoidTop: null }),
		).toEqual({ inset: 24, bottom: 24 });
		expect(
			dockPlacement({ viewportWidth: 390, viewportHeight: 844, barHeight: 0, avoidTop: null }),
		).toEqual({ inset: 16, bottom: 16 });
	});

	it("lifts over the phone's sticky bar only once the bar is showing", () => {
		expect(
			dockPlacement({ viewportWidth: 390, viewportHeight: 844, barHeight: 72, avoidTop: null }),
		).toEqual({ inset: 16, bottom: 88 });
		// Above a phone the bar never shows, so a measured one changes nothing.
		expect(
			dockPlacement({ viewportWidth: 1280, viewportHeight: 800, barHeight: 72, avoidTop: null }),
		).toEqual({ inset: 24, bottom: 24 });
	});

	it("rises to stay just above the footer as it scrolls in, and ignores it while below", () => {
		expect(
			dockPlacement({ viewportWidth: 1280, viewportHeight: 800, barHeight: 0, avoidTop: 900 }),
		).toEqual({ inset: 24, bottom: 24 });
		expect(
			dockPlacement({ viewportWidth: 1280, viewportHeight: 800, barHeight: 0, avoidTop: 600 }),
		).toEqual({ inset: 24, bottom: 224 });
		// On a phone the higher of the two wins.
		expect(
			dockPlacement({ viewportWidth: 390, viewportHeight: 844, barHeight: 72, avoidTop: 820 }),
		).toEqual({ inset: 16, bottom: 88 });
		expect(
			dockPlacement({ viewportWidth: 390, viewportHeight: 844, barHeight: 72, avoidTop: 500 }),
		).toEqual({ inset: 16, bottom: 360 });
	});

	it("never rises into the fixed header, and holds under it when the footer is taller than the room", () => {
		// A phone whose footer's top has scrolled up past the 64px header: the
		// launcher stops 16px under the header, 844 - 64 - 52 - 16 from the foot.
		const held = dockPlacement({
			viewportWidth: 390,
			viewportHeight: 844,
			barHeight: 72,
			avoidTop: 40,
			headerBottom: 64,
		});
		expect(held).toEqual({ inset: 16, bottom: 712 });
		const launcherTop = 844 - held.bottom - 52;
		expect(launcherTop).toBeGreaterThanOrEqual(64 + 16);
		// And it stays there however far the footer runs.
		expect(
			dockPlacement({
				viewportWidth: 390,
				viewportHeight: 844,
				barHeight: 72,
				avoidTop: -600,
				headerBottom: 64,
			}),
		).toEqual(held);
		// With no header the screen's top edge is the limit, as before.
		expect(
			dockPlacement({ viewportWidth: 390, viewportHeight: 844, barHeight: 72, avoidTop: 40 }),
		).toEqual({ inset: 16, bottom: 776 });
	});
});

describe("ContactDock", () => {
	it("prerenders closed, its panel in the HTML and hidden", () => {
		const html = renderToString(<ContactDock label="Talk to us" items={items} />);
		expect(html).toContain('aria-expanded="false"');
		expect(html).toContain("Send a message");
		expect(html).toMatch(/<section[^>]*hidden/);
	});

	it("opens and closes from the launcher, which names its state", () => {
		const { container } = render(
			<ContactDock label="Talk to us" title="How can we help?" items={items} />,
		);
		const panel = container.querySelector(".cd-panel") as HTMLElement;
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
		expect(panel).toHaveAttribute("inert");

		fireEvent.click(launcher());
		expect(launcher()).toHaveAttribute("aria-expanded", "true");
		expect(launcher()).toHaveAccessibleName("Close");
		expect(panel).not.toHaveAttribute("inert");
		expect(within(panel).getByRole("heading", { name: "How can we help?" })).toBeInTheDocument();

		fireEvent.click(launcher());
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
	});

	it("closes from the close button in its head, handing focus back to the launcher", () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} defaultOpen />);
		const panel = container.querySelector(".cd-panel") as HTMLElement;
		fireEvent.click(within(panel).getByRole("button", { name: "Close panel" }));
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
		expect(launcher()).toHaveFocus();
	});

	it("closes on Escape, returning focus to the launcher, and on a click outside", () => {
		render(
			<>
				<ContactDock label="Talk to us" items={items} defaultOpen />
				<p>Page</p>
			</>,
		);
		fireEvent.keyDown(document, { key: "Escape" });
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
		expect(launcher()).toHaveFocus();

		fireEvent.click(launcher());
		fireEvent.pointerDown(screen.getByText("Page"));
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
	});

	it("renders a link item as a link, a tel never in a new tab, and a handed off item as a button", () => {
		const onSelect = vi.fn();
		render(
			<ContactDock
				label="Talk to us"
				items={[
					{ label: "Chat with us", onSelect },
					{ label: "Call", href: "tel:+15555550100", external: true },
					{ label: "Book", href: "https://booking.example.com", external: true },
				]}
				defaultOpen
			/>,
		);
		const call = screen.getByRole("link", { name: /Call/ });
		expect(call).toHaveAttribute("href", "tel:+15555550100");
		expect(call).not.toHaveAttribute("target");
		expect(screen.getByRole("link", { name: /Book/ })).toHaveAttribute("target", "_blank");

		fireEvent.click(screen.getByRole("button", { name: /Chat with us/ }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(launcher()).toHaveAttribute("aria-expanded", "false");
	});

	it("leaves its corner to the stylesheet when told not to track, so a phone gets its own inset", () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} track={false} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		// chrome.css sets 24px, and 16px below 900px; an inline value would pin 24 on a phone.
		expect(dock.style.right).toBe("");
		expect(dock.style.bottom).toBe("");
	});
});

describe("ContactDock tracking", () => {
	const width = window.innerWidth;
	const height = window.innerHeight;
	beforeEach(() => {
		Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
		Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
	});
	afterEach(() => {
		Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
		Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
		document.body.querySelectorAll("[data-test-bar]").forEach((node) => {
			node.remove();
		});
	});

	function bar(showing: boolean): HTMLElement {
		const element = document.createElement("div");
		element.setAttribute("data-dock-lift", "");
		element.setAttribute("data-test-bar", "");
		element.dataset.showing = showing ? "true" : "false";
		element.getBoundingClientRect = () => ({ height: 72 }) as DOMRect;
		return element;
	}

	it("sits at the phone's corner once measured", async () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} avoid={null} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		await waitFor(() => expect(dock.style.bottom).toBe("16px"));
		expect(dock.style.right).toBe("16px");
	});

	it("lifts over a sticky bar that mounts after it, and again when the bar shows", async () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} avoid={null} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		await waitFor(() => expect(dock.style.bottom).toBe("16px"));

		const late = bar(false);
		document.body.append(late);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(dock.style.bottom).toBe("16px");

		late.dataset.showing = "true";
		await waitFor(() => expect(dock.style.bottom).toBe("88px"));
	});

	it("rides above the element it is handed by ref", async () => {
		const footer = document.createElement("footer");
		footer.getBoundingClientRect = () => ({ top: 500 }) as DOMRect;
		const ref = { current: footer };
		const { container } = render(<ContactDock label="Talk to us" items={items} avoid={ref} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		// 844 - 500 covered, plus the 16 inset.
		await waitFor(() => expect(dock.style.bottom).toBe("360px"));
	});

	it("finds the bar and the footer once, never on a scroll frame", async () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		await waitFor(() => expect(dock.style.bottom).toBe("16px"));
		const query = vi.spyOn(document, "querySelector");
		for (let i = 0; i < 5; i += 1) {
			fireEvent.scroll(window);
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
		expect(query).not.toHaveBeenCalled();
		query.mockRestore();
	});

	it("measures its ceiling again when the header changes size or ends a transition", async () => {
		const observed: Element[] = [];
		const callbacks: (() => void)[] = [];
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: () => void) {
					callbacks.push(callback);
				}
				observe(element: Element) {
					observed.push(element);
				}
				disconnect() {}
				unobserve() {}
			},
		);
		const header = document.createElement("header");
		header.className = "nav";
		let bottom = 64;
		header.getBoundingClientRect = () => ({ bottom }) as DOMRect;
		document.body.append(header);
		// A footer taller than the screen holds the launcher just under the header.
		const footer = document.createElement("footer");
		footer.getBoundingClientRect = () => ({ top: 40 }) as DOMRect;
		const { container } = render(
			<ContactDock label="Talk to us" items={items} avoid={{ current: footer }} />,
		);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		// 844 - 64 - 52 - 16.
		await waitFor(() => expect(dock.style.bottom).toBe("712px"));
		expect(observed).toContain(header);

		// A late logo makes the bar taller: the header's resize measures again.
		bottom = 120;
		for (const callback of callbacks) callback();
		await waitFor(() => expect(dock.style.bottom).toBe("656px"));

		// A transition ending inside the header (a pill, a chevron) is not the
		// header moving, so it measures nothing.
		bottom = 90;
		const pill = document.createElement("a");
		header.append(pill);
		pill.dispatchEvent(new Event("transitionend", { bubbles: true }));
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(dock.style.bottom).toBe("656px");

		// The header's own transition moves it without resizing it: its end measures again.
		header.dispatchEvent(new Event("transitionend"));
		await waitFor(() => expect(dock.style.bottom).toBe("686px"));
		header.remove();
		vi.unstubAllGlobals();
	});
});
