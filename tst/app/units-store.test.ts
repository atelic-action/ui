import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SYSTEMS, useUnitsStore } from "../../src/app/stores/unitsStore";

describe("unitsStore", () => {
	beforeEach(() => {
		useUnitsStore.setState({ systems: DEFAULT_SYSTEMS });
	});

	it("starts on the defaults", () => {
		expect(useUnitsStore.getState().systems).toEqual(DEFAULT_SYSTEMS);
	});

	it("switches one measure and leaves the rest", () => {
		useUnitsStore.getState().setSystem("volume", "imperial");
		expect(useUnitsStore.getState().systems).toEqual({ ...DEFAULT_SYSTEMS, volume: "imperial" });
	});

	it("hydrates the saved choices over the defaults", () => {
		useUnitsStore.getState().setSystem("volume", "imperial");
		useUnitsStore.getState().hydrate({ bodyMass: "metric" });
		expect(useUnitsStore.getState().systems).toEqual({ ...DEFAULT_SYSTEMS, bodyMass: "metric" });
	});

	it("hydrates from nothing back to the defaults", () => {
		useUnitsStore.getState().setSystem("temperature", "metric");
		useUnitsStore.getState().hydrate(undefined);
		expect(useUnitsStore.getState().systems).toEqual(DEFAULT_SYSTEMS);
	});
});
