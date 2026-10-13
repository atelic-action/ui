import { describe, expect, it } from "vitest";
import {
	cmToFeetInches,
	convertDisplay,
	feetInchesToCm,
	formatMeasure,
	hasUnitChoice,
	kgToPounds,
	measureOf,
	poundsToKg,
	toCanonical,
	toDisplay,
	unitFor,
	unitOptions,
} from "../../src/app/lib/units";

describe("units", () => {
	describe("toDisplay", () => {
		it("passes a canonical value through in metric", () => {
			expect(toDisplay(84.458, "massKg", "metric")).toBe("84.5");
			expect(toDisplay(500, "volumeMl", "metric")).toBe("500");
			expect(toDisplay(2, "volumeL", "metric")).toBe("2");
			expect(toDisplay(30.5, "tempC", "metric")).toBe("30.5");
		});

		it("converts to the imperial unit", () => {
			expect(toDisplay(84.458, "massKg", "imperial")).toBe("186.2");
			expect(toDisplay(500, "volumeMl", "imperial")).toBe("17");
			expect(toDisplay(2, "volumeL", "imperial")).toBe("68");
			expect(toDisplay(100, "massG", "imperial")).toBe("3.5");
			expect(toDisplay(30.5, "tempC", "imperial")).toBe("87");
		});

		it("returns an empty string for a value that was never logged", () => {
			expect(toDisplay(null, "massKg", "imperial")).toBe("");
			expect(toDisplay(undefined, "massKg", "metric")).toBe("");
			expect(toDisplay(Number.NaN, "massKg", "metric")).toBe("");
		});

		it("keeps zero, which is a logged value and not an empty one", () => {
			expect(toDisplay(0, "volumeMl", "metric")).toBe("0");
			expect(toDisplay(0, "tempC", "imperial")).toBe("32");
		});
	});

	describe("toCanonical", () => {
		it("returns the typed value unchanged in metric", () => {
			expect(toCanonical("84.5", "massKg", "metric")).toBe(84.5);
			expect(toCanonical("500", "volumeMl", "metric")).toBe(500);
		});

		it("converts a typed imperial value back to the stored unit", () => {
			expect(toCanonical("186.2", "massKg", "imperial")).toBeCloseTo(84.46, 2);
			expect(toCanonical("87", "tempC", "imperial")).toBeCloseTo(30.56, 2);
			expect(toCanonical("68", "volumeL", "imperial")).toBeCloseTo(2.01, 2);
		});

		it("returns null for anything that does not parse", () => {
			expect(toCanonical("", "massKg", "metric")).toBeNull();
			expect(toCanonical("-", "massKg", "metric")).toBeNull();
			expect(toCanonical(".", "tempC", "metric")).toBeNull();
		});

		it("handles a negative temperature", () => {
			expect(toCanonical("14", "tempC", "imperial")).toBeCloseTo(-10, 2);
		});
	});

	describe("round trips", () => {
		// The lossy direction is documented in units.ts: display precision is
		// deliberately coarser than storage, so callers must save the pristine
		// value for fields the user never touched.
		it("returns to within display precision, not to the exact original", () => {
			const stored = 84.458;
			const shown = toDisplay(stored, "massKg", "imperial");
			const back = toCanonical(shown, "massKg", "imperial");
			expect(back).not.toBe(stored);
			expect(back).toBeCloseTo(stored, 1);
		});

		it("is exact when the display precision already holds the value", () => {
			expect(toCanonical(toDisplay(78.4, "massKg", "metric"), "massKg", "metric")).toBe(78.4);
			expect(toCanonical(toDisplay(750, "volumeMl", "metric"), "volumeMl", "metric")).toBe(750);
		});
	});

	describe("convertDisplay", () => {
		it("restates a typed string in the other system", () => {
			expect(convertDisplay("84.5", "massKg", "metric", "imperial")).toBe("186.3");
			expect(convertDisplay("186.3", "massKg", "imperial", "metric")).toBe("84.5");
		});

		it("leaves the string alone when the system has not moved", () => {
			expect(convertDisplay("84.5", "massKg", "metric", "metric")).toBe("84.5");
		});

		it("leaves an unparseable string alone rather than blanking a partial edit", () => {
			expect(convertDisplay("", "massKg", "metric", "imperial")).toBe("");
			expect(convertDisplay("-", "tempC", "metric", "imperial")).toBe("-");
		});
	});

	describe("measures and options", () => {
		it("groups the two weights and the two volumes under one preference each", () => {
			expect(measureOf("massKg")).toBe("bodyMass");
			expect(measureOf("volumeMl")).toBe("volume");
			expect(measureOf("volumeL")).toBe("volume");
			expect(measureOf("massG")).toBe("foodMass");
		});

		it("offers no choice where there is none to make", () => {
			expect(measureOf("percent")).toBeNull();
			expect(measureOf("count")).toBeNull();
			expect(hasUnitChoice("percent")).toBe(false);
			expect(unitOptions("count")).toEqual([]);
		});

		it("labels the dropdown with the units themselves, metric first", () => {
			expect(unitOptions("massKg")).toEqual([
				{ value: "metric", label: "kg" },
				{ value: "imperial", label: "lb" },
			]);
			expect(unitOptions("tempC")).toEqual([
				{ value: "metric", label: "°C" },
				{ value: "imperial", label: "°F" },
			]);
		});

		it("keeps the % sign on humidity and nothing at all on a bare count", () => {
			expect(unitFor("percent", "imperial").label).toBe("%");
			expect(unitFor("count", "metric").label).toBe("");
		});
	});

	describe("formatMeasure", () => {
		it("renders a value with its unit", () => {
			expect(formatMeasure(1270, "volumeMl", "metric")).toBe("1,270 ml");
			expect(formatMeasure(1270, "volumeMl", "imperial")).toBe("43 fl oz");
		});

		it("drops the space when there is no unit", () => {
			expect(formatMeasure(3, "count", "metric")).toBe("3");
		});

		it("returns an empty string for a value that was never logged", () => {
			expect(formatMeasure(null, "volumeMl", "metric")).toBe("");
		});
	});

	describe("body measures", () => {
		it("round trips kilograms and pounds at two decimals", () => {
			expect(kgToPounds(80)).toBe(176.37);
			expect(poundsToKg(176.37)).toBe(80);
		});

		it("converts feet and inches to centimeters at one decimal", () => {
			expect(feetInchesToCm(6, 0)).toBe(182.9);
			expect(feetInchesToCm(5, 7)).toBe(170.2);
		});

		it("rolls a rounded twelfth inch into the next foot", () => {
			expect(cmToFeetInches(183)).toEqual({ feet: 6, inches: 0 });
			expect(cmToFeetInches(170)).toEqual({ feet: 5, inches: 7 });
			expect(cmToFeetInches(182.6)).toEqual({ feet: 6, inches: 0 });
		});
	});
});
