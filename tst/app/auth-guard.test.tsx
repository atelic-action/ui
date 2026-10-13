import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockAuth = { isAuthenticated: false };
let pathname = "/";

vi.mock("../../src/app/stores/authStore", () => ({
	useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));

vi.mock("@tanstack/react-router", () => ({
	Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
	useLocation: ({ select }: { select: (location: { pathname: string }) => string }) =>
		select({ pathname }),
}));

import "./fixtures";
import { AuthGuard } from "../../src/app/AuthGuard";

function renderAt(path: string) {
	pathname = path;
	return render(
		<AuthGuard>
			<div data-testid="page">page</div>
		</AuthGuard>,
	);
}

describe("AuthGuard", () => {
	it("sends a signed out visitor home from a private page", () => {
		renderAt("/notes");
		expect(screen.getByTestId("navigate")).toHaveTextContent("/");
		expect(screen.queryByTestId("page")).toBeNull();
	});

	it("renders a public page for a signed out visitor", () => {
		renderAt("/u/forni/activity/390");
		expect(screen.getByTestId("page")).toBeInTheDocument();
	});

	it("renders the exact public routes for a signed out visitor", () => {
		renderAt("/oauth/callback");
		expect(screen.getByTestId("page")).toBeInTheDocument();
	});
});
