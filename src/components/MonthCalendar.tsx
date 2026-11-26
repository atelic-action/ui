import { ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { addDays, daysBetween, longDayLabel, monthLabel, weekday } from "../forms/calendar";

/** Every word the calendar draws that is not a date, each with a neutral default. */
export interface MonthCalendarLabels {
	/** The earlier month button's name. */
	earlier: string;
	/** The later month button's name. */
	later: string;
	/** After a day's name when it cannot be picked. */
	unavailable: string;
	/** The column heads, Sunday first. */
	weekdays: string[];
}

export interface MonthCalendarProps {
	/** The day chosen, `2026-12-02`, empty for none. */
	value: string;
	/** Called with the day the visitor picks. */
	onChange: (day: string) => void;
	/** The first day that can be picked; the calendar opens on its month. */
	first: string;
	/** The last day that can be picked; no month after its own is offered. */
	last: string;
	/**
	 * Whether a day between `first` and `last` can be picked (a business
	 * day, say). Every day between them can when left out.
	 */
	isAvailable?: (day: string) => boolean;
	/** The group's name. Defaults to "Preferred day". */
	label?: string;
	/** Why the pick is refused; the group is described by it while set. */
	error?: string;
	labels?: Partial<MonthCalendarLabels>;
	className?: string;
}

const LABELS: MonthCalendarLabels = {
	earlier: "Earlier month",
	later: "Later month",
	unavailable: "not available",
	weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/** The first of the month a day is in. */
const monthOf = (day: string) => `${day.slice(0, 7)}-01`;

/** The first of the month `count` months after the one `start` begins. */
function addMonths(start: string, count: number): string {
	const total = Number(start.slice(0, 4)) * 12 + Number(start.slice(5, 7)) - 1 + count;
	return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

/** How many months `to` is after `from`. */
const monthsBetween = (from: string, to: string) =>
	(Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
	Number(to.slice(5, 7)) -
	Number(from.slice(5, 7));

/** The days of a month, `2026-12-01` to `2026-12-31`. */
function daysOf(start: string): string[] {
	const next = addMonths(start, 1);
	return Array.from({ length: daysBetween(start, next) }, (_, index) => addDays(start, index));
}

/**
 * A month of days to pick one from: a heading with the month, buttons for
 * the earlier and the later month, and a button for each day, a day that
 * cannot be picked greyed, disabled, and named so. The first month opens on
 * the week of the first day that can be picked, so it never leads with a
 * row of nothing to pick. The days are one stop in the tab order, on the
 * day chosen or the first that can be picked; the arrows move between the
 * days that can be (left and right a day, up and down a week, crossing into
 * the next month and back), Page Up and Page Down move a month, and Enter or
 * Space picks. Dates are calendar days with no clock, so it prerenders the
 * same everywhere.
 */
export function MonthCalendar({
	value,
	onChange,
	first,
	last,
	isAvailable,
	label = "Preferred day",
	error,
	labels: labelProps,
	className,
}: MonthCalendarProps) {
	const labels = { ...LABELS, ...labelProps };
	const ownId = useId();
	const errorId = `${ownId}-error`;
	const gridRef = useRef<HTMLDivElement>(null);
	const firstMonth = monthOf(first);
	const lastMonth = monthOf(last);
	const [shown, setShown] = useState(() =>
		value && value >= first && value <= last ? monthOf(value) : firstMonth,
	);
	// The day the arrows moved to, focused once its month is drawn.
	const [moveTo, setMoveTo] = useState<string | null>(null);

	const open = (day: string) =>
		day >= first && day <= last && (isAvailable ? isAvailable(day) : true);

	// A month outside the range (a range that moved under it) comes back into it.
	const month = shown < firstMonth ? firstMonth : shown > lastMonth ? lastMonth : shown;
	const at = monthsBetween(firstMonth, month);
	const span = monthsBetween(firstMonth, lastMonth);

	// The first month opens on the first day's week when that week starts inside it.
	const weekStart = addDays(first, -weekday(first));
	const days = daysOf(month).filter(
		(day) => !(month === firstMonth && monthOf(weekStart) === month && day < weekStart),
	);
	const blanks = days[0] ? weekday(days[0]) : 0;
	const choosable = days.filter(open);
	const tabbable = value && choosable.includes(value) ? value : choosable[0];

	useEffect(() => {
		if (!moveTo) return;
		const button = gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${moveTo}"]`);
		button?.focus();
		setMoveTo(null);
	}, [moveTo]);

	/** The next day that can be picked from `day`, stepping `step` days, or none in range. */
	const seek = (day: string, step: number): string | null => {
		let next = addDays(day, step);
		for (let guard = 0; guard < 400; guard++) {
			if (next < first || next > last) return null;
			if (open(next)) return next;
			next = addDays(next, step > 0 ? 1 : -1);
		}
		return null;
	};

	const go = (day: string | null) => {
		if (!day) return;
		setShown(monthOf(day));
		setMoveTo(day);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: string) => {
		const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
		if (step !== undefined) {
			event.preventDefault();
			go(seek(day, step));
		} else if (event.key === "PageUp" || event.key === "PageDown") {
			event.preventDefault();
			const target = addMonths(month, event.key === "PageUp" ? -1 : 1);
			if (target < firstMonth || target > lastMonth) return;
			const offered = daysOf(target).filter(open);
			go(offered[0] ?? null);
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: a group of day buttons with a live month heading, not a fieldset of inputs
		<div
			className={["month-calendar", error && "invalid", className].filter(Boolean).join(" ")}
			role="group"
			aria-label={label}
			{...(error && { "aria-describedby": errorId })}
		>
			<div className="mc-head">
				<div className="mc-month" aria-live="polite">
					{monthLabel(month)}
				</div>
				<div className="mc-nav">
					<button
						type="button"
						aria-label={labels.earlier}
						disabled={at <= 0}
						onClick={() => setShown(addMonths(month, -1))}
					>
						<ChevronLeft aria-hidden="true" size={20} strokeWidth={2.25} />
					</button>
					<button
						type="button"
						aria-label={labels.later}
						disabled={at >= span}
						onClick={() => setShown(addMonths(month, 1))}
					>
						<ChevronRight aria-hidden="true" size={20} strokeWidth={2.25} />
					</button>
				</div>
			</div>
			<div className="mc-grid" ref={gridRef}>
				{labels.weekdays.map((name) => (
					<div key={name} className="mc-dow" aria-hidden="true">
						{name}
					</div>
				))}
				{Array.from({ length: blanks }, (_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: the blanks before the first day are interchangeable
					<span key={`blank-${index}`} className="mc-blank" aria-hidden="true" />
				))}
				{days.map((day) => {
					const can = open(day);
					const on = day === value;
					return (
						<button
							key={day}
							type="button"
							className={on ? "mc-day is-on" : "mc-day"}
							data-day={day}
							disabled={!can}
							aria-pressed={on}
							aria-label={can ? longDayLabel(day) : `${longDayLabel(day)}, ${labels.unavailable}`}
							tabIndex={day === tabbable ? 0 : -1}
							onClick={() => onChange(day)}
							onKeyDown={(event) => onKeyDown(event, day)}
						>
							{Number(day.slice(8))}
						</button>
					);
				})}
			</div>
			{error && (
				<span className="mc-error" id={errorId}>
					{error}
				</span>
			)}
		</div>
	);
}
