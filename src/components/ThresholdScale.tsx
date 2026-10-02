import type { Tone } from "./tone";

export interface ThresholdZone {
	label: string;
	/** Where the zone ends, in the reading's unit; the last zone runs to `max`. */
	upTo?: number;
	tone: Tone;
}

export interface ThresholdReading {
	label: string;
	value: number;
	/** The figure as printed, e.g. "5.9 s". */
	display: string;
	tone: Tone;
}

export interface ThresholdScaleProps {
	/** The far end of the scale, in the reading's unit. */
	max: number;
	/** Zones in order, e.g. good, slow, poor. */
	zones: ThresholdZone[];
	/** The lines between zones, labeled, e.g. "2.5 s" at 2.5. */
	ticks?: Array<{ at: number; label: string }>;
	/** One line a reading, each a pin on the scale. */
	readings: ThresholdReading[];
	className?: string;
}

/**
 * A scale with zones and one line a reading: where a number sits against
 * the lines that decide good, slow, and poor.
 */
export function ThresholdScale({ max, zones, ticks, readings, className }: ThresholdScaleProps) {
	let from = 0;
	const sized = zones.map((zone) => {
		const to = zone.upTo ?? max;
		const width = ((to - from) / max) * 100;
		from = to;
		return { ...zone, width };
	});
	return (
		<div className={["threshold-scale", className].filter(Boolean).join(" ")}>
			{readings.map((reading) => (
				<div className="threshold-scale-row" key={reading.label}>
					<span className="threshold-scale-label">{reading.label}</span>
					<span
						className="threshold-scale-track"
						role="img"
						aria-label={`${reading.label}: ${reading.display}`}
					>
						{sized.map((zone) => (
							<span
								className="threshold-scale-zone"
								key={zone.label}
								data-tone={zone.tone}
								style={{ width: `${zone.width}%` }}
							/>
						))}
						<span
							className="threshold-scale-pin"
							data-tone={reading.tone}
							style={{ left: `${Math.min(reading.value / max, 1) * 100}%` }}
						/>
					</span>
					<b className="threshold-scale-value" data-tone={reading.tone}>
						{reading.display}
					</b>
				</div>
			))}
			<div className="threshold-scale-row is-axis" aria-hidden="true">
				<span className="threshold-scale-label" />
				<span className="threshold-scale-axis">
					{sized.map((zone) => (
						<span key={zone.label} data-tone={zone.tone} style={{ width: `${zone.width}%` }}>
							{zone.label}
						</span>
					))}
					{ticks?.map((tick) => (
						<i key={tick.label} style={{ left: `${(tick.at / max) * 100}%` }}>
							{tick.label}
						</i>
					))}
				</span>
				<span className="threshold-scale-value" />
			</div>
		</div>
	);
}
