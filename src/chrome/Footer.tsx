import { Mail, Star, UserRound } from "lucide-react";
import type { ComponentProps, CSSProperties, Ref } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { Brand, FooterColumn, FooterColumnLink, Phone, PostalAddress } from "../types";
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
	 * logo beside five stars, as plain text and never a link.
	 */
	rating?: string;
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
	/** The footer element, for a caller that measures it (`SiteShell` hands it to the contact dock). */
	ref?: Ref<HTMLElement>;
}

/**
 * The site footer: a brand column (the logo, the Google rating, the address
 * linked to the Google profile, the phone, and the email), the link columns
 * beside it, and the closing bar under it all.
 */
export function Footer({
	brand,
	rating,
	address,
	addressHref,
	phone,
	email,
	columns,
	attribution,
	note,
	credit = true,
	ref,
}: FooterProps) {
	const { name, logo } = brand;
	// The footer always names the business when it draws no image.
	const wordmark = logo?.wordmark === false ? name : (logo?.wordmark ?? name);
	// The band is dark, so the mark cut for a dark surface leads.
	const mark = logo?.onDark ?? logo?.src ?? logo?.onLight;
	const shown = (columns ?? []).filter((column) => column.links.length > 0);
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
						className="footer-grid"
						style={{ "--footer-columns": shown.length } as CSSProperties}
					>
						<div className="footer-brand">
							{logo?.tile ? (
								<p className="footer-wordmark">
									<span className="logo-tile" aria-hidden="true">
										{logo.tile}
									</span>
									{wordmark}
									{logo.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							) : mark ? (
								<img src={mark} alt={logo?.alt ?? name} />
							) : (
								<p className="footer-wordmark">
									{wordmark}
									{logo?.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							)}
							{rating && (
								<p className="footer-rating">
									<span className="footer-stars" aria-hidden="true">
										{STARS.map((star) => (
											<Star key={star} size={16} fill="currentColor" />
										))}
									</span>
									{rating}
								</p>
							)}
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
									{email && <a href={`mailto:${email}`}>{email}</a>}
								</address>
							)}
						</div>
						{shown.map((column) => (
							<nav key={column.heading} className="footer-column" aria-label={column.heading}>
								<h4>{column.heading}</h4>
								{column.links.map((link) => (
									<ColumnLink key={`${link.label} ${link.href}`} link={link} />
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
