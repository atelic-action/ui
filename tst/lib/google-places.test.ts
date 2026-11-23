import {
	type AddressComponent,
	addressFromComponents,
	googlePlacesProvider,
	loadPlacesLibrary,
	type PlacesLibrary,
	placesProvider,
	RETRY_AFTER_MS,
} from "../../src/lib/googlePlaces";

/*
 * The provider calls the Maps JavaScript API's places library, never fetch:
 * Google documents a website restricted key for that library and not for
 * calling the Places web service from a browser. So these stand in for the
 * library (and, below, for the script tag that loads it). Nothing here has
 * run against Google's live API; no key exists yet.
 */

const ALDER: AddressComponent[] = [
	{ longText: "418", shortText: "418", types: ["street_number"] },
	{ longText: "Alder Street", shortText: "Alder St", types: ["route"] },
	{ longText: "Fairhaven", shortText: "Fairhaven", types: ["locality", "political"] },
	{ longText: "Colorado", shortText: "CO", types: ["administrative_area_level_1", "political"] },
	{ longText: "United States", shortText: "US", types: ["country", "political"] },
	{ longText: "80000", shortText: "80000", types: ["postal_code"] },
];

/** A stand in for the places library, recording every request and every token made. */
function fakeLibrary(components: AddressComponent[] = ALDER) {
	const tokens: object[] = [];
	const requests: Record<string, unknown>[] = [];
	const fetched: { fields: string[] }[] = [];
	let answer: () => Promise<{ suggestions: unknown[] }> = async () => ({
		suggestions: [
			{
				placePrediction: {
					placeId: "alder",
					text: { text: "418 Alder Street, Fairhaven, CO, USA" },
					mainText: { text: "418 Alder Street" },
					secondaryText: { text: "Fairhaven, CO, USA" },
					toPlace: () => {
						const place = {
							addressComponents: null as AddressComponent[] | null,
							async fetchFields(request: { fields: string[] }) {
								fetched.push(request);
								place.addressComponents = components;
								return { place };
							},
						};
						return place;
					},
				},
			},
			{ queryPrediction: { text: { text: "418 Alder" } } },
		],
	});
	const library: PlacesLibrary = {
		AutocompleteSessionToken: class {
			constructor() {
				tokens.push(this);
			}
		},
		AutocompleteSuggestion: {
			fetchAutocompleteSuggestions: (request) => {
				requests.push(request);
				return answer() as never;
			},
		},
	};
	return {
		library,
		tokens,
		requests,
		fetched,
		answerWith(next: () => Promise<{ suggestions: unknown[] }>) {
			answer = next;
		},
	};
}

const signal = () => new AbortController().signal;

