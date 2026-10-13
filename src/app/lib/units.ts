/**
 * Unit display for logged measurements.
 *
 * The API stores every measurement in one canonical unit (kg, ml, L, g, °C).
 * The UI converts at the presentation layer so a measure can be read and typed
 * in either system without the wire format ever changing.
 *
 * Two levels:
 *  - a **scale** is what a single field is stored in (`massKg`, `volumeMl`, …)
 *  - a **measure** is the preference group a scale belongs to (`bodyMass`,
 *    `volume`, …). Switching a measure switches every scale under it, so
 *    weight before and weight after can never disagree.
 *
 * Round-trip warning: a value converted out and back does not always land on
 * itself (84.458 kg reads 186.2 lb, which converts back to 84.46 kg). Callers
 * must send the untouched canonical value for fields the user did not edit
 * rather than re-deriving it from the display string.
 */

export type UnitSystem = "metric" | "imperial";

/** Preference groups. One choice each, persisted in `unitsStore`. */
export type MeasureId = "bodyMass" | "volume" | "foodMass" | "temperature";

/** A system per measure, as the api stores it on the person and the store keeps it. */
export type UnitPreferences = Record<MeasureId, UnitSystem>;

/** What a given field is stored in on the API. */
export type ScaleId = "massKg" | "volumeMl" | "volumeL" | "massG" | "tempC" | "percent" | "count";

export interface UnitDef {
	/** Shown beside the value and in the dropdown ("kg", "fl oz", "°F"). */
	label: string;
	/** Decimal places used when rendering a canonical value in this unit. */
	decimals: number;
	/** Canonical value in this unit. */
	from: (canonical: number) => number;
	/** This unit back to canonical. */
	to: (value: number) => number;
}

interface Scale {
	/** The preference group, or null when the field has no unit choice. */
	measure: MeasureId | null;
	metric: UnitDef;
	imperial: UnitDef;
}

const POUNDS_PER_KG = 2.2046226218;
const FL_OZ_PER_ML = 0.0338140227;
const OUNCES_PER_GRAM = 0.0352739619;

const identity = (value: number): number => value;

const SCALES: Record<ScaleId, Scale> = {
	massKg: {
		measure: "bodyMass",
		metric: { label: "kg", decimals: 1, from: identity, to: identity },
		imperial: {
			label: "lb",
			decimals: 1,
			from: (kg) => kg * POUNDS_PER_KG,
			to: (lb) => lb / POUNDS_PER_KG,
		},
	},
	volumeMl: {
		measure: "volume",
		metric: { label: "ml", decimals: 0, from: identity, to: identity },
		imperial: {
			label: "fl oz",
			decimals: 0,
			from: (ml) => ml * FL_OZ_PER_ML,
			to: (flOz) => flOz / FL_OZ_PER_ML,
		},
	},
	volumeL: {
		measure: "volume",
		metric: { label: "L", decimals: 1, from: identity, to: identity },
		imperial: {
			label: "fl oz",
			decimals: 0,
			from: (liters) => liters * 1000 * FL_OZ_PER_ML,
			to: (flOz) => flOz / FL_OZ_PER_ML / 1000,
		},
	},
	massG: {
		measure: "foodMass",
		metric: { label: "g", decimals: 0, from: identity, to: identity },
		imperial: {
			label: "oz",
			decimals: 1,
			from: (grams) => grams * OUNCES_PER_GRAM,
			to: (oz) => oz / OUNCES_PER_GRAM,
		},
	},
	tempC: {
		measure: "temperature",
		metric: { label: "°C", decimals: 1, from: identity, to: identity },
		imperial: {
			label: "°F",
			decimals: 0,
			from: (celsius) => celsius * 1.8 + 32,
			to: (fahrenheit) => (fahrenheit - 32) / 1.8,
		},
	},
	percent: {
		measure: null,
		metric: { label: "%", decimals: 0, from: identity, to: identity },
		imperial: { label: "%", decimals: 0, from: identity, to: identity },
	},
	count: {
		measure: null,
		metric: { label: "", decimals: 0, from: identity, to: identity },
		imperial: { label: "", decimals: 0, from: identity, to: identity },
	},
};

