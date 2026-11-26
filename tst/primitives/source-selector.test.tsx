import { readFileSync } from "node:fs";
import { join } from "node:path";
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

	it("wears the field's look, stated once in fields.css, which a lone primitives sheet imports", () => {
		const styles = join(import.meta.dirname, "..", "..", "src", "styles");
		const sheet = (name: string) => readFileSync(join(styles, name), "utf8");
		const select = /\.atelic-ui \.field select \{[^}]*appearance: none;/;
		expect(sheet("fields.css")).toMatch(select);
		for (const name of ["primitives.css", "sections.css", "components.css"]) {
			expect(sheet(name)).toMatch(/@import "\.\/fields\.css";/);
			expect(sheet(name)).not.toMatch(select);
			expect(sheet(name)).not.toMatch(/\.source-selector[^{]*\{/);
		}
		render(<SourceSelector source={SOURCE} value="" onChange={() => {}} />);
		expect(screen.getByLabelText("How did you hear about us?").closest(".field")).not.toBeNull();
	});

	it("prerenders", () => {
		expect(
			renderToString(<SourceSelector source={SOURCE} value="" onChange={() => {}} />),
		).toContain("How did you hear about us?");
	});

	describe("an answer that asks for a detail (9.5.0)", () => {
		const ASKING = {
			label: "How did you hear about us?",
			options: [
				"Google",
				{ label: "Referral", detail: { label: "Who referred you?", placeholder: "A name" } },
			],
		};

		it("draws the detail field only while that answer is chosen, on a form that takes it", () => {
			const onDetailChange = vi.fn();
			const { rerender } = render(
				<SourceSelector
					source={ASKING}
					value="Google"
					onChange={() => {}}
					onDetailChange={onDetailChange}
				/>,
			);
			expect(screen.queryByLabelText(/Who referred you/)).toBeNull();
			rerender(
				<SourceSelector
					source={ASKING}
					value="Referral"
					onChange={() => {}}
					onDetailChange={onDetailChange}
					hint="(optional)"
				/>,
			);
			const detail = screen.getByLabelText(/Who referred you/);
			expect(detail).toHaveAttribute("name", "sourceDetail");
			expect(detail).toHaveAttribute("placeholder", "A name");
			fireEvent.change(detail, { target: { value: "A neighbor" } });
			expect(onDetailChange).toHaveBeenLastCalledWith("A neighbor");
		});

		it("lists an option written out by its label, and draws no detail without onDetailChange", () => {
			render(<SourceSelector source={ASKING} value="Referral" onChange={() => {}} />);
			expect(screen.getByRole("option", { name: "Referral" })).toHaveValue("Referral");
			expect(screen.queryByLabelText(/Who referred you/)).toBeNull();
		});

		it("renders the same select as before for a list of words", () => {
			const before = renderToString(
				<SourceSelector source={SOURCE} value="" onChange={() => {}} id="s" />,
			);
			expect(before).not.toContain("sourceDetail");
			expect(before.match(/<div/g)).toHaveLength(1);
		});
	});
});
