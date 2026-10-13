import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs } from "../../src/app/layout";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		className,
		"aria-label": ariaLabel,
	}: {
		children: React.ReactNode;
		to: string;
		className?: string;
		"aria-label"?: string;
	}) => (
		<a href={to} className={className} aria-label={ariaLabel}>
			{children}
		</a>
	),
}));

describe("Breadcrumbs", () => {
	it("links section crumbs and renders the current page as plain, unlinked text", () => {
		render(<Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Two" }]} />);

		expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");

		const current = screen.getByText("Two");
		expect(current).toHaveAttribute("aria-current", "page");
		expect(current.closest("a")).toBeNull();
	});

	it("collapses to one back link to the nearest linked ancestor on small screens", () => {
		render(
			<Breadcrumbs
				items={[
					{ label: "Home", to: "/" },
					{ label: "Profile", to: "/profile" },
					{ label: "A Detail Page" },
				]}
			/>,
		);

		const back = screen.getByRole("link", { name: "Back to Profile" });
		expect(back).toHaveAttribute("href", "/profile");
		expect(back).toHaveClass("crumbs-back");

		// The full trail is still there for desktop; the stylesheet hides it below lg.
		expect(screen.getByRole("list")).toHaveClass("crumbs-trail");
		expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
	});

	it("gives a root page's single crumb no back link, only the desktop trail", () => {
		render(<Breadcrumbs items={[{ label: "Beta" }]} />);

		expect(screen.queryByRole("link")).toBeNull();
		expect(screen.getByText("Beta")).toHaveAttribute("aria-current", "page");
	});
});
