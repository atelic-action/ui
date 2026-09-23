import { render, screen } from "@testing-library/react";
import { NotFound } from "../../src/components";

const base = {
	title: "This page wandered off.",
	closing: { title: "Let's get you where you were headed." },
	primaryCTA: { label: "Book a Free Consult", href: "https://example.test/book", external: true },
};

describe("NotFound", () => {
	it("leads with the 404 kicker and the headline", () => {
		render(<NotFound {...base} />);
		expect(screen.getByText("404")).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This page wandered off.");
	});

	it("lists the popular pages under their own named navigation", () => {
		render(
			<NotFound
				{...base}
				links={[
					{ label: "About", href: "/about" },
					{ label: "Services", href: "/services" },
				]}
			/>,
		);
		const nav = screen.getByRole("navigation", { name: "Popular Pages" });
		expect(nav.querySelectorAll("a")).toHaveLength(2);
		expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
	});

	it("drops the popular pages row when there are none", () => {
		render(<NotFound {...base} />);
		expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
	});

	it("closes on the primary action, then home", () => {
		render(<NotFound {...base} />);
		const primary = screen.getByRole("link", { name: /Book a Free Consult/ });
		expect(primary).toHaveAttribute("target", "_blank");
		expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
	});
});
