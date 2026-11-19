import type { ReactNode } from "react";
import { Copyright } from "./Copyright";
import { Credit } from "./Credit";

export interface ClosingBarProps {
	/** The business's name, for the default copyright on the left. */
	name?: string;
	/**
	 * The left side. Left out, it is the copyright with `name`, or nothing
	 * when there is no name; `null` empties it; anything else renders as given.
	 */
	left?: ReactNode;
	/**
	 * The right side. Left out, it is the practice's credit; `null` empties
	 * it; anything else renders as given.
	 */
	right?: ReactNode;
}

/**
 * The line that closes every page: two sides, each taking anything. By
 * default the left is the copyright with the business's name and the right is
 * the practice's credit. Footer renders it at its foot, and a page with no
 * footer renders it on its own (ArtifactShell passes the sender's name, so a
 * sent document closes the way a site does); with nothing on the left, the
 * right side sits centered.
 */
export function ClosingBar({ name, left, right }: ClosingBarProps) {
	const leftSide = left === undefined ? name ? <Copyright name={name} /> : null : left;
	const rightSide = right === undefined ? <Credit /> : right;
	const hasLeft = leftSide !== null && leftSide !== false;
	const hasRight = rightSide !== null && rightSide !== false;
	if (!hasLeft && !hasRight) return null;

	return (
		<div className={hasLeft ? "closing-bar" : "closing-bar is-solo"}>
			<div className="wrap closing-bar-line">
				{hasLeft && <div className="closing-bar-left">{leftSide}</div>}
				{hasRight && <div className="closing-bar-right">{rightSide}</div>}
			</div>
		</div>
	);
}
