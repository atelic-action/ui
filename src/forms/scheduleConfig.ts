/**
 * A request for a visit or a call, as a business states it once: the kinds
 * of work it takes requests for, the ways each can happen and how long each
 * takes, the materials that narrow a kind, its office day and calendar, the
 * promise of when it confirms, its phone, and how a visitor heard about it.
 * The page hands it to `ScheduleRequestForm` and the function to
 * `createScheduleRequest`, so what the form offers and what the endpoint
 * takes can never drift apart. Nothing in it is any one business's: a site
 * writes its own.
 *
 *   export const schedule: ScheduleConfig = {
 *     kinds: [
 *       { id: "repair", label: "A repair", materials: true, visit: 30, call: 20 },
 *       { id: "storm", label: "Storm damage", visit: 30, note: "This one starts with a visit." },
 *     ],
 *     materials: [{ id: "tile", label: "Tile", only: "call", note: "A tile roof starts with a call." }],
 *     hours: { open: "08:00", close: "17:00" },
 *     timeZone: "America/Denver",
 *     phone: { display: "(555) 555-0100", e164: "+15555550100" },
 *   };
 *
 * Built with the gate, as part of `@atelic-action/ui/forms/schedule`.
 */
import {
	type CalendarRules,
	clockLabel,
	DEFAULT_SLOT_MINUTES,
	isTimeZone,
	longDayLabel,
	minutesOf,
} from "./calendar.js";
import { type Source, sourceLabels } from "./source.js";

/** How a request happens: someone comes out, or someone calls. */
export type ScheduleMode = "visit" | "call";

/** The two ways, in the order the form offers them. */
export const SCHEDULE_MODES: ScheduleMode[] = ["visit", "call"];

/** One kind of work a request can be for. */
export interface ScheduleKind {
	/** The value the form sends and a destination reads. */
	id: string;
	/** The words the visitor reads. */
	label: string;
	/** Minutes a visit takes; left out, a visit is not offered for this kind. */
	visit?: number;
	/** Minutes a call takes; left out, a call is not offered. */
	call?: number;
	/** Whether the materials dropdown shows under this kind. */
	materials?: boolean;
	/** The line shown when this kind allows one way only: "This one starts with a visit." */
	note?: string;
}

/** One material, an optional second answer under a kind that shows them. */
export interface ScheduleMaterial {
	id: string;
	label: string;
	/** The one way a request for this material happens, whatever the kind allows. */
	only?: ScheduleMode;
	/** The line shown when `only` narrows the request to one way: "A tile roof starts with a call." */
	note?: string;
}

/** The words for one way, in each place they are read. */
export interface ScheduleModeWords {
	/** The choice card's name: "At your property". */
	label: string;
	/** The line under it: "We come out and take a look." */
	line: string;
	/** In a sentence: "a visit". */
	short: string;
	/** In the summary and the emails: "A visit at your property". */
	long: string;
	/** The last of what happens next: "We come out at the confirmed time and take a look." */
	next: string;
	/** The line for a request that can only happen this way: "This starts with a visit." */
	only: string;
}

/** The words each way reads in, unless a business words its own. */
export const DEFAULT_MODE_WORDS: Record<ScheduleMode, ScheduleModeWords> = {
	visit: {
		label: "At your property",
		line: "We come out and take a look.",
		short: "a visit",
		long: "A visit at your property",
		next: "We come out at the confirmed time and take a look.",
		only: "This starts with a visit.",
	},
	call: {
		label: "By phone",
		line: "We call you and talk it through.",
		short: "a call",
		long: "A phone call",
		next: "We call you at the confirmed time.",
		only: "This starts with a call.",
	},
};

/** A request for a visit or a call, as a business states it once. */
export interface ScheduleConfig {
	/** What a request can be for, in the order the dropdown lists them. */
	kinds: ScheduleKind[];
	/** The materials under a kind that sets `materials`. */
	materials?: ScheduleMaterial[];
	/** The materials dropdown's label. Defaults to "Material". */
	materialLabel?: string;
	/** The office day, on the business's clock: `{ open: "08:00", close: "17:00" }`. */
	hours: { open: string; close: string };
	/** The business's IANA timezone, "America/Denver": every day and time is on its clock. */
	timeZone: string;
	/** The step between the times offered, in minutes. Defaults to 30. */
	slotMinutes?: number;
	/** How many business days out the first day is. Defaults to 2. */
	leadBusinessDays?: number;
	/** Whether the United States federal holidays are left out. Defaults to true. */
	holidays?: boolean;
	/** Any other day the business is shut, "2026-11-27". */
	closedDays?: string[];
	/** How many days past the first day the calendar runs. Defaults to 60. */
	horizonDays?: number;
	/** How soon the office confirms: "2 business days", the default. */
	confirmWithin?: string;
	/** The office's phone, offered beside every step and in the emails. */
	phone: { display: string; e164: string };
	/** How did you hear about us, optional; an answer may ask for a detail. */
	source?: Source;
	/** The words each way reads in, each replacing its default. */
	modes?: Partial<Record<ScheduleMode, Partial<ScheduleModeWords>>>;
}

export const DEFAULT_CONFIRM_WITHIN = "2 business days";
export const DEFAULT_MATERIAL_LABEL = "Material";

