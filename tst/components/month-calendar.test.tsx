import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MonthCalendar } from "../../src/components/MonthCalendar";
import { isWorkingDay } from "../../src/forms/calendar";

const RULES = { timeZone: "America/Denver", open: "08:00", close: "17:00" };

function Picker({ onChange = () => {} }: { onChange?: (day: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<MonthCalendar
			value={value}
			first="2026-11-30"
			last="2027-01-29"
			isAvailable={(day) => isWorkingDay(day, RULES)}
			onChange={(day) => {
				setValue(day);
				onChange(day);
			}}
		/>
	);
}

describe("MonthCalendar", () => {
	it("is one tab stop, on the first day that can be picked", () => {
		render(<Picker />);
		const tabbable = screen.getAllByRole("button").filter((button) => button.tabIndex === 0);
		expect(tabbable.map((button) => button.getAttribute("aria-label"))).toEqual([
			"Earlier month",
			"Later month",
			"Monday, November 30",
		]);
	});

	it("moves between the days that can be picked with the arrows, across a month", () => {
		const onChange = vi.fn();
		render(<Picker onChange={onChange} />);
		const monday = screen.getByRole("button", { name: "Monday, November 30" });
		monday.focus();
		fireEvent.keyDown(monday, { key: "ArrowRight" });
		expect(screen.getByText("December 2026")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Tuesday, December 1" })).toHaveFocus();
		// Down a week from Friday the 18th lands on Christmas, so it goes on to the next day open.
		const eighteenth = screen.getByRole("button", { name: "Friday, December 18" });
		eighteenth.focus();
		fireEvent.keyDown(eighteenth, { key: "ArrowDown" });
		expect(screen.getByRole("button", { name: "Monday, December 28" })).toHaveFocus();
		fireEvent.keyDown(screen.getByRole("button", { name: "Monday, December 28" }), {
			key: "ArrowLeft",
		});
		expect(screen.getByRole("button", { name: "Thursday, December 24" })).toHaveFocus();
		fireEvent.click(screen.getByRole("button", { name: "Thursday, December 24" }));
		expect(onChange).toHaveBeenLastCalledWith("2026-12-24");
		expect(screen.getByRole("button", { name: "Thursday, December 24" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("offers no month before the first day's or after the last day's", () => {
		render(<Picker />);
		expect(screen.getByRole("button", { name: "Earlier month" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Later month" }));
		fireEvent.click(screen.getByRole("button", { name: "Later month" }));
		expect(screen.getByText("January 2027")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Later month" })).toBeDisabled();
		expect(screen.queryByRole("button", { name: /February/ })).toBeNull();
	});
});
