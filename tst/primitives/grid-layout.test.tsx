// @vitest-environment node
import { renderToString } from "react-dom/server";
import { GridLayout, HighlightCard } from "../../src/primitives";
import { BasePathProvider } from "../../src/routing";

const cells = (count: number) =>
	Array.from({ length: count }, (_, at) => `Town ${at + 1}`).map((name) => (
		<span key={name}>{name}</span>
	));

/** A prerender has no layout to measure: which items wait is decided from the counts alone. */
describe("GridLayout on the server", () => {
	it("marks the items past the visible rows at each width, and draws the button", () => {
		const html = renderToString(
			<GridLayout columns={3} narrowColumns={2} visibleRows={5}>
				{cells(20)}
			</GridLayout>,
		);
		expect(html.match(/<li/g)).toHaveLength(20);
		expect(html.match(/data-past-wide="true"/g)).toHaveLength(5);
		expect(html.match(/data-past-narrow="true"/g)).toHaveLength(10);
		expect(html).toContain("Town 20");
		expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*>Show all<\/button>/);
		expect(html).not.toContain("data-only");
	});

	it("offers the button only where items wait", () => {
		const html = renderToString(
			<GridLayout columns={3} narrowColumns={2} visibleRows={5}>
				{cells(12)}
			</GridLayout>,
		);
		expect(html).toContain('data-only="narrow"');
		expect(html).not.toContain('data-past-wide="true"');
	});

	it("draws no button when every item fits, nor without visible rows", () => {
		expect(
			renderToString(
				<GridLayout columns={3} visibleRows={5}>
					{cells(4)}
				</GridLayout>,
			),
		).not.toContain("<button");
		expect(renderToString(<GridLayout minItemWidth={320}>{cells(40)}</GridLayout>)).not.toContain(
			"<button",
		);
	});

	it("sets the counts and the least width on the grid, and plain cells when asked", () => {
		const byWidth = renderToString(
			<GridLayout minItemWidth={280} stretch as="div">
				{cells(2)}
			</GridLayout>,
		);
		expect(byWidth).toContain("--_grid-min:280px");
		expect(byWidth).toContain("by-width stretch");
		expect(byWidth).not.toContain("<li");
		const byColumns = renderToString(<GridLayout columns={4}>{cells(2)}</GridLayout>);
		expect(byColumns).toContain("--_grid-cols:4;--_grid-cols-narrow:2");
	});
});

describe("HighlightCard on the server", () => {
	it("is one link under the base path when it has one, and a plain card without", () => {
		const linked = renderToString(
			<BasePathProvider base="/proto">
				<HighlightCard title="Fairhaven" href="/orders/cake" />
			</BasePathProvider>,
		);
		expect(linked).toMatch(/^<a class="highlight-card" href="\/proto\/orders\/cake"/);
		const plain = renderToString(<HighlightCard title="Fairhaven" />);
		expect(plain).toMatch(/^<div class="highlight-card"/);
		expect(plain).not.toContain("<a");
	});

	it("draws the square only with a picture or a brief, the brief silent", () => {
		expect(renderToString(<HighlightCard title="Post" />)).not.toContain("highlight-card-media");
		const brief = renderToString(<HighlightCard title="Job" placeholder="Photo: the job" />);
		expect(brief).toContain('class="highlight-card has-picture"');
		expect(brief).toMatch(/highlight-card-media" aria-hidden="true"/);
		expect(brief).toContain("Photo: the job");
	});
});
