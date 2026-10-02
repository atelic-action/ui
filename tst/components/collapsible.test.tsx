import { render, screen } from "@testing-library/react";
import { Collapsible } from "../../src/components";

describe("Collapsible", () => {
	it("shows its label and summary, and keeps the detail closed until opened", () => {
		const { container } = render(
			<Collapsible label="Your Main Pages" summary="All eight load.">
				<p>The detail.</p>
			</Collapsible>,
		);
		expect(screen.getByText("Your Main Pages")).toBeInTheDocument();
		expect(screen.getByText("All eight load.")).toBeInTheDocument();
		expect(container.querySelector("details")).not.toHaveAttribute("open");
	});

	it("opens on first render when asked", () => {
		const { container } = render(
			<Collapsible label="Open" defaultOpen>
				<p>The detail.</p>
			</Collapsible>,
		);
		expect(container.querySelector("details")).toHaveAttribute("open");
	});
});
