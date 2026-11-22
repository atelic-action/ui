import { Mail, Star, UserRound } from "lucide-react";
import type { ComponentProps, CSSProperties, Ref } from "react";
import { breakableEmail } from "../lib/emailText";
import { newTabProps } from "../lib/newTabProps";
import type {
	Brand,
	FooterColumn,
	FooterColumnLink,
	FooterHoursPlacement,
	HoursRow,
	Phone,
	PostalAddress,
} from "../types";
import { LockupParts, LogoTile, lockupWords } from "./BrandLockup";
import { resolveMark, tintClass } from "./brandMark";
import { ClosingBar } from "./ClosingBar";
import { Copyright } from "./Copyright";

/*
 * lucide-react ships no brand marks (removed upstream by policy), and a code
 * glyph standing in for GitHub or a briefcase for LinkedIn misleads the
 * reader. These are the brands' own simple marks, carried by hand as a
 * considered exception to the lucide only rule; like lucide icons they take
 * currentColor and a size prop.
 */
type MarkProps = { size?: number } & ComponentProps<"svg">;

function GitHubMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
			{...rest}
		>
			<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
		</svg>
	);
}

function LinkedInMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
			{...rest}
		>
			<path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.1h4.56V23H.22V8.1zM8.34 8.1h4.37v2.03h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 6.99V23h-4.55v-7.28c0-1.74-.03-3.97-2.42-3.97-2.42 0-2.79 1.89-2.79 3.84V23H8.34V8.1z" />
		</svg>
	);
}

function FacebookMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
		</svg>
	);
}

function InstagramMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" />
		</svg>
	);
}

function YouTubeMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17 M10 15l5-3-5-3z" />
		</svg>
	);
}

const LINK_ICONS = {
	facebook: FacebookMark,
	github: GitHubMark,
	instagram: InstagramMark,
	linkedin: LinkedInMark,
	mail: Mail,
	star: Star,
	user: UserRound,
	youtube: YouTubeMark,
} as const;

function ColumnLink({ link }: { link: FooterColumnLink }) {
	const Icon = link.icon ? LINK_ICONS[link.icon] : null;
	return (
		<a href={link.href} {...newTabProps(link.href, link.external)}>
			{Icon && <Icon aria-hidden size={18} />}
			{link.label}
		</a>
	);
}

const STARS = [1, 2, 3, 4, 5];

export interface FooterProps {
	/** The identity at the head of the brand column. */
	brand: Brand;
	/**
	 * The Google rating as printed, e.g. "4.8 on Google". It sits under the
	 * logo beside five stars, which are hidden from assistive technology, so
	 * the line is named by these words. Plain text unless `ratingHref` is given.
	 */
	rating?: string;
	/**
	 * Where the rating links: the business's Google profile, where the
	 * reviews are. Given, the whole line (the stars and the words) is one
	 * link, opening in a new tab as the address does.
	 */
	ratingHref?: string;
	/**
	 * The rating link's accessible name, when it should say more than the
	 * words shown, e.g. "4.8 on Google, opens the Google profile". Defaults
	 * to `rating`.
	 */
	ratingLabel?: string;
	/**
	 * The one address, the headquarters. Omit it for a business with no
	 * storefront, and the phone and email stand alone.
	 */
	address?: PostalAddress;
	/** Where the address links: the business's Google profile. */
	addressHref?: string;
	phone?: Phone;
	email?: string;
	/**
	 * The opening hours, already formatted by the site (`SiteShell` formats
	 * the config's `hours`), drawn as their own column beside the link
	 * columns: each row's days and its range. Left out when empty.
	 */
	hours?: HoursRow[];
	/** The hours column's heading. Defaults to "Hours". */
	hoursHeading?: string;
	/**
	 * Where the hours sit: `column` (the default) is a column of their own
	 * beside the link columns; `brand` sets them inside the brand column,
	 * under the address, the phone, and the email, as a compact list of two
	 * columns under a small label, so the link columns keep the row's room.
	 */
	hoursPlacement?: FooterHoursPlacement;
	/**
	 * The link columns beside the brand column. The default footer carries
	 * four: Company, Resources, Social, and Legal. A column with no links is
	 * left out.
	 */
	columns?: FooterColumn[];
	/** Suffix on the copyright line, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/** The site's own words for the closing bar's right side, in place of the practice's credit. */
	note?: string;
	/**
	 * The practice's credit on the closing bar's right side. Defaults on; off
	 * leaves the right side empty unless the site gives a note. The copyright
	 * prints either way.
	 */
	credit?: boolean;
	/**
	 * The level of the link columns' headings. Defaults to 2: the footer is a
	 * landmark beside the page's main content, so its sections sit one level
	 * under the page's `h1` whatever the page's own outline ends on, and a
	 * page never skips a level into its footer. A site whose footer sits
	 * inside a deeper outline passes its own.
	 */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** The footer element, for a caller that measures it (`SiteShell` hands it to the contact dock). */
	ref?: Ref<HTMLElement>;
}

/**
 * The site footer: a brand column (the logo, the Google rating, the address
 * linked to the Google profile, the phone, and the email), the hours when the
 * site gives them, the link columns beside it, and the closing bar under it
 * all. The logo is the header's lockup: the mark with the wordmark beside it,
 * or the mark alone when `logo.wordmark` is false.
 */
