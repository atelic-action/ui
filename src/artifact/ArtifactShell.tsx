import type { ReactNode } from "react";
import { ClosingBar } from "../chrome/ClosingBar";
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
 * The wrapper every artifact page uses: the `.atelic-ui` theming
 * scope, the skip link, the header, the closing bar, and the access gate's
 * watermark, composed from the chrome. The header is always the dark
 * variant with the sender's lockup and never a site nav or a CTA, because the
 * document's own close is the ask. There is no footer and no sticky bar by
 * design: a document ends on its own sign off, and the closing bar is the
 * one line allowed after it, closing the way a site does, with the copyright
 * in the sender's name on the left and the practice's credit on the right.
 */
export function ArtifactShell({ site, currentPath, stops, children }: ArtifactShellProps) {
	const { name, href, logo } = site.sender;
	// The lockup names both parties of a sent document: the sender's wordmark
	// and run, then the recipient's mark after a times sign (ui 0.6.0).
	const recipient = site.recipient.logo;

	// Pinned to the roomier spacing every page had before 8.0.0, so a
	// document's shell (its 404 included) reads as close as the one token allows to how it did when the
	// marketing default tightened. `data-shell` scopes the document header's
	// mark height (artifact.css).
	return (
		<div className="atelic-ui" data-density="comfortable" data-shell="artifact">
			<SkipLink />
			<SiteHeader
				brand={{ name, href, logo, recipient }}
				variant="dark"
				currentPath={currentPath}
				stops={stops}
			/>
			<main id="main">{children}</main>
			<ClosingBar name={name} />
			<Watermark />
		</div>
	);
}
