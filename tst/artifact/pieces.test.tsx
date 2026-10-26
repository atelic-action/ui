import { fireEvent, render, screen } from "@testing-library/react";
import * as entry from "../../src/artifact";
import {
	ArtifactAnchor,
	type ArtifactParagraph,
	GradeChip,
	gradeLabel,
	isEmpty,
	Paragraph,
	Runs,
	Shot,
	SignOff,
	type WriteupPerson,
} from "../../src/artifact";

const person: WriteupPerson = {
	photoSrc: "/images/profile.jpg",
	photoAlt: "A person",
	name: "A Person",
	role: "Founder",
	mailHref: "mailto:a@example.com",
	mailLabel: "a@example.com",
};

/*
 * The artifact entry holds the pieces a document is built from; the
 * composed documents live in @atelic-action/artifact, which imports these.
 * The first block locks that contract, so a piece that entry relies on can
 * never drop out of a release unnoticed, and a document cannot creep back.
 */
describe("the artifact entry", () => {
	it("exports every piece a document is built from", () => {
		for (const name of [
			"GradeChip",
			"gradeLabel",
			"SignOff",
			"Shot",
			"Paragraph",
			"Runs",
			"isEmpty",
			"ArtifactAnchor",
			"newTabProps",
			"ArtifactShell",
			"AppErrorBoundary",
			"ErrorFallback",
			"buildPageHead",
			"canonicalURL",
			"mintToken",
			"openReader",
			"readerId",
			"readerLink",
			"sealReader",
			"whoIsReading",
		]) {
			expect(entry, name).toHaveProperty(name);
		}
	});

	it("exports no composed document", () => {
		for (const name of ["Writeup", "Read", "Report", "Note", "Gate", "normalizeEmail"]) {
			expect(entry, name).not.toHaveProperty(name);
		}
	});
});

describe("GradeChip", () => {
	it("prints each grade's letter, carrying the grade for its color", () => {
		const { container } = render(
			<>
				<GradeChip grade="a" />
				<GradeChip grade="b" />
				<GradeChip grade="c" />
				<GradeChip grade="d" />
			</>,
		);
		const chips = [...container.querySelectorAll(".op-grade")];
		expect(chips.map((chip) => chip.textContent)).toEqual(["A", "B", "C", "D"]);
		expect(chips.map((chip) => chip.getAttribute("data-grade"))).toEqual(["a", "b", "c", "d"]);
	});

	it("names each letter in gradeLabel", () => {
		expect(gradeLabel).toEqual({ a: "A", b: "B", c: "C", d: "D" });
	});
});

describe("SignOff", () => {
	it("closes on the script line, the photo, the name, the role, and the address", () => {
		render(<SignOff signOff="Reliably Yours," person={person} />);
		expect(screen.getByText("Reliably Yours,")).toHaveClass("op-sign");
		expect(screen.getByRole("img", { name: "A person" })).toHaveAttribute(
			"src",
			"/images/profile.jpg",
		);
		expect(screen.getByText("A Person")).toBeInTheDocument();
		expect(screen.getByText(/Founder/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /a@example\.com/ })).toHaveAttribute(
			"href",
			"mailto:a@example.com",
		);
	});
});

