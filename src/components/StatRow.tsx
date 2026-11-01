import { ArrowDown, ArrowRight, ArrowUp, Triangle } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "./tone";

export type StatDirection = "up" | "down" | "flat";

/** One comparison under a figure: which way it moved, by how much, against what. */
export interface StatDelta {
	direction: StatDirection;
	/** How far it moved, e.g. "23%". */
	change: string;
	/** What it is measured against, short, e.g. "YoY". */
	basis: string;
	/** The basis spelled out, e.g. "year over year"; read aloud and shown on hover. */
	basisTitle?: string;
	/** The earlier figure, e.g. "5,157". It leads the line, small, under the current one. */
	was?: string;
	/** Whether the move is good or bad news; a spend falling and a cost falling read differently. */
	tone?: Tone;
}

/** The change beside a figure: a small triangle and how far it moved, to the right of the figure. */
export interface StatChange {
	direction: StatDirection;
	/** How far it moved, e.g. "+26", "3.8 s". */
	text: string;
	/** Whether the move is good or bad news. Defaults to good for a rise and muted otherwise. */
	tone?: Tone;
}

export interface StatItem {
	/** The big figure, e.g. "$199", "3,948", "23%"; may embed an inline glyph. */
	value: ReactNode;
	/** The figure's unit, set small after it on the same baseline, e.g. "mi". */
	unit?: ReactNode;
	/**
	 * The denominator of a figure that is a share, set small and muted after
	 * it: a `value` of "6" with an `outOf` of "7" reads as a big 6 and a small
	 * /7, so the number that matters is the one the eye lands on.
	 */
	outOf?: ReactNode;
	/**
	 * The change, set small to the right of the figure with a triangle for its
	 * direction: "100 ▲ +26". The figure stays the current reading; the earlier
	 * one is not shown. For a comparison with its basis spelled out, use
	 * `deltas`.
	 */
	change?: StatChange;
	/** An arrow before the figure, when the figure is itself a change. */
	trend?: StatDirection;
	/** What the figure counts. */
	label: ReactNode;
	/** The period the figure covers, e.g. "2026 Q3". */
	period?: ReactNode;
	/** Comparisons under the figure, each an arrow, a change, and what it is against. */
	deltas?: StatDelta[];
	/** A small dimmed qualifier at the foot (the source, a caveat). */
	note?: ReactNode;
	/** How the figure itself reads; set as data-tone. */
	tone?: Tone;
}

export interface StatRowProps {
	stats: StatItem[];
	/**
	 * How loud the row is. `loud`, the default, is a report's headline figures:
	 * heavy, large, in the accent. `quiet` is a glance row for a working page:
	 * a light figure in the text color over a small capitalized label, the
	 * stats divided by a hairline. A tone still colors a quiet figure.
	 */
	variant?: "loud" | "quiet";
	className?: string;
}

const arrow = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const;
const spoken = { up: "Up", down: "Down", flat: "Unchanged" } as const;

/**
 * A row of large figures. Under each sit its comparisons, one a line: what
 * the figure was, an arrow, how far it moved, and against what. The label
 * closes the stat, with the period it covers. The row wraps to as many
 * columns as fit, and arrows are read aloud as up or down.
 */
export function StatRow({ stats, variant = "loud", className }: StatRowProps) {
	return (
		<div
			className={["stat-row", variant === "quiet" && "is-quiet", className]
				.filter(Boolean)
				.join(" ")}
		>
			{stats.map((stat, i) => {
				const Trend = stat.trend ? arrow[stat.trend] : null;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: stats are static content in a fixed order
					<div className="stat" key={i} data-tone={stat.tone}>
						<div className="num">
							{Trend && stat.trend && (
								<Trend className="stat-trend" role="img" aria-label={spoken[stat.trend]} />
							)}
							{/* The figure, its denominator, and its unit are one unbreakable
							    group; only the change may drop to the next line on a phone. */}
							<span className="stat-figure">
								{stat.value}
								{stat.outOf != null && <span className="stat-out-of">/{stat.outOf}</span>}
								{stat.unit != null && <span className="stat-unit">{stat.unit}</span>}
							</span>
							{stat.change && (
								<span
									className={[
										"stat-change",
										stat.change.direction === "down" && "is-down",
										stat.change.direction === "flat" && "is-flat",
									]
										.filter(Boolean)
										.join(" ")}
									data-tone={
										stat.change.tone ?? (stat.change.direction === "up" ? "good" : "muted")
									}
								>
									<Triangle
										size={10}
										fill="currentColor"
										role="img"
										aria-label={spoken[stat.change.direction]}
									/>
									{stat.change.text}
								</span>
							)}
						</div>
						{stat.deltas?.map((delta) => {
							const Icon = arrow[delta.direction];
							return (
								<div className="stat-delta" key={delta.basis}>
									{delta.was && <span className="stat-delta-was">{delta.was}</span>}
									<span className="stat-delta-change" data-tone={delta.tone ?? "muted"}>
										<Icon size={14} role="img" aria-label={spoken[delta.direction]} />
										{delta.change}
									</span>
									{delta.basisTitle ? (
										<abbr className="stat-delta-basis" title={delta.basisTitle}>
											{delta.basis}
										</abbr>
									) : (
										<span className="stat-delta-basis">{delta.basis}</span>
									)}
								</div>
							);
						})}
						<div className="lbl">
							{stat.label}
							{stat.period && <span className="stat-period">{stat.period}</span>}
						</div>
						{stat.note && <div className="note">{stat.note}</div>}
					</div>
				);
			})}
		</div>
	);
}
