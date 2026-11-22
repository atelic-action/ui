import type { Brand, BrandLogo } from "../types";
import { hasMark, type MarkSurface, type ResolvedMark, resolveMark, tintClass } from "./brandMark";

export interface BrandLockupProps {
	brand: Brand;
	/**
	 * The link's accessible name. Defaults to the words the lockup shows (the
	 * brand's name when they are its name in another case), then "home".
	 */
	ariaLabel?: string;
}

/**
 * The glyph tile mark (`logo.tile`): the favicon's design, its letter drawn
 * by the stylesheet from `data-glyph` so it is never text in the link. Were
 * it text, a link reading "K" then "Kestrel Hollow" would show words its
 * name does not hold. Decorative, and hidden from assistive technology.
 */
export function LogoTile({ glyph }: { glyph: string }) {
	return <span className="logo-tile" data-glyph={glyph} aria-hidden="true" />;
}

function MarkImage({ mark, surface }: { mark: ResolvedMark; surface?: "light" | "dark" }) {
	const className = ["mark", surface && `is-on-${surface}`, tintClass(mark)]
		.filter(Boolean)
		.join(" ");
	return <img className={className} src={mark.src} alt="" />;
}

/**
 * The header's mark: a glyph tile, or the image each surface resolves to
 * (`resolveMark`), one per surface, each shown on its own bar by chrome.css.
 * When both surfaces draw the same image the same way, it is drawn once.
 * Given a `surface`, it draws that surface's image alone, for a place that
 * only ever wears one ground (the footer's dark band).
 */
function Mark({ logo, surface }: { logo?: BrandLogo; surface?: MarkSurface }) {
	if (logo?.tile) return <LogoTile glyph={logo.tile} />;
	if (surface) {
		const mark = resolveMark(logo, surface);
		return mark ? <MarkImage mark={mark} /> : null;
	}
	const light = resolveMark(logo, "light");
	const dark = resolveMark(logo, "dark");
	if (!light || !dark) return null;
	if (light.src === dark.src && light.tint === dark.tint) return <MarkImage mark={light} />;
	return (
		<>
			<MarkImage mark={light} surface="light" />
			<MarkImage mark={dark} surface="dark" />
		</>
	);
}

/**
 * The live words beside the mark: the wordmark the logo names, else the
 * brand's name. `wordmark: false` drops them beside artwork that spells the
 * name, and only there: with no mark to stand in, the name stays, so the
 * home link is never empty.
 */
export function lockupWords(name: string, logo: BrandLogo | undefined): string | null {
	if (logo?.wordmark === false) return hasMark(logo) ? null : name;
	return logo?.wordmark ?? name;
}

/**
 * The lockup's parts, in the order the header draws them: the mark, the
 * live words beside it (`lockupWords`), and the trailing run. The header
 * wraps them in its home link; the footer sets them on its dark band, passing
 * `surface` so only that ground's image is drawn. The mark's image carries
 * empty alt text, since the words beside it name the lockup.
 */
export function LockupParts({
	name,
	logo,
	surface,
}: {
	name: string;
	logo?: BrandLogo;
	surface?: MarkSurface;
}) {
	const wordmark = lockupWords(name, logo);
	return (
		<>
			<Mark logo={logo} surface={surface} />
			{wordmark !== null && <span className="wordmark">{wordmark}</span>}
			{logo?.run && <span className="wordmark-run" aria-hidden="true" />}
		</>
	);
}

/**
 * The header's identity as one link: the mark (a glyph tile or an image),
 * the wordmark, and the trailing run. The image carries empty alt text
 * because the link's own label already names it. A mark is as tall as
 * `--brand-mark-height` and as wide as its own ratio; a site whose artwork is
 * cut per surface passes `onLight` and `onDark`, and a cut is never
 * recolored on its own surface (see `resolveMark` for a surface with none).
 * On a sent artifact the recipient's mark follows, after a times sign:
 * "atelic × Wynkoop Athletics", the sender's identity and the business the
 * document is for in one lockup. The anchor's aria-label folds in the
 * recipient's alt too, since it overrides accessible-name computation for
 * every child, image alt included, and it always holds the words the link
 * shows, so what a reader sees is what a voice user can say.
 */
export function BrandLockup({ brand, ariaLabel }: BrandLockupProps) {
	const { name, href = "/", logo, recipient } = brand;
	const wordmark = lockupWords(name, logo);
	// The visible words lead the name. A wordmark that is the name in another
	// case (or a part of it) keeps the name's own spelling.
	const words =
		wordmark === null || name.toLowerCase().includes(wordmark.toLowerCase()) ? name : wordmark;
	const label = ariaLabel ?? (recipient ? `${words} × ${recipient.alt} home` : `${words} home`);
	return (
		<a className="nav-logo" href={href} aria-label={label}>
			<LockupParts name={name} logo={logo} />
			{recipient && (
				<>
					<span className="nav-x" aria-hidden="true">
						×
					</span>
					<img className="nav-recipient" src={recipient.src} alt={recipient.alt} />
				</>
			)}
		</a>
	);
}
