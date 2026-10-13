import { type AppConfig, setAppConfig } from "../../src/app/config";
import type { NavItem } from "../../src/app/layout/nav";

/**
 * The app every shell test runs as. Importing this file records the config,
 * which is what the transport and the public route check read; it touches no
 * store, so a test that mocks the auth store can import it too.
 */
export const testConfig: AppConfig = {
	name: "Test",
	mark: "test",
	storagePrefix: "test",
	publicRoutes: ["/", "/oauth/callback"],
	publicPages: ["/u/*"],
	apiBaseUrl: "https://api.example.test",
};

setAppConfig(testConfig);

/** A fixture nav, so the frame is tested on its own and not on any app's sections. */
export const testNav: NavItem[] = [
	{ label: "Home", href: "/", icon: () => null },
	{
		label: "Alpha",
		href: "/alpha",
		icon: () => null,
		children: [
			{ label: "One", href: "/alpha/one", icon: () => null, blurb: "First." },
			{ label: "Two", href: "/alpha/two", icon: () => null, blurb: "Second." },
		],
	},
	{ label: "Beta", href: "/beta", icon: () => null },
];
