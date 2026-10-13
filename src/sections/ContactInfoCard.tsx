import { newTabProps } from "../lib/newTabProps";
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
}

/** Dark card with direct contact rows: call, email, visit, portal. */
export function ContactInfoCard({
	site,
	title = "Reach us directly",
	phones,
	showAddress = true,
}: ContactInfoCardProps) {
	const withBase = useWithBase();
	const portal = site.footerLinks?.find((link) => link.label.toLowerCase().includes("portal"));
	return (
		<div className="contact-info-card">
			<h3>{title}</h3>
			<div className="ci-rows">
				{phones?.length
					? phones.map((phone) => (
							<div className="ci-row" key={phone.e164}>
								<span className="k">{phone.role}</span>
								<span className="v">
									<a href={`tel:${phone.e164}`}>{phone.display}</a>
								</span>
							</div>
						))
					: site.phone && (
							<div className="ci-row">
								<span className="k">Call / Text</span>
								<span className="v">
									<a href={`tel:${site.phone.e164}`}>{site.phone.display}</a>
								</span>
							</div>
						)}
				<div className={["ci-row", !showAddress && !portal && "last"].filter(Boolean).join(" ")}>
					<span className="k">Email</span>
					<span className="v">
						<a href={`mailto:${site.email}`}>{site.email}</a>
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
