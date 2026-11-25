import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { SourceSelector } from "../../src/primitives/SourceSelector";

const SOURCE = { label: "How did you hear about us?", options: ["Google", "A friend"] };

describe("SourceSelector", () => {
	it("hands each answer chosen, and an empty one for the first row", () => {
		const onChange = vi.fn();
		render(<SourceSelector source={SOURCE} value="" onChange={onChange} />);
		const select = screen.getByLabelText("How did you hear about us?");
		fireEvent.change(select, { target: { value: "A friend" } });
		expect(onChange).toHaveBeenLastCalledWith("A friend");
		fireEvent.change(select, { target: { value: "" } });
		expect(onChange).toHaveBeenLastCalledWith("");
	});

	it("submits under source by default, or the name it is given", () => {
		const { rerender } = render(
			<SourceSelector source={SOURCE} value="Google" onChange={() => {}} />,
		);
		expect(screen.getByLabelText("How did you hear about us?")).toHaveAttribute("name", "source");
		rerender(<SourceSelector source={SOURCE} value="Google" onChange={() => {}} name="heard" />);
		expect(screen.getByLabelText("How did you hear about us?")).toHaveAttribute("name", "heard");
	});

	it("takes the site's empty row and marks a required select", () => {
		render(
			<SourceSelector
				source={{ ...SOURCE, required: true, placeholder: "Pick one" }}
				value=""
				onChange={() => {}}
			/>,
		);
		const select = screen.getByLabelText("How did you hear about us?");
		expect(select).toBeRequired();
		expect(screen.getByRole("option", { name: "Pick one" })).toHaveValue("");
	});

	it("is marked invalid and described by its error only while it has one", () => {
		const { rerender } = render(
			<SourceSelector source={SOURCE} value="" onChange={() => {}} error="Please choose one." />,
		);
		const select = screen.getByLabelText("How did you hear about us?");
		expect(select).toHaveAttribute("aria-invalid", "true");
		expect(select).toHaveAccessibleDescription("Please choose one.");
		rerender(<SourceSelector source={SOURCE} value="" onChange={() => {}} />);
		expect(select).not.toHaveAttribute("aria-invalid");
		expect(screen.queryByText("Please choose one.")).toBeNull();
	});

	it("prerenders", () => {
		expect(
			renderToString(<SourceSelector source={SOURCE} value="" onChange={() => {}} />),
		).toContain("How did you hear about us?");
	});
});
