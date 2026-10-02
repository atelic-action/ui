import { CircleAlert, CircleCheck, CircleX, Info } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "./tone";

export interface CalloutProps {
	/** How it reads; picks the icon and the color. Defaults to a warning. */
	tone?: Tone;
	/** The point, in a sentence. The icon sits beside it. */
	title: ReactNode;
	/** What the icon means, for a screen reader, e.g. "Needs work". */
	toneLabel?: string;
	/** `box` sets it apart on a tinted ground, for something missing or owed. */
	variant?: "plain" | "box";
	className?: string;
	/** The one explainer under the title. */
	children?: ReactNode;
}

const icons = {
	good: CircleCheck,
	warn: CircleAlert,
	bad: CircleX,
	info: Info,
	muted: Info,
} as const;
const labels = {
	good: "Working",
	warn: "Needs work",
	bad: "Broken",
	info: "Note",
	muted: "Note",
} as const;

/**
 * One finding: an icon in its tone beside the title, and the explainer
 * under it. Plain, it sits in a list of findings; boxed, it is a callout
 * for something a reader must not miss.
 */
export function Callout({
	tone = "warn",
	title,
	toneLabel,
	variant = "plain",
	className,
	children,
}: CalloutProps) {
	const Icon = icons[tone];
	return (
		<div
			className={["callout", variant === "box" && "is-box", className].filter(Boolean).join(" ")}
			data-tone={tone}
		>
			<Icon className="callout-icon" size={18} aria-label={toneLabel ?? labels[tone]} />
			<div className="callout-text">
				<div className="callout-title">{title}</div>
				{children && <div className="callout-body">{children}</div>}
			</div>
		</div>
	);
}
