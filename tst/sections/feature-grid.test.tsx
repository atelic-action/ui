import { render } from "@testing-library/react";
import { FeatureGrid } from "../../src/sections/FeatureGrid";

/*
 * The card is either a link or a card containing one. The type keeps the two
 * apart, and this locks the rendering either way: a linked card is exactly one
 * anchor, and a card whose description carries an inline link is not itself
 * wrapped in one, so no page can ship nested anchors a browser would unnest.
 */
describe("FeatureGrid", () => {
	it("renders a linked card as exactly one anchor", () => {
		const { container } = render(
			<FeatureGrid
				title="Services"
				items={[
					{
						num: "01",
						title: "Dry Needling",
						description: "Targeted relief for stubborn knots.",
						href: "/services#dry-needling",
						linkLabel: "Learn more",
					},
				]}
			/>,
		);

		const card = container.querySelector(".feature-card");
		expect(card?.tagName).toBe("A");
		expect(card?.getAttribute("href")).toBe("/services#dry-needling");
		expect(container.querySelectorAll("a")).toHaveLength(1);
	});

	it("leaves a card whose description holds a link unwrapped", () => {
		const { container } = render(
			<FeatureGrid
				title="How it works"
				items={[
					{
						num: "01",
						title: "Wire",
						description: (
							<>
								Your site, a <a href="/glossary#crm">CRM</a> you own, and the tracking behind them.
							</>
						),
					},
				]}
			/>,
		);

		const card = container.querySelector(".feature-card");
		expect(card?.tagName).toBe("DIV");
		const links = container.querySelectorAll("a");
		expect(links).toHaveLength(1);
		expect(links[0].getAttribute("href")).toBe("/glossary#crm");
	});
});
