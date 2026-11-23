import { render, screen } from "@testing-library/react";
import { MultiSelect } from "../../src/components/MultiSelect";

/*
 * The closed control only. Opening a Radix popover under jsdom ties the
 * test runner up for seconds after each open (a bare Popover does it too),
 * and no test in tst/ opens one; ticking, the listener, the keyboard, and
 * the form's reset run in a real browser in
 * stories/components/MultiSelect.stories.tsx.
 */

const OPTIONS = ["Bread", "Cakes", { value: "wholesale", label: "Wholesale orders" }];

function inForm(props: Partial<Parameters<typeof MultiSelect>[0]> = {}) {
	render(
		<form data-testid="form">
			<MultiSelect label="What for?" name="for" options={OPTIONS} {...props} />
		</form>,
	);
	return screen.getByTestId("form") as HTMLFormElement;
}

const button = () => screen.getByRole("button", { name: /What for\?/ });

describe("MultiSelect", () => {
	it("names itself by its label and what is chosen", () => {
		inForm({ defaultValue: ["Cakes"] });
		expect(button()).toHaveAccessibleName("What for? Cakes");
	});

	it("lists up to `listed` labels in the options' order, then counts", () => {
		inForm({ defaultValue: ["wholesale", "Bread"] });
		expect(button()).toHaveTextContent("Bread, Wholesale orders");
	});

	it("counts with the site's words past `listed`", () => {
		inForm({ defaultValue: ["Bread", "Cakes", "wholesale"], countLabel: (n) => `${n} things` });
		expect(button()).toHaveTextContent("3 things");
	});

	it("shows the placeholder when nothing is chosen", () => {
		inForm({ placeholder: "Pick any" });
		expect(button()).toHaveTextContent("Pick any");
	});

	it("submits each default value under its name while closed", () => {
		const form = inForm({ defaultValue: ["wholesale", "Bread"] });
		expect(new FormData(form).getAll("for")).toEqual(["Bread", "wholesale"]);
	});

	it("submits nothing without a name", () => {
		render(
			<form data-testid="form">
				<MultiSelect label="What for?" options={OPTIONS} defaultValue={["Bread"]} />
			</form>,
		);
		expect([...new FormData(screen.getByTestId("form") as HTMLFormElement).keys()]).toEqual([]);
	});
});
