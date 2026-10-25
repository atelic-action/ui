import { Info } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface HintProps {
	/** What the button is called, for a screen reader, e.g. "About First paint". */
	label: string;
	/** Which side of its word the icon sits on; `before` for a right aligned heading. */
	side?: "before" | "after";
	className?: string;
	/** The bubble's text: a sentence or two in plain words. */
	children: ReactNode;
}

/**
 * An info bubble: a small icon beside a word that opens a short explainer.
 * It opens on hover or focus and stays open on a click or a tap, so it works
 * on a phone, and Escape or a tap elsewhere closes it. The bubble opens
 * from the icon's left edge and flips to its right edge when it would run
 * off the screen. It is read to a screen reader as the button's
 * description; print hides the icon, since a printed sheet cannot be tapped.
 */
export function Hint({ label, side = "after", className, children }: HintProps) {
	const [open, setOpen] = useState(false);
	const [pinned, setPinned] = useState(false);
	const [flip, setFlip] = useState(false);
	const id = useId();
	const root = useRef<HTMLSpanElement>(null);
	const bubble = useRef<HTMLSpanElement>(null);

	const close = useCallback(() => {
		setOpen(false);
		setPinned(false);
	}, []);

	useEffect(() => {
		if (!open) return;
		const away = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) close();
		};
		const key = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};
		document.addEventListener("pointerdown", away);
		document.addEventListener("keydown", key);
		return () => {
			document.removeEventListener("pointerdown", away);
			document.removeEventListener("keydown", key);
		};
	}, [open, close]);

	// Measured from the left edge first; flipped when that runs off the screen.
	useLayoutEffect(() => {
		if (!open || !bubble.current || !root.current) return;
		const icon = root.current.getBoundingClientRect();
		const width = bubble.current.getBoundingClientRect().width;
		setFlip(icon.left + width > document.documentElement.clientWidth - 8);
	}, [open]);

	return (
		<span
			ref={root}
			className={["hint", className].filter(Boolean).join(" ")}
			data-side={side}
			data-open={open || undefined}
			data-flip={flip || undefined}
			onPointerEnter={(event) => {
				// A finger never hovers: a tap opens through the click instead.
				if (event.pointerType !== "touch") setOpen(true);
			}}
			onPointerLeave={(event) => {
				if (event.pointerType !== "touch" && !pinned) setOpen(false);
			}}
		>
			<button
				type="button"
				aria-label={label}
				aria-describedby={id}
				aria-expanded={open}
				onFocus={() => setOpen(true)}
				onBlur={() => {
					if (!pinned) setOpen(false);
				}}
				onClick={() => {
					if (pinned) close();
					else {
						setPinned(true);
						setOpen(true);
					}
				}}
			>
				<Info size={14} aria-hidden="true" />
			</button>
			<span ref={bubble} role="tooltip" id={id} className="hint-bubble">
				{children}
			</span>
		</span>
	);
}
