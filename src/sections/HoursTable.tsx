import { formatHoursRange, isClosed } from "../lib/hours";
import type { Clock, OpeningHours } from "./siteConfig";

export interface HoursTableProps {
	hours: OpeningHours[];
	/** "12h" (the default) or "24h"; pass the site's `SiteConfig.clock`. */
	clock?: Clock;
}

/** Day-by-day hours rows with dashed rules and mono times. */
export function HoursTable({ hours, clock }: HoursTableProps) {
	return (
		<div>
			{hours.map((row) => (
				<div
					key={row.label}
					className={["hours-row", isClosed(row) && "closed"].filter(Boolean).join(" ")}
				>
					<span className="day">{row.label}</span>
					<span className="time">{formatHoursRange(row, { clock })}</span>
				</div>
			))}
		</div>
	);
}
