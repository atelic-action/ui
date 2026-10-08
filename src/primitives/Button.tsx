import type { CSSProperties, ReactNode } from "react";
import { newTabProps } from "../lib/newTabProps";

export interface ButtonProps {
	variant?: "primary" | "dark" | "ghost";
	size?: "md" | "lg";
	/** Inverts ghost styling for use on dark surfaces. */
	onDark?: boolean;
	/** Appends the animated arrow glyph. */
	arrow?: boolean;
	/**
	 * Link target: an internal path ("/services") or protocol link
	 * (https, tel, mailto). Marketing pages navigate as an MPA, so plain
	 * anchors are intentional here.
	 */
	href?: string;
	/** Open href in a new tab with rel="noopener". */
	newTab?: boolean;
	/** Renders a real button element (e.g. form submit) when set. */
	type?: "submit" | "button";
	onClick?: () => void;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}

export function Button({
	variant = "primary",
	size = "md",
	onDark = false,
	arrow = false,
	href,
	newTab = false,
	type,
	onClick,
	ariaLabel,
	className,
	style,
	children,
}: ButtonProps) {
	const classes = [
		"btn",
		`btn-${variant}`,
		size === "lg" && "btn-lg",
		onDark && "on-dark",
		className,
	]
		.filter(Boolean)
		.join(" ");

	const content = (
		<>
			{children}
			{arrow && (
				<span className="arrow" aria-hidden="true">
					→
				</span>
			)}
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				className={classes}
				style={style}
				aria-label={ariaLabel}
				{...newTabProps(href, newTab)}
			>
				{content}
			</a>
		);
	}
	return (
		<button
			type={type ?? "button"}
			className={classes}
			style={style}
			aria-label={ariaLabel}
			onClick={onClick}
		>
			{content}
		</button>
	);
}
