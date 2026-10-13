import { NotFound } from "../src/components";
import { Example, Piece } from "./parts";

/** The not found page the made up bakery's site renders for a path it does not have. */
export function NotFoundPiece() {
	return (
		<Piece
			id="not-found"
			title="NotFound"
			lead="The page an unknown path renders: a headline, a row of the pages worth landing on, and the closing call to action. It renders the body only, so a site wraps it in its own shell, and it wears the site's own classes, so a site that styles them gets its own look."
		>
			<Example caption="The body, framed to sit in the page">
				<div className="gallery-document">
					<NotFound
						title="This page wandered off."
						lead="The link may be old, or the page may have moved. The bread is where it always was."
						links={[
							{ label: "Menu", href: "#not-found" },
							{ label: "Cakes", href: "#not-found" },
							{ label: "Catering", href: "#not-found" },
							{ label: "Visit", href: "#not-found" },
						]}
						closing={{ eyebrow: "Back on Track", title: "Let's get you a loaf." }}
						primaryCTA={{ label: "Order Ahead", href: "#not-found" }}
						secondary={{ label: "Back to Home", href: "#not-found" }}
					/>
				</div>
			</Example>
		</Piece>
	);
}
