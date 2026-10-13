import { render, screen } from "@testing-library/react";
import { PressQuotes, sortPress } from "../../src/sections/PressQuotes";

const items = [
	{
		quote: '"Best studio in town"',
		source: "Mile High Mag",
		year: 2025,
		href: "https://example.com/a",
	},
	{ quote: "Readers' Choice", source: "Front Range Weekly", year: 2024 },
];

describe("PressQuotes", () => {
	it("links rows that carry an href and opens them in a new tab", () => {
		render(<PressQuotes items={items} />);
		const link = screen.getByRole("link", { name: /best studio in town/i });
		expect(link).toHaveAttribute("href", "https://example.com/a");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("renders rows without an href as plain text", () => {
		render(<PressQuotes items={items} />);
		expect(screen.queryByRole("link", { name: /readers' choice/i })).toBeNull();
		expect(screen.getByText(/front range weekly/i)).toBeInTheDocument();
	});

	it("sorts newest first by default and oldest first on request", () => {
		const shuffled = [
			{ quote: "b", source: "B", year: 2018 },
			{ quote: "c", source: "C", year: 2024 },
			{ quote: "a", source: "A", year: 2020 },
		];
		expect(sortPress(shuffled, "newest").map((i) => i.year)).toEqual([2024, 2020, 2018]);
		expect(sortPress(shuffled, "oldest").map((i) => i.year)).toEqual([2018, 2020, 2024]);
		expect(sortPress(shuffled, "newest")).not.toBe(shuffled);
	});

	it("renders in sorted order", () => {
		render(<PressQuotes items={[...items].reverse()} />);
		const rows = screen.getAllByText(/·/).map((el) => el.textContent);
		expect(rows[0]).toContain("2025");
		expect(rows[1]).toContain("2024");
	});
});
