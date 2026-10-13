import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppConfigProvider } from "../../src/app/context/AppContext";
import { MobileMenu } from "../../src/app/layout/MobileMenu";
import type { AppUser as User } from "../../src/app/types";
import { testConfig, testNav } from "./fixtures";

const wrapper = ({ children }: { children: ReactNode }) => (
	<AppConfigProvider config={testConfig} nav={testNav}>
		{children}
	</AppConfigProvider>
);

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

const user = {
	firstName: "Ada",
	lastName: "Lovelace",
	avatar: null,
} as unknown as User;

describe("MobileMenu", () => {
	it("opens from the hamburger onto the whole map, with the account at the foot", () => {
		const onLogout = vi.fn();
		render(<MobileMenu pathname="/alpha/two" user={user} onLogout={onLogout} />, { wrapper });

		const trigger = screen.getByRole("button", { name: "Open menu" });
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(trigger);

		const menu = screen.getByRole("navigation", { name: "Menu" });
		// Sections and the Alpha sub pages, in nav order.
		const links = Array.from(menu.querySelectorAll("a")).map((a) => a.getAttribute("href"));
		expect(links).toEqual(["/", "/alpha", "/alpha/one", "/alpha/two", "/beta"]);

		// The page we are on is the lit row; its section is not, so the eye goes
		// to one place.
		expect(screen.getByRole("link", { name: "Two" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Alpha" })).not.toHaveAttribute("aria-current");

		// Account: the user's name links to the profile; log out fires the handler.
		expect(screen.getByText("Ada Lovelace").closest("a")).toHaveAttribute("href", "/profile");
		fireEvent.click(screen.getByRole("button", { name: "Log out" }));
		expect(onLogout).toHaveBeenCalledTimes(1);
	});

	it("closes itself when the route changes", () => {
		const { rerender } = render(<MobileMenu pathname="/alpha" user={user} onLogout={vi.fn()} />, {
			wrapper,
		});
		fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
		expect(screen.getByRole("navigation", { name: "Menu" })).toBeInTheDocument();

		rerender(<MobileMenu pathname="/alpha/one" user={user} onLogout={vi.fn()} />);
		expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
	});
});
