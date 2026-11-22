import type { Brand, BrandLogo } from "../types";

export interface BrandLockupProps {
	brand: Brand;
	/** The link's accessible name. Defaults to "<name> home". */
	ariaLabel?: string;
}

/** The header's mark: a glyph tile, the brand's own artwork per surface, or a mark the bar tints. */
function Mark({ logo }: { logo?: BrandLogo }) {
	if (logo?.tile) {
		return (
			<span className="logo-tile" aria-hidden="true">
				{logo.tile}
			</span>
		);
	}
	const { onLight, onDark } = logo ?? {};
	// The brand's own artwork, drawn as given. With both cuts, each shows on its
	// own surface (chrome.css); with one, it shows on every surface.
	if (onLight && onDark) {
		return (
			<>
				<img className="mark is-on-light" src={onLight} alt="" />
				<img className="mark is-on-dark" src={onDark} alt="" />
			</>
		);
	}
	if (onLight || onDark) return <img className="mark" src={onLight ?? onDark} alt="" />;
	// A single light mark, which the header tints to ink on a light bar.
	return logo?.src ? <img className="mark is-tinted" src={logo.src} alt="" /> : null;
}

/**
 * The header's identity as one link: the mark (a glyph tile or an image),
 * the wordmark, and the trailing run. The image carries empty alt text
 * because the link's own label already names it. A mark is as tall as
 * `--brand-mark-height` and as wide as its own ratio; a site whose artwork is
 * cut per surface passes `onLight` and `onDark`, and neither is ever
 * recolored. On a sent artifact the recipient's mark follows, after a times
 * sign: "atelic × Wynkoop Athletics", the sender's identity and the business
 * the document is for in one lockup. The anchor's aria-label folds in the
 * recipient's alt too, since it overrides accessible-name computation for
 * every child, image alt included.
 */
export function BrandLockup({ brand, ariaLabel }: BrandLockupProps) {
	const { name, href = "/", logo, recipient } = brand;
	const label = ariaLabel ?? (recipient ? `${name} × ${recipient.alt} home` : `${name} home`);
	const wordmark = logo?.wordmark === false ? null : (logo?.wordmark ?? name);
	return (
		<a className="nav-logo" href={href} aria-label={label}>
			<Mark logo={logo} />
			{wordmark !== null && <span className="wordmark">{wordmark}</span>}
			{logo?.run && <span className="wordmark-run" aria-hidden="true" />}
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
