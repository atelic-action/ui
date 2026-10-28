import { Callout, Tabs } from "../src/components";
import { Example, Piece } from "./parts";

/*
 * The bakery's plan and read, made up like the rest of the page. The ids
 * carry the bakery's name so they never meet a gallery section's anchor.
 */
export function TabsPiece() {
	return (
		<Piece
			id="tabs"
			title="Tabs"
			lead="Panels behind a row of tabs, every panel kept in the page. A hash opens a tab by its id, or the panel holding any element it names, and scrolls there, so a link in one panel can land on a finding in another. Find in page reaches an inactive panel, and on paper the tabs fall away and every panel prints under its label."
		>
			<Example caption="A link in the plan opens the read on its finding">
				<Tabs
					ariaLabel="The bakery's plan and read"
					tabs={[
						{
							id: "bakehouse-plan",
							label: "The Plan",
							content: (
								<p>
									First, make the opening hours agree everywhere they are listed.{" "}
									<a href="#bakehouse-sunday-hours">See the finding on Sunday hours.</a>
								</p>
							),
						},
						{
							id: "bakehouse-read",
							label: "The Read",
							content: (
								<div className="gallery-stack">
									<Callout tone="good" title="Customers find you by name.">
										A search for the bakery's name puts the site first and the map listing beside
										it.
									</Callout>
									<div id="bakehouse-sunday-hours">
										<Callout tone="bad" title="Three listings disagree about Sunday.">
											The site says 08:00 to 14:00, the map listing says closed, and one directory
											still shows the summer hours.
										</Callout>
									</div>
								</div>
							),
						},
					]}
				/>
			</Example>
		</Piece>
	);
}