export function Footer({
	brand,
	rating,
	ratingHref,
	ratingLabel,
	address,
	addressHref,
	phone,
	email,
	hours,
	hoursHeading = "Hours",
	hoursPlacement = "column",
	columns,
	attribution,
	note,
	credit = true,
	headingLevel = 2,
	ref,
}: FooterProps) {
	const { name, logo } = brand;
	// The footer always names the business beside a glyph tile.
	const wordmark = logo?.wordmark === false ? name : (logo?.wordmark ?? name);
	// The band is a dark surface, resolved by the order the header uses.
	const mark = resolveMark(logo, "dark");
	const shown = (columns ?? []).filter((column) => column.links.length > 0);
	const hoursGiven = hours && hours.length > 0 ? hours : null;
	// The hours as a column of their own, or inside the brand column.
	// Any value but "brand" (a typo, a value from a later version) is a column.
	const inBrand = hoursPlacement === "brand";
	const hoursShown = inBrand ? null : hoursGiven;
	const hoursInBrand = inBrand ? hoursGiven : null;
	const hoursList = (rows: HoursRow[]) => (
		<dl>
			{rows.map((row, at) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: two rows may share a label (a split day), so the place keeps the key unique; rows never reorder
				<div key={`${at} ${row.label}`}>
					<dt>{row.label}</dt>
					<dd>{row.range}</dd>
				</div>
			))}
		</dl>
	);
	const stars = (
		<span className="footer-stars" aria-hidden="true">
			{STARS.map((star) => (
				<Star key={star} size={16} fill="currentColor" />
			))}
		</span>
	);
	const addressLines = address && (
		<>
			{/* A business that publishes a service area but no storefront leaves
			    street empty; a blank line reads as a broken block. */}
			{address.street && <span>{address.street}</span>}
			<span>
				{address.locality}, {address.region}
				{address.postalCode ? ` ${address.postalCode}` : ""}
			</span>
		</>
	);

	return (
		<>
			<footer ref={ref} className="footer">
				<div className="wrap">
					<div
						className={[
							"footer-grid",
							hoursShown && "has-hours",
							// Two across, the hours span the row only beside an even count of
							// link columns, so no cell is left alone (chrome.css, the footer).
							hoursShown && shown.length % 2 === 0 && "has-even-columns",
							hoursInBrand && "has-brand-hours",
						]
							.filter(Boolean)
							.join(" ")}
						// The link columns drawn, which the brand placement's floors are
						// measured for (chrome.css), so two or three columns keep the
						// brand column beside them as long as theirs fit.
						style={hoursInBrand ? ({ "--_link-count": shown.length } as CSSProperties) : undefined}
					>
						<div className="footer-brand">
							{logo?.tile ? (
								<p className="footer-wordmark">
									<LogoTile glyph={logo.tile} />
									{wordmark}
									{logo.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							) : mark && lockupWords(name, logo) === null ? (
								// Artwork that already spells the name stands alone, named by its alt.
								<img className={tintClass(mark)} src={mark.src} alt={logo?.alt ?? name} />
							) : (
								// The header's lockup on the dark band: the mark with the wordmark
								// beside it, or the words alone when there is no image.
								<p className={mark ? "footer-wordmark footer-lockup" : "footer-wordmark"}>
									<LockupParts name={name} logo={logo} surface="dark" />
								</p>
							)}
							{rating &&
								(ratingHref ? (
									<p className="footer-rating">
										<a
											className="footer-rating-link"
											href={ratingHref}
											aria-label={ratingLabel}
											{...newTabProps(ratingHref, true)}
										>
											{stars}
											{rating}
										</a>
									</p>
								) : (
									<p className="footer-rating">
										{stars}
										{rating}
									</p>
								))}
							{(address || phone || email) && (
								<address className="nap">
									{address &&
										(addressHref ? (
											<a
												className="nap-address"
												href={addressHref}
												{...newTabProps(addressHref, true)}
											>
												{addressLines}
											</a>
										) : (
											<span className="nap-address">{addressLines}</span>
										))}
									{phone && <a href={`tel:${phone.e164}`}>{phone.display}</a>}
									{email && <a href={`mailto:${email}`}>{breakableEmail(email)}</a>}
								</address>
							)}
							{hoursInBrand && (
								<div className="footer-brand-hours">
									{/* biome-ignore lint/a11y/useSemanticElements: a heading by role, as the link columns' are (see below) */}
									<div className="footer-heading" role="heading" aria-level={headingLevel}>
										{hoursHeading}
									</div>
									{hoursList(hoursInBrand)}
								</div>
							)}
						</div>
						{hoursShown && (
							<div className="footer-column footer-hours">
								{/* biome-ignore lint/a11y/useSemanticElements: a heading by role, as the link columns' are (see below) */}
								<div className="footer-heading" role="heading" aria-level={headingLevel}>
									{hoursHeading}
								</div>
								{hoursList(hoursShown)}
							</div>
						)}
						{shown.map((column) => (
							<nav key={column.heading} className="footer-column" aria-label={column.heading}>
								{/* A heading by role rather than by element: a site's own bare
								    h2 rule (unlayered, so it beats any rule in the package's
								    layer whatever its weight) is written for a page's section
								    titles and would restyle these small labels. A div that says
								    it is a heading keeps the outline and matches no such rule. */}
								{/* biome-ignore lint/a11y/useSemanticElements: an h2 element would take a site's bare h2 rules, see above */}
								<div className="footer-heading" role="heading" aria-level={headingLevel}>
									{column.heading}
								</div>
								{column.links.map((link, at) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: two links may share a label and a page, so the place keeps the key unique; links never reorder
									<ColumnLink key={at} link={link} />
								))}
							</nav>
						))}
					</div>
				</div>
			</footer>
			<ClosingBar
				left={<Copyright name={name} attribution={attribution} />}
				right={note ?? (credit ? undefined : null)}
			/>
		</>
	);
}
