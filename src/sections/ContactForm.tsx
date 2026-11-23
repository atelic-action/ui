import { Check } from "lucide-react";
import {
	type FormEvent,
	type ReactNode,
	type RefObject,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { MultiSelect } from "../components/MultiSelect";
import {
	addressLine,
	type ContactFormField,
	type ContactFormRefusals,
	type ContactFormShape,
	type ContactFormValues,
	checkContactForm,
	contactFormBody,
	firstRefused,
	readContactForm,
} from "../lib/contactForm";
import { isHoneypotFilled } from "../lib/honeypot";
import { newTabProps } from "../lib/newTabProps";
import { trackEvent } from "../lib/trackEvent";
import {
	type AddressParts,
	type AddressProvider,
	AddressSearch,
} from "../primitives/AddressSearch";
import { Button } from "../primitives/Button";
import { ExpandableText } from "../primitives/ExpandableText";
import { useWithBase } from "../routing/BasePathProvider";

/** Every word the form draws that is not a visitor's, each with a neutral default. */
export interface ContactFormLabels {
	name: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	topic: string;
	message: string;
	/** The address search's label, when the form has a provider. */
	addressSearch: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	services: string;
	/** Beside the services label, such as "(check all that apply)". None by default. */
	servicesHint?: string;
	/** Beside the label of an optional phone and an optional address. */
	optional: string;
	/** The services button's words for more chosen than it lists. */
	servicesCount: (count: number) => string;
	/** The address suggestions' accessible name. */
	suggestions: string;
	showMore: string;
	showLess: string;
	submit: string;
	sending: string;
}

/** A placeholder for each text field that takes one; none by default but the two pickers'. */
export type ContactFormPlaceholders = Partial<
	Record<Exclude<ContactFormField, "state"> | "addressSearch" | "services", string>
>;

/** The property address block: an optional search over street, city, state, and ZIP. */
export interface ContactFormAddress {
	/** Refuse a send without every part and a ZIP code. Optional by default. */
	required?: boolean;
	/** Looks addresses up as they are typed and fills the four fields; without it, the fields stand alone. */
	provider?: AddressProvider;
	/** Under the suggestions, for a provider whose terms ask for it. */
	attribution?: ReactNode;
	/** Draws the state as a select of these; a text field when left out. */
	states?: string[];
	/** The state chosen before anyone picks; the first of `states` when left out. */
	defaultState?: string;
}

/** A consent checkbox under the message, its words cut short behind Show more. */
export interface ContactFormConsent {
	/** The consent wording, verbatim, as prose: it is the checkbox's whole label. */
	text: ReactNode;
	/** Links shown once the wording is opened (terms, privacy policy). */
	links?: { label: string; href: string; newTab?: boolean }[];
	/** The lines shown while closed. Defaults to 2. */
	lines?: number;
}

/** The thanks that replaces the form once a message is sent. */
export interface ContactFormThanks {
	/** The heading; a function of what was sent, to greet by name. */
	title: ReactNode | ((values: ContactFormValues) => ReactNode);
	/** The line under it. Defaults to the form's `successMessage`. */
	lead?: ReactNode | ((values: ContactFormValues) => ReactNode);
	/**
	 * What was sent, read back: the labels of its rows (services, topic,
	 * address, and how to reach the visitor), or false for none. Shown by
	 * default, each row only when the form drew its field and it was filled.
	 */
	summary?: false | Partial<Record<"services" | "topic" | "address" | "contact", string>>;
	/** The steps that follow, as a numbered list. */
	steps?: string[];
	/** The heading over the steps. */
	stepsHeading?: string;
	/** The words of the control that brings the form back. */
	again?: string;
	/** The level the heading is read at. Defaults to 3. */
	headingLevel?: 2 | 3 | 4 | 5;
}

export interface ContactFormProps {
	/**
	 * POST target for a real form backend (e.g. "/api/contact"). The body is
	 * JSON: { name, email, topic, message, company } where company is the
	 * honeypot and must be relayed verbatim. Those five keys are always
	 * there, so a relay that reads only them keeps working whatever else the
	 * form draws: with `splitName`, `name` is the first and last joined, and
	 * with `services`, `topic` is the chosen services joined by commas. Each
	 * opt in field adds its own keys only when it is drawn: `firstName` and
	 * `lastName`; `phone`; `address`, { street, city, state, zip }; `services`,
	 * an array of the chosen values; `consent`, a boolean. When omitted, the
	 * form falls back to a mailto handoff via toEmail.
	 */
	endpoint?: string;
	/** Destination inbox for the mailto fallback (required without endpoint). */
	toEmail?: string;
	/** Options for the topic select; no select when left out, or when `services` is set. */
	topics?: string[];
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
	/** First and last name as two fields, side by side, in place of the one name. */
	splitName?: boolean;
	/** A phone field beside the email, optional or required. None when left out. */
	phone?: "optional" | "required";
	/** The property address: street, city, state, and ZIP, under an address search when given a provider. */
	address?: ContactFormAddress;
	/** A multi select of these services in place of the topic select. */
	services?: string[];
	/** A consent checkbox under the message. */
	consent?: ContactFormConsent;
	/** The form's words, each replacing its neutral default. */
	labels?: Partial<ContactFormLabels>;
	placeholders?: ContactFormPlaceholders;
	/** The message under each refused field, each replacing its neutral default. */
	errorText?: Partial<Record<ContactFormField, string>>;
	/**
	 * A count of the fields to fix, over the form, after a refused send: true
	 * for the default words, or a function of the count for the site's own.
	 */
	errorSummary?: boolean | ((count: number) => string);
	/** Replaces the form with a thanks once a message is sent; by default the thanks shows over the cleared form. */
	thanks?: ContactFormThanks;
	/** Whether a phone number is one to accept. Defaults to ten digits, a leading 1 aside. */
	validatePhone?: (value: string) => boolean;
}

function sendLead() {
	trackEvent("generate_lead", { form_name: "contact" });
}

type Status = "idle" | "sending" | "sent" | "failed";

const LABELS: ContactFormLabels = {
	name: "Your name",
	firstName: "First name",
	lastName: "Last name",
	email: "Email",
	phone: "Phone",
	topic: "What can we help with?",
	message: "Message",
	addressSearch: "Address",
	street: "Street address",
	city: "City",
	state: "State",
	zip: "ZIP",
	services: "Services",
	optional: "(optional)",
	servicesCount: (count) => `${count} chosen`,
	suggestions: "Address suggestions",
	showMore: "Show more",
	showLess: "Show less",
	submit: "Send Message",
	sending: "Sending…",
};

const ERRORS: Record<ContactFormField, string> = {
	name: "Please enter your name.",
	firstName: "Please enter your first name.",
	lastName: "Please enter your last name.",
	phone: "Please enter a 10 digit phone number.",
	email: "Please enter a valid email.",
	street: "Please enter the street address.",
	city: "Please enter the city.",
	state: "Please enter the state.",
	zip: "Please enter a 5 digit ZIP code.",
	message: "Please add a short message.",
};

const countWords = (count: number) =>
	count === 1
		? "One field needs fixing before this can be sent."
		: `${count} fields need fixing before this can be sent.`;

/**
 * Contact form with client validation and a honeypot. POSTs to `endpoint`
 * when one is configured; otherwise hands off to the visitor's mail app.
 *
 * With no opt in prop it is the form it always was: a name, an email, the
 * topic select, and a message. The opt in props add a service business's
 * fields: a split name, a phone, the property address (with an address
 * search when the site gives it a provider), a multi select of services in
 * place of the topic, a consent line cut short behind Show more, a count of
 * the fields to fix, and a thanks that replaces the form once it is sent.
 */
export function ContactForm({
	endpoint,
	toEmail,
	topics,
	successMessage,
	errorMessage = "Something went wrong sending your message. Please try again.",
	footnote,
	onLead = sendLead,
	splitName = false,
	phone,
	address,
	services,
	consent,
	labels: labelProps,
	placeholders = {},
	errorText,
	errorSummary,
	thanks,
	validatePhone,
}: ContactFormProps) {
	const withBase = useWithBase();
	const labels = { ...LABELS, ...labelProps };
	const errorWords = { ...ERRORS, ...errorText };
	const shape: ContactFormShape = {
		splitName,
		phone: phone ?? "off",
		address: address ? (address.required ? "required" : "optional") : "off",
		services: Boolean(services),
		consent: Boolean(consent),
	};
	const hasTopic = Boolean(topics) && !services;
	const startAddress = (): AddressParts => ({
		street: "",
		city: "",
		state: address?.defaultState ?? address?.states?.[0] ?? "",
		zip: "",
	});

	const [errors, setErrors] = useState<ContactFormRefusals>({});
	const [status, setStatus] = useState<Status>("idle");
	const [place, setPlace] = useState<AddressParts>(startAddress);
	const [sentValues, setSentValues] = useState<ContactFormValues | null>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const thanksRef = useRef<HTMLDivElement>(null);
	// Where focus goes once the form or the thanks is drawn: the thanks's
	// heading when it replaces the form, the first field when the form comes back.
	const [focusOn, setFocusOn] = useState<"thanks" | "form" | null>(null);
	// Ids from useId, so two forms on one page never share a label's target.
	const uid = useId();
	const idOf = (key: string) => `${uid}-${key}`;
	const ids = {
		name: idOf("name"),
		email: idOf("email"),
		topic: idOf("topic"),
		message: idOf("message"),
		company: idOf("company"),
	};

	useEffect(() => {
		if (focusOn === "thanks") thanksRef.current?.focus();
		if (focusOn === "form") {
			const first = formRef.current?.elements.namedItem(splitName ? "firstName" : "name");
			if (first instanceof HTMLElement) first.focus();
		}
		if (focusOn) setFocusOn(null);
	}, [focusOn, splitName]);

	// A refused field says so and why: aria-invalid, and its message as its
	// description, only while it is refused.
	const refused = (field: ContactFormField) =>
		errors[field]
			? { "aria-invalid": true as const, "aria-describedby": `${idOf(field)}-error` }
			: {};
	const fieldClass = (field: ContactFormField) =>
		["field", errors[field] && "invalid"].filter(Boolean).join(" ");
	const optionalHint = (on: boolean) =>
		on && (
			<>
				{" "}
				<small className="field-hint">{labels.optional}</small>
			</>
		);
	const errorLine = (field: ContactFormField) => (
		<span className="err" id={`${idOf(field)}-error`}>
			{errorWords[field]}
		</span>
	);
	const textField = (
		field: ContactFormField,
		input: {
			type?: string;
			autoComplete?: string;
			inputMode?: "tel" | "numeric";
			required?: boolean;
			hint?: boolean;
			value?: string;
			onChange?: (value: string) => void;
		},
	) => (
		<div className={fieldClass(field)}>
			<label htmlFor={idOf(field)}>
				{labels[field]}
				{optionalHint(Boolean(input.hint))}
			</label>
			<input
				id={idOf(field)}
				name={field}
				type={input.type ?? "text"}
				autoComplete={input.autoComplete}
				inputMode={input.inputMode}
				placeholder={placeholders[field as keyof ContactFormPlaceholders]}
				required={input.required}
				{...(input.onChange && {
					value: input.value,
					onChange: (event) => input.onChange?.(event.target.value),
				})}
				{...refused(field)}
			/>
			{errorLine(field)}
		</div>
	);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (status === "sending") return;
		const form = event.currentTarget;
		const values = readContactForm(new FormData(form), shape);
		const nextErrors = checkContactForm(values, shape, validatePhone);
		setErrors(nextErrors);
		const first = firstRefused(nextErrors);
		if (first) {
			setStatus("idle");
			// Focus goes to the first field to fix, where its message is read.
			const field = form.elements.namedItem(first);
			if (field instanceof HTMLElement) field.focus();
			return;
		}
		const { name, email, topic, message, company } = values;

		if (!endpoint) {
			if (!toEmail) {
				setStatus("failed");
				return;
			}
			const subject = encodeURIComponent(`Website inquiry: ${topic}`);
			const extra = [
				shape.phone !== "off" && values.phone && `Phone: ${values.phone}`,
				shape.address !== "off" && addressLine(values.address),
			].filter(Boolean);
			const body = encodeURIComponent(
				`${name} (${email}) wrote:\n\n${message}${extra.length ? `\n\n${extra.join("\n")}` : ""}`,
			);
			setSentValues(values);
			setStatus("sent");
			if (thanks) setFocusOn("thanks");
			window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
			return;
		}

		setStatus("sending");
		try {
			const response = await fetch(withBase(endpoint), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(contactFormBody(values, shape)),
			});
			if (!response.ok) throw new Error(`status ${response.status}`);
			setSentValues(values);
			setStatus("sent");
			form.reset();
			setPlace(startAddress());
			if (thanks) setFocusOn("thanks");
			// The conversion: only a relay the endpoint accepted counts, never a
			// press of the button, a failed send, or a honeypot catch (which the
			// relay answers with the same success so the bot never learns). No
			// personal data rides along.
			if (!isHoneypotFilled(company)) onLead();
		} catch {
			setStatus("failed");
		}
	}

	if (thanks && status === "sent" && sentValues) {
		return (
			<ContactThanks
				thanks={thanks}
				values={sentValues}
				successMessage={successMessage}
				shape={shape}
				hasTopic={hasTopic}
				titleRef={thanksRef}
				onAgain={() => {
					setStatus("idle");
					setErrors({});
					setSentValues(null);
					setFocusOn("form");
				}}
			/>
		);
	}

	const refusedCount = Object.values(errors).filter(Boolean).length;
	const summaryWords = typeof errorSummary === "function" ? errorSummary : countWords;
	const states = address?.states;
	// A state a provider hands back that the list lacks is still offered, so a pick is never lost.
	const stateOptions =
		states && place.state && !states.includes(place.state) ? [...states, place.state] : states;
	const setPart = (part: keyof AddressParts) => (value: string) =>
		setPlace((was) => ({ ...was, [part]: value }));
	const addressOptional = shape.address === "optional";
	const searchShown = Boolean(address?.provider);

	return (
		<form ref={formRef} onSubmit={handleSubmit} noValidate>
			{/* One shot status: the thanks or the failure is announced once when it
			    appears (Component Rules 14). The region is always drawn, so a screen
			    reader is already watching it when the words arrive. */}
			<output className="form-status">
				{status === "sent" && <span className="form-success">{successMessage}</span>}
				{status === "failed" && <span className="form-error">{errorMessage}</span>}
			</output>
			{errorSummary && refusedCount > 0 && (
				<div className="form-alert" role="alert">
					{summaryWords(refusedCount)}
				</div>
			)}
			{splitName ? (
				<div className="field-row">
					{textField("firstName", { autoComplete: "given-name", required: true })}
					{textField("lastName", { autoComplete: "family-name", required: true })}
				</div>
			) : (
				<div className={fieldClass("name")}>
					<label htmlFor={ids.name}>{labels.name}</label>
					<input
						id={ids.name}
						name="name"
						type="text"
						autoComplete="name"
						placeholder={placeholders.name}
						required
						{...refused("name")}
					/>
					{errorLine("name")}
				</div>
			)}
			{(() => {
				const emailField = (
					<div className={fieldClass("email")}>
						<label htmlFor={ids.email}>{labels.email}</label>
						<input
							id={ids.email}
							name="email"
							type="email"
							autoComplete="email"
							placeholder={placeholders.email}
							required
							{...refused("email")}
						/>
						{errorLine("email")}
					</div>
				);
				if (shape.phone === "off") return emailField;
				return (
					<div className="field-row">
						{textField("phone", {
							type: "tel",
							autoComplete: "tel",
							inputMode: "tel",
							required: shape.phone === "required",
							hint: shape.phone === "optional",
						})}
						{emailField}
					</div>
				);
			})()}
			{address && (
				<>
					{searchShown && (
						<AddressSearch
							className="field"
							provider={address.provider}
							label={labels.addressSearch}
							hint={addressOptional ? labels.optional : undefined}
							placeholder={placeholders.addressSearch ?? "Start typing an address"}
							attribution={address.attribution}
							listLabel={labels.suggestions}
							onPick={(picked) => {
								setPlace(picked);
								// A field the pick filled is no longer refused.
								setErrors((was) => ({
									...was,
									street: undefined,
									city: undefined,
									state: undefined,
									zip: undefined,
								}));
							}}
						/>
					)}
					{textField("street", {
						autoComplete: "address-line1",
						required: !addressOptional,
						hint: addressOptional && !searchShown,
						value: place.street,
						onChange: setPart("street"),
					})}
					<div className="field-row field-row-3">
						{textField("city", {
							autoComplete: "address-level2",
							required: !addressOptional,
							value: place.city,
							onChange: setPart("city"),
						})}
						{stateOptions ? (
							<div className={fieldClass("state")}>
								<label htmlFor={idOf("state")}>{labels.state}</label>
								<select
									id={idOf("state")}
									name="state"
									autoComplete="address-level1"
									required={!addressOptional}
									value={place.state}
									onChange={(event) => setPart("state")(event.target.value)}
									{...refused("state")}
								>
									{stateOptions.map((state) => (
										<option key={state}>{state}</option>
									))}
								</select>
								{errorLine("state")}
							</div>
						) : (
							textField("state", {
								autoComplete: "address-level1",
								required: !addressOptional,
								value: place.state,
								onChange: setPart("state"),
							})
						)}
						{textField("zip", {
							autoComplete: "postal-code",
							inputMode: "numeric",
							required: !addressOptional,
							value: place.zip,
							onChange: setPart("zip"),
						})}
					</div>
				</>
			)}
			{services ? (
				<MultiSelect
					className="field"
					label={labels.services}
					hint={labels.servicesHint}
					name="services"
					options={services}
					placeholder={placeholders.services}
					countLabel={labels.servicesCount}
				/>
			) : (
				hasTopic && (
					<div className="field">
						<label htmlFor={ids.topic}>{labels.topic}</label>
						<select id={ids.topic} name="topic">
							{topics?.map((topic) => (
								<option key={topic}>{topic}</option>
							))}
						</select>
					</div>
				)
			)}
			<div className={fieldClass("message")}>
				<label htmlFor={ids.message}>{labels.message}</label>
				<textarea
					id={ids.message}
					name="message"
					placeholder={placeholders.message}
					required
					{...refused("message")}
				/>
				{errorLine("message")}
			</div>
			{consent && (
				<div className="contact-consent">
					<input
						id={idOf("consent")}
						className="contact-consent-box"
						type="checkbox"
						name="consent"
						value="yes"
					/>
					<ExpandableText
						labelFor={idOf("consent")}
						lines={consent.lines ?? 2}
						moreLabel={labels.showMore}
						lessLabel={labels.showLess}
						more={
							consent.links?.length ? (
								<span className="contact-consent-links">
									{consent.links.map((link) => (
										<a
											key={link.href + link.label}
											href={withBase(link.href)}
											{...newTabProps(link.href, link.newTab)}
										>
											{link.label}
										</a>
									))}
								</span>
							) : undefined
						}
					>
						{consent.text}
					</ExpandableText>
				</div>
			)}
			{/* Honeypot: visually hidden and skipped by keyboard/screen readers;
			    bots that fill it are quietly dropped by the backend. */}
			<div className="hp-field" aria-hidden="true">
				<label htmlFor={ids.company}>Company</label>
				<input id={ids.company} name="company" type="text" tabIndex={-1} autoComplete="off" />
			</div>
			<Button type="submit" size="lg" arrow style={{ width: "100%" }}>
				{status === "sending" ? labels.sending : labels.submit}
			</Button>
			{footnote && (
				<p className="muted form-footnote" style={{ fontSize: "0.82rem", marginTop: 14 }}>
					{footnote}
				</p>
			)}
		</form>
	);
}

