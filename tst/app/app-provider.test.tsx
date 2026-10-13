import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "../../src/app/AppProvider";
import { type AppConfig, getAppConfig } from "../../src/app/config";
import { configureApp } from "../../src/app/configure";
import { AppConfigProvider, useAppConfig, useNav } from "../../src/app/context/AppContext";
import { useUser } from "../../src/app/context/UserContext";
import { useAuthStore } from "../../src/app/stores/authStore";
import { useUnitsStore } from "../../src/app/stores/unitsStore";
import { testConfig, testNav } from "./fixtures";

const signedOut = {
	token: null,
	refreshToken: null,
	expiresAt: null,
	user: null,
	isAuthenticated: false,
};

afterEach(() => {
	configureApp(testConfig);
	useAuthStore.setState(signedOut);
	localStorage.clear();
});

function Probe() {
	const config = useAppConfig();
	const nav = useNav();
	const { user } = useUser();
	return (
		<p>
			{config.mark} {nav.map((item) => item.label).join(",")} {user?.firstName ?? "nobody"}
		</p>
	);
}

describe("AppProvider", () => {
	it("hands its config and nav to the shell, signed out", () => {
		render(
			<AppProvider config={testConfig} nav={testNav} toaster={false}>
				<Probe />
			</AppProvider>,
		);
		expect(screen.getByText("test Home,Alpha,Beta nobody")).toBeInTheDocument();
		expect(getAppConfig()).toBe(testConfig);
	});

	it("renders sonner's toaster unless told not to", () => {
		const { container, rerender } = render(
			<AppProvider config={testConfig} nav={testNav}>
				<p>page</p>
			</AppProvider>,
		);
		expect(container.querySelector("section[aria-label]")).not.toBeNull();
		rerender(
			<AppProvider config={testConfig} nav={testNav} toaster={false}>
				<p>page</p>
			</AppProvider>,
		);
		expect(container.querySelector("section[aria-label]")).toBeNull();
	});

	it("records a new config object and hydrates under its prefix before children read", () => {
		// AppConfigProvider alone: under AppProvider a stored session with no
		// refresh token would be signed out by the user query, as it should be.
		const other: AppConfig = { ...testConfig, mark: "other", storagePrefix: "other" };
		localStorage.setItem(
			"other-auth",
			JSON.stringify({
				state: { ...signedOut, token: "stored", isAuthenticated: true },
				version: 0,
			}),
		);
		function Token() {
			return <p>{useAuthStore((state) => state.token) ?? "none"}</p>;
		}
		render(
			<AppConfigProvider config={other} nav={testNav}>
				<Token />
			</AppConfigProvider>,
		);
		expect(screen.getByText("stored")).toBeInTheDocument();
		expect(getAppConfig().mark).toBe("other");
	});
});

describe("useNav", () => {
	it("refuses to run outside a provider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		function Bare() {
			useNav();
			return null;
		}
		expect(() => render(<Bare />)).toThrow("useNav must be used within an AppProvider");
		vi.restoreAllMocks();
	});
});

describe("configureApp", () => {
	it("persists the stores under the app's prefix", () => {
		configureApp(testConfig);
		useAuthStore.getState().setTokens("access", "refresh", 3600);
		useUnitsStore.getState().setSystem("volume", "imperial");
		expect(JSON.parse(localStorage.getItem("test-auth") ?? "{}").state.token).toBe("access");
		expect(JSON.parse(localStorage.getItem("test-units") ?? "{}").state.systems.volume).toBe(
			"imperial",
		);
	});

	it("hydrates the session stored under a prefix when the app switches to it", () => {
		localStorage.setItem(
			"bakery-auth",
			JSON.stringify({ state: { ...signedOut, token: "kept", isAuthenticated: true }, version: 0 }),
		);
		configureApp({ ...testConfig, storagePrefix: "bakery" });
		expect(useAuthStore.getState().token).toBe("kept");
		expect(useAuthStore.getState().isAuthenticated).toBe(true);
	});
});

describe("before the app configures the shell", () => {
	it("reads and writes no storage, and the transport refuses to guess an api", async () => {
		vi.resetModules();
		const config = await import("../../src/app/config");
		const { useAuthStore: freshStore } = await import("../../src/app/stores/authStore");
		expect(config.peekAppConfig()).toBeNull();
		expect(() => config.getAppConfig()).toThrow("The app shell is not configured");

		const before = localStorage.length;
		freshStore.getState().setTokens("early", "early", 60);
		expect(localStorage.length).toBe(before);
		vi.resetModules();
	});
});
