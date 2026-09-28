import type { Brand } from "../types";

export interface BrandLockupProps {
	brand: Brand;
	/** The link's accessible name. Defaults to "<name> home". */
	ariaLabel?: string;
}

/**
 * The header's identity as one link: the mark (a glyph tile or an image),
 * the wordmark, and the trailing run. The image carries empty alt text
 * because the link's own label already names it. On a sent artifact the
 * recipient's mark follows, after a times sign: "atelic × Wynkoop Athletics",
 * the sender's identity and the business the document is for in one lockup.
 * The anchor's aria-label folds in the recipient's alt too, since it
 * overrides accessible-name computation for every child, image alt included.
 */
export function BrandLockup({ brand, ariaLabel }: BrandLockupProps) {
	const { name, href = "/", logo, recipient } = brand;
	const label = ariaLabel ?? (recipient ? `${name} × ${recipient.alt} home` : `${name} home`);
	return (
		<a className="nav-logo" href={href} aria-label={label}>
			{logo?.tile ? (
				<span className="logo-tile" aria-hidden="true">
					{logo.tile}
				</span>
			) : (
				logo?.src && <img className="mark" src={logo.src} alt="" />
			)}
			<span className="wordmark">{logo?.wordmark ?? name}</span>
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
