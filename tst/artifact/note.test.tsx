import { render, screen, within } from "@testing-library/react";
import { Note, type NoteProps } from "../../src/artifact/Note";

const person = {
	photoSrc: "/images/profile.jpg",
	photoAlt: "A person",
	name: "A Person",
	role: "Founder",
	mailHref: "mailto:a@example.com",
	mailLabel: "a@example.com",
};

const shot = {
	src: "/images/menu.png",
	alt: "The menu page on a phone",
	href: "/images/menu-full.png",
	caption: "The menu, as a phone sees it",
};

function note(overrides: Partial<NoteProps> = {}): NoteProps {
	return {
		title: "A Note for the Bakery",
		preparedFor: "An Owner",
		date: "2026-10-09",
		opener: [
			"I walked past the window this morning. ",
			{ text: "The site", href: "https://example.com" },
			" has no way to order ahead.",
		],
		lanes: [
			{
				heading: "What your customer sees",
				findings: [
					{
						lead: "The menu is a picture.",
						body: "A phone has to pinch to read it.",
						href: "https://example.com/menu",
						shot,
					},
					{ lead: "The hours disagree.", body: "The map says closed on Sunday." },
				],
			},
			{
				heading: "What I see under the hood",
				findings: [{ lead: "Every page is titled Home.", body: "Search shows Home." }],
			},
		],
		start: {
			lead: "I would start by:",
			items: [
				{ lead: "Setting the menu as text,", body: "so a phone reads it." },
				{ lead: "Fixing the hours." },
			],
		},
		close: {
			paragraphs: [
				[
					"My name is A Person and I run ",
					{ text: "Atelic", href: "https://atelic.me" },
					", a small shop.",
				],
				[
					"If it is useful, ",
					{ text: "pick a time to talk", href: "https://meet.example.com" },
					". If not, no worries at all.",
				],
			],
			signOff: "Reliably Yours,",
			person,
		},
		...overrides,
	};
}

/** The lane a heading names. */
function lane(heading: string): HTMLElement {
	return screen.getByRole("heading", { level: 2, name: heading }).closest("section") as HTMLElement;
}

/** The finding a lead names. */
function finding(lead: string): HTMLElement {
	return screen.getByText(lead).closest("li") as HTMLElement;
}

describe("Note", () => {
	it("renders the title and the dateline", () => {
		render(<Note {...note()} />);
		expect(
			screen.getByRole("heading", { level: 1, name: "A Note for the Bakery" }),
		).toBeInTheDocument();
		const dateline = screen.getByText("An Owner").closest("p") as HTMLElement;
		expect(dateline).toHaveTextContent("Prepared for An Owner, 2026-10-09");
	});

	it("renders the opener as one paragraph, its link carrying its address", () => {
		render(<Note {...note()} />);
		const link = screen.getByRole("link", { name: "The site" });
		expect(link).toHaveAttribute("href", "https://example.com");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link.closest("p")).toHaveTextContent(
			"I walked past the window this morning. The site has no way to order ahead.",
		);
	});

	it("takes the opener as a plain string", () => {
		render(<Note {...note({ opener: "A plain opener." })} />);
		expect(screen.getByText("A plain opener.").tagName).toBe("P");
	});

	it("renders both lanes in order, each heading over its findings", () => {
		render(<Note {...note()} />);
		expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
			"What your customer sees",
			"What I see under the hood",
		]);
		const customer = lane("What your customer sees");
		expect(within(customer).getByText("The menu is a picture.")).toBeInTheDocument();
		expect(within(customer).getByText("A phone has to pinch to read it.")).toBeInTheDocument();
		expect(within(customer).getByText("The hours disagree.")).toBeInTheDocument();
		const hood = lane("What I see under the hood");
		expect(within(hood).getByText("Every page is titled Home.")).toBeInTheDocument();
		expect(within(hood).getByText("Search shows Home.")).toBeInTheDocument();
	});

	it("marks every finding as needing work", () => {
		render(<Note {...note()} />);
		for (const lead of ["The menu is a picture.", "The hours disagree."]) {
			expect(within(finding(lead)).getByLabelText("Needs work")).toBeInTheDocument();
		}
	});

	it("links a finding's lead to where it can be seen, and leaves the rest plain", () => {
		render(<Note {...note()} />);
		const link = screen.getByRole("link", { name: "The menu is a picture." });
		expect(link).toHaveAttribute("href", "https://example.com/menu");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
		expect(screen.queryByRole("link", { name: "The hours disagree." })).toBeNull();
	});

	it("renders a shot under its own finding and nowhere else", () => {
		render(<Note {...note()} />);
		const withShot = finding("The menu is a picture.");
		const figure = within(withShot).getByRole("figure");
		expect(figure).toHaveTextContent("The menu, as a phone sees it");
		expect(within(figure).getByRole("img", { name: "The menu page on a phone" })).toHaveAttribute(
			"src",
			"/images/menu.png",
		);
		expect(within(figure).getByRole("link")).toHaveAttribute("href", "/images/menu-full.png");
		// The figure comes after the finding's words.
		const words = within(withShot).getByText("A phone has to pinch to read it.");
		expect(words.compareDocumentPosition(figure)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
		expect(screen.getAllByRole("figure")).toHaveLength(1);
		expect(within(finding("The hours disagree.")).queryByRole("figure")).toBeNull();
	});

	it("marks a finding that carries a shot, so it can set the shot beside its words", () => {
		render(<Note {...note()} />);
		expect(finding("The menu is a picture.")).toHaveClass("nt-finding", "has-shot");
		expect(finding("The hours disagree.")).toHaveClass("nt-finding");
		expect(finding("The hours disagree.")).not.toHaveClass("has-shot");
	});

	it("renders a shot with no full screenshot as the crop alone", () => {
		const { href: _, ...crop } = shot;
		render(
			<Note
				{...note({
					lanes: [
						{
							heading: "What your customer sees",
							findings: [{ lead: "A lead.", body: "A body.", shot: crop }],
						},
					],
				})}
			/>,
		);
		const figure = screen.getByRole("figure");
		expect(within(figure).queryByRole("link")).toBeNull();
		expect(
			within(figure).getByRole("img", { name: "The menu page on a phone" }),
		).toBeInTheDocument();
	});

	it("lists where the work would start, each lead in bold before its body", () => {
		render(<Note {...note()} />);
		expect(screen.getByText("I would start by:")).toBeInTheDocument();
		const first = screen.getByText("Setting the menu as text,").closest("li") as HTMLElement;
		expect(first).toHaveTextContent("Setting the menu as text, so a phone reads it.");
		expect(within(first).getByText("Setting the menu as text,").tagName).toBe("B");
		expect(screen.getByText("Fixing the hours.").closest("li")).toHaveTextContent(
			/^Fixing the hours\.$/,
		);
	});

	it("closes on the sender, the offer with its scheduling link, and the sign off", () => {
		render(<Note {...note()} />);
		const atelic = screen.getByRole("link", { name: "Atelic" });
		expect(atelic).toHaveAttribute("href", "https://atelic.me");
		expect(atelic.closest("p")).toHaveTextContent(
			"My name is A Person and I run Atelic, a small shop.",
		);
		const ask = screen.getByRole("link", { name: "pick a time to talk" });
		expect(ask).toHaveAttribute("href", "https://meet.example.com");
		expect(ask.closest("p")).toHaveTextContent(
			"If it is useful, pick a time to talk. If not, no worries at all.",
		);
		expect(screen.getByText("Reliably Yours,")).toBeInTheDocument();
		expect(screen.getByText("A Person")).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "A person" })).toHaveAttribute(
			"src",
			"/images/profile.jpg",
		);
		const mail = screen.getByRole("link", { name: "a@example.com" });
		expect(mail).toHaveAttribute("href", "mailto:a@example.com");
		expect(mail).not.toHaveAttribute("target");
	});

	it("opens an anchor link in place", () => {
		render(<Note {...note({ opener: ["See ", { text: "below", href: "#start" }, "."] })} />);
		expect(screen.getByRole("link", { name: "below" })).not.toHaveAttribute("target");
	});
});

