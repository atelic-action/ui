import { fireEvent, render, screen } from "@testing-library/react";
import { describeStarRating, StarRating } from "../../src/components";

describe("describeStarRating", () => {
	it("says a rating the way a person would", () => {
		expect(describeStarRating(null)).toBe("Not rated");
		expect(describeStarRating(1)).toBe("1 star");
		expect(describeStarRating(4.5)).toBe("4.5 stars");
	});
});

describe("StarRating", () => {
	it("offers every half star from 0.5 to 5", () => {
		render(<StarRating value={null} onChange={() => {}} />);
		const labels = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
		expect(labels).toEqual([
			"0.5 stars",
			"1 star",
			"1.5 stars",
			"2 stars",
			"2.5 stars",
			"3 stars",
			"3.5 stars",
			"4 stars",
			"4.5 stars",
			"5 stars",
		]);
	});

	it("runs to as many stars as max says", () => {
		const onChange = vi.fn();
		render(<StarRating value={null} onChange={onChange} max={3} />);
		expect(screen.getAllByRole("button")).toHaveLength(6);
		fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
		expect(onChange).toHaveBeenLastCalledWith(3);
	});

	it("rates in half stars on a click", () => {
		const onChange = vi.fn();
		render(<StarRating value={null} onChange={onChange} />);
		fireEvent.click(screen.getByRole("button", { name: "4.5 stars" }));
		expect(onChange).toHaveBeenCalledWith(4.5);
	});

	it("clears the rating when the current one is picked again", () => {
		const onChange = vi.fn();
		render(<StarRating value={4.5} onChange={onChange} />);
		fireEvent.click(screen.getByRole("button", { name: "4.5 stars" }));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it("fills whole stars, then half of the next, then none", () => {
		const { container } = render(<StarRating value={3.5} />);
		const widths = [...container.querySelectorAll<HTMLElement>(".star-rating-fill")].map(
			(fill) => fill.style.width,
		);
		expect(widths).toEqual(["100%", "100%", "100%", "50%", "0%"]);
	});

	it("reads as one slider, with the rating as its value", () => {
		render(<StarRating value={3.5} onChange={() => {}} label="Your rating" />);
		const slider = screen.getByRole("slider", { name: "Your rating" });
		expect(slider).toHaveAttribute("aria-valuenow", "3.5");
		expect(slider).toHaveAttribute("aria-valuetext", "3.5 stars");
	});

	it("moves half a star on the arrows, and stops at the top", () => {
		const onChange = vi.fn();
		const { rerender } = render(<StarRating value={4.5} onChange={onChange} />);
		const slider = screen.getByRole("slider");

		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).toHaveBeenLastCalledWith(5);
		fireEvent.keyDown(slider, { key: "ArrowLeft" });
		expect(onChange).toHaveBeenLastCalledWith(4);

		onChange.mockClear();
		rerender(<StarRating value={5} onChange={onChange} />);
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("clears below half a star and on Home, and jumps to the top on End", () => {
		const onChange = vi.fn();
		render(<StarRating value={0.5} onChange={onChange} />);
		const slider = screen.getByRole("slider");

		fireEvent.keyDown(slider, { key: "ArrowLeft" });
		expect(onChange).toHaveBeenLastCalledWith(null);
		fireEvent.keyDown(slider, { key: "End" });
		expect(onChange).toHaveBeenLastCalledWith(5);
		fireEvent.keyDown(slider, { key: "Home" });
		expect(onChange).toHaveBeenLastCalledWith(null);
	});

	it("is a picture with no controls when read only", () => {
		render(<StarRating value={4} />);
		expect(screen.getByRole("img", { name: "Rating: 4 stars" })).toBeInTheDocument();
		expect(screen.queryByRole("slider")).not.toBeInTheDocument();
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	it("takes a fill color, an outline color, and a size, as custom properties on the row", () => {
		render(<StarRating value={2} fillColor="#d98c00" outlineColor="rebeccapurple" size={16} />);
		const row = screen.getByRole("img");
		expect(row.style.getPropertyValue("--star-fill")).toBe("#d98c00");
		expect(row.style.getPropertyValue("--star-outline")).toBe("rebeccapurple");
		expect(row.style.getPropertyValue("--star-size")).toBe("16px");
	});

	it("sets neither color when none is passed, so the stylesheet's fallbacks hold", () => {
		render(<StarRating value={2} />);
		const row = screen.getByRole("img");
		expect(row.style.getPropertyValue("--star-fill")).toBe("");
		expect(row.style.getPropertyValue("--star-outline")).toBe("");
	});
});