describe("Shot", () => {
	it("opens the full picture in a new tab when it has one, and says so", () => {
		render(
			<Shot
				shot={{
					src: "/images/crop.png",
					alt: "The menu page",
					href: "/images/full.png",
					caption: "The menu, as a phone sees it",
				}}
			/>,
		);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/images/full.png");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("title", "Open the full picture");
		expect(screen.getByRole("img", { name: "The menu page" })).toHaveAttribute(
			"src",
			"/images/crop.png",
		);
		expect(screen.getByText("The menu, as a phone sees it").tagName).toBe("FIGCAPTION");
	});

	it("renders the crop alone when there is no full picture", () => {
		const { container } = render(
			<Shot shot={{ src: "/images/crop.png", alt: "The menu page", caption: "The menu" }} />,
		);
		expect(screen.queryByRole("link")).toBeNull();
		expect(container.querySelector(".op-shot-frame img")).toHaveAttribute(
			"src",
			"/images/crop.png",
		);
	});

	/** Give the rendered image the size a browser would have read off its file. */
	function sized(img: HTMLImageElement, width: number, height: number) {
		Object.defineProperty(img, "naturalWidth", { configurable: true, value: width });
		Object.defineProperty(img, "naturalHeight", { configurable: true, value: height });
		Object.defineProperty(img, "complete", { configurable: true, value: true });
	}

	it("marks a crop taller than it is wide as portrait once it loads, and a wide one not", () => {
		const { container } = render(
			<>
				<Shot shot={{ src: "/images/phone.png", alt: "A phone screen", caption: "Phone" }} />
				<Shot shot={{ src: "/images/laptop.png", alt: "A laptop screen", caption: "Laptop" }} />
			</>,
		);
		const [phone, laptop] = [...container.querySelectorAll(".op-shot")];
		expect(phone).not.toHaveAttribute("data-portrait");

		const phoneImage = screen.getByRole("img", { name: "A phone screen" }) as HTMLImageElement;
		const laptopImage = screen.getByRole("img", { name: "A laptop screen" }) as HTMLImageElement;
		sized(phoneImage, 390, 844);
		sized(laptopImage, 1280, 800);
		fireEvent.load(phoneImage);
		fireEvent.load(laptopImage);

		expect(phone).toHaveAttribute("data-portrait");
		expect(laptop).not.toHaveAttribute("data-portrait");
	});

	it("marks a portrait crop that finished loading before the page hydrated", () => {
		const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
		const width = vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(390);
		const height = vi
			.spyOn(HTMLImageElement.prototype, "naturalHeight", "get")
			.mockReturnValue(844);
		try {
			const { container } = render(
				<Shot shot={{ src: "/images/phone.png", alt: "A phone screen", caption: "Phone" }} />,
			);
			expect(container.querySelector(".op-shot")).toHaveAttribute("data-portrait");
		} finally {
			complete.mockRestore();
			width.mockRestore();
			height.mockRestore();
		}
	});

	it("leaves the mark off an image with no size yet", () => {
		const { container } = render(
			<Shot shot={{ src: "/images/phone.png", alt: "A phone screen", caption: "Phone" }} />,
		);
		fireEvent.load(screen.getByRole("img", { name: "A phone screen" }));
		expect(container.querySelector(".op-shot")).not.toHaveAttribute("data-portrait");
	});
});

describe("Paragraph and its runs", () => {
	const runs: ArtifactParagraph = [
		"Read ",
		{ text: "the site", href: "https://example.com" },
		", ",
		{ text: "the section", href: "#section" },
		", or ",
		{ text: "write", href: "mailto:a@example.com" },
		".",
	];

	it("renders a plain string as one paragraph", () => {
		const { container } = render(<Paragraph paragraph="Plain words." className="lede" />);
		const p = container.querySelector("p");
		expect(p).toHaveTextContent("Plain words.");
		expect(p).toHaveClass("lede");
	});

	it("opens a link off the page in a new tab, and an anchor or a mail link in place", () => {
		render(<Paragraph paragraph={runs} />);
		expect(screen.getByRole("link", { name: "the site" })).toHaveAttribute("target", "_blank");
		expect(screen.getByRole("link", { name: "the section" })).not.toHaveAttribute("target");
		expect(screen.getByRole("link", { name: "write" })).not.toHaveAttribute("target");
	});

	it("sets the runs alone in a container that is not a paragraph", () => {
		const { container } = render(
			<ul>
				<li>
					<Runs paragraph={runs} />
				</li>
			</ul>,
		);
		expect(container.querySelector("p")).toBeNull();
		expect(container.querySelector("li")).toHaveTextContent(
			"Read the site, the section, or write.",
		);
	});

	it("renders one anchor on its own the same way", () => {
		render(<ArtifactAnchor href="tel:+15555550100">Call</ArtifactAnchor>);
		expect(screen.getByRole("link", { name: "Call" })).not.toHaveAttribute("target");
	});

	it("counts a paragraph as empty only when every run is blank text", () => {
		expect(isEmpty("")).toBe(true);
		expect(isEmpty("   ")).toBe(true);
		expect(isEmpty(["", "  "])).toBe(true);
		expect(isEmpty(["", { text: "", href: "#a" }])).toBe(false);
		expect(isEmpty("Words")).toBe(false);
	});
});
