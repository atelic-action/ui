import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Marquee, ProofFact } from "../../src/sections";

describe("Marquee", () => {
	it("draws the row and one copy before measuring, the copy hidden and inert", () => {
		const html = renderToString(
			<Marquee ariaLabel="Proof">
				<ProofFact value="Since 2014" label="On Alder Street" />
				<a href="/menu">See the menu</a>
			</Marquee>,
		);
		expect(html.match(/class="marquee-group"/g)).toHaveLength(2);
		expect(html).toMatch(/class="marquee-group" aria-hidden="true" inert=""/);
		// Not measured, so no length is set and the sheet's default holds.
		expect(html).not.toContain("--_marquee-duration");
	});

	it("reads each item once, in one list, and names the band", () => {
		render(
			<Marquee ariaLabel="Proof">
				<span>One</span>
				<span>Two</span>
			</Marquee>,
		);
		expect(screen.getByRole("region", { name: "Proof" })).toBeInTheDocument();
		expect(screen.getAllByRole("list")).toHaveLength(1);
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("draws dividers and pauses on hover unless told not to", () => {
		const { container, rerender } = render(
			<Marquee>
				<span>One</span>
			</Marquee>,
		);
		expect(container.querySelector(".marquee-band")).toHaveClass("has-dividers");
		expect(container.querySelector(".marquee")).toHaveClass("pause-on-hover");
		rerender(
			<Marquee dividers={false} pauseOnHover={false}>
				<span>One</span>
			</Marquee>,
		);
		expect(container.querySelector(".marquee-band")).not.toHaveClass("has-dividers");
		expect(container.querySelector(".marquee")).not.toHaveClass("pause-on-hover");
	});

	it("stops and restarts from its toggle, named Pause by default", () => {
		const { container } = render(
			<Marquee>
				<span>One</span>
			</Marquee>,
		);
		const toggle = screen.getByRole("button", { name: "Pause" });
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-pressed", "true");
		expect(container.querySelector(".marquee")).toHaveAttribute("data-paused");
	});
});