/** The preference group a scale answers to, or null when it has no choice. */
export function measureOf(scale: ScaleId): MeasureId | null {
	return SCALES[scale].measure;
}

/** The unit a scale renders in under the given system. */
export function unitFor(scale: ScaleId, system: UnitSystem): UnitDef {
	return SCALES[scale][system];
}

/** True when the field offers a real choice worth a dropdown. */
export function hasUnitChoice(scale: ScaleId): boolean {
	return SCALES[scale].measure !== null;
}

/** Dropdown options for a scale, metric first. Empty when there is no choice. */
export function unitOptions(scale: ScaleId): { value: UnitSystem; label: string }[] {
	if (!hasUnitChoice(scale)) return [];
	return [
		{ value: "metric", label: SCALES[scale].metric.label },
		{ value: "imperial", label: SCALES[scale].imperial.label },
	];
}

/** Round to a unit's display precision without trailing-zero padding. */
function round(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/**
 * A canonical value rendered for display, as the string an input holds.
 * Returns "" for null/undefined/NaN so an empty field stays empty.
 */
export function toDisplay(
	canonical: number | null | undefined,
	scale: ScaleId,
	system: UnitSystem,
): string {
	if (canonical === null || canonical === undefined || Number.isNaN(canonical)) return "";
	const unit = unitFor(scale, system);
	return String(round(unit.from(canonical), unit.decimals));
}

/**
 * A typed display string converted back to the canonical unit, or null when
 * the string does not parse. Canonical values keep two more decimals than the
 * display so a conversion never throws away what the user typed.
 */
export function toCanonical(display: string, scale: ScaleId, system: UnitSystem): number | null {
	const parsed = parseFloat(display);
	if (Number.isNaN(parsed)) return null;
	const unit = unitFor(scale, system);
	return round(unit.to(parsed), unit.decimals + 2);
}

/**
 * Restate a display string from one system in another, preserving what the
 * user typed as closely as the target precision allows. Used when a unit
 * dropdown changes while a field holds an unsaved edit.
 */
export function convertDisplay(
	display: string,
	scale: ScaleId,
	from: UnitSystem,
	to: UnitSystem,
): string {
	if (from === to) return display;
	const canonical = toCanonical(display, scale, from);
	if (canonical === null) return display;
	return toDisplay(canonical, scale, to);
}

/** Kilograms to pounds, rounded to two decimals. */
export function kgToPounds(kg: number): number {
	return round(kg * POUNDS_PER_KG, 2);
}

/** Pounds to kilograms, rounded to two decimals. */
export function poundsToKg(pounds: number): number {
	return round(pounds / POUNDS_PER_KG, 2);
}

const CM_PER_INCH = 2.54;

/** Feet and inches to centimeters, rounded to one decimal. */
export function feetInchesToCm(feet: number, inches: number): number {
	return round((feet * 12 + inches) * CM_PER_INCH, 1);
}

/** Centimeters to whole feet and inches; 11.6 inches rolls into the next foot. */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
	const totalInches = cm / CM_PER_INCH;
	const feet = Math.floor(totalInches / 12);
	const inches = Math.round(totalInches % 12);
	if (inches === 12) return { feet: feet + 1, inches: 0 };
	return { feet, inches };
}

/** A canonical value plus its unit, e.g. "186.2 lb". Empty string when null. */
export function formatMeasure(
	canonical: number | null | undefined,
	scale: ScaleId,
	system: UnitSystem,
): string {
	const value = toDisplay(canonical, scale, system);
	if (value === "") return "";
	const { label } = unitFor(scale, system);
	const shown = Number(value).toLocaleString();
	return label === "" ? shown : `${shown} ${label}`;
}
