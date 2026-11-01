import { render, screen } from "@testing-library/react";
import { PrimaryButton, SecondaryButton } from "../../src/primitives";

/*
 * The two call to action buttons are fixed shapes: a page never picks their
 * variant or size, so the props that would let it are not on them.
 */
describe("PrimaryButton and SecondaryButton", () => {
	it("renders the primary call to action as the large primary button with the arrow", () => {
		render(<PrimaryButton href="/contact">Reach out</PrimaryButton>);
		// The arrow is hidden from the accessible name, the way Button hides it.
		const link = screen.getByRole("link", { name: "Reach out" });
		expect(link).toHaveClass("btn", "btn-primary", "btn-lg");
		expect(link.querySelector(".arrow")).not.toBeNull();
	});

	it("renders the secondary as the large ghost button with no arrow", () => {
		render(<SecondaryButton href="/work">See the work</SecondaryButton>);
		const link = screen.getByRole("link", { name: "See the work" });
		expect(link).toHaveClass("btn", "btn-ghost", "btn-lg");
		expect(link.querySelector(".arrow")).toBeNull();
	});

	it("passes the rest of a button's props through", () => {
		render(
			<PrimaryButton href="https://example.com" newTab ariaLabel="Example">
				Go
			</PrimaryButton>,
		);
		const link = screen.getByRole("link", { name: "Example" });
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener");
	});
});
