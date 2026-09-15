import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SiteHeader } from "../../src/chrome";
import { brand, links, primaryCTA } from "../fixtures";

function getHeader(container: HTMLElement): HTMLElement {
	const header = container.querySelector("header");
	if (!header) throw new Error("the header rendered no header element");
	return header;
}

function scrollTo(y: number) {
	act(() => {
		Object.defineProperty(window, "scrollY", { configurable: true, value: y });
		window.dispatchEvent(new Event("scroll"));
	});
}

const stops = [
	{ id: "findings", label: "Findings" },
	{ id: "plan", label: "Plan" },
];

describe("SiteHeader", () => {
	afterEach(() => scrollTo(0));

	describe("variants", () => {
		it("defaults to the solid light bar", () => {
			const { container } = render(<SiteHeader brand={brand} />);
			const header = getHeader(container);
			expect(header).toHaveClass("nav", "is-solid");
			expect(header).not.toHaveClass("is-transparent");
			expect(header).not.toHaveClass("nav-dark");
		});

		it("renders the dark bar solid, with the dark modifier", () => {
			const { container } = render(<SiteHeader brand={brand} variant="dark" />);
			const header = getHeader(container);
			expect(header).toHaveClass("nav", "is-solid", "nav-dark");
			expect(header).not.toHaveClass("is-transparent");
		});

		it("starts transparent over a hero and turns solid once scrolled", () => {
			const { container } = render(<SiteHeader brand={brand} variant="transparent" />);
			const header = getHeader(container);
			expect(header).toHaveClass("nav", "is-transparent");
			expect(header).not.toHaveClass("is-solid");
			expect(header).not.toHaveClass("nav-dark");

			scrollTo(window.innerHeight);
			expect(header).toHaveClass("is-solid");
			expect(header).not.toHaveClass("is-transparent");

			scrollTo(0);
			expect(header).toHaveClass("is-transparent");
		});
	});

	it("marks the link matching currentPath with aria-current", () => {
		const { container } = render(<SiteHeader brand={brand} links={links} currentPath="/about" />);
		const nav = within(getHeader(container)).getByRole("navigation", { name: "Primary" });

		expect(within(nav).getByRole("link", { name: "About" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
	});

	it("marks nothing current when no currentPath is given", () => {
		const { container } = render(<SiteHeader brand={brand} links={links} />);
		expect(getHeader(container).querySelector("[aria-current]")).toBeNull();
	});

	it("renders no nav, no CTA, and no burger when both are omitted", () => {
		const { container } = render(<SiteHeader brand={brand} variant="dark" />);
		const header = getHeader(container);

		expect(within(header).queryByRole("navigation")).toBeNull();
		expect(header.querySelector(".nav-cta")).toBeNull();
		expect(within(header).queryByRole("button")).toBeNull();
		expect(container.querySelector("dialog")).toBeNull();
		expect(within(header).getByRole("link", { name: "Test Practice home" })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders the bar CTA as a standard button inside its wrapper", () => {
		const { container } = render(
			<SiteHeader brand={brand} links={links} primaryCTA={primaryCTA} />,
		);
		const button = within(getHeader(container)).getByRole("link", { name: "Book Now" });

		expect(button).toHaveClass("btn", "btn-primary");
		expect(button.parentElement).toHaveClass("nav-cta");
		expect(button).toHaveAttribute("target", "_blank");
	});

	it("hides the bar CTA with hideCTA and keeps it in the menu", () => {
		const { container } = render(
			<SiteHeader brand={brand} links={links} primaryCTA={primaryCTA} hideCTA />,
		);

		expect(getHeader(container).querySelector(".nav-cta")).toBeNull();
		const dialog = container.querySelector("dialog");
		expect(dialog?.querySelector(".mm-cta")).toHaveTextContent("Book Now");
	});

	it("swaps the nav and the CTA for the page's own stops in presentation mode", () => {
		const { container } = render(
			<SiteHeader brand={brand} links={links} primaryCTA={primaryCTA} stops={stops} />,
		);
		const header = getHeader(container);

		const nav = within(header).getByRole("navigation", { name: "Page sections" });
		expect(within(nav).getByRole("link", { name: "Plan" })).toHaveAttribute("href", "#plan");
		expect(within(header).queryByRole("navigation", { name: "Primary" })).toBeNull();
		expect(header.querySelector(".nav-cta")).toBeNull();

		const dialog = container.querySelector("dialog");
		expect(dialog?.querySelector(".mm-cta")).toBeNull();
		expect(dialog?.querySelector('a.mm-link[href="#findings"]')).toBeInTheDocument();
	});

	it("opens the menu from the burger and reflects it on the button", () => {
		const { container } = render(<SiteHeader brand={brand} links={links} />);
		const burger = within(getHeader(container)).getByRole("button", { name: "Open menu" });
		const dialog = container.querySelector("dialog");
		expect(burger).toHaveAttribute("aria-expanded", "false");
		expect(burger).toHaveAttribute("aria-controls", dialog?.id);
		expect(dialog?.open).toBe(false);

		fireEvent.click(burger);

		expect(burger).toHaveAttribute("aria-expanded", "true");
		expect(burger).toHaveAccessibleName("Close menu");
		expect(dialog?.open).toBe(true);
	});

	it("resets the burger when the menu closes itself", () => {
		const { container } = render(<SiteHeader brand={brand} links={links} />);
		const burger = within(getHeader(container)).getByRole("button", { name: "Open menu" });
		fireEvent.click(burger);
		const dialog = container.querySelector("dialog");
		if (!dialog) throw new Error("the header rendered no menu");

		fireEvent.click(within(dialog).getByRole("button", { name: "Close menu" }));

		expect(dialog.open).toBe(false);
		expect(burger).toHaveAttribute("aria-expanded", "false");
	});

	it("resets the burger when Escape closes the menu", () => {
		const { container } = render(<SiteHeader brand={brand} links={links} />);
		const burger = within(getHeader(container)).getByRole("button", { name: "Open menu" });
		fireEvent.click(burger);
		const dialog = container.querySelector("dialog");
		if (!dialog) throw new Error("the header rendered no menu");

		// The browser's Escape: cancel, then close, both from the platform.
		act(() => {
			if (dialog.dispatchEvent(new Event("cancel", { cancelable: true }))) dialog.close();
		});

		expect(dialog.open).toBe(false);
		expect(burger).toHaveAttribute("aria-expanded", "false");
		expect(burger).toHaveAccessibleName("Open menu");
	});

	describe("brand lockup", () => {
		it("renders a glyph tile and the run in place of an image", () => {
			const { container } = render(
				<SiteHeader
					brand={{ name: "Atelic", href: "https://atelic.me", logo: { tile: "a", run: true } }}
				/>,
			);
			const lockup = screen.getByRole("link", { name: "Atelic home" });

			expect(lockup).toHaveAttribute("href", "https://atelic.me");
			expect(lockup.querySelector(".logo-tile")).toHaveTextContent("a");
			expect(lockup.querySelector(".wordmark-run")).toBeInTheDocument();
			expect(container.querySelector("img")).toBeNull();
		});

		it("renders the mark image and the wordmark override", () => {
			render(
				<SiteHeader
					brand={{ name: "Test Practice", logo: { src: "/logo.png", wordmark: "test practice" } }}
				/>,
			);
			const lockup = screen.getByRole("link", { name: "Test Practice home" });

			expect(lockup.querySelector("img.mark")).toHaveAttribute("src", "/logo.png");
			expect(lockup.querySelector(".wordmark")).toHaveTextContent("test practice");
			expect(lockup.querySelector(".wordmark-run")).toBeNull();
		});
	});
});
