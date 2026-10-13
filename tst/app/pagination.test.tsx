import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../../src/app/ui/pagination";

describe("Pagination", () => {
	it("renders nothing for a single page", () => {
		const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("disables Prev on the first page and Next on the last", () => {
		const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

		rerender(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
	});

	it("calls onPageChange for a numbered page and for Next", () => {
		const onPageChange = vi.fn();
		render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Page 5" }));
		expect(onPageChange).toHaveBeenCalledWith(5);

		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(onPageChange).toHaveBeenCalledWith(3);
	});

	it("marks the current page with aria-current", () => {
		render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
	});

	it("windows large page counts, eliding the middle", () => {
		render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Page 20" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Page 6" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Page 10" })).not.toBeInTheDocument();
	});
});