/** The calendar the config states, for the calendar's functions. */
export function calendarRules(config: ScheduleConfig): CalendarRules {
	return {
		timeZone: config.timeZone,
		open: config.hours.open,
		close: config.hours.close,
		slotMinutes: config.slotMinutes,
		leadBusinessDays: config.leadBusinessDays,
		holidays: config.holidays,
		closedDays: config.closedDays,
		horizonDays: config.horizonDays,
	};
}

/** A kind by its id, or undefined. */
export function findKind(config: ScheduleConfig, id: string): ScheduleKind | undefined {
	return config.kinds.find((kind) => kind.id === id);
}

/** A material by its id, only under a kind that shows materials. */
export function findMaterial(
	config: ScheduleConfig,
	kind: ScheduleKind | undefined,
	id: string,
): ScheduleMaterial | undefined {
	if (!kind?.materials) return undefined;
	return config.materials?.find((material) => material.id === id);
}

/**
 * The ways a request for this kind and material can happen, in order: the
 * ways the kind offers, narrowed to the material's one way when it names
 * one. A material whose one way the kind does not offer leaves the kind's
 * ways as they are, so a request is never left with none.
 */
export function waysFor(
	kind: ScheduleKind | undefined,
	material?: ScheduleMaterial,
): ScheduleMode[] {
	if (!kind) return [...SCHEDULE_MODES];
	const offered = SCHEDULE_MODES.filter((mode) => (kind[mode] ?? 0) > 0);
	if (material?.only && offered.includes(material.only)) return [material.only];
	return offered;
}

/**
 * The way a request happens: the one way when only one is offered, the
 * chosen one when it is offered, or none yet.
 */
export function modeFor(
	kind: ScheduleKind | undefined,
	material: ScheduleMaterial | undefined,
	chosen: string,
): ScheduleMode | "" {
	if (!kind) return "";
	const ways = waysFor(kind, material);
	if (ways.length === 1) return ways[0] ?? "";
	return ways.find((way) => way === chosen) ?? "";
}

/** How long a request takes, in minutes. */
export function lengthOf(kind: ScheduleKind, mode: ScheduleMode): number {
	return kind[mode] ?? 0;
}

/** "About 30 minutes", "About 1 hour", "About 1.5 hours". */
export function lengthWords(minutes: number): string {
	if (minutes < 60) return `About ${minutes} minutes`;
	const hours = Math.round((minutes / 60) * 10) / 10;
	return `About ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** The words a way reads in, the business's own over the defaults. */
export function modeWords(config: ScheduleConfig, mode: ScheduleMode): ScheduleModeWords {
	return { ...DEFAULT_MODE_WORDS[mode], ...config.modes?.[mode] };
}

/**
 * The line a request that can happen one way only shows in place of the
 * choice: the material's note when the material narrowed it, else the
 * kind's, else the way's own words.
 */
export function oneWayNote(
	config: ScheduleConfig,
	kind: ScheduleKind,
	material: ScheduleMaterial | undefined,
	mode: ScheduleMode,
): string {
	const offered = SCHEDULE_MODES.filter((one) => (kind[one] ?? 0) > 0);
	const narrowed = material?.only === mode && offered.length > 1;
	return (narrowed ? material?.note : kind.note) ?? modeWords(config, mode).only;
}

/** "Wednesday, December 2 at 9:00 am". */
export function askedForWords(day: string, time: string): string {
	return [day && longDayLabel(day), time && clockLabel(time)].filter(Boolean).join(" at ");
}

/**
 * What is wrong with a config, as sentences, or none. The endpoint throws on
 * any when its function loads, so a mistake stops a site's tests and its
 * first request rather than refusing every visitor.
 */
export function scheduleConfigProblems(config: ScheduleConfig): string[] {
	const problems: string[] = [];
	if (!config.kinds?.length) problems.push("it lists no kinds");
	const ids = (config.kinds ?? []).map((kind) => kind.id);
	const twice = ids.find((id, index) => ids.indexOf(id) !== index);
	if (twice) problems.push(`the kind "${twice}" is listed twice`);
	for (const kind of config.kinds ?? []) {
		if (!kind.id) problems.push(`the kind "${kind.label}" has no id`);
		if (waysFor(kind).length === 0)
			problems.push(`the kind "${kind.id}" offers neither a visit nor a call`);
		if (kind.materials && !config.materials?.length) {
			problems.push(`the kind "${kind.id}" shows materials and the config lists none`);
		}
	}
	const materials = (config.materials ?? []).map((material) => material.id);
	const twiceMaterial = materials.find((id, index) => materials.indexOf(id) !== index);
	if (twiceMaterial) problems.push(`the material "${twiceMaterial}" is listed twice`);
	const open = minutesOf(config.hours?.open ?? "");
	const close = minutesOf(config.hours?.close ?? "");
	if (open === null || close === null) problems.push('its hours are not times written "08:00"');
	else if (close <= open) problems.push("its hours close before they open");
	if (!isTimeZone(config.timeZone ?? ""))
		problems.push(`"${config.timeZone}" is not an IANA timezone`);
	if ((config.slotMinutes ?? DEFAULT_SLOT_MINUTES) <= 0)
		problems.push("its slotMinutes is not positive");
	if (!config.phone?.e164) problems.push("it gives no phone");
	if (config.source) {
		const labels = sourceLabels(config.source);
		const repeated = labels.find((label, index) => labels.indexOf(label) !== index);
		if (repeated) problems.push(`the source answer "${repeated}" is listed twice`);
	}
	return problems;
}
