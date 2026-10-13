import { type ProseBlock, ProseBlocks } from "../primitives/ProseBlocks";

/**
 * Legal documents are prose blocks like any other ported document, so the
 * block vocabulary and the renderer are shared with the blog rather than
 * duplicated. Re-exported because a client site importing `LegalDoc` should
 * not need to know where the block type happens to live.
 */
export type LegalBlock = ProseBlock;

export interface LegalDoc {
	/** The document's own title, as the source states it. */
	title: string;
	/** The source's own revision date, verbatim. Null when it states none. */
	lastUpdated?: string | null;
	blocks: LegalBlock[];
}

export interface LegalPageProps {
	doc: LegalDoc;
	id?: string;
	className?: string;
}

/**
 * Renders a legal document: terms, a privacy policy, a disclaimer. Content
 * arrives entirely as data so a client's published wording can be ported
 * without passing through anyone's judgment about what it should say.
 *
 * All-caps passages are left exactly as the source sets them. Legal drafting
 * uses capitals to make a clause conspicuous, which carries actual legal
 * weight in some jurisdictions, so it is never normalised away here.
 */
export function LegalPage({ doc, id, className }: LegalPageProps) {
	return (
		<section className={["section", "legal", className].filter(Boolean).join(" ")} id={id}>
			<div className="wrap">
				{doc.lastUpdated && <p className="legal-updated">Last updated: {doc.lastUpdated}</p>}
				<ProseBlocks blocks={doc.blocks} />
			</div>
		</section>
	);
}