describe("Note, empty sections", () => {
	it("renders no lanes when there are none", () => {
		const { container } = render(<Note {...note({ lanes: [] })} />);
		expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
		expect(container.querySelector(".nt-lanes")).toBeNull();
	});

	it("renders no lane whose findings are empty, and keeps the other", () => {
		render(
			<Note
				{...note({
					lanes: [
						{ heading: "What your customer sees", findings: [] },
						{
							heading: "What I see under the hood",
							findings: [{ lead: "A lead.", body: "A body." }],
						},
					],
				})}
			/>,
		);
		expect(screen.queryByText("What your customer sees")).toBeNull();
		expect(lane("What I see under the hood")).toBeInTheDocument();
	});

	it("renders no start when it has no steps", () => {
		const { container } = render(
			<Note {...note({ start: { lead: "I would start by:", items: [] } })} />,
		);
		expect(screen.queryByText("I would start by:")).toBeNull();
		expect(container.querySelector(".nt-start")).toBeNull();
	});

	it("renders no opener when it is empty, as a string or as runs", () => {
		const runs = render(<Note {...note({ opener: [] })} />);
		expect(runs.container.querySelector(".nt-opener")).toBeNull();
		runs.unmount();
		const text = render(<Note {...note({ opener: "  " })} />);
		expect(text.container.querySelector(".nt-opener")).toBeNull();
	});

	it("treats runs that are all blank as empty, in the opener and the close, and keeps a lone link", () => {
		const blank = render(
			<Note
				{...note({
					opener: ["", "  "],
					close: { paragraphs: [[""], ["Kept."]], signOff: "Reliably Yours,", person },
				})}
			/>,
		);
		expect(blank.container.querySelector(".nt-opener")).toBeNull();
		expect(blank.container.querySelectorAll(".nt-close p")).toHaveLength(1);
		blank.unmount();
		render(<Note {...note({ opener: ["", { text: "A link", href: "https://example.com" }] })} />);
		expect(screen.getByRole("link", { name: "A link" }).closest("p")).toHaveClass("nt-opener");
	});

	it("renders no close paragraphs when there are none, and still signs off", () => {
		const { container } = render(
			<Note {...note({ close: { paragraphs: [], signOff: "Reliably Yours,", person } })} />,
		);
		expect(container.querySelectorAll(".nt-close p")).toHaveLength(0);
		expect(screen.getByText("Reliably Yours,")).toBeInTheDocument();
	});
});
