import type { Tone } from "./tone";

export interface StackedBarSegment {
	label: string;
	value: number;
	/** The figure as printed, e.g. "1,158"; defaults to the value with separators. */
	display?: string;
	tone: Tone;
}

export interface StackedBarProps {
	segments: StackedBarSegment[];
	className?: string;
}

/** One bar split into the parts of a whole, with a key naming each part and its figure. */
export function StackedBar({ segments, className }: StackedBarProps) {
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
							style={{ flexGrow: segment.value / total }}
						/>
					))}
			</div>
			<ul className="chart-key">
				{segments.map((segment) => (
					<li key={segment.label} data-tone={segment.tone}>
						<span className="chart-swatch" aria-hidden="true" />
						<b>{figure(segment)}</b>
						<span>{segment.label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