interface ContactThanksProps {
	thanks: ContactFormThanks;
	values: ContactFormValues;
	successMessage: string;
	shape: ContactFormShape;
	hasTopic: boolean;
	titleRef: RefObject<HTMLDivElement | null>;
	onAgain: () => void;
}

/** The thanks that replaces the form: the heading, the lead, what was sent, and what comes next. */
function ContactThanks({
	thanks,
	values,
	successMessage,
	shape,
	hasTopic,
	titleRef,
	onAgain,
}: ContactThanksProps) {
	const level = thanks.headingLevel ?? 3;
	const read = (words: ReactNode | ((values: ContactFormValues) => ReactNode)) =>
		typeof words === "function" ? words(values) : words;
	const labels =
		thanks.summary === false
			? null
			: {
					services: "Services",
					topic: "Topic",
					address: "Address",
					contact: "Contact",
					...thanks.summary,
				};
	const rows: { label: string; value: string }[] = [];
	if (labels) {
		const { address } = values;
		if (shape.services && values.services.length > 0)
			rows.push({ label: labels.services, value: values.services.join(", ") });
		if (hasTopic && values.topic) rows.push({ label: labels.topic, value: values.topic });
		// A state alone, left at its default, is not an address.
		if (shape.address !== "off" && (address.street || address.city || address.zip))
			rows.push({ label: labels.address, value: addressLine(address) });
		const reach = [values.phone, values.email].filter(Boolean).join(", ");
		if (reach) rows.push({ label: labels.contact, value: reach });
	}

	return (
		<div className="contact-thanks">
			<div className="contact-thanks-mark" aria-hidden="true">
				<Check size={26} strokeWidth={2.5} />
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
			<div
				ref={titleRef}
				className="contact-thanks-title"
				role="heading"
				aria-level={level}
				tabIndex={-1}
			>
				{read(thanks.title)}
			</div>
			<p className="contact-thanks-lead">{read(thanks.lead ?? successMessage)}</p>
			{rows.length > 0 && (
				<dl className="contact-thanks-summary">
					{rows.map((row) => (
						<div key={row.label}>
							<dt>{row.label}</dt>
							<dd>{row.value}</dd>
						</div>
					))}
				</dl>
			)}
			{thanks.steps && thanks.steps.length > 0 && (
				<>
					{thanks.stepsHeading && (
						// biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21)
						<div className="contact-thanks-steps-head" role="heading" aria-level={level + 1}>
							{thanks.stepsHeading}
						</div>
					)}
					<ol className="contact-thanks-steps">
						{thanks.steps.map((step) => (
							<li key={step}>{step}</li>
						))}
					</ol>
				</>
			)}
			<button type="button" className="contact-thanks-again" onClick={onAgain}>
				{thanks.again ?? "Send another message"}
			</button>
		</div>
	);
}
