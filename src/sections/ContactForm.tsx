import { type FormEvent, type ReactNode, useState } from "react";
import { isHoneypotFilled } from "../lib/honeypot";
import { trackEvent } from "../lib/trackEvent";
import { Button } from "../primitives/Button";
import { useWithBase } from "../routing/BasePathProvider";

export interface ContactFormProps {
	/**
	 * POST target for a real form backend (e.g. "/api/contact"). The body is
	 * JSON: { name, email, topic, message, company } where company is the
	 * honeypot and must be relayed verbatim. When omitted, the form falls
	 * back to a mailto handoff via toEmail.
	 */
	endpoint?: string;
	/** Destination inbox for the mailto fallback (required without endpoint). */
	toEmail?: string;
	/** Options for the topic select. */
	topics: string[];
	/** Message shown after a successful submit (or after the mail draft opens). */
	successMessage: string;
	/** Message shown when the endpoint submission fails. */
	errorMessage?: string;
	/** Small footer line under the submit button. */
	footnote?: ReactNode;
	/**
	 * Called once for each human submission the endpoint accepted: never on a
	 * press of the button, a failed send, a honeypot catch, or the mailto
	 * handoff. Defaults to the GA4 `generate_lead` event with
	 * `form_name: "contact"`, a silent no op on a page without the Google tag.
	 * It is passed nothing, so no personal data can ride along.
	 */
	onLead?: () => void;
}

function sendLead() {
	trackEvent("generate_lead", { form_name: "contact" });
}

interface FieldErrors {
	name?: boolean;
	email?: boolean;
	message?: boolean;
}

type Status = "idle" | "sending" | "sent" | "failed";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact form with client validation and a honeypot. POSTs to `endpoint`
 * when one is configured; otherwise hands off to the visitor's mail app.
 */
export function ContactForm({
	endpoint,
	toEmail,
	topics,
	successMessage,
	errorMessage = "Something went wrong sending your message. Please try again.",
	footnote,
	onLead = sendLead,
}: ContactFormProps) {
	const withBase = useWithBase();
	const [errors, setErrors] = useState<FieldErrors>({});
	const [status, setStatus] = useState<Status>("idle");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const name = String(data.get("name") ?? "").trim();
		const email = String(data.get("email") ?? "").trim();
		const topic = String(data.get("topic") ?? "");
		const message = String(data.get("message") ?? "").trim();
		const company = String(data.get("company") ?? "");

		const nextErrors: FieldErrors = {
			name: !name,
			email: !EMAIL_PATTERN.test(email),
			message: !message,
		};
		setErrors(nextErrors);
		if (nextErrors.name || nextErrors.email || nextErrors.message) return;

		if (!endpoint) {
			const subject = encodeURIComponent(`Website inquiry: ${topic}`);
			const body = encodeURIComponent(`${name} (${email}) wrote:\n\n${message}`);
			setStatus("sent");
			window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
			return;
		}

		setStatus("sending");
		try {
			const response = await fetch(withBase(endpoint), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, topic, message, company }),
			});
			if (!response.ok) throw new Error(`status ${response.status}`);
			setStatus("sent");
			form.reset();
			// The conversion: only a relay the endpoint accepted counts, never a
			// press of the button, a failed send, or a honeypot catch (which the
			// relay answers with the same success so the bot never learns). No
			// personal data rides along.
			if (!isHoneypotFilled(company)) onLead();
		} catch {
			setStatus("failed");
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate>
			{status === "sent" && <div className="form-success">{successMessage}</div>}
			{status === "failed" && <div className="form-error">{errorMessage}</div>}
			<div className={["field", errors.name && "invalid"].filter(Boolean).join(" ")}>
				<label htmlFor="contact-name">Your name</label>
				<input id="contact-name" name="name" type="text" autoComplete="name" required />
				<span className="err">Please enter your name.</span>
			</div>
			<div className={["field", errors.email && "invalid"].filter(Boolean).join(" ")}>
				<label htmlFor="contact-email">Email</label>
				<input id="contact-email" name="email" type="email" autoComplete="email" required />
				<span className="err">Please enter a valid email.</span>
			</div>
			<div className="field">
				<label htmlFor="contact-topic">What can we help with?</label>
				<select id="contact-topic" name="topic">
					{topics.map((topic) => (
						<option key={topic}>{topic}</option>
					))}
				</select>
			</div>
			<div className={["field", errors.message && "invalid"].filter(Boolean).join(" ")}>
				<label htmlFor="contact-message">Message</label>
				<textarea id="contact-message" name="message" required />
				<span className="err">Please add a short message.</span>
			</div>
			{/* Honeypot: visually hidden and skipped by keyboard/screen readers;
			    bots that fill it are quietly dropped by the backend. */}
			<div className="hp-field" aria-hidden="true">
				<label htmlFor="contact-company">Company</label>
				<input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
			</div>
			<Button type="submit" size="lg" arrow style={{ width: "100%" }}>
				{status === "sending" ? "Sending…" : "Send Message"}
			</Button>
			{footnote && (
				<p className="muted form-footnote" style={{ fontSize: "0.82rem", marginTop: 14 }}>
					{footnote}
				</p>
			)}
		</form>
	);
}
