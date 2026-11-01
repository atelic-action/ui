import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BasePathProvider } from "../../src/routing/BasePathProvider";
import { type ComparisonRow, ComparisonTable } from "../../src/sections/ComparisonTable";

const rows: ComparisonRow[] = [
	{
		id: "technical-seo",
		stage: "Technical SEO",
		stageHref: "/glossary/technical-seo",
		before: { grade: "C", points: ["Thin"] },
		after: { grade: "B", points: ["Better"] },
	},
	{
		id: "plain",
		stage: "Plain",
		before: { grade: "A", points: ["Fine"] },
		after: { grade: "A", points: ["Fine"] },
	},
];

describe("ComparisonTable: a linked row label", () => {
	it("links the label when the row gives an href, and leaves the others as text", () => {
		render(<ComparisonTable rows={rows} />);
		expect(screen.getByRole("link", { name: "Technical SEO" })).toHaveAttribute(
			"href",
			"/glossary/technical-seo",
		);
		expect(screen.queryByRole("link", { name: "Plain" })).toBeNull();
	});

	it("puts the base path on the link", () => {
		render(
			<BasePathProvider base="/proto">
				<ComparisonTable rows={rows} />
			</BasePathProvider>,
		);
		expect(screen.getByRole("link", { name: "Technical SEO" })).toHaveAttribute(
			"href",
			"/proto/glossary/technical-seo",
		);
	});
});
