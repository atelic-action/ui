import type { Brand } from "../types";

export interface BrandLockupProps {
	brand: Brand;
	/** The link's accessible name. Defaults to "<name> home". */
	ariaLabel?: string;
}

/**
 * The header's identity as one link: the mark (a glyph tile or an image),
 * the wordmark, and the trailing run. The image carries empty alt text
 * because the link's own label already names it.
 */
export function BrandLockup({ brand, ariaLabel }: BrandLockupProps) {
	const { name, href = "/", logo } = brand;
	return (
		<a className="nav-logo" href={href} aria-label={ariaLabel ?? `${name} home`}>
			{logo?.tile ? (
				<span className="logo-tile" aria-hidden="true">
					{logo.tile}
				</span>
			) : (
				logo?.src && <img className="mark" src={logo.src} alt="" />
			)}
			<span className="wordmark">{logo?.wordmark ?? name}</span>
			{logo?.run && <span className="wordmark-run" aria-hidden="true" />}
		</a>
	);
}
