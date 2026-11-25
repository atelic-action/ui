import { type RefObject, useCallback, useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile in the browser, for the contact form's guard. The
 * script loads once, on demand (the form asks on its first focus, never at
 * render), and the widget is rendered explicitly into a container the form
 * owns, run only when the form asks for a token at submit. Whether it shows
 * anything is the widget's type, set where the widget is made in Cloudflare;
 * the form's is invisible.
 *
 * Nothing here touches `window` or `document` at module scope or during a
 * render, so the form prerenders.
 */

/** The script, in explicit mode: it renders nothing until asked. */
export const TURNSTILE_SCRIPT_URL =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** The longest a submit waits for a token, the script's load included. */
export const TOKEN_WAIT_MS = 10_000;

/** The options `turnstile.render` is handed, the ones the form sets. */
export interface TurnstileRenderOptions {
	sitekey: string;
	/** Run the challenge only when `execute` is called. */
	execution: "execute";
	callback: (token: string) => void;
	/** Handed Cloudflare's error code; answering true says the page handled it. */
	"error-callback": (code: string) => boolean;
	"unsupported-callback": () => void;
}

/** The slice of Turnstile's API the form calls. Named here so a test can stand in for it. */
export interface TurnstileAPI {
	render(container: HTMLElement, options: TurnstileRenderOptions): string | null | undefined;
	execute(widget: string): void;
	reset(widget: string): void;
	remove(widget: string): void;
}

declare global {
	interface Window {
		turnstile?: TurnstileAPI;
	}
}

/** The load in flight, shared by every form on the page, with its script. */
let loading: { promise: Promise<TurnstileAPI>; script: HTMLScriptElement } | null = null;

/**
 * Turnstile's API: the one already on the page, or the script added once
 * and waited for. A script that fails is taken back out, so a later call
 * tries again, and so is a load whose script something else took off the
 * page. Refuses where there is no window (a prerender).
 */
export function loadTurnstile(): Promise<TurnstileAPI> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Turnstile loads only in a browser"));
	}
	if (window.turnstile) return Promise.resolve(window.turnstile);
	if (loading?.script.isConnected) return loading.promise;
	const script = document.createElement("script");
	const pending = new Promise<TurnstileAPI>((resolve, reject) => {
		script.src = TURNSTILE_SCRIPT_URL;
		script.async = true;
		script.addEventListener(
			"load",
			() => {
				if (loading?.script === script) loading = null;
				if (window.turnstile) resolve(window.turnstile);
				else reject(new Error("The Turnstile script loaded without its API"));
			},
			{ once: true },
		);
		script.addEventListener(
			"error",
			() => {
				if (loading?.script === script) loading = null;
				script.remove();
				reject(new Error("The Turnstile script did not load"));
			},
			{ once: true },
		);
		document.head.appendChild(script);
	});
	loading = { promise: pending, script };
	return pending;
}

/** What `useTurnstile` gives a form. */
export interface Turnstile {
	/** The element the widget renders into; the form draws it. */
	containerRef: RefObject<HTMLDivElement | null>;
	/** Starts the load and the widget, once. The form calls it on its first focus. */
	prepare: () => void;
	/**
	 * Runs the challenge and resolves with its token. Waits for a load still
	 * in flight. Rejects when the script fails to load, the challenge errors,
	 * the browser cannot run it, or no token arrives within `TOKEN_WAIT_MS`.
	 */
	token: () => Promise<string>;
	/** Spends the token: a token is good once, so the form resets after every submit. */
	reset: () => void;
}

interface Waiter {
	resolve: (token: string) => void;
	reject: (error: Error) => void;
}

function asError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

/**
 * Turnstile for one form, by its site key; with none, `prepare` does
 * nothing and `token` refuses. The widget is removed when the form leaves
 * the page.
 */
