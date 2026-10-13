import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeasureId, UnitPreferences, UnitSystem } from "../lib/units";
import { appStorage } from "./storage";

export interface UnitsState {
	systems: UnitPreferences;
	setSystem: (measure: MeasureId, system: UnitSystem) => void;
	/** Take the person's saved choices, as read from the api, over the defaults. */
	hydrate: (systems: Partial<UnitPreferences> | null | undefined) => void;
}

/**
 * Defaults. Body weight and temperature read imperial to match the rest of the
 * app (miles, feet, the profile's pounds); fuel and hydration stay metric
 * because bottles, bladders, and gel packets are labelled in ml, L, and g.
 * Every one of them is one dropdown away from the other system.
 */
export const DEFAULT_SYSTEMS: UnitPreferences = {
	bodyMass: "imperial",
	volume: "metric",
	foodMass: "metric",
	temperature: "imperial",
};

/**
 * Which system each measure displays in, persisted to localStorage so the
 * choice survives a reload, and kept in step with the person's account by
 * UserContext: their saved choices hydrate the store on sign in, and a change
 * here is written back. Preference only: the API is always sent canonical
 * units. Persisted as `<storagePrefix>-units`, hydrated when the app
 * configures the shell.
 */
export const useUnitsStore = create<UnitsState>()(
	persist(
		(set) => ({
			systems: DEFAULT_SYSTEMS,
			setSystem: (measure, system) =>
				set((state) => ({ systems: { ...state.systems, [measure]: system } })),
			hydrate: (systems) => set({ systems: { ...DEFAULT_SYSTEMS, ...(systems ?? {}) } }),
		}),
		{
			name: "units",
			storage: appStorage,
			skipHydration: true,
			// Merge stored values over the defaults so a measure added later
			// starts on its default instead of arriving undefined.
			merge: (persisted, current) => {
				const stored = (persisted as Partial<UnitsState> | undefined)?.systems;
				return { ...current, systems: { ...DEFAULT_SYSTEMS, ...stored } };
			},
		},
	),
);
