import { type FormEvent, useEffect, useId, useRef, useState } from "react";

type Status = "idle" | "sending" | "sent" | "failed";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GateLoginProps {
	/** Who the page behind the gate is for, set at the top of the screen. */
	brandName: string;
	/** The small line over the headline; with it the brand wears a "Preview" tag. */
	eyebrow?: string;
	headline?: string;
	lead?: string;
	/** Who built what is behind the gate, in the fine print. */
	builtBy?: string;
	/** A reply address, in the fine print. */
	contactEmail?: string;
	/**
	 * Where the form posts. A site served under a base path passes its own
	 * path to the function.
	 */
	endpoint?: string;
}

/**
 * The access gate's sign in screen. Collects an email and posts it to the
 * request link function, which emails a sign in link only to allowlisted
 * addresses. The response is the same either way, so this screen always
 * shows the same "check your inbox" confirmation.
 *
 * It renders the screen only: a site wraps it in its `.mkt` scope with no
 * header, since a header would only point at pages the visitor cannot open
 * yet. The button wears the site's own `.btn` classes, as the chrome's do.
 */
export function GateLogin({
	brandName,
	eyebrow,
	headline = "A first look, by invitation.",
	lead = "Enter your email and we will send a private link to the document.",
	builtBy,
	contactEmail,
	endpoint = "/api/auth/request-link",
}: GateLoginProps) {
	const [status, setStatus] = useState<Status>("idle");
	const [sentTo, setSentTo] = useState("");
	const [expired, setExpired] = useState(false);
	const [invalid, setInvalid] = useState(false);
	const input = useRef<HTMLInputElement>(null);
	const confirmation = useRef<HTMLHeadingElement>(null);
	// A ref, since two submits can land before React renders the first one's state.
	const inFlight = useRef(false);
	const errorId = useId();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("e") === "expired") setExpired(true);
	}, []);

	// The form leaves the page when the confirmation arrives, and focus would
	// fall to the body with it. Moving it to the heading is also what tells a
	// screen reader the request went through.
	useEffect(() => {
		if (status === "sent") confirmation.current?.focus();
	}, [status]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		// A second submit while the first is in flight would post twice, and a
		// late failure would then pull the confirmation back to the form.
		if (inFlight.current) return;
		const email = String(new FormData(form).get("email") ?? "").trim();
		if (!EMAIL_PATTERN.test(email)) {
			// Nothing was sent, so an earlier failure no longer describes anything.
			setStatus("idle");
			setInvalid(true);
			input.current?.focus();
			return;
		}
		setInvalid(false);

		const next = new URLSearchParams(window.location.search).get("next") ?? "/";
		inFlight.current = true;
		setStatus("sending");
		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, next }),
			});
			if (!response.ok) throw new Error(`status ${response.status}`);
			setSentTo(email);
			setStatus("sent");
			setExpired(false);
		} catch {
			setStatus("failed");
		} finally {
			inFlight.current = false;
		}
	}

	// "Start over" swaps the confirmation for the form, and the button that
	// held focus goes with it, so focus is handed to the field it leads to.
	function startOver() {
		setStatus("idle");
		requestAnimationFrame(() => input.current?.focus());
	}

	return (
		<div className="gate-screen">
			<div className="gate-brand">
				<span className="gate-brand-name">{brandName}</span>
				{eyebrow && <span className="gate-brand-sub">Preview</span>}
			</div>

			<div className="gate-body">
				{eyebrow && <p className="gate-eyebrow">{eyebrow}</p>}

				{status === "sent" ? (
					<>
						<h1 className="gate-headline" ref={confirmation} tabIndex={-1}>
							Check your inbox.
						</h1>
						<div className="gate-sent">
							If <strong>{sentTo}</strong> is on the list, a sign in link is on its way. The link
							expires shortly if unused, and once you are in, you stay signed in for a while.
						</div>
						<p className="gate-fine">
							Wrong address?{" "}
							<button type="button" className="gate-link-button" onClick={startOver}>
								Start over
							</button>
						</p>
					</>
				) : (
					<>
						<h1 className="gate-headline">{headline}</h1>
						{expired && (
							<p className="gate-error" role="alert">
								That link has expired. Enter your email and we will send a fresh one.
							</p>
						)}
						<p className="gate-lead">{lead}</p>
						<form className="gate-form" onSubmit={handleSubmit} noValidate>
							<input
								className="gate-input"
								type="email"
								name="email"
								placeholder="you@company.com"
								autoComplete="email"
								aria-label="Your email"
								aria-invalid={invalid || undefined}
								aria-describedby={invalid ? errorId : undefined}
								ref={input}
								required
							/>
							<button
								type="submit"
								className="btn btn-primary btn-lg"
								disabled={status === "sending"}
							>
								{status === "sending" ? "Sending…" : "Email me my link"}
								<span className="arrow" aria-hidden="true">
									→
								</span>
							</button>
						</form>
						{invalid && (
							<p className="gate-error gate-error-after" id={errorId} role="alert">
								That does not look like an email address. Check it and try again.
							</p>
						)}
						{status === "failed" && (
							<p className="gate-error gate-error-after" role="alert">
								Something went wrong. Please try again in a moment.
							</p>
						)}
						{(builtBy || contactEmail) && (
							<p className="gate-fine">
								{builtBy && `Built by ${builtBy}`}
								{builtBy && contactEmail && " · "}
								{contactEmail && <a href={`mailto:${contactEmail}`}>{contactEmail}</a>}
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}
