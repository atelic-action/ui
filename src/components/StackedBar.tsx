import type { CSSProperties } from "react";
import type { Tone } from "./tone";

export interface StackedBarSegment {
	label: string;
	value: number;
	/** The figure as printed, e.g. "1,158"; defaults to the value with separators. */
	display?: string;
	/** How the part reads. Leave it out when `color` says it instead. */
	tone?: Tone;
	/** A color of the part's own, any CSS color, for parts that are not good or bad. It wins over `tone`. */
	color?: string;
}

export interface StackedBarProps {
	segments: StackedBarSegment[];
	/** False draws the bar alone, for a page that keys the parts its own way. The bar keeps its spoken summary. */
	showKey?: boolean;
	className?: string;
}

/** A part's own color, set as the fill its bar and its swatch both read. */
function fill(segment: StackedBarSegment): CSSProperties | undefined {
	return segment.color ? ({ "--tone-fill": segment.color } as CSSProperties) : undefined;
}

/** One bar split into the parts of a whole, with a key naming each part and its figure. */
export function StackedBar({ segments, showKey = true, className }: StackedBarProps) {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
	const figure = (segment: StackedBarSegment) =>
		segment.display ?? segment.value.toLocaleString("en-US");
	const summary = segments.map((segment) => `${segment.label}: ${figure(segment)}`).join(", ");
	return (
		<div className={["stacked-bar", className].filter(Boolean).join(" ")}>
			<div className="stacked-bar-track" role="img" aria-label={summary}>
				{segments
					.filter((segment) => segment.value > 0)
					.map((segment) => (
						<span
							key={segment.label}
							data-tone={segment.tone}
							style={{ flexGrow: segment.value / total, ...fill(segment) }}
						/>
					))}
			</div>
			{showKey && (
				<ul className="chart-key">
					{segments.map((segment) => (
						<li key={segment.label} data-tone={segment.tone} style={fill(segment)}>
							<span className="chart-swatch" aria-hidden="true" />
							<b>{figure(segment)}</b>
							<span>{segment.label}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
