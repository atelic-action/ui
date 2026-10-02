import type { Tone } from "./tone";

export interface ColumnChartBar {
	/** Under the bar, e.g. "Jul". */
	label: string;
	value: number;
	/** Over the bar, e.g. "1.7k"; defaults to the value with separators. */
	display?: string;
	tone?: Tone;
}

export interface ColumnChartGroup {
	/** Under the group, e.g. "2026 Q3". */
	label?: string;
	/** The group's own figure beside its label, e.g. "3,948". */
	total?: string;
	/** Colors every bar in the group that sets no tone of its own. */
	tone?: Tone;
	bars: ColumnChartBar[];
}

export interface ColumnChartProps {
	/** Bars in groups, e.g. months in quarters. One group draws a plain chart. */
	groups: ColumnChartGroup[];
	/** What each tone means, e.g. "The same quarter, a year apart". */
	legend?: Array<{ label: string; tone: Tone }>;
	/** The tallest a bar draws, in pixels. */
	height?: number;
	className?: string;
}

/**
 * A column chart: one bar a period, the periods in groups that each carry
 * their own label and total, so a reader compares a quarter with the one
 * before it and with the same quarter a year earlier in one picture.
 */
export function ColumnChart({ groups, legend, height = 120, className }: ColumnChartProps) {
	const all = groups.flatMap((group) => group.bars);
	const max = Math.max(...all.map((bar) => bar.value), 1);
	const figure = (bar: ColumnChartBar) => bar.display ?? bar.value.toLocaleString("en-US");
	const summary = groups
		.map(
			(group) =>
				`${group.label ? `${group.label}${group.total ? `, ${group.total}` : ""}: ` : ""}${group.bars
					.map((bar) => `${bar.label} ${bar.value.toLocaleString("en-US")}`)
					.join(", ")}`,
		)
		.join("; ");
	return (
		<div className={["column-chart", className].filter(Boolean).join(" ")}>
			<div className="column-chart-plot" role="img" aria-label={summary}>
				{groups.map((group, g) => (
					<div
						className="column-chart-group"
						// biome-ignore lint/suspicious/noArrayIndexKey: groups are static content in time order
						key={g}
						style={{ flexGrow: group.bars.length }}
					>
						<div className="column-chart-bars">
							{group.bars.map((bar, b) => (
								<div
									className="column-chart-col"
									// biome-ignore lint/suspicious/noArrayIndexKey: bars are static content in time order
									key={b}
									data-tone={bar.tone ?? group.tone ?? "muted"}
								>
									<span className="column-chart-value">{figure(bar)}</span>
									<span
										className="column-chart-bar"
										style={{ height: `${Math.round((bar.value / max) * height)}px` }}
									/>
									<span className="column-chart-label">{bar.label}</span>
								</div>
							))}
						</div>
						{(group.label || group.total) && (
							<div className="column-chart-group-label">
								{group.label && <span>{group.label}</span>}
								{group.total && <b>{group.total}</b>}
							</div>
						)}
					</div>
				))}
			</div>
			{legend && (
				<ul className="chart-key">
					{legend.map((entry) => (
						<li key={entry.label} data-tone={entry.tone}>
							<span className="chart-swatch" aria-hidden="true" />
							<span>{entry.label}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
