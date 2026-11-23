import type { AddressParts, AddressProvider, AddressSuggestion } from "../primitives/AddressSearch";

/** The options a site passes `googlePlacesProvider`; only the key is required. */
export interface GooglePlacesOptions {
	/**
	 * A Maps JavaScript API key with the Places API (New) enabled, restricted
	 * to the site's own domains (Websites) and to those two APIs. It ships to
	 * the browser, as every Maps JavaScript API key does.
	 */
	apiKey: string;
	/** Limit suggestions to these countries, as CLDR two letter codes ("us"); up to 15. */
	regionCodes?: string[];
	/**
	 * Prefer addresses near a point, a soft bias rather than a limit: a center
	 * and a radius in meters (up to 50000).
	 */
	near?: { lat: number; lng: number; radius: number };
	/** The kinds of place offered, up to five. Defaults to addresses: `street_address`, `premise`, and `subpremise` (a unit). */
	types?: string[];
	/** The language of the suggestions (an IETF code, "en"). */
	language?: string;
	/** The region the suggestions are formatted for (a CLDR code, "us"). */
	region?: string;
}

/**
 * The slice of the Maps JavaScript API's `places` library the provider
 * calls: `AutocompleteSuggestion`, `AutocompleteSessionToken`, and the
 * `Place` a prediction turns into. Named here so a test can stand in for it.
 */
export interface PlacesLibrary {
	AutocompleteSessionToken: new () => unknown;
	AutocompleteSuggestion: {
		fetchAutocompleteSuggestions(request: Record<string, unknown>): Promise<{
			suggestions: { placePrediction?: PlacePrediction | null }[];
		}>;
	};
}

interface FormattableText {
	text: string;
}

interface PlacePrediction {
	placeId: string;
	text: FormattableText;
	mainText?: FormattableText | null;
	secondaryText?: FormattableText | null;
	toPlace(): {
		fetchFields(request: { fields: string[] }): Promise<unknown>;
		addressComponents?: AddressComponent[] | null;
	};
}

/** One part of an address as Google returns it. */
export interface AddressComponent {
	longText?: string | null;
	shortText?: string | null;
	types: string[];
}

// Addresses, buildings, and the units inside them (Table B; up to five allowed).
const ADDRESS_TYPES = ["street_address", "premise", "subpremise"];

function abortError(): Error {
	return new DOMException("The lookup was aborted.", "AbortError");
}

/** Settles with `task`, or rejects the moment `signal` aborts, whichever is first. */
function honoring<T>(signal: AbortSignal, task: () => Promise<T>): Promise<T> {
	if (signal.aborted) return Promise.reject(abortError());
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(abortError());
		signal.addEventListener("abort", onAbort, { once: true });
		task().then(
			(value) => {
				signal.removeEventListener("abort", onAbort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener("abort", onAbort);
				reject(error);
			},
		);
	});
}

/**
 * Google's address components as the four parts a form holds: the street
 * number and the route (with a unit after a #), the city (the locality, or
 * the postal town or sublocality where a country uses one), the state's
 * short code ("CO"), and the postal code. `fallbackStreet` stands in when
 * there is no route, such as a named building.
 */
export function addressFromComponents(
	components: AddressComponent[],
	fallbackStreet = "",
): AddressParts {
	const find = (type: string) => components.find((component) => component.types.includes(type));
	const long = (type: string) => find(type)?.longText ?? "";
	const short = (type: string) => find(type)?.shortText || find(type)?.longText || "";
	const line = [long("street_number"), long("route")].filter(Boolean).join(" ");
	const unit = long("subpremise");
	const street = line ? (unit ? `${line} #${unit}` : line) : fallbackStreet;
	const city =
		long("locality") ||
		long("postal_town") ||
		long("sublocality_level_1") ||
		long("sublocality") ||
		long("administrative_area_level_3");
	return { street, city, state: short("administrative_area_level_1"), zip: long("postal_code") };
}

/**
 * The provider over a loaded `places` library, separate from the loading so
 * a test can hand it a stand in. One session token covers every search from
 * the first keystroke to a pick; the pick's details end the session, and
 * the next search starts a new one.
 */
