import { useEffect } from "react";

/**
 * Keep the screen awake while the consuming surface is mounted (the cook view:
 * saucy fingers should never have to tap a dimming screen). Progressive
 * enhancement over the Screen Wake Lock API:
 * - Silently no-ops where unsupported (Firefox, older Safari).
 * - The browser auto-releases the lock when the tab is hidden, so a
 *   visibilitychange listener re-acquires it when the user returns.
 */
export function useWakeLock(): void {
	useEffect(() => {
		if (!("wakeLock" in navigator)) return;

		let sentinel: WakeLockSentinel | null = null;
		let released = false;
		let acquiring = false;

		const acquire = async () => {
			// Guard against overlapping requests (rapid visibility flips) and
			// redundant ones while a lock is already held.
			if (acquiring || (sentinel && !sentinel.released)) return;
			acquiring = true;
			try {
				const lock = await navigator.wakeLock.request("screen");
				sentinel = lock;
				// The effect may have cleaned up while the request was in flight.
				if (released) await lock.release();
			} catch {
				// Denied (low battery, permissions policy) — cook on without it.
			} finally {
				acquiring = false;
			}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") void acquire();
		};

		void acquire();
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			released = true;
			document.removeEventListener("visibilitychange", onVisibilityChange);
			void sentinel?.release().catch(() => {});
		};
	}, []);
}
