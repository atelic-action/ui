import { render, screen } from "@testing-library/react";
import { Rank } from "../../src/components";

describe("Rank", () => {
	it("sets the badge in its tone, named for a screen reader, beside the figure", () => {
		const { container } = render(<Rank figure="4" tone="warn" meaning="Top ten" />);
		expect(container.querySelector(".rank")).toHaveAttribute("data-tone", "warn");
		expect(screen.getByRole("img", { name: "Top ten" })).toHaveClass("chart-swatch");
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("links the figure where it has somewhere to go, in a new tab when asked", () => {
		render(<Rank figure="2" tone="good" meaning="Top three" href="https://example.com/" newTab />);
		const link = screen.getByRole("link", { name: "2" });
		expect(link).toHaveAttribute("href", "https://example.com/");
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("draws a dash for none, in its own tone", () => {
		const { container } = render(<Rank figure="–" tone="bad" meaning="Not ranked" />);
		expect(container.querySelector(".rank")).toHaveAttribute("data-tone", "bad");
		expect(screen.getByText("–")).toBeInTheDocument();
	});
});