export function placesProvider(
	library: (retry: boolean) => Promise<PlacesLibrary>,
	options: Omit<GooglePlacesOptions, "apiKey">,
): AddressProvider {
	let token: unknown = null;
	// The predictions behind the latest suggestions, so a pick resolves through
	// its own prediction and stays in the session.
	let predictions = new Map<string, PlacePrediction>();

	return {
		// Each focus may retry a load that failed; a search never does.
		prepare() {
			library(true).catch(() => {});
		},
		async suggest(query, { signal }) {
			try {
				const places = await honoring(signal, () => library(false));
				token ??= new places.AutocompleteSessionToken();
				const request: Record<string, unknown> = {
					input: query,
					sessionToken: token,
					includedPrimaryTypes: options.types ?? ADDRESS_TYPES,
				};
				if (options.regionCodes?.length) request.includedRegionCodes = options.regionCodes;
				if (options.near) {
					const { lat, lng, radius } = options.near;
					request.locationBias = { center: { lat, lng }, radius };
				}
				if (options.language) request.language = options.language;
				if (options.region) request.region = options.region;
				const { suggestions } = await honoring(signal, () =>
					places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request),
				);
				const found = suggestions.flatMap((suggestion) =>
					suggestion.placePrediction ? [suggestion.placePrediction] : [],
				);
				predictions = new Map(found.map((prediction) => [prediction.placeId, prediction]));
				return found.map(
					(prediction): AddressSuggestion => ({
						id: prediction.placeId,
						text: prediction.mainText?.text ?? prediction.text.text,
						secondary: prediction.secondaryText?.text ?? undefined,
					}),
				);
			} catch {
				if (signal.aborted) throw abortError();
				// A failed lookup offers nothing; the plain fields still take the address.
				return [];
			}
		},
		async resolve(suggestion, { signal }) {
			const prediction = predictions.get(suggestion.id);
			if (!prediction) throw new Error("That suggestion is no longer offered.");
			const place = prediction.toPlace();
			// Only the address components: the cheapest field set that fills the form.
			const fetched = honoring(signal, () => place.fetchFields({ fields: ["addressComponents"] }));
			// The details call ends the session, answered or not; the next search starts a new one.
			token = null;
			predictions = new Map();
			await fetched;
			return addressFromComponents(place.addressComponents ?? [], suggestion.text);
		},
	};
}

declare global {
	interface Window {
		google?: {
			maps?: {
				importLibrary?: (name: string) => Promise<unknown>;
				places?: Partial<PlacesLibrary>;
			};
		};
	}
}

const MAPS_SCRIPT = "https://maps.googleapis.com/maps/api/js";
/** After a failed load, searches wait this long before trying again; a focus does not wait. */
export const RETRY_AFTER_MS = 30_000;
/** How long to wait for a Maps script, ours or one already on the page, to answer. */
export const SCRIPT_WAIT_MS = 15_000;

const loads = new Map<string, Promise<PlacesLibrary>>();
const failures = new Map<string, number>();
let callbacks = 0;

/**
 * The places library, when the page's Maps API can give it: by
 * `importLibrary`, or the older namespace once it holds the Autocomplete
 * Data classes. Null while it cannot yet, including a Maps API still
 * attaching its libraries.
 */
function placesReady(): Promise<PlacesLibrary> | null {
	const maps = window.google?.maps;
	if (!maps) return null;
	if (maps.importLibrary) return maps.importLibrary("places") as Promise<PlacesLibrary>;
	const places = maps.places;
	if (places?.AutocompleteSuggestion && places.AutocompleteSessionToken) {
		return Promise.resolve(places as PlacesLibrary);
	}
	return null;
}

/** The places library from a Maps API already on the page, a refusal when it has none, null with no Maps. */
function libraryOnPage(): Promise<PlacesLibrary> | null {
	if (!window.google?.maps) return null;
	return (
		placesReady() ??
		Promise.reject(new Error("The Maps JavaScript API on the page has no Places library."))
	);
}

/**
 * Waits for a Maps script already on the page (another's, or ours that was
 * slow) rather than adding a second, until its Places library is there:
 * a `google.maps` without it yet is still loading, not a failure.
 */
function waitForScript(script: HTMLScriptElement): Promise<PlacesLibrary> {
	return new Promise<PlacesLibrary>((resolve, reject) => {
		const started = Date.now();
		const check = () => {
			const ready = placesReady();
			if (ready) {
				ready.then(resolve, reject);
				return;
			}
			if (Date.now() - started > SCRIPT_WAIT_MS) {
				reject(
					new Error(
						window.google?.maps
							? "The Maps JavaScript API on the page has no Places library."
							: "The Maps JavaScript API on the page never finished loading.",
					),
				);
				return;
			}
			setTimeout(check, 50);
		};
		script.addEventListener(
			"error",
			() => reject(new Error("The Maps JavaScript API did not load.")),
			{
				once: true,
			},
		);
		check();
	});
}

