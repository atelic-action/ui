import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "./fixtures";
import { UserProvider, useUser } from "../../src/app/context/UserContext";
import { session } from "../../src/app/lib/session";
import { DEFAULT_SYSTEMS, useUnitsStore } from "../../src/app/stores/unitsStore";
import type { AppUser as User } from "../../src/app/types";

// Mock the auth store
const mockAuthState = {
	token: null as string | null,
	user: null as User | null,
	isAuthenticated: false,
};

vi.mock("../../src/app/stores/authStore", () => ({
	useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

// Mock the API
vi.mock("../../src/app/lib/session", () => ({
	session: {
		me: vi.fn(),
		updateUnits: vi.fn(),
	},
}));

function TestConsumer() {
	const { user, isLoading } = useUser();
	return (
		<div>
			<span data-testid="loading">{isLoading ? "loading" : "done"}</span>
			<span data-testid="user-name">{user?.firstName ?? "no-user"}</span>
			<span data-testid="user-email">{user?.email ?? "no-email"}</span>
		</div>
	);
}

function createClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
}

function createWrapper(queryClient = createClient()) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<UserProvider>{children}</UserProvider>
			</QueryClientProvider>
		);
	};
}

describe("UserContext", () => {
	beforeEach(() => {
		// Reset auth state before each test
		mockAuthState.token = null;
		mockAuthState.user = null;
		mockAuthState.isAuthenticated = false;
		useUnitsStore.setState({ systems: DEFAULT_SYSTEMS });
		vi.mocked(session.me).mockReset();
		vi.mocked(session.updateUnits).mockReset();
	});

	it("provides null user when not authenticated", () => {
		render(<TestConsumer />, { wrapper: createWrapper() });

		expect(screen.getByTestId("user-name")).toHaveTextContent("no-user");
		expect(screen.getByTestId("user-email")).toHaveTextContent("no-email");
	});

	it("provides auth store user when authenticated", async () => {
		mockAuthState.token = "test-token";
		mockAuthState.isAuthenticated = true;
		mockAuthState.user = {
			id: "1",
			email: "test@example.com",
			firstName: "Test",
			lastName: "User",
			avatar: null,
		} as unknown as User;

		render(<TestConsumer />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByTestId("user-name")).toHaveTextContent("Test");
			expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
		});
	});

	describe("units", () => {
		const apiUser = {
			id: "1",
			email: "test@example.com",
			firstName: "Test",
			lastName: "User",
			username: "test",
			avatar: null,
			units: { ...DEFAULT_SYSTEMS, volume: "imperial" },
		} as unknown as User;

		beforeEach(() => {
			mockAuthState.token = "test-token";
			mockAuthState.isAuthenticated = true;
			vi.mocked(session.me).mockResolvedValue(apiUser);
		});

		it("hydrates the units store from the account, without writing back", async () => {
			render(<TestConsumer />, { wrapper: createWrapper() });

			await waitFor(() => expect(useUnitsStore.getState().systems.volume).toBe("imperial"));
			expect(session.updateUnits).not.toHaveBeenCalled();
		});

		it("writes a change in the store back to the account", async () => {
			vi.mocked(session.updateUnits).mockImplementation(async (units) => ({ ...apiUser, units }));
			render(<TestConsumer />, { wrapper: createWrapper() });
			await waitFor(() => expect(useUnitsStore.getState().systems.volume).toBe("imperial"));

			useUnitsStore.getState().setSystem("bodyMass", "metric");

			await waitFor(() =>
				expect(session.updateUnits).toHaveBeenCalledWith({
					...DEFAULT_SYSTEMS,
					volume: "imperial",
					bodyMass: "metric",
				}),
			);
			expect(session.updateUnits).toHaveBeenCalledTimes(1);
		});

		it("takes a choice made on another device when the account is refetched", async () => {
			const queryClient = createClient();
			render(<TestConsumer />, { wrapper: createWrapper(queryClient) });
			await waitFor(() => expect(useUnitsStore.getState().systems.volume).toBe("imperial"));

			vi.mocked(session.me).mockResolvedValue({
				...apiUser,
				units: { ...DEFAULT_SYSTEMS, volume: "imperial", temperature: "metric" },
			} as unknown as User);
			await queryClient.invalidateQueries({ queryKey: ["user", "me"] });

			await waitFor(() => expect(useUnitsStore.getState().systems.temperature).toBe("metric"));
			expect(useUnitsStore.getState().systems.volume).toBe("imperial");
			expect(session.updateUnits).not.toHaveBeenCalled();
		});

		it("saves quick changes one at a time and keeps the newest", async () => {
			const settle: Array<(user: User) => void> = [];
			vi.mocked(session.updateUnits).mockImplementation(
				(units) =>
					new Promise<User>((resolve) => {
						settle.push((user) => resolve({ ...user, units }));
					}),
			);
			render(<TestConsumer />, { wrapper: createWrapper() });
			await waitFor(() => expect(useUnitsStore.getState().systems.volume).toBe("imperial"));

			useUnitsStore.getState().setSystem("bodyMass", "metric");
			useUnitsStore.getState().setSystem("temperature", "metric");

			// The second save waits on the first.
			await waitFor(() => expect(session.updateUnits).toHaveBeenCalledTimes(1));
			settle[0]?.(apiUser);
			await waitFor(() => expect(session.updateUnits).toHaveBeenCalledTimes(2));
			expect(session.updateUnits).toHaveBeenLastCalledWith({
				...DEFAULT_SYSTEMS,
				volume: "imperial",
				bodyMass: "metric",
				temperature: "metric",
			});
			settle[1]?.(apiUser);

			// The store holds both choices; the first response never wound it back.
			await waitFor(() => expect(useUnitsStore.getState().systems.temperature).toBe("metric"));
			expect(useUnitsStore.getState().systems.bodyMass).toBe("metric");
			expect(session.updateUnits).toHaveBeenCalledTimes(2);
		});

		it("drops a pending save when the account changes underneath it", async () => {
			const settle: Array<(user: User) => void> = [];
			vi.mocked(session.updateUnits).mockImplementation(
				(units) =>
					new Promise<User>((resolve) => {
						settle.push((user) => resolve({ ...user, units }));
					}),
			);
			const queryClient = createClient();
			render(<TestConsumer />, { wrapper: createWrapper(queryClient) });
			await waitFor(() => expect(useUnitsStore.getState().systems.volume).toBe("imperial"));

			useUnitsStore.getState().setSystem("bodyMass", "metric");
			useUnitsStore.getState().setSystem("temperature", "metric");
			await waitFor(() => expect(session.updateUnits).toHaveBeenCalledTimes(1));

			// Another account signs in while the first save is still in flight.
			const other = {
				...apiUser,
				id: "2",
				firstName: "Other",
				units: { ...DEFAULT_SYSTEMS },
			} as unknown as User;
			vi.mocked(session.me).mockResolvedValue(other);
			await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			await waitFor(() => expect(screen.getByTestId("user-name")).toHaveTextContent("Other"));
			await waitFor(() => expect(useUnitsStore.getState().systems.bodyMass).toBe("imperial"));

			settle[0]?.(apiUser);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// The queued second save never ran, and the first account's response
			// did not land in the second account's cache.
			expect(session.updateUnits).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId("user-name")).toHaveTextContent("Other");
			expect(useUnitsStore.getState().systems.bodyMass).toBe("imperial");
		});
	});

	it("throws error when useUser is used outside provider", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<TestConsumer />)).toThrow("useUser must be used within a UserProvider");

		consoleSpy.mockRestore();
	});
});
