import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { BrandLockup, Footer } from "../../src/chrome";

/*
 * The lockup's marks: a single light mark the header tints on a light bar (as
 * every site before 8.0.0 passed it), and the brand's own artwork cut per
 * surface, which nothing recolors. The sheet's rules are read as text, since
 * jsdom applies none of them.
 */

const chrome = readFileSync(
	join(import.meta.dirname, "..", "..", "src", "styles", "chrome.css"),
	"utf8",
);

function marks(container: HTMLElement): HTMLImageElement[] {
	return [...container.querySelectorAll<HTMLImageElement>(".nav-logo img.mark")];
}

describe("BrandLockup marks", () => {
	it("draws a single src as the tinted mark beside the name, as before", () => {
		const { container } = render(
			<BrandLockup brand={{ name: "Kestrel", logo: { src: "/mark-white.svg" } }} />,
		);
		const [mark] = marks(container);
		expect(mark).toHaveAttribute("src", "/mark-white.svg");
		expect(mark).toHaveClass("is-tinted");
		expect(container.querySelector(".wordmark")).toHaveTextContent("Kestrel");
	});

	it("draws both cuts, each for its own surface, and tints neither", () => {
		const { container } = render(
			<BrandLockup
				brand={{
					name: "Kestrel",
					logo: { onLight: "/mark-ink.svg", onDark: "/mark-white.svg", wordmark: false },
				}}
			/>,
		);
		const [light, dark] = marks(container);
		expect(light).toHaveAttribute("src", "/mark-ink.svg");
		expect(light).toHaveClass("is-on-light");
		expect(dark).toHaveAttribute("src", "/mark-white.svg");
		expect(dark).toHaveClass("is-on-dark");
		expect(container.querySelector(".is-tinted")).toBeNull();
		// The artwork spells the name, so the live wordmark steps aside; the link keeps it.
		expect(container.querySelector(".wordmark")).toBeNull();
		expect(screen.getByRole("link", { name: "Kestrel home" })).toBeInTheDocument();
	});

	it("draws one cut on every surface when only one is given", () => {
		const { container } = render(
			<BrandLockup brand={{ name: "Kestrel", logo: { onLight: "/mark-ink.svg" } }} />,
		);
		const all = marks(container);
		expect(all).toHaveLength(1);
		expect(all[0].className).toBe("mark");
	});

	it("tints only the single light mark, and sizes every mark by the token and its own ratio", () => {
		expect(chrome).toMatch(
			/\.nav\.is-solid \.nav-logo \.mark\.is-tinted \{\s*filter: brightness\(0\)/,
		);
		expect(chrome).not.toMatch(/\.nav-logo \.mark \{[^}]*filter/);
		expect(chrome).toMatch(
			/\.nav-logo \.mark \{[^}]*height: var\(--brand-mark-height\);[^}]*width: auto;/,
		);
	});

	it("leads the footer with the cut for a dark surface", () => {
		const { container } = render(
			<Footer
				brand={{
					name: "Kestrel",
					logo: { onLight: "/mark-ink.svg", onDark: "/mark-white.svg", alt: "Kestrel" },
				}}
			/>,
		);
		expect(container.querySelector(".footer-brand img")).toHaveAttribute("src", "/mark-white.svg");
	});
});
