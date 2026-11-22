import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { BrandLockup, Footer } from "../../src/chrome";
import { lockupWords } from "../../src/chrome/BrandLockup";
import { resolveMark } from "../../src/chrome/brandMark";

/*
 * The lockup's marks: a single light mark the header tints on a light bar (as
 * every site before 8.0.0 passed it), and the brand's own artwork cut per
 * surface, which nothing recolors on its own surface. One resolution serves
 * the header and the footer. The sheet's rules are read as text, since jsdom
 * applies none of them.
 */

const chrome = readFileSync(
	join(import.meta.dirname, "..", "..", "src", "styles", "chrome.css"),
	"utf8",
);

function marks(container: HTMLElement): HTMLImageElement[] {
	return [...container.querySelectorAll<HTMLImageElement>(".nav-logo img.mark")];
}

describe("resolveMark", () => {
	it("draws a surface's own cut as given", () => {
		const logo = { onLight: "/ink.svg", onDark: "/white.svg", src: "/old.svg" };
		expect(resolveMark(logo, "light")).toEqual({ src: "/ink.svg", tint: null });
		expect(resolveMark(logo, "dark")).toEqual({ src: "/white.svg", tint: null });
	});

	it("falls back to the single light mark, tinted to ink on the light bar only", () => {
		const logo = { src: "/white.svg" };
		expect(resolveMark(logo, "light")).toEqual({ src: "/white.svg", tint: "ink" });
		expect(resolveMark(logo, "dark")).toEqual({ src: "/white.svg", tint: null });
	});

	it("flattens the other surface's cut rather than draw a mark that vanishes", () => {
		// A light only mark on the light bar would be white on cream.
		expect(resolveMark({ onDark: "/white.svg" }, "light")).toEqual({
			src: "/white.svg",
			tint: "ink",
		});
		// An ink only mark on the footer would be ink on near black.
		expect(resolveMark({ onLight: "/ink.svg" }, "dark")).toEqual({
			src: "/ink.svg",
			tint: "light",
		});
	});

	it("prefers the single mark over the other surface's cut", () => {
		expect(resolveMark({ src: "/white.svg", onLight: "/ink.svg" }, "dark")).toEqual({
			src: "/white.svg",
			tint: null,
		});
	});

	it("draws nothing for a logo with no image", () => {
		expect(resolveMark(undefined, "light")).toBeNull();
		expect(resolveMark({ tile: "K" }, "dark")).toBeNull();
	});
});

