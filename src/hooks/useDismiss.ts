import { type RefObject, useEffect, useRef } from "react";

/** What closed it: the Escape key, or a press somewhere outside. */
export type DismissReason = "escape" | "outside";

/**
 * Closes a popover, a panel, or a menu the two ways a reader expects: the
 * Escape key, and a press anywhere outside the element `ref` holds. It
 * listens only while `active`, on the document, and calls `onDismiss` with
 * the reason, so the caller decides what else to do (hand focus back on
 * Escape, leave it where the press put it). The latest `onDismiss` is always
 * the one called, so a caller can pass an inline function. Used by `Hint`,
 * `SiteHeader`, and `ContactDock`; it touches the document only inside an
 * effect, so a component using it still prerenders.
 */
export function useDismiss(
	active: boolean,
	ref: RefObject<HTMLElement | null>,
	onDismiss: (reason: DismissReason) => void,
): void {
	const latest = useRef(onDismiss);
	latest.current = onDismiss;

	useEffect(() => {
		if (!active) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") latest.current("escape");
		};
		const onPointer = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) latest.current("outside");
		};
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPointer);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPointer);
		};
	}, [active, ref]);
}
