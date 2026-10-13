import { formatHoursRange, isClosed } from "../lib/hours";
import type { OpeningHours } from "./siteConfig";

export interface HoursTableProps {
	hours: OpeningHours[];
}

/** Day-by-day hours rows with dashed rules and mono times. */
export function HoursTable({ hours }: HoursTableProps) {
	return (
		<div>
			{hours.map((row) => (
				<div
					key={row.label}
					className={["hours-row", isClosed(row) && "closed"].filter(Boolean).join(" ")}
				>
					<span className="day">{row.label}</span>
					<span className="time">{formatHoursRange(row)}</span>
				</div>
			))}
		</div>
	);
}