describe("the Google provider over the places library", () => {
	it("asks for addresses by default, with one session token, and maps the predictions", async () => {
		const fake = fakeLibrary();
		const provider = placesProvider(async () => fake.library, {});
		const suggestions = await provider.suggest("418 Ald", { signal: signal() });
		expect(fake.requests[0]).toEqual({
			input: "418 Ald",
			sessionToken: fake.tokens[0],
			includedPrimaryTypes: ["street_address", "premise", "subpremise"],
		});
		// A query prediction (no place) is not an address to offer.
		expect(suggestions).toEqual([
			{ id: "alder", text: "418 Alder Street", secondary: "Fairhaven, CO, USA" },
		]);
	});

	it("passes the countries, the point to prefer, the types, the language, and the region", async () => {
		const fake = fakeLibrary();
		const provider = placesProvider(async () => fake.library, {
			regionCodes: ["us"],
			near: { lat: 39.74, lng: -104.99, radius: 40000 },
			types: ["street_address"],
			language: "en",
			region: "us",
		});
		await provider.suggest("418", { signal: signal() });
		expect(fake.requests[0]).toMatchObject({
			includedRegionCodes: ["us"],
			locationBias: { center: { lat: 39.74, lng: -104.99 }, radius: 40000 },
			includedPrimaryTypes: ["street_address"],
			language: "en",
			region: "us",
		});
	});

	it("keeps one token across the searches, ends the session on a pick, and starts a new one after", async () => {
		const fake = fakeLibrary();
		const provider = placesProvider(async () => fake.library, {});
		await provider.suggest("41", { signal: signal() });
		const [picked] = await provider.suggest("418 Ald", { signal: signal() });
		expect(fake.tokens).toHaveLength(1);
		expect(fake.requests[1]?.sessionToken).toBe(fake.requests[0]?.sessionToken);
		const parts = await provider.resolve(picked as never, { signal: signal() });
		expect(fake.fetched).toEqual([{ fields: ["addressComponents"] }]);
		expect(parts).toEqual({
			street: "418 Alder Street",
			city: "Fairhaven",
			state: "CO",
			zip: "80000",
		});
		await provider.suggest("12 Bir", { signal: signal() });
		expect(fake.tokens).toHaveLength(2);
		expect(fake.requests[2]?.sessionToken).toBe(fake.tokens[1]);
		expect(fake.requests[2]?.sessionToken).not.toBe(fake.tokens[0]);
	});

	it("offers nothing when the search fails, and when the library fails to load", async () => {
		const fake = fakeLibrary();
		fake.answerWith(() => Promise.reject(new Error("REQUEST_DENIED")));
		const failing = placesProvider(async () => fake.library, {});
		await expect(failing.suggest("418", { signal: signal() })).resolves.toEqual([]);
		const unloaded = placesProvider(() => Promise.reject(new Error("blocked")), {});
		await expect(unloaded.suggest("418", { signal: signal() })).resolves.toEqual([]);
	});

	it("rejects an aborted search, before it starts and while it waits", async () => {
		const fake = fakeLibrary();
		const provider = placesProvider(async () => fake.library, {});
		const early = new AbortController();
		early.abort();
		await expect(provider.suggest("418", { signal: early.signal })).rejects.toMatchObject({
			name: "AbortError",
		});
		fake.answerWith(() => new Promise(() => {}));
		const late = new AbortController();
		const waiting = provider.suggest("418", { signal: late.signal });
		late.abort();
		await expect(waiting).rejects.toMatchObject({ name: "AbortError" });
	});

	it("refuses to resolve a suggestion it did not offer", async () => {
		const provider = placesProvider(async () => fakeLibrary().library, {});
		await expect(
			provider.resolve({ id: "nowhere", text: "Nowhere" }, { signal: signal() }),
		).rejects.toThrow();
	});

	it("loads with a retry on prepare and without one on a search, swallowing a failed load", async () => {
		const load = vi.fn((_retry: boolean) => Promise.reject(new Error("blocked")));
		const provider = placesProvider(load, {});
		provider.prepare?.();
		expect(load).toHaveBeenLastCalledWith(true);
		await provider.suggest("418", { signal: signal() });
		expect(load).toHaveBeenLastCalledWith(false);
	});
});

describe("addressFromComponents", () => {
	it("reads the street, the city, the state's short code, and the ZIP", () => {
		expect(addressFromComponents(ALDER)).toEqual({
			street: "418 Alder Street",
			city: "Fairhaven",
			state: "CO",
			zip: "80000",
		});
	});

	it("adds a unit after a #", () => {
		const unit = [...ALDER, { longText: "4", shortText: "4", types: ["subpremise"] }];
		expect(addressFromComponents(unit).street).toBe("418 Alder Street #4");
	});

	it("falls back to the postal town or sublocality for the city, in any order", () => {
		const town = [
			{ longText: "Upper Fairhaven", types: ["sublocality_level_1", "sublocality"] },
			...ALDER.filter((component) => !component.types.includes("locality")).reverse(),
		];
		expect(addressFromComponents(town).city).toBe("Upper Fairhaven");
	});

	it("takes the suggestion's main line when there is no route, and leaves a missing part empty", () => {
		const building = [{ longText: "The Mill", types: ["premise"] }];
		expect(addressFromComponents(building, "The Mill")).toEqual({
			street: "The Mill",
			city: "",
			state: "",
			zip: "",
		});
	});
});

