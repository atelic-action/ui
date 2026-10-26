import { render, screen } from "@testing-library/react";
import { Button, Chip, Eyebrow, Lead, ProseBlocks, SectionHeading } from "../../src/primitives";

describe("Button, the arrow", () => {
	it("keeps the arrow out of the name a screen reader hears", () => {
		render(
			<Button href="/services" arrow>
				See services
			</Button>,
		);
		expect(screen.getByRole("link", { name: "See services" })).toBeInTheDocument();
	});
});

describe("Chip", () => {
	it("is a span by default and an anchor when given an href", () => {
		const { rerender } = render(<Chip>Denver</Chip>);
		expect(screen.getByText("Denver").tagName).toBe("SPAN");
		rerender(<Chip href="#areas">Denver</Chip>);
		expect(screen.getByRole("link", { name: "Denver" })).toHaveAttribute("href", "#areas");
	});

	it("takes a dot and the dark surface form", () => {
		const { container } = render(
			<Chip dot onDark>
				Licensed
			</Chip>,
		);
		expect(container.querySelector(".chip")).toHaveClass("on-dark");
		expect(container.querySelector(".chip .dot")).not.toBeNull();
	});
});

describe("Eyebrow and Lead", () => {
	it("composes the eyebrow's surface and alignment classes", () => {
		render(
			<Eyebrow onDark center>
				Services
			</Eyebrow>,
		);
		expect(screen.getByText("Services")).toHaveClass("eyebrow", "on-dark", "center");
	});

	it("renders the lead as a paragraph with any extra class", () => {
		render(<Lead className="wide">A short introduction.</Lead>);
		const lead = screen.getByText("A short introduction.");
		expect(lead.tagName).toBe("P");
		expect(lead).toHaveClass("lead", "wide");
	});
});

describe("SectionHeading", () => {
	it("opens a section with an eyebrow, a heading at the level asked, and a lead", () => {
		render(<SectionHeading eyebrow="Pricing" title="One number" lead="Flat and posted." as="h3" />);
		expect(screen.getByText("Pricing")).toHaveClass("eyebrow");
		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("One number");
		expect(screen.getByText("Flat and posted.")).toHaveClass("lead", "section-head-lead");
	});

	it("defaults to an h2 and leaves the eyebrow and lead out when not given", () => {
		const { container } = render(<SectionHeading title="Just a title" />);
		expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
		expect(container.querySelector(".eyebrow")).toBeNull();
		expect(container.querySelector(".lead")).toBeNull();
	});
});

describe("ProseBlocks", () => {
	it("draws a heading at the component's level unless the block names its own", () => {
		render(
			<ProseBlocks
				blocks={[
					{ type: "h", text: "Hip stabilization" },
					{ type: "h", level: 3, text: "Clamshells" },
					{ type: "p", text: "Keep the pelvis still." },
				]}
			/>,
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Hip stabilization" }),
		).toBeInTheDocument();
		const sub = screen.getByRole("heading", { level: 3, name: "Clamshells" });
		expect(sub).toHaveClass("pb-heading", "pb-h3");
	});

	it("shows a figure as a lazy image, or as a silent loop when the file is a clip", () => {
		const { container } = render(
			<ProseBlocks
				blocks={[
					{
						type: "figure",
						src: "/images/clamshell.webp",
						alt: "A side lying clamshell",
						caption: "The clamshell",
					},
					{ type: "figure", src: "/images/clamshell.mp4", alt: "A side lying clamshell, looping" },
				]}
			/>,
		);
		const img = screen.getByRole("img", { name: "A side lying clamshell" });
		expect(img).toHaveAttribute("loading", "lazy");
		expect(screen.getByText("The clamshell").tagName).toBe("FIGCAPTION");
		const video = container.querySelector("video");
		expect(video).toHaveAttribute("src", "/images/clamshell.mp4");
		expect(video).toHaveAttribute("aria-label", "A side lying clamshell, looping");
		expect(video?.muted).toBe(true);
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveAttribute("playsinline");
		expect(container.querySelectorAll("figcaption")).toHaveLength(1);
	});

	it("renders a placeholder for a figure with no file yet", () => {
		const { container } = render(
			<ProseBlocks blocks={[{ type: "figure", alt: "A clamshell", caption: "Soon" }]} />,
		);
		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector(".ph")).toHaveTextContent("A clamshell");
	});

	it("pauses a clip and shows controls for a reader who prefers reduced motion", () => {
		const original = window.matchMedia;
		window.matchMedia = ((q: string) => ({
			matches: q.includes("reduce"),
		})) as typeof window.matchMedia;
		const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
		try {
			const { container } = render(
				<ProseBlocks blocks={[{ type: "figure", src: "/images/a.mp4?v=2", alt: "A clip" }]} />,
			);
			expect(play).not.toHaveBeenCalled();
			expect(container.querySelector("video")).toHaveAttribute("controls");
		} finally {
			window.matchMedia = original;
			play.mockRestore();
		}
	});
});