export function useTurnstile(siteKey: string | undefined): Turnstile {
	const containerRef = useRef<HTMLDivElement>(null);
	const widget = useRef<Promise<{ api: TurnstileAPI; id: string }> | null>(null);
	const waiting = useRef<Waiter | null>(null);
	const unsupported = useRef(false);
	/**
	 * An error the widget raised while no submit was waiting (a site key
	 * Cloudflare refuses, a domain it does not allow, at render): the next
	 * submit rejects with it at once rather than waiting out the limit. That
	 * rejection drops the widget, so the submit after renders a fresh one
	 * and the error goes with it; a token that arrives clears it too.
	 */
	const raised = useRef<Error | null>(null);
	/**
	 * Which widget is live. Every widget made, and every drop, moves it on,
	 * so a callback from a widget already dropped (a token that arrives after
	 * its submit gave up) is recognized and ignored.
	 */
	const live = useRef(0);
	const gone = useRef(false);
	/** The element the live widget was rendered into, once it has been. */
	const renderedInto = useRef<HTMLElement | null>(null);

	/** Takes the widget out of the page, once it is made, and forgets it. */
	const drop = useCallback(() => {
		const made = widget.current;
		widget.current = null;
		renderedInto.current = null;
		raised.current = null;
		live.current += 1;
		made?.then(
			({ api, id }) => {
				try {
					api.remove(id);
				} catch {
					// The widget is already gone with its container.
				}
			},
			() => {},
		);
	}, []);

	const prepare = useCallback(() => {
		if (!siteKey) return;
		if (widget.current) {
			// A widget still loading renders into whatever container is there
			// when it arrives. One already rendered is kept only while its
			// container is the form's and still on the page: the form is swapped
			// for its thanks after a send and drawn anew on "send another", and
			// a widget left in the old container would never answer again.
			const into = renderedInto.current;
			if (!into || (into === containerRef.current && into.isConnected)) return;
			drop();
		}
		live.current += 1;
		const generation = live.current;
		const made = loadTurnstile().then((api) => {
			const container = containerRef.current;
			if (gone.current || !container) {
				throw new Error("The form left the page before Turnstile loaded");
			}
			// A fresh widget starts with nothing raised.
			raised.current = null;
			unsupported.current = false;
			const id = api.render(container, {
				sitekey: siteKey,
				execution: "execute",
				callback: (token) => {
					if (live.current !== generation) return;
					raised.current = null;
					const waiter = waiting.current;
					waiting.current = null;
					waiter?.resolve(token);
				},
				"error-callback": (code) => {
					if (live.current !== generation) return true;
					const error = new Error(`The Turnstile challenge failed (${code})`);
					const waiter = waiting.current;
					waiting.current = null;
					if (waiter) waiter.reject(error);
					else raised.current = error;
					return true;
				},
				"unsupported-callback": () => {
					if (live.current !== generation) return;
					unsupported.current = true;
					const waiter = waiting.current;
					waiting.current = null;
					waiter?.reject(new Error("This browser cannot run the Turnstile challenge"));
				},
			});
			if (!id) throw new Error("Turnstile rendered no widget");
			if (widget.current === made) renderedInto.current = container;
			return { api, id };
		});
		// A load or a render that failed is tried again on the next focus.
		made.catch(() => {
			if (widget.current === made) widget.current = null;
		});
		widget.current = made;
	}, [siteKey, drop]);

	const token = useCallback((): Promise<string> => {
		prepare();
		const made = widget.current;
		if (!made) return Promise.reject(new Error("Turnstile has no site key"));
		return new Promise<string>((resolve, reject) => {
			let done = false;
			const waiter: Waiter = {
				resolve: (value) => {
					if (done) return;
					done = true;
					clearTimeout(timer);
					resolve(value);
				},
				reject: (error) => {
					if (done) return;
					done = true;
					clearTimeout(timer);
					if (waiting.current === waiter) waiting.current = null;
					// A widget that failed a submit is dropped, so the next focus or
					// submit renders a fresh one; a browser that cannot run the
					// challenge at all keeps it, since a fresh one would fail alike.
					if (!unsupported.current && widget.current === made) drop();
					reject(error);
				},
			};
			const timer = setTimeout(
				() => waiter.reject(new Error(`Turnstile sent no token within ${TOKEN_WAIT_MS} ms`)),
				TOKEN_WAIT_MS,
			);
			made.then(
				({ api, id }) => {
					if (done) return;
					if (unsupported.current) {
						waiter.reject(new Error("This browser cannot run the Turnstile challenge"));
						return;
					}
					if (raised.current) {
						waiter.reject(raised.current);
						return;
					}
					waiting.current = waiter;
					try {
						api.execute(id);
					} catch (error) {
						waiter.reject(asError(error));
					}
				},
				(error: unknown) => waiter.reject(asError(error)),
			);
		});
	}, [prepare, drop]);

	const reset = useCallback(() => {
		widget.current?.then(
			({ api, id }) => {
				try {
					api.reset(id);
				} catch {
					// A widget that cannot reset stays as it is; the next submit's
					// wait still ends at its limit, and the form sends without a token.
				}
			},
			() => {},
		);
	}, []);

	useEffect(() => {
		gone.current = false;
		return () => {
			gone.current = true;
			waiting.current = null;
			drop();
		};
	}, [drop]);

	return { containerRef, prepare, token, reset };
}
