import { menuPhoneLabel } from "../chrome/SiteMenu";
import { newTabProps } from "../lib/newTabProps";
import { EmailLink } from "../primitives/EmailLink";
import { PhoneLink } from "../primitives/PhoneLink";
import { useWithBase } from "../routing/BasePathProvider";
import type { SiteConfig } from "./siteConfig";

export interface ContactPhone {
	/** Who picks up, e.g. "Owner" or "Co Owner". */
	role: string;
	display: string;
	e164: string;
}

/** The keys of the site config the card reads; a whole `SiteConfig` passes as it is. */
export type ContactInfoCardSite = Pick<SiteConfig, "phone" | "email" | "address" | "footerLinks">;

export interface ContactInfoCardProps {
	site: ContactInfoCardSite;
	/** Card heading. */
	title?: string;
	/**
	 * Labelled phone lines for a business that publishes more than one (a
	 * family shop with an owner and a co owner, say). When set, these replace
	 * the single `site.phone` row and each carries its own role label.
	 */
	phones?: ContactPhone[];
	/**
	 * Render the street address row. Off for businesses that publish a service
	 * area but no storefront: an address row with an empty street reads as a
	 * broken card, and inventing one is worse.
	 */
	showAddress?: boolean;
	/**
	 * The words beside the single `site.phone` row. Defaults to the site's
	 * own words for its phone (`site.phone.menuLabel`), read as the phone menu
	 * reads them, so a site states them once (9.7.0), and to "Call" when it
	 * gives none, which asserts nothing a business may not do. Set here, it
	 * wins for this card ("Call or text").
	 */
	phoneLabel?: string;
	/**
	 * How each row sets its label beside its value. `inline`, the default, is
	 * the small mono label in a column of its own; `stacked` (8.5.0) puts the
	 * label over the value in the body face and sets each number large, for a
	 * card of several labeled lines where the label is a place ("Downtown")
	 * and too long for the column.
	 */
	layout?: "inline" | "stacked";
}

/** Dark card with direct contact rows: call, email, visit, portal. */
export function ContactInfoCard({
	site,
	title = "Reach us directly",
	phones,
	showAddress = true,
	phoneLabel,
	layout = "inline",
}: ContactInfoCardProps) {
	const withBase = useWithBase();
	const portal = site.footerLinks?.find((link) => link.label.toLowerCase().includes("portal"));
	return (
		<div
			className={["contact-info-card", layout === "stacked" && "is-stacked"]
				.filter(Boolean)
				.join(" ")}
			data-ground="dark"
		>
			<h3>{title}</h3>
			<div className="ci-rows">
				{phones?.length
					? phones.map((phone) => (
							<div className="ci-row" key={phone.e164}>
								<span className="k">{phone.role}</span>
								<span className="v">
									<PhoneLink phone={phone} />
								</span>
							</div>
						))
					: site.phone && (
							<div className="ci-row">
								<span className="k">{phoneLabel ?? menuPhoneLabel(site.phone)}</span>
								<span className="v">
									<PhoneLink phone={site.phone} />
								</span>
							</div>
						)}
				<div className={["ci-row", !showAddress && !portal && "last"].filter(Boolean).join(" ")}>
					<span className="k">Email</span>
					<span className="v">
						{/* Breaks after the @ and before each dot, never inside a word, as the footer's does. */}
						<EmailLink email={site.email} />
					</span>
				</div>
				{showAddress && (
					<div className="ci-row">
						<span className="k">Visit</span>
						<span className="v">
							{site.address.street}
							<br />
							{site.address.locality}, {site.address.region} {site.address.postalCode}
						</span>
					</div>
				)}
				{portal && (
					<div className="ci-row last">
						<span className="k">Portal</span>
						<span className="v">
							<a href={withBase(portal.href)} {...newTabProps(portal.href, portal.external)}>
								{portal.label} →
							</a>
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
