import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
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

export interface StatItem {
	/** The big figure, e.g. "$199", "3,948", "23%"; may embed an inline glyph. */
	value: ReactNode;
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
export function StatRow({ stats, className }: StatRowProps) {
	return (
		<div className={["stat-row", className].filter(Boolean).join(" ")}>
			{stats.map((stat, i) => {
				const Trend = stat.trend ? arrow[stat.trend] : null;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: stats are static content in a fixed order
					<div className="stat" key={i} data-tone={stat.tone}>
						<div className="num">
							{Trend && stat.trend && (
								<Trend className="stat-trend" aria-label={spoken[stat.trend]} />
							)}
							{stat.value}
						</div>
						{stat.deltas?.map((delta) => {
							const Icon = arrow[delta.direction];
							return (
								<div className="stat-delta" key={delta.basis}>
									{delta.was && <span className="stat-delta-was">{delta.was}</span>}
									<span className="stat-delta-change" data-tone={delta.tone ?? "muted"}>
										<Icon size={14} aria-label={spoken[delta.direction]} />
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
