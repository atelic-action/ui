import type { ReactNode } from "react";

export interface BubbleProps {
	/** The icon inside: a lucide element the caller sizes. */
	icon?: ReactNode;
	/**
	 * A short mono index, such as "01": set in the middle when there is no
	 * icon, and on a small badge at the lower right rim when there is one.
	 */
	num?: string;
	/** 36, 48, or 60 pixels across. */
	size?: "sm" | "md" | "lg";
	/** Lifts the fill for a dark band, the way the chip's dark form does. */
	onDark?: boolean;
	className?: string;
}

/**
 * A round tile holding an icon or a step number, set beside a heading or a
 * numbered step. Given both, the icon sits inside and the number rides a
 * badge on the rim, the way an unread count sits on an app icon. It is
 * decoration, so it is hidden from assistive tech
 * (`aria-hidden`) and the meaning stays in the heading beside it: a step's
 * number belongs in that heading's text or the list's order, never only here.
 */
export function Bubble({ icon, num, size = "md", onDark = false, className }: BubbleProps) {
	const classes = ["bubble", `bubble-${size}`, onDark && "on-dark", className]
		.filter(Boolean)
		.join(" ");
	const hasIcon = icon !== undefined && icon !== null;
	const hasNum = num !== undefined && num !== "";
	return (
		<span className={classes} aria-hidden="true">
			{hasIcon ? icon : hasNum && <span className="bubble-num">{num}</span>}
			{hasIcon && hasNum && <span className="bubble-badge">{num}</span>}
		</span>
	);
}
