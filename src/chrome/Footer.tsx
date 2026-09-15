import { Mail, UserRound } from "lucide-react";
import type { ComponentProps } from "react";
import { newTabProps } from "../lib/newTabProps";
import type {
	Brand,
	HoursRow,
	NavLink,
	Phone,
	PostalAddress,
	SiteLink,
	SocialLink,
} from "../types";
import { CreditBar } from "./CreditBar";

/*
 * lucide-react ships no brand marks (removed upstream by policy), and a code
 * glyph standing in for GitHub or a briefcase for LinkedIn misleads the
 * reader. These two are the brands' own simple marks, carried by hand as a
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

const SOCIAL_ICONS = {
	github: GitHubMark,
	linkedin: LinkedInMark,
	mail: Mail,
	user: UserRound,
} as const;

function SocialIconLink({ link }: { link: SocialLink }) {
	const Icon = SOCIAL_ICONS[link.icon];
	return (
		<a
			className="footer-social-link"
			href={link.href}
			aria-label={link.label}
			title={link.label}
			{...newTabProps(link.href, true)}
		>
			<Icon aria-hidden size={18} />
		</a>
	);
}

function FooterLink({ link }: { link: SiteLink }) {
	return (
		<a href={link.href} {...newTabProps(link.href, link.external)}>
			{link.label}
		</a>
	);
}

export interface FooterProps {
	/** The identity at the head of the brand column. */
	brand: Brand;
	/** Short brand paragraph under the identity. */
	blurb?: string;
	/** Icon links (socials, the founder's own site) under the blurb. */
	socialLinks?: SocialLink[];
	/** The site's nav, repeated in the explore column. */
	links?: NavLink[];
	/** Explore links beyond the nav, e.g. a patient portal. */
	extraLinks?: SiteLink[];
	/** Heading over the contact column. Defaults to "Visit". */
	contactHeading?: string;
	/**
	 * The street address, printed under the business name. Omit it for a
	 * practice with no storefront, and the phone and email stand alone under
	 * the heading.
	 */
	address?: PostalAddress;
	phone?: Phone;
	email?: string;
	/** Opening hours as display rows, already formatted by the site. */
	hours?: HoursRow[];
	/** Suffix on the copyright line, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/** A short closing note beside the copyright line. */
	note?: string;
	legalLinks?: SiteLink[];
	/** The developer credit band at the foot. Defaults on. */
	credit?: boolean;
}

/** The site footer: brand blurb, explore nav, NAP block, hours, and the credit band. */
export function Footer({
	brand,
	blurb,
	socialLinks,
	links,
	extraLinks,
	contactHeading = "Visit",
	address,
	phone,
	email,
	hours,
	attribution,
	note,
	legalLinks,
	credit = true,
}: FooterProps) {
	const { name, logo } = brand;
	const wordmark = logo?.wordmark ?? name;

	return (
		<>
			<footer className="footer">
				<div className="wrap">
					<div className="footer-grid">
						<div className="footer-brand">
							{logo?.tile ? (
								<p className="footer-wordmark">
									<span className="logo-tile" aria-hidden="true">
										{logo.tile}
									</span>
									{wordmark}
									{logo.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							) : logo?.src ? (
								<img src={logo.src} alt={logo.alt ?? name} />
							) : (
								<p className="footer-wordmark">
									{wordmark}
									{logo?.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							)}
							{blurb && <p>{blurb}</p>}
							{socialLinks && socialLinks.length > 0 && (
								<div className="footer-social">
									{socialLinks.map((link) => (
										<SocialIconLink key={link.href} link={link} />
									))}
								</div>
							)}
						</div>
						<div>
							<h4>Explore</h4>
							<nav aria-label="Footer">
								{links?.map((link) => (
									<a key={link.href} href={link.href}>
										{link.label}
									</a>
								))}
								{extraLinks?.map((link) => (
									<FooterLink key={link.href} link={link} />
								))}
							</nav>
						</div>
						<div>
							<h4>{contactHeading}</h4>
							<address className="nap">
								{address && (
									<>
										<strong>{name}</strong>
										<br />
										{/* A business that publishes a service area but no storefront
										    leaves street empty; a blank line reads as a broken block. */}
										{address.street && (
											<>
												{address.street}
												<br />
											</>
										)}
										{address.locality}, {address.region}
										{address.postalCode ? ` ${address.postalCode}` : ""}
										<br />
										<br />
									</>
								)}
								{phone && (
									<>
										<a href={`tel:${phone.e164}`}>{phone.display}</a>
										<br />
									</>
								)}
								{email && <a href={`mailto:${email}`}>{email}</a>}
							</address>
						</div>
						{hours && hours.length > 0 && (
							<div>
								<h4>Hours</h4>
								<div className="footer-hours">
									{hours.map((row) => (
										<span key={row.label}>
											{row.label}&nbsp;&nbsp;{row.range}
											<br />
										</span>
									))}
								</div>
							</div>
						)}
					</div>
					<div className="footer-bottom">
						<span>
							© {new Date().getFullYear()} {name}
							{attribution ? ` · ${attribution}` : ""}
						</span>
						{note && <span>{note}</span>}
						{legalLinks && legalLinks.length > 0 && (
							<span className="footer-legal">
								{legalLinks.map((link) => (
									<FooterLink key={link.href} link={link} />
								))}
							</span>
						)}
					</div>
				</div>
			</footer>
			{credit && <CreditBar />}
		</>
	);
}
