/**
 * The arithmetic behind `Marquee`: how many copies of its row it draws, and
 * how long one loop takes at a pace. Pure, so the unit tests reach it.
 */

/** The pace a marquee moves at when it is given none, in pixels a second. */
export const MARQUEE_SPEED = 60;

/**
 * How many copies of a row a marquee draws so the loop never shows a gap.
 * Every copy slides left by its own width, so whatever the offset, the band
 * must be covered by the copies still in view: one copy more than the band
 * holds. Two at the least, the seamless loop's own pair, which is also the
 * answer before anything has been measured (on the server, or in a test
 * environment with no layout).
 */
export function marqueeCopies(rowWidth: number, bandWidth: number): number {
	if (!(rowWidth > 0) || !(bandWidth > 0)) return 2;
	return Math.max(2, Math.ceil(bandWidth / rowWidth) + 1);
}

/**
 * How long one loop takes, in seconds: the distance it travels (one row's
 * width) over the pace. A pace, never a fixed length, so a long row moves at
 * the same speed as a short one. A pace that is not a positive number reads
 * as the default; a distance that is not one gives 0, which a caller treats
 * as not yet measured.
 */
export function marqueeDuration(distance: number, speed: number = MARQUEE_SPEED): number {
	if (!(distance > 0)) return 0;
	const pace = speed > 0 ? speed : MARQUEE_SPEED;
	return distance / pace;
}
