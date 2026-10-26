import { GradeChip, gradeLabel, type WriteupGrade } from "../src/artifact/GradeChip";
import { type ArtifactParagraph, isEmpty, Paragraph, Runs } from "../src/artifact/Paragraph";
import { Shot } from "../src/artifact/Shot";
import { SignOff, type WriteupPerson } from "../src/artifact/SignOff";
import { ReportCard } from "../src/components/ReportCard";
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
	{ text: "a phone has to pinch it to read", href: "https://example.com/" },
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
				id="report-card"
				title="ReportCard"
				lead="A name, a grade, and one line on it per row, in labeled groups. A row with an href is a link from edge to edge, with a chevron at its end, and a link inside the line still goes where it points. On a later card the earlier grade sits faded beside the grade, and a section not yet read carries a dash."
			>
				<Example caption="The first card, with a legend">
					<ReportCard
						title="At a Glance"
						legend={[
							{ grade: "a", label: "Clean" },
							{ grade: "b", label: "Works, with a quick win left" },
							{ grade: "c", label: "A customer feels it" },
							{ grade: "d", label: "Broken" },
						]}
						groups={[
							{
								title: "Health",
								rows: [
									{
										name: "Technical SEO",
										href: "#report-card",
										grade: "b",
										line: "Every page that matters is in Google. Two of the menu pages copy each other, and Google shows the older one.",
									},
									{
										name: "Core Web Vitals",
										href: "#report-card",
										grade: "c",
										line: "The home page shows its first loaf in ~4 s on a phone, where Google's line is 2.5 s.",
									},
								],
							},
							{
								title: "Visibility",
								rows: [
									{
										name: "Local SEO",
										href: "#report-card",
										grade: "a",
										line: "First on the map for bakery near me across the neighborhood, with a review a week.",
									},
									{
										name: "GEO",
										href: "#report-card",
										grade: "b",
										line: (
											<>
												Named in 9 of 12 answers; the three misses ask about{" "}
												<a href="#report-card">gluten free</a>, which the site never says.
											</>
										),
									},
								],
							},
						]}
					/>
				</Example>
				<Example caption="A later card: what moved, and a section not yet read">
					<ReportCard
						label="At a glance"
						labels={{ before: "June 2026" }}
						groups={[
							{
								title: "Health",
								rows: [
									{
										name: "Technical SEO",
										href: "#report-card",
										grade: "a",
										before: "b",
										line: "The duplicate menu page is gone, and Google shows the right one.",
									},
									{
										name: "Core Web Vitals",
										href: "#report-card",
										grade: "c",
										before: "c",
										line: "Still ~4 s on a phone; the hero photo is the next cut.",
									},
								],
							},
							{
								title: "Conversion",
								rows: [
									{
										name: "Analytics and Conversion Tracking",
										line: "Read once the Analytics access lands.",
									},
								],
							},
						]}
					/>
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
				lead="The owner's own screen: the crop, opening the full picture in a new tab when it has one, over its caption. A document sizes it and lays shots out in its own sheet. A crop taller than it is wide is marked portrait and held far narrower than its column."
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
				<Example caption="A phone screen and a laptop screen in the same wide column: the phone is held narrow">
					<div className="gallery-shot-column">
						<Shot
							shot={{
								src: "/images/bakery-phone.svg",
								alt: "The bakery's home page on a phone",
								href: "/images/bakery-phone.svg",
								caption: "The home page at phone width",
							}}
						/>
						<Shot
							shot={{
								src: "/images/bakery-desktop.svg",
								alt: "The bakery's home page on a laptop",
								href: "/images/bakery-desktop.svg",
								caption: "The home page on a laptop",
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