describe("BrandLockup marks", () => {
	it("draws a single src for each bar, tinted only for the light one, beside the name", () => {
		const { container } = render(
			<BrandLockup brand={{ name: "Kestrel", logo: { src: "/mark-white.svg" } }} />,
		);
		const [light, dark] = marks(container);
		expect(light).toHaveAttribute("src", "/mark-white.svg");
		expect(light).toHaveClass("is-on-light", "is-tinted");
		expect(dark).toHaveAttribute("src", "/mark-white.svg");
		expect(dark).toHaveClass("is-on-dark");
		expect(dark).not.toHaveClass("is-tinted");
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
		expect(container.querySelector(".is-tinted, .is-tinted-light")).toBeNull();
		// The artwork spells the name, so the live wordmark steps aside; the link keeps it.
		expect(container.querySelector(".wordmark")).toBeNull();
		expect(screen.getByRole("link", { name: "Kestrel home" })).toBeInTheDocument();
	});

	it("draws a light only cut as given over the dark bars and as an ink silhouette on the light bar", () => {
		const { container } = render(
			<BrandLockup brand={{ name: "Kestrel", logo: { onDark: "/mark-white.svg" } }} />,
		);
		const [light, dark] = marks(container);
		expect(light).toHaveClass("is-on-light", "is-tinted");
		expect(dark).toHaveClass("is-on-dark");
		expect(dark).not.toHaveClass("is-tinted");
	});

	it("draws one image when both surfaces draw the same artwork the same way", () => {
		const { container } = render(
			<BrandLockup
				brand={{ name: "Kestrel", logo: { onLight: "/mark.svg", onDark: "/mark.svg" } }}
			/>,
		);
		const all = marks(container);
		expect(all).toHaveLength(1);
		expect(all[0].className).toBe("mark");
	});

	it("tints by class on the bar it shows on, and sizes every mark by the token and its own ratio", () => {
		expect(chrome).toMatch(
			/\.nav\.is-solid:not\(\.nav-dark\) \.nav-logo \.mark\.is-tinted \{\s*filter: brightness\(0\) saturate\(1\)/,
		);
		expect(chrome).toMatch(
			/\.nav-logo \.mark\.is-tinted-light,[^{]*\{\s*filter: brightness\(0\) invert\(1\)/,
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
		const img = container.querySelector(".footer-brand img");
		expect(img).toHaveAttribute("src", "/mark-white.svg");
		expect(img).not.toHaveClass("is-tinted");
		expect(img).not.toHaveClass("is-tinted-light");
	});

	it("resolves the footer by the header's order: the single mark before an ink only cut", () => {
		const { container } = render(
			<Footer brand={{ name: "Kestrel", logo: { src: "/white.svg", onLight: "/ink.svg" } }} />,
		);
		expect(container.querySelector(".footer-brand img")).toHaveAttribute("src", "/white.svg");
	});

	it("draws an ink only cut in the footer as a white silhouette, never ink on the dark band", () => {
		const { container } = render(
			<Footer brand={{ name: "Kestrel", logo: { onLight: "/ink.svg" } }} />,
		);
		const img = container.querySelector(".footer-brand img");
		expect(img).toHaveAttribute("src", "/ink.svg");
		expect(img).toHaveClass("is-tinted-light");
	});
});

describe("BrandLockup words and name", () => {
	it("keeps the name when wordmark is false but there is no mark to stand in", () => {
		expect(lockupWords("Kestrel Hollow", { wordmark: false })).toBe("Kestrel Hollow");
		expect(lockupWords("Kestrel Hollow", undefined)).toBe("Kestrel Hollow");
		expect(lockupWords("Kestrel Hollow", { wordmark: false, src: "/mark.svg" })).toBeNull();
		render(<BrandLockup brand={{ name: "Kestrel Hollow", logo: { wordmark: false } }} />);
		const link = screen.getByRole("link", { name: "Kestrel Hollow home" });
		expect(link).toHaveTextContent("Kestrel Hollow");
	});

	it("keeps the tile's letter out of the link's text, so the visible words are the name's", () => {
		render(<BrandLockup brand={{ name: "Kestrel Hollow", logo: { tile: "K" } }} />);
		const link = screen.getByRole("link", { name: "Kestrel Hollow home" });
		expect(link.textContent).toBe("Kestrel Hollow");
		const tile = link.querySelector(".logo-tile");
		expect(tile).toHaveAttribute("aria-hidden", "true");
		expect(tile).toHaveAttribute("data-glyph", "K");
		expect(chrome).toMatch(/\.logo-tile::before \{[^}]*content: attr\(data-glyph\) \/ "";/);
	});

	it("names the link with the words it shows, in the name's spelling when they match", () => {
		const { unmount } = render(
			<BrandLockup brand={{ name: "Kestrel Hollow", logo: { wordmark: "kestrel hollow" } }} />,
		);
		expect(screen.getByRole("link", { name: "Kestrel Hollow home" })).toBeInTheDocument();
		unmount();
		render(<BrandLockup brand={{ name: "Kestrel Hollow LLC", logo: { wordmark: "KH Studio" } }} />);
		const link = screen.getByRole("link", { name: "KH Studio home" });
		expect(link.getAttribute("aria-label")).toContain(link.textContent ?? "");
	});
});

describe("ArtifactShell's mark", () => {
	it("wears the shell hook the artifact sheet sizes the mark by", async () => {
		const { ArtifactShell } = await import("../../src/artifact");
		const { container } = render(
			<ArtifactShell
				site={
					{
						sender: { name: "Atelic", href: "https://atelic.me", logo: { wordmark: "atelic" } },
						recipient: {
							name: "Kestrel Hollow",
							logo: { src: "/mark.svg", alt: "Kestrel Hollow" },
						},
					} as never
				}
				currentPath="/the-read"
			>
				<p>Doc</p>
			</ArtifactShell>,
		);
		expect(container.querySelector(".atelic-ui")).toHaveAttribute("data-shell", "artifact");
	});
});
