import type { ReactNode } from "react";
import { CreditBar } from "../chrome/CreditBar";
import { SiteHeader } from "../chrome/SiteHeader";
import { SkipLink } from "../chrome/SkipLink";
import { Watermark } from "../components/Watermark";
import type { PageStop } from "../hooks/useScrollSpy";
import type { ArtifactConfig } from "./artifactConfig";

export interface ArtifactShellProps {
	site: ArtifactConfig;
	/**
	 * The path of the page being read. The package imports no router, so the
	 * site reads it from its own and passes it down.
	 */
	currentPath: string;
	/** The page's own stops; the header renders them scroll spied. */
	stops?: PageStop[];
	children: ReactNode;
}

/**
 * The wrapper every artifact page uses: the `.mkt` theming
 * scope, the skip link, the header, the credit band, and the access gate's
 * watermark, composed from the chrome. The header is always the dark
 * variant with the sender's lockup and never a site nav or a CTA, because the
 * document's own close is the ask. There is no footer and no sticky bar by
 * design: a document ends on its own sign off, and the credit band is the
 * one line allowed after it.
 */
export function ArtifactShell({ site, currentPath, stops, children }: ArtifactShellProps) {
	const { name, href, logo } = site.sender;
	// The lockup names both parties of a sent document: the sender's wordmark
	// and run, then the recipient's mark after a times sign (ui 0.6.0).
	const recipient = site.recipient.logo;

	return (
		<div className="mkt">
			<SkipLink />
			<SiteHeader
				brand={{ name, href, logo, recipient }}
				variant="dark"
				currentPath={currentPath}
				stops={stops}
			/>
			<main id="main">{children}</main>
			<CreditBar />
			<Watermark />
		</div>
	);
}
