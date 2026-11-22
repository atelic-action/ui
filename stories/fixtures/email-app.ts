import { spyOn } from "storybook/test";
import type { AppUser } from "../../src/app";
import { configureApp, useAuthStore } from "../../src/app";
import type { RecordStackItem } from "../../src/email";
import { storyAppConfig } from "./app";

/*
 * The email and app group's own data: the bakery ops app's signed in owner
 * and the fake api it talks to, and the bakery's internal reports for the
 * email pieces. Everything here is made up; hosts are on example.test.
 */

/** The made up owner of the bakery's ops app. */
export const storyUser: AppUser = {
	id: "user-kestrel-1",
	email: "wren.okafor@example.com",
	firstName: "Wren",
	lastName: "Okafor",
	username: "wren",
	avatar: null,
};

/** A user with the longest realistic name the shell shows. */
export const longNameUser: AppUser = {
	...storyUser,
	id: "user-kestrel-2",
	firstName: "Maximiliana",
	lastName: "Featherstonehaugh-Abernathy",
	username: "maximiliana",
};

const realFetch = globalThis.fetch.bind(globalThis);

const A_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * The fake api: every request to the fixture app's api host is answered here
 * and recorded on the returned spy, so no story ever reaches the network.
 * `/v1/users/me` answers with the signed in user; anything else is a 404.
 * A request to any other host (Storybook's own modules) passes through.
 */
export function mockAPI(user: AppUser = storyUser) {
	// The real fetch, taken once: a story whose own beforeEach follows the meta's
	// mocks twice, and the second mock must not call the first as its original.
	const original = realFetch;
	const spy = spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
		const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
		if (!url.startsWith(storyAppConfig.apiBaseURL)) return original(input, init);
		const path = new URL(url).pathname;
		if (path === "/v1/users/me") {
			return new Response(JSON.stringify({ data: { entity: user }, meta: {} }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
	});
	return spy;
}

/** Forget what an earlier story left in the app's storage: the rails' saved collapse. */
function forgetSaved() {
	for (const name of ["sidebarCollapsed", "railCollapsed"]) {
		localStorage.removeItem(`${storyAppConfig.storagePrefix}-${name}`);
	}
}

/**
 * A story's `beforeEach` that signs the owner in the way the OAuth callback
 * does, with the api mocked, and signs them out again after the story.
 */
export function signIn(user: AppUser = storyUser) {
	return () => {
		const spy = mockAPI(user);
		forgetSaved();
		configureApp(storyAppConfig);
		useAuthStore.getState().login("story-token", "story-refresh", A_YEAR_IN_SECONDS, user);
		return () => {
			useAuthStore.getState().logout();
			spy.mockRestore();
		};
	};
}

/** A story's `beforeEach` that makes sure nobody is signed in, with the api mocked. */
export function signOut() {
	const spy = mockAPI();
	forgetSaved();
	configureApp(storyAppConfig);
	useAuthStore.getState().logout();
	return () => spy.mockRestore();
}

/* The email reports: the bakery's weekly operations email and its pieces. */

/** The week's wholesale accounts, as the report stacks them. */
export const wholesaleRecords: RecordStackItem[] = [
	{
		title: "Larkspur Coffee Bar",
		url: "https://example.test/accounts/larkspur",
		meta: ["Standing order", "Mon to Sat", "06:15 drop"],
		badge: "Active",
		badges: [{ text: "Call Thu", tone: "ink" }],
		timeline: { days: 30, touches: [27, 13, 2], opens: [12, 2] },
		aside: { text: "opened", strong: "2d", tone: "up" },
		note: "Asked to add a second tray of morning buns on Saturdays.",
	},
	{
		title: "Fairhaven Grocery Cooperative",
		meta: ["Trial", "Wed and Fri"],
		badge: "Trial",
		badges: [{ text: "New", tone: "accent" }],
		timeline: { days: 30, touches: [9], opens: [] },
		aside: { text: "quiet", strong: "9d", tone: "warm" },
		callout: { eyebrow: "Next", text: "Send the spring price sheet before the trial ends." },
	},
	{
		title: "The Alder Street Reading Room and Tea House at the Old Mill",
		meta: ["Paused", "", "since 2026-10-02"],
		badge: "Paused",
		aside: { text: "last order", strong: "41d", tone: "accent" },
	},
];

/** A log tail with one long unbroken token, the way a runner's log ends. */
export const longLogTail = [
	"2026-11-16 05:02:11 fetching the wholesale ledger",
	"2026-11-16 05:02:14 error: ENOENT /srv/bakehouse/runners/weekly_ops/cache/ledger_2026W47_wholesale_accounts_export.json",
	"2026-11-16 05:02:14 exit 1",
].join("\n");
