import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "../../src/app/context/SidebarContext";
import { AppPage } from "../../src/app/layout";

function renderPage(ui: React.ReactNode) {
	return render(<SidebarProvider>{ui}</SidebarProvider>);
}

describe("AppPage rail collapse", () => {
	it("shows no rail toggle when the page has no rail", () => {
		renderPage(<AppPage title="Train">content</AppPage>);
		expect(screen.queryByRole("button", { name: /collapse rail|expand rail/i })).toBeNull();
	});

	it("renders the desktop rail expanded with a Collapse toggle when a rail is passed", () => {
		const { container } = renderPage(
			<AppPage title="Pantry" rail={<div>rail summary</div>}>
				content
			</AppPage>,
		);
		expect(screen.getByRole("button", { name: /collapse rail/i })).toBeInTheDocument();
		const aside = container.querySelector(".ap-rail");
		expect(aside).not.toBeNull();
		expect(aside?.classList.contains("is-collapsed")).toBe(false);
	});

	it("collapses the desktop rail and persists the choice when the toggle is clicked", async () => {
		const user = userEvent.setup();
		const { container } = renderPage(
			<AppPage title="Pantry" rail={<div>rail summary</div>}>
				content
			</AppPage>,
		);

		await user.click(screen.getByRole("button", { name: /collapse rail/i }));

		const aside = container.querySelector(".ap-rail");
		expect(aside?.classList.contains("is-collapsed")).toBe(true);
		expect(localStorage.getItem("railCollapsed")).toBe("true");
		// The control flips to the inverse affordance once collapsed.
		expect(screen.getByRole("button", { name: /expand rail/i })).toBeInTheDocument();
	});
});
