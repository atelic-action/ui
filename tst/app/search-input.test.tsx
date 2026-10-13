import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchInput } from "../../src/app/ui/search-input";

describe("SearchInput", () => {
	it("renders with placeholder", () => {
		render(<SearchInput value="" onValueChange={vi.fn()} placeholder="Search items..." />);

		expect(screen.getByPlaceholderText("Search items...")).toBeInTheDocument();
	});

	it("calls onValueChange on input", () => {
		const onValueChange = vi.fn();
		render(<SearchInput value="" onValueChange={onValueChange} />);

		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "hello" },
		});
		expect(onValueChange).toHaveBeenCalledWith("hello");
	});

	it("shows clear button when value is non-empty", () => {
		render(<SearchInput value="test" onValueChange={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
	});

	it("hides clear button when value is empty", () => {
		render(<SearchInput value="" onValueChange={vi.fn()} />);

		expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
	});

	it("clears value on clear button click", () => {
		const onValueChange = vi.fn();
		render(<SearchInput value="test" onValueChange={onValueChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(onValueChange).toHaveBeenCalledWith("");
	});

	it("clears value on Escape key", () => {
		const onValueChange = vi.fn();
		render(<SearchInput value="test" onValueChange={onValueChange} />);

		fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
		expect(onValueChange).toHaveBeenCalledWith("");
	});

	it("calls onClear callback when clearing", () => {
		const onClear = vi.fn();
		render(<SearchInput value="test" onValueChange={vi.fn()} onClear={onClear} />);

		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(onClear).toHaveBeenCalled();
	});

	it("does not clear on Escape when value is empty", () => {
		const onValueChange = vi.fn();
		render(<SearchInput value="" onValueChange={onValueChange} />);

		fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("clear button prevents default on mouseDown to preserve input focus", () => {
		render(<SearchInput value="test" onValueChange={vi.fn()} />);

		const clearButton = screen.getByRole("button", { name: "Clear search" });
		const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
		const prevented = !clearButton.dispatchEvent(mouseDownEvent);
		expect(prevented).toBe(true);
	});
});
