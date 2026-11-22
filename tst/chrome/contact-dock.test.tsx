import { fireEvent, render, screen, within } from "@testing-library/react";
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
		fireEvent.click(within(panel).getByRole("button", { name: "Close" }));
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

	it("holds its inset when told not to track the page", () => {
		const { container } = render(<ContactDock label="Talk to us" items={items} track={false} />);
		const dock = container.querySelector(".contact-dock") as HTMLElement;
		expect(dock.style.right).toBe("24px");
		expect(dock.style.bottom).toBe("24px");
	});
});
