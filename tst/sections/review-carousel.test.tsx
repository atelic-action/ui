import { fireEvent, render, screen } from "@testing-library/react";
import { ReviewCarousel } from "../../src/sections/ReviewCarousel";

const items = [
	{ quote: "Best hour of my month, every month.", by: "Sam O." },
	{ quote: "My back is better than it has been in a decade.", by: "Priya S." },
	{ quote: "Left eight weeks later pacing my old running route.", by: "Jordan M." },
];

function slideOf(quote: string): HTMLElement {
	const node = screen.getByText(`“${quote}”`).closest("figure");
	if (!node) throw new Error(`no slide for ${quote}`);
	return node as HTMLElement;
}

describe("ReviewCarousel", () => {
	it("ships every quote in the static HTML (inactive slides hide in CSS)", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		for (const item of items) {
			expect(screen.getByText(`“${item.quote}”`)).toBeInTheDocument();
		}
	});

	it("steps the quote's type size down as the quote gets longer", () => {
		const long = "x".repeat(300);
		const veryLong = "y".repeat(500);
		render(
			<ReviewCarousel
				score="5.0"
				items={[items[0], { quote: long, by: "Medium M." }, { quote: veryLong, by: "Long L." }]}
			/>,
		);
		expect(screen.getByText(`“${items[0].quote}”`).className).toBe("rc-quote");
		expect(screen.getByText(`“${long}”`)).toHaveClass("is-medium");
		expect(screen.getByText(`“${veryLong}”`)).toHaveClass("is-compact");
	});

	it("marks exactly one slide active at a time", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		expect(slideOf(items[0].quote)).toHaveClass("is-active");
		expect(slideOf(items[1].quote)).not.toHaveClass("is-active");
		expect(slideOf(items[1].quote)).toHaveAttribute("aria-hidden", "true");
	});

	it("steps forward and wraps with the arrows", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		const next = screen.getByLabelText("Next review");
		fireEvent.click(next);
		expect(slideOf(items[1].quote)).toHaveClass("is-active");
		fireEvent.click(next);
		fireEvent.click(next);
		expect(slideOf(items[0].quote)).toHaveClass("is-active");
	});

	it("steps backward from the first slide to the last", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		fireEvent.click(screen.getByLabelText("Previous review"));
		expect(slideOf(items[2].quote)).toHaveClass("is-active");
	});

	it("jumps to a review from its dot and marks it current", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		const dot = screen.getByLabelText("Go to review 3");
		fireEvent.click(dot);
		expect(slideOf(items[2].quote)).toHaveClass("is-active");
		expect(dot).toHaveAttribute("aria-current", "true");
	});

	it("steps with the left and right arrow keys", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		const region = screen.getByRole("region", { name: "Customer reviews" });
		fireEvent.keyDown(region, { key: "ArrowRight" });
		expect(slideOf(items[1].quote)).toHaveClass("is-active");
		fireEvent.keyDown(region, { key: "ArrowLeft" });
		expect(slideOf(items[0].quote)).toHaveClass("is-active");
	});

	it("renders no stars at all when neither the aggregate nor an item has a rating", () => {
		render(<ReviewCarousel score="5.0" items={items} />);
		expect(screen.queryAllByRole("img")).toHaveLength(0);
	});

	it("renders the aggregate star row and per-review stars only where given", () => {
		render(
			<ReviewCarousel
				score="4.9"
				rating={5}
				caption="from 128 verified Google reviews"
				items={[{ ...items[0], rating: 4 }, items[1], items[2]]}
			/>,
		);
		const stars = screen.getAllByRole("img");
		expect(stars).toHaveLength(2);
		expect(stars[0]).toHaveAccessibleName("5 out of 5 stars");
		expect(stars[1]).toHaveAccessibleName("4 out of 5 stars");
	});

	it("leaves the caption a plain span when no profile URL is given", () => {
		render(<ReviewCarousel score="5.0" caption="from 100+ Google reviews" items={items} />);
		const caption = screen.getByText("from 100+ Google reviews");
		expect(caption.tagName).toBe("SPAN");
		expect(caption).toHaveClass("rc-caption");
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("links the caption out to the review profile in a new tab when given one", () => {
		render(
			<ReviewCarousel
				score="5.0"
				caption="from 100+ Google reviews"
				profileURL="https://maps.google.com/?cid=529966634563468011"
				items={items}
			/>,
		);
		const link = screen.getByRole("link", {
			name: "from 100+ Google reviews, opens the review profile in a new tab",
		});
		expect(link).toHaveAttribute("href", "https://maps.google.com/?cid=529966634563468011");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener");
		expect(link).toHaveClass("rc-caption");
	});

	it("has nothing to link without a caption", () => {
		render(<ReviewCarousel score="5.0" profileURL="https://example.com/reviews" items={items} />);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("omits the stat row unless stats are given", () => {
		const { rerender } = render(<ReviewCarousel score="5.0" items={items} />);
		expect(screen.queryByText("Google reviews")).not.toBeInTheDocument();
		rerender(
			<ReviewCarousel
				score="5.0"
				items={items}
				stats={[{ value: "128", label: "Google reviews" }]}
			/>,
		);
		expect(screen.getByText("Google reviews")).toBeInTheDocument();
	});
});
