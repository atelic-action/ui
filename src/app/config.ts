/**
 * What makes an app that app, as the shell reads it: the name on the mark and
 * in aria labels, the prefix on every browser storage key, the routes a signed
 * out visitor may see, and the api the transport talks to. The app owns the
 * values and hands them to `AppProvider`, which records them here, since the
 * transport and the stores run outside React and read them by function.
 */
export interface AppConfig {
	/** Display name, used in aria labels. */
	name: string;
	/** The lowercase wordmark the shell renders beside the brand dot. */
	mark: string;
	/** Prefix for every localStorage key and cookie the shell writes. */
	storagePrefix: string;
	/** Exact routes a signed out visitor can load bare; everything else redirects home. */
	publicRoutes: readonly string[];
	/**
	 * Pages that stand on their own signed out, as prefix patterns ending in
	 * "/*". They render inside the public chrome (brand bar, sign in link) for
	 * a visitor and inside the app shell for the signed in owner. The
	 * convention is a person's public records under /u/<username>/...
	 */
	publicPages?: readonly string[];
	/**
	 * The api's base URL, resolved by the app (typically
	 * `import.meta.env.VITE_API_BASE_URL ?? "https://api.example.com"`), so the
	 * package never reads the app's environment itself.
	 */
	apiBaseURL: string;
	/** Where the Profile link in the rail menu and the mobile menu goes. Defaults to "/profile". */
	profileHref?: string;
	/**
	 * Where `CountryDropdown` and `getCountryFlag` load a country's round
	 * flag from: a base address ending in a slash, each flag at
	 * `<base><code>.svg` with the lowercase two letter code (`/flags/pt.svg`),
	 * the file names `react-circle-flags` ships. The app serves the files
	 * itself, from its own origin or a host it already trusts. Unset, the
	 * shell asks no host for a flag and draws the country's code in a plain
	 * circle instead, so no visitor's browser calls a third party by default.
	 */
	flagsBaseURL?: string;
}

let current: AppConfig | null = null;

/** Record the app's config. `configureApp` (or `AppProvider`) calls this; the stores rehydrate there. */
export function setAppConfig(config: AppConfig): void {
	current = config;
}

/** The app's config, or null before `configureApp` has run. */
export function peekAppConfig(): AppConfig | null {
	return current;
}

/** The app's config. Throws when the app has not configured the shell yet. */
export function getAppConfig(): AppConfig {
	if (!current) {
		throw new Error(
			"The app shell is not configured: render AppProvider (or call configureApp) before using the transport.",
		);
	}
	return current;
}
