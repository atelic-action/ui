import { render, screen, within } from "@testing-library/react";
import {
	CalloutPanel,
	CTASection,
	Hero,
	LinkColumns,
	ProofStrip,
	ReviewCarousel,
} from "../../src/sections";

describe("LinkColumns", () => {
	it("sets a link's figure beside its label, and leaves a link without one bare", () => {
		render(
			<LinkColumns
				columns={[
					{
						heading: "North",
						href: "/areas/north",
						links: [
							{ label: "Northtown", href: "/areas/northtown", count: "1,204 jobs" },
							{ label: "Ridge", href: "/areas/ridge" },
						],
					},
				]}
			/>,
		);
		const northtown = screen.getByRole("link", { name: /Northtown/ });
		expect(northtown.querySelector(".lc-count")).toHaveTextContent("1,204 jobs");
		expect(screen.getByRole("link", { name: "Ridge" }).querySelector(".lc-count")).toBeNull();
		expect(screen.getByRole("heading", { name: "North" }).querySelector("a")).toHaveAttribute(
			"href",
			"/areas/north",
		);
	});
});

describe("CalloutPanel", () => {
	it("gives every item a title and a subtitle line, so the rows share both lines", () => {
		const { container } = render(
			<CalloutPanel
				items={[{ title: "Since 2009", subtitle: "Two offices" }, { title: "A longer title" }]}
			/>,
		);
		const items = container.querySelectorAll(".callout-panel li");
		expect(items).toHaveLength(2);
		// The subtitle cell renders even when empty, holding the subgrid's second row.
		expect(items[1]?.querySelector(".callout-panel-sub")).not.toBeNull();
		expect(container.querySelector(".callout-panel")).toHaveClass("on-primary");
	});
});

describe("ProofStrip", () => {
	it("lists each fact as its figure over its label, on the surface asked for", () => {
		const { container } = render(
			<ProofStrip
				ariaLabel="Why people choose us"
				surface="alt"
				items={[
					{ value: "4.9", label: "312 reviews" },
					{ value: "Since 2009", label: "Family owned" },
				]}
			/>,
		);
		const list = screen.getByRole("list", { name: "Why people choose us" });
		expect(within(list).getAllByRole("listitem")).toHaveLength(2);
		expect(container.querySelector(".proof-strip")).toHaveClass("surface-alt");
	});
});

describe("Hero split layout", () => {
	it("sets the copy on the primary field beside the photo, with no scroll cue", () => {
		const { container } = render(
			<Hero
				layout="split"
				title="A headline"
				image={{ src: "/hero.jpg", alt: "A finished job" }}
				primaryCTA={{ label: "Get a quote", href: "/quote" }}
				scrollTarget="#next"
			/>,
		);
		expect(container.querySelector(".hero")).toHaveClass("is-split");
		expect(container.querySelector(".hero-split-copy")).toHaveClass("on-primary");
		expect(container.querySelector(".hero-split-media img")).toHaveAttribute(
			"alt",
			"A finished job",
		);
		expect(container.querySelector(".hero-scroll")).toBeNull();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A headline");
	});

	it("keeps the overlay layout by default", () => {
		const { container } = render(<Hero title="A headline" />);
		expect(container.querySelector(".hero")).not.toHaveClass("is-split");
		expect(container.querySelector(".hero-media-fallback")).not.toBeNull();
	});
});

describe("Section surfaces", () => {
	it("takes the same surface prop on the review carousel as on the closer", () => {
		const { container } = render(
			<>
				<ReviewCarousel score="4.9" items={[{ quote: "Good work.", by: "A. N." }]} surface="alt" />
				<CTASection
					site={{ cta: { label: "Book", href: "/book" } }}
					title="Close"
					surface="default"
				/>
			</>,
		);
		expect(container.querySelector(".review-carousel")).toHaveClass("surface-alt");
		expect(container.querySelector(".final-cta")).not.toHaveClass("surface-alt");
	});
});
