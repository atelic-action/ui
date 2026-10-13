import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The max height an expanding body animates to. Put `ref` on the content
 * inside the clipped box: the height is measured before paint when the row
 * opens (so a row that mounts already open is never clipped to nothing) and
 * re-measured whenever the content resizes (rotation, font swap, late image).
 * Until a measurement exists an open row is unclamped rather than zero.
 */
export function useOpenHeight(open: boolean) {
	const ref = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number | null>(null);

	useIsoLayoutEffect(() => {
		const el = ref.current;
		if (!open || !el) return;
		setHeight(el.scrollHeight);
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => setHeight(el.scrollHeight));
		observer.observe(el);
		return () => observer.disconnect();
	}, [open]);

	return { ref, maxHeight: open ? (height ?? "none") : 0 } as const;
}