describe("loadPlacesLibrary", () => {
	const head = () => Array.from(document.head.querySelectorAll("script"));

	afterEach(() => {
		for (const script of head()) script.remove();
		delete window.google;
	});

	it("adds nothing to the page until called", () => {
		googlePlacesProvider({ apiKey: "test-key-idle" });
		expect(head()).toHaveLength(0);
	});

	it("loads Google's script once per key, asynchronously, and imports the places library", async () => {
		const places = fakeLibrary().library;
		const loading = loadPlacesLibrary("test-key-a");
		expect(loadPlacesLibrary("test-key-a")).toBe(loading);
		const [script] = head();
		const src = new URL(script?.getAttribute("src") ?? "");
		expect(src.origin + src.pathname).toBe("https://maps.googleapis.com/maps/api/js");
		expect(Object.fromEntries(src.searchParams)).toMatchObject({
			key: "test-key-a",
			loading: "async",
			libraries: "places",
			v: "weekly",
		});
		const importLibrary = vi.fn(async () => places);
		window.google = { maps: { importLibrary } };
		const callback = src.searchParams.get("callback") as string;
		(window as unknown as Record<string, () => void>)[callback]?.();
		await expect(loading).resolves.toBe(places);
		expect(importLibrary).toHaveBeenCalledWith("places");
		expect((window as unknown as Record<string, unknown>)[callback]).toBeUndefined();
	});

	it("reuses the API when the page already has it", async () => {
		const places = fakeLibrary().library;
		window.google = { maps: { importLibrary: async () => places } };
		await expect(loadPlacesLibrary("test-key-b")).resolves.toBe(places);
		expect(head()).toHaveLength(0);
	});

	it("takes a failed tag back out, and adds none on the searches that follow", async () => {
		const first = loadPlacesLibrary("test-key-c");
		head()[0]?.dispatchEvent(new Event("error"));
		await expect(first).rejects.toThrow("did not load");
		expect(head()).toHaveLength(0);
		const again = loadPlacesLibrary("test-key-c");
		await expect(again).rejects.toThrow("did not load");
		expect(head()).toHaveLength(0);
	});

	it("tries again on a focus at once, and on a search once the wait is over", async () => {
		const failed = loadPlacesLibrary("test-key-d");
		head()[0]?.dispatchEvent(new Event("error"));
		await expect(failed).rejects.toThrow();
		const focused = loadPlacesLibrary("test-key-d", { retry: true });
		expect(head()).toHaveLength(1);
		head()[0]?.dispatchEvent(new Event("error"));
		await expect(focused).rejects.toThrow();
		const now = Date.now();
		const clock = vi.spyOn(Date, "now").mockReturnValue(now + RETRY_AFTER_MS + 1);
		loadPlacesLibrary("test-key-d").catch(() => {});
		expect(head()).toHaveLength(1);
		clock.mockRestore();
	});

	it("waits for a Maps script already on the page rather than adding a second", async () => {
		const theirs = document.createElement("script");
		theirs.src = "https://maps.googleapis.com/maps/api/js?key=their-own&loading=async";
		document.head.appendChild(theirs);
		const places = fakeLibrary().library;
		const loading = loadPlacesLibrary("test-key-e");
		expect(head()).toHaveLength(1);
		setTimeout(() => {
			window.google = { maps: { importLibrary: async () => places } };
		}, 120);
		await expect(loading).resolves.toBe(places);
		expect(head()).toHaveLength(1);
	});

	it("takes the older places namespace when the page's Maps has no importLibrary", async () => {
		const places = fakeLibrary().library;
		window.google = { maps: { places } };
		await expect(loadPlacesLibrary("test-key-f")).resolves.toBe(places);
		expect(head()).toHaveLength(0);
	});

	it("fails cleanly when the page's Maps has neither, so the plain fields stand", async () => {
		window.google = { maps: {} };
		await expect(loadPlacesLibrary("test-key-g")).rejects.toThrow("no Places library");
		const provider = googlePlacesProvider({ apiKey: "test-key-g" });
		await expect(provider.suggest("418", { signal: signal() })).resolves.toEqual([]);
	});
});
