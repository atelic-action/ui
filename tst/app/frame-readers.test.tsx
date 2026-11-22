import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppConfigProvider } from "../../src/app/context/AppContext";
import { AppPageToolbar } from "../../src/app/layout/AppPage";
import { DesktopRail } from "../../src/app/layout/DesktopRail";
import type { AppUser as User } from "../../src/app/types";
import { testConfig, testNav } from "./fixtures";

/*
 * What a reader and a keyboard get from the frame: a name on every rail link
 * and on the user menu that holds what it shows, a toolbar action named with
 * its visible time, and focus that stays in the search when it is cleared.
 */

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		className,
		"aria-label": ariaLabel,
		"aria-current": ariaCurrent,
	}: {
		children: ReactNode;
		to: string;
		className?: string;
		"aria-label"?: string;
		"aria-current"?: "page";
	}) => (
		<a href={to} className={className} aria-label={ariaLabel} aria-current={ariaCurrent}>
			{children}
		</a>
	),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
	<AppConfigProvider config={testConfig} nav={testNav}>
		{children}
	</AppConfigProvider>
);

const user = { firstName: "Wren", lastName: "Okafor", avatar: null } as unknown as User;

function rail(collapsed: boolean) {
	return render(
		<DesktopRail
			pathname="/beta"
			collapsed={collapsed}
			onToggle={vi.fn()}
			user={user}
			onLogout={vi.fn()}
		/>,
		{ wrapper },
	);
}

describe("DesktopRail", () => {
	it("keeps a name on every section link when collapsed to icons", () => {
		rail(true);
		const nav = screen.getByRole("navigation", { name: "Primary navigation" });
		const links = Array.from(nav.querySelectorAll("a"));
		expect(links.map((link) => link.getAttribute("aria-label"))).toEqual(["Home", "Alpha", "Beta"]);
		expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute("aria-current", "page");
	});

	it("names an expanded link by its visible label alone", () => {
		rail(false);
		const link = screen.getByRole("link", { name: "Beta" });
		expect(link).not.toHaveAttribute("aria-label");
		expect(link).toHaveTextContent("Beta");
	});
});

describe("UserMenu's trigger", () => {
	it("is named by the user's name it shows, expanded", () => {
		rail(false);
		const trigger = screen.getByRole("button", { name: "Wren Okafor" });
		expect(trigger).not.toHaveAttribute("aria-label");
		expect(trigger).toHaveAttribute("aria-haspopup", "menu");
	});

	it("holds the initials it shows and the name, collapsed", () => {
		rail(true);
		const trigger = screen.getByRole("button", { name: /Wren Okafor/ });
		expect(trigger).not.toHaveAttribute("aria-label");
		expect(trigger).toHaveTextContent("WO");
		expect(trigger.textContent).toContain("Wren Okafor");
	});
});

describe("AppPageToolbar", () => {
	it("names an action by its visible words, its time included", () => {
		render(<AppPageToolbar actions={[{ label: "Sync", ago: "06:02", onClick: vi.fn() }]} />);
		const action = screen.getByRole("button", { name: "Sync 06:02" });
		expect(action).not.toHaveAttribute("aria-label");
	});

	it("keeps the visible time in the name of an icon action given its own", () => {
		render(
			<AppPageToolbar
				actions={[
					{
						icon: <svg aria-hidden="true" />,
						ariaLabel: "Sync now",
						ago: "06:02",
						onClick: vi.fn(),
					},
				]}
			/>,
		);
		expect(screen.getByRole("button", { name: "Sync now 06:02" })).toBeInTheDocument();
	});

	it("returns focus to the search box when it is cleared by keyboard", async () => {
		const press = userEvent.setup();
		function Harness() {
			const [value, setValue] = useState("rye");
			return <AppPageToolbar search={{ value, onChange: setValue }} />;
		}
		render(<Harness />);
		screen.getByRole("button", { name: "Clear search" }).focus();
		await press.keyboard("{Enter}");
		const box = screen.getByRole("searchbox", { name: "Search" });
		expect(box).toHaveValue("");
		expect(box).toHaveFocus();
		expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
	});
});
