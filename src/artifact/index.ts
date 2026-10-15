/**
 * The artifact entry: the pieces a document is built from and the site
 * around it. The composed documents (the writeup, the read, the monthly
 * page, the note, and the sealed document) live in @atelic-action/artifact,
 * which builds them from what this entry exports.
 */
export { newTabProps } from "../lib/newTabProps";
export { AppErrorBoundary } from "./AppErrorBoundary";
export { ArtifactShell, type ArtifactShellProps } from "./ArtifactShell";
export type {
	ArtifactConfig,
	ArtifactReader,
	ArtifactRecipient,
	ArtifactSender,
	GateConfig,
} from "./artifactConfig";
export { ErrorFallback } from "./ErrorFallback";
export { GradeChip, gradeLabel, type WriteupGrade } from "./GradeChip";
export {
	ArtifactAnchor,
	type ArtifactLink,
	type ArtifactParagraph,
	isEmpty,
	Paragraph,
	Runs,
} from "./Paragraph";
export { buildPageHead, canonicalUrl, type PageMeta } from "./pageHead";
export {
	mintToken,
	openReader,
	readerId,
	readerLink,
	sealReader,
	whoIsReading,
} from "./readers";
export { Shot, type WriteupShot } from "./Shot";
export { SignOff, type WriteupPerson } from "./SignOff";
