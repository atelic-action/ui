import { GradeChip, gradeLabel, type WriteupGrade } from "../src/artifact/GradeChip";
import { type ArtifactParagraph, isEmpty, Paragraph, Runs } from "../src/artifact/Paragraph";
import { Shot } from "../src/artifact/Shot";
import { SignOff, type WriteupPerson } from "../src/artifact/SignOff";
import { Example, Piece } from "./parts";

/*
 * The pieces the artifact documents are built from, each on its own with
 * made up data for Kestrel Hollow Bakehouse, the gallery's fictional bakery.
 * The sender is the practice's own close, as every document carries it. The
 * composed documents themselves live in @atelic-action/artifact and are
 * shown there.
 */

const person: WriteupPerson = {
	photoSrc: "/images/note-person.svg",
	photoAlt: "Matthew Fornaciari",
	name: "Matthew Fornaciari",
	role: "Atelic",
	mailHref: "mailto:matt@atelic.me",
	mailLabel: "matt@atelic.me",
};

const grades: Array<{ grade: WriteupGrade; section: string }> = [
	{ grade: "a", section: "Local SEO" },
	{ grade: "b", section: "Technical SEO" },
	{ grade: "c", section: "Core Web Vitals" },
	{ grade: "d", section: "Analytics and Conversion Tracking" },
];

const runs: ArtifactParagraph = [
	"The menu is a photo of the chalkboard, so ",
	{ text: "a phone has to pinch it to read", href: "https://pagespeed.web.dev/" },
	", and the hours below it ",
	{ text: "disagree with the map", href: "#paragraph" },
	". ",
	{ text: "Write to the bakery", href: "mailto:hello@example.test" },
	" to ask.",
];

const blank: ArtifactParagraph = ["  ", ""];

export function ArtifactPieces() {
	return (
		<>
			<Piece
				id="grade-chip"
				title="GradeChip"
				lead={
					<>
						A section's grade, A to D, as a chip in its grade's color: green, yellow, orange, red,
						whatever the brand is, so an owner reads it at a glance. <code>gradeLabel</code> is the
						letter alone, for a table cell or a screen reader's name.
					</>
				}
			>
				<Example caption="The four grades, each beside its section">
					<ul className="gallery-rows">
						{grades.map(({ grade, section }) => (
							<li key={grade}>
								{section}
								<GradeChip grade={grade} />
							</li>
						))}
					</ul>
				</Example>
				<Example caption="gradeLabel, the letter alone">
					<p>{grades.map(({ grade }) => gradeLabel[grade]).join(" ")}</p>
				</Example>
			</Piece>

			<Piece
				id="sign-off"
				title="SignOff"
				lead="The close a document ends on: the script line, then the photo beside the name, the role, and the address. Its container sets the type size and the color."
			>
				<Example>
					<div className="gallery-sign-off">
						<SignOff signOff="Reliably Yours," person={person} />
					</div>
				</Example>
			</Piece>

			<Piece
				id="shot"
				title="Shot"
				lead="The owner's own screen: the crop, opening the full picture in a new tab when it has one, over its caption. A document sizes it and lays shots out in its own sheet."
			>
				<Example caption="Linked to the full picture, and the crop alone">
					<div className="gallery-shots">
						<Shot
							shot={{
								src: "/images/note-menu.svg",
								alt: "The menu page on a phone: a dark photo of a chalkboard, too small to read",
								href: "/images/note-menu.svg",
								caption: "The menu page at phone width",
							}}
						/>
						<Shot
							shot={{
								src: "/images/note-menu.svg",
								alt: "The menu page on a phone, with no full picture to open",
								caption: "The same crop, with nothing to open",
							}}
						/>
					</div>
				</Example>
			</Piece>

			<Piece
				id="paragraph"
				title="Paragraph"
				lead={
					<>
						Plain data text a routine can write as JSON: a paragraph is a string, or runs of text
						and <code>{"{ text, href }"}</code> links in order. A link opens in a new tab when it
						leaves the page, and in place when it is an anchor or a mail link (
						<code>ArtifactAnchor</code>). <code>Runs</code> sets the runs in a container that is not
						a paragraph, and <code>isEmpty</code> says when there is nothing to read.
					</>
				}
			>
				<Example caption="A plain string">
					<Paragraph paragraph="Every figure on this page is made up for the gallery." />
				</Example>
				<Example caption="Runs: a link off the page, an anchor, and a mail link">
					<Paragraph paragraph={runs} />
				</Example>
				<Example caption="Runs in a list item, and isEmpty on runs that are all blank">
					<ul className="gallery-rows">
						<li>
							<Runs paragraph={runs} />
						</li>
						<li>isEmpty: {String(isEmpty(blank))}</li>
					</ul>
				</Example>
			</Piece>
		</>
	);
}