/**
 * Adds Google's direct script tag with `loading=async`. A tag that fails is
 * taken back out. One that has not called back within `SCRIPT_WAIT_MS`
 * rejects the load, down the same failure and retry path, but stays on the
 * page with its callback left as a no op: it may still arrive, and a retry
 * then waits for it (`waitForScript`) rather than adding a second.
 */
function addScript(apiKey: string): Promise<PlacesLibrary> {
	return new Promise<PlacesLibrary>((resolve, reject) => {
		callbacks += 1;
		const callback = `__atelicPlacesReady${callbacks}`;
		const globals = window as unknown as Record<string, unknown>;
		const params = new URLSearchParams({
			key: apiKey,
			loading: "async",
			libraries: "places",
			v: "weekly",
			callback,
		});
		const script = document.createElement("script");
		const fail = (message: string) => {
			clearTimeout(timer);
			delete globals[callback];
			script.remove();
			reject(new Error(message));
		};
		const timer = setTimeout(() => {
			// Late, not lost: the tag stays and its callback answers nothing.
			globals[callback] = () => {};
			reject(new Error("The Maps JavaScript API did not answer."));
		}, SCRIPT_WAIT_MS);
		globals[callback] = () => {
			clearTimeout(timer);
			delete globals[callback];
			const ready = libraryOnPage();
			if (ready) ready.then(resolve, reject);
			else reject(new Error("The Maps JavaScript API loaded without google.maps."));
		};
		script.src = `${MAPS_SCRIPT}?${params}`;
		script.async = true;
		script.onerror = () => fail("The Maps JavaScript API did not load.");
		document.head.appendChild(script);
	});
}

function startLoad(apiKey: string): Promise<PlacesLibrary> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("The Maps JavaScript API loads only in a browser."));
	}
	const ready = placesReady();
	if (ready) return ready;
	// A Maps script still on its way, even one whose google.maps is there
	// before its Places library, is waited for rather than doubled.
	const existing = document.querySelector<HTMLScriptElement>(`script[src^="${MAPS_SCRIPT}"]`);
	if (existing) return waitForScript(existing);
	return libraryOnPage() ?? addScript(apiKey);
}

/**
 * Loads the Maps JavaScript API once per key, by Google's direct script tag
 * with `loading=async`, and imports its `places` library. Uses the API when
 * the page already has it, and waits for a Maps script already on the page
 * rather than adding a second; where `importLibrary` is missing it takes
 * the older `google.maps.places` namespace when that holds the Autocomplete
 * Data classes, and fails otherwise.
 *
 * A failed load takes its tag back out and is remembered: a call without
 * `retry` hands back the same failure for `RETRY_AFTER_MS`, so a search on
 * every keystroke never adds a tag, while `retry` (the field's next focus)
 * tries again at once. Runs only when called, never at import.
 */
export function loadPlacesLibrary(
	apiKey: string,
	{ retry = false }: { retry?: boolean } = {},
): Promise<PlacesLibrary> {
	const cached = loads.get(apiKey);
	if (cached) {
		const failedAt = failures.get(apiKey);
		if (failedAt === undefined) return cached;
		if (!retry && Date.now() - failedAt < RETRY_AFTER_MS) return cached;
		failures.delete(apiKey);
	}
	const load = startLoad(apiKey);
	load.catch(() => failures.set(apiKey, Date.now()));
	loads.set(apiKey, load);
	return load;
}

/**
 * Google's address suggestions as an `AddressSearch` provider: pass a key,
 * and the search offers Google's addresses and fills the form with the
 * street, city, state, and ZIP of the one picked.
 *
 * Built on the Maps JavaScript API's Places library (Autocomplete Data API,
 * the New one), loaded on the field's first focus and never before (a
 * failed load is tried again on a later focus, not on every keystroke), so a
 * page whose visitor never reaches the address loads nothing of Google's.
 * Google documents a website restricted key for the JavaScript API, and does
 * not document one for calling the Places web service from a browser, which
 * is why it is not called directly. A session token covers the searches and
 * the pick, so they bill as one session, and the pick asks for the address
 * components alone. A failed load or search offers no suggestions, so the
 * plain fields still take the address; an aborted search rejects.
 *
 * Wherever its suggestions show, Google's terms ask for its attribution:
 * pass `GoogleMapsAttribution` as the search's `attribution` (ContactForm's
 * `googlePlacesKey` does).
 */
export function googlePlacesProvider({ apiKey, ...options }: GooglePlacesOptions): AddressProvider {
	return placesProvider((retry) => loadPlacesLibrary(apiKey, { retry }), options);
}
