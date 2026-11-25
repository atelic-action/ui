import { Check } from "lucide-react";
import {
	type FormEvent,
	type ReactNode,
	type RefObject,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { MultiSelect } from "../components/MultiSelect";
import { TURNSTILE_TOKEN_KEY } from "../forms/guard";
import type { Source } from "../forms/source";
import {
	addressLine,
	type ContactFormField,
	type ContactFormRefusals,
	type ContactFormShape,
	type ContactFormValues,
	checkContactForm,
	contactFormBody,
	firstRefused,
	isZIP,
	readContactForm,
} from "../lib/contactForm";
import { type GooglePlacesOptions, googlePlacesProvider } from "../lib/googlePlaces";
import { isHoneypotFilled } from "../lib/honeypot";
import { newTabProps } from "../lib/newTabProps";
import { trackEvent } from "../lib/trackEvent";
import { useTurnstile } from "../lib/turnstile";
import { reportError } from "../monitoring/catcher";
import {
	type AddressParts,
	type AddressProvider,
	AddressSearch,
} from "../primitives/AddressSearch";
import { Button } from "../primitives/Button";
import { EmailLink } from "../primitives/EmailLink";
import { ExpandableText } from "../primitives/ExpandableText";
import { GoogleMapsAttribution } from "../primitives/GoogleMapsAttribution";
import { PhoneLink } from "../primitives/PhoneLink";
import { SourceSelector } from "../primitives/SourceSelector";
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

/** A field the form draws as a text input, every refusable field but the Source Selector. */
type TextField = Exclude<ContactFormField, "source">;

/**
 * A placeholder for each text field that takes one; none by default but the
 * two pickers'. The Source Selector's empty row is its `Source`'s own.
 */
export type ContactFormPlaceholders = Partial<
	Record<Exclude<TextField, "state"> | "addressSearch" | "services", string>
>;

/** The property address block: an optional search over street, city, state, and ZIP. */
export interface ContactFormAddress {
	/** Refuse a send without every part and a ZIP code. Optional by default. */
	required?: boolean;
	/** Looks addresses up as they are typed and fills the four fields; without it, the fields stand alone. */
	provider?: AddressProvider;
	/**
	 * A Maps JavaScript API key: the search then offers Google's addresses
	 * (`googlePlacesProvider`) under the "Google Maps" attribution Google's
	 * terms ask for. `provider` wins when both are given; with neither, the
	 * fields stand alone.
	 */
	googlePlacesKey?: string;
	/** Google's options beside the key: the countries, a point to prefer, the types, the language. */
	googlePlacesOptions?: Omit<GooglePlacesOptions, "apiKey">;
	/** Under the suggestions, for a provider whose terms ask for it; with `googlePlacesKey`, Google's by default. */
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
	/** Show more at the end of the last line rather than under the wording (`ExpandableText`'s `inline`). */
	inline?: boolean;
}

/** What `onError` is told of a failed send beside the endpoint's words. */
export interface ContactFormFailure {
	/** Stopped as a bot's: a 403 from the guard, or a rate limit's 429. */
	blocked: boolean;
}

/**
 * What the endpoint said of a send beside its success, handed to the
 * thanks's words: whether a copy went back to the visitor (9.2.0), so a
 * site says "a copy is on its way" only when one is.
 */
export interface ContactFormSent {
	receipt: boolean;
}

/** Words of the thanks: fixed, or a function of what was sent and what the endpoint said. */
export type ContactThanksWords =
	| ReactNode
	| ((values: ContactFormValues, sent: ContactFormSent) => ReactNode);

/** The thanks that replaces the form once a message is sent. */
export interface ContactFormThanks {
	/** The heading; a function of what was sent, to greet by name. */
	title: ContactThanksWords;
	/**
	 * The line under it. Defaults to the form's `successMessage`; `null` or
	 * `false` draws none, no element at all. A function is handed whether a
	 * receipt went to the visitor beside what was sent.
	 */
	lead?: ContactThanksWords;
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
	/**
	 * Called once each time a send fails (the endpoint answered a failure, or
	 * never answered), so a site can say so its own way, in a toast. Passed
	 * the endpoint's own words when it refused what was written (a field over
	 * its limit), which are the visitor's to read, and nothing otherwise.
	 * The second argument says whether the send was stopped as a bot's
	 * (`blocked`: a 403 from the guard, or a rate limit's 429), so a site
	 * that shows failures itself can say "call us instead" rather than "try
	 * again" (9.2.0). The form's own message still shows unless
	 * `inlineError` is false. A throw from it is swallowed.
	 */
	onError?: (refusal: string | undefined, failure: ContactFormFailure) => void;
	/**
	 * False keeps the form's own failure message off, for a site that shows a
	 * failure itself through `onError`. Without an `onError` a visitor would
	 * be told nothing, so it is only read beside one. Defaults to true.
	 */
	inlineError?: boolean;
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
	/**
	 * Whether a phone number is one to accept. Defaults to `isPhoneNumber`: a
	 * ten digit North American number typed any common way (a leading 1
	 * aside), or a full international one starting with + and its country code.
	 */
	validatePhone?: (value: string) => boolean;
	/**
	 * How the visitor heard about the business: the `SourceSelector`, after
	 * the services or the topic and before the message, its answer posted as
	 * `source` (empty when none was chosen). The site's one `Source`, the
	 * same object its function hands `sourceField` (9.2.0).
	 */
	source?: Source;
	/**
	 * The spam check, Cloudflare Turnstile, by the widget's site key (9.2.0).
	 * The script loads on the form's first focus, the invisible challenge runs
	 * at submit, and its token is posted as `turnstile`. A check that cannot
	 * run (the script fails to load, the challenge errors, no token in ten
	 * seconds) is reported, and the message is sent all the same, with no
	 * token, so a visitor is never stopped by a check that could not load.
	 */
	guard?: { siteKey: string };
	/**
	 * The site's words for a send the endpoint stopped as a bot's (a 403
	 * from the guard) or a platform's rate limit stopped (a 429), with the
	 * way to reach the business instead, such as its phone link. A neutral
	 * default (9.2.0).
	 */
	blockedMessage?: ReactNode;
}

function sendLead() {
	trackEvent("generate_lead", { form_name: "contact" });
}

type Status = "idle" | "sending" | "sent" | "failed";

const BLOCKED_MESSAGE = "We could not send this from your browser. Please call us instead.";

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
	phone: "Please enter a phone number with its area code.",
	email: "Please enter a valid email.",
	street: "Please enter the street address.",
	city: "Please enter the city.",
	state: "Please enter the state.",
	zip: "Please enter a 5 digit ZIP code.",
	source: "Please choose an answer.",
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
	onError,
	inlineError = true,
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
	source,
	guard,
	blockedMessage = BLOCKED_MESSAGE,
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
		source: source ? (source.required ? "required" : "optional") : "off",
	};
	// An empty list of topics is no topic select, as no list is.
	const hasTopic = Boolean(topics?.length) && !services;
	const startAddress = (): AddressParts => ({
		street: "",
		city: "",
		state: address?.defaultState ?? address?.states?.[0] ?? "",
		zip: "",
	});

	// Google's provider, made once per key and options, so the search keeps
	// one session across renders.
	const googleKey = address?.provider ? undefined : address?.googlePlacesKey;
	const googleOptions = JSON.stringify(address?.googlePlacesOptions ?? {});
	const google = useMemo(
		() =>
			googleKey
				? googlePlacesProvider({ apiKey: googleKey, ...JSON.parse(googleOptions) })
				: undefined,
		[googleKey, googleOptions],
	);
	const addressProvider = address?.provider ?? google;
	const addressAttribution =
		address?.attribution ?? (google ? <GoogleMapsAttribution /> : undefined);
	const [errors, setErrors] = useState<ContactFormRefusals>({});
	const [status, setStatus] = useState<Status>("idle");
	/** The endpoint's own words for refusing what was written, when it gave any. */
	const [refusal, setRefusal] = useState<string | null>(null);
	const [place, setPlace] = useState<AddressParts>(startAddress);
	// Whether a chosen suggestion's parts are still on their way.
	const choosing = useRef(false);
	const [sentValues, setSentValues] = useState<ContactFormValues | null>(null);
	/** Whether the endpoint said a copy went back to the visitor. */
	const [sentReceipt, setSentReceipt] = useState(false);
	/** Whether the last send was stopped as a bot's or by a rate limit. */
	const [blocked, setBlocked] = useState(false);
	const [sourceAnswer, setSourceAnswer] = useState("");
	const turnstile = useTurnstile(guard?.siteKey);
	const formRef = useRef<HTMLFormElement>(null);
	const thanksRef = useRef<HTMLDivElement>(null);
	// Where focus goes once the form or the thanks is drawn: the thanks's
	// heading when it replaces the form, the first field when the form comes back.
	const [focusOn, setFocusOn] = useState<"thanks" | "form" | null>(null);
	// Ids from useId, so two forms on one page never share a label's target.
	const uid = useId();
	const idOf = (key: string) => `${uid}-${key}`;

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
		field: TextField,
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

	/** Hands a failure to the site. A throw from the site's handler stops here. */
	function handUp(refused?: string, blocked = false) {
		try {
			onError?.(refused, { blocked });
		} catch {
			// The form has already said what it has to say.
		}
	}

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
				setRefusal(null);
				setStatus("failed");
				handUp();
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
			setSentReceipt(false);
			setStatus("sent");
			if (thanks) setFocusOn("thanks");
			window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
			return;
		}

		setStatus("sending");
		setRefusal(null);
		setBlocked(false);
		let refused: string | undefined;
		let stopped = false;
		try {
			// The spam check's token. A check that cannot run is reported and
			// the message goes without a token: the endpoint lets it through,
			// unvouched, so a lead is never lost to a check that did not load.
			let token = "";
			if (guard) {
				try {
					token = await turnstile.token();
				} catch (error) {
					reportError(
						new Error(
							`Contact form: the spam check could not run, and the message was sent without it: ${error instanceof Error ? error.message : String(error)}`,
							{ cause: error },
						),
						"handled",
					);
				}
			}
			let response: Response;
			try {
				response = await fetch(withBase(endpoint), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...contactFormBody(values, shape),
						...(guard && { [TURNSTILE_TOKEN_KEY]: token }),
					}),
				});
			} finally {
				// A token is good once, whatever the endpoint made of it.
				if (guard) turnstile.reset();
			}
			if (!response.ok) {
				// A 400 is the endpoint refusing what was written (a field over
				// its limit, say), in words meant for the visitor: shown in place
				// of the general message, since trying again would not help. A
				// 403 from the guard, or a rate limit's 429, is a send stopped as
				// a bot's, and the visitor is told how else to reach the business.
				const answer =
					response.status === 400 || response.status === 403
						? ((await response.json().catch(() => null)) as {
								error?: unknown;
								code?: unknown;
							} | null)
						: null;
				if (response.status === 429 || (response.status === 403 && answer?.code === "guard")) {
					stopped = true;
					setBlocked(true);
				} else if (response.status === 400 && typeof answer?.error === "string" && answer.error) {
					refused = answer.error;
				}
				setRefusal(refused ?? null);
				throw new Error(`status ${response.status}`);
			}
			const answer = (await response.json().catch(() => null)) as { receipt?: unknown } | null;
			setSentReceipt(answer?.receipt === true);
			setSentValues(values);
			setStatus("sent");
			form.reset();
			setPlace(startAddress());
			setSourceAnswer("");
			if (thanks) setFocusOn("thanks");
		} catch {
			setStatus("failed");
			handUp(refused, stopped);
			return;
		}
		// The conversion: only a relay the endpoint accepted counts, never a
		// press of the button, a failed send, or a honeypot catch (which the
		// relay answers with the same success so the bot never learns). No
		// personal data rides along. It sits outside the send's own try: a lead
		// event that throws is no reason to tell the visitor a message that was
		// delivered had failed.
		try {
			if (!isHoneypotFilled(company)) onLead();
		} catch {
			// The message was sent; the count of it was not.
		}
	}

	if (thanks && status === "sent" && sentValues) {
		return (
			<ContactThanks
				thanks={thanks}
				values={sentValues}
				sent={{ receipt: sentReceipt }}
				successMessage={successMessage}
				shape={shape}
				hasTopic={hasTopic}
				titleRef={thanksRef}
				onAgain={() => {
					// Back to a fresh form, whichever way it was sent: the address the
					// form holds goes with the rest of the last visitor's words.
					setStatus("idle");
					setErrors({});
					setSentValues(null);
					setSentReceipt(false);
					setPlace(startAddress());
					setSourceAnswer("");
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
	// A hand edit to an address field drops a pick still being read, so the
	// late pick never writes over what the visitor typed.
	const setPart = (part: keyof AddressParts) => (value: string) => {
		choosing.current = false;
		setPlace((was) => ({ ...was, [part]: value }));
	};
	const addressOptional = shape.address === "optional";
	const searchShown = Boolean(addressProvider);

	return (
		<form
			ref={formRef}
			onSubmit={handleSubmit}
			// The spam check's script loads on the first focus inside the form,
			// never with the page, so a visitor who never writes never loads it.
			onFocus={guard ? turnstile.prepare : undefined}
			noValidate
		>
			{/* One shot status: the thanks or the failure is announced once when it
			    appears (Component Rules 14). The region is always drawn, so a screen
			    reader is already watching it when the words arrive. */}
			<output className="form-status">
				{status === "sent" && <span className="form-success">{successMessage}</span>}
				{status === "failed" && (inlineError || !onError) && (
					<span className="form-error">{blocked ? blockedMessage : (refusal ?? errorMessage)}</span>
				)}
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
				textField("name", { autoComplete: "name", required: true })
			)}
			{(() => {
				const emailField = textField("email", {
					type: "email",
					autoComplete: "email",
					required: true,
				});
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
							provider={addressProvider}
							label={labels.addressSearch}
							hint={addressOptional ? labels.optional : undefined}
							placeholder={placeholders.addressSearch ?? "Start typing an address"}
							attribution={addressAttribution}
							listLabel={labels.suggestions}
							onChoose={() => {
								choosing.current = true;
							}}
							onPick={(picked) => {
								// A hand edit came first: the form keeps it, and the search
								// goes back to what was typed (8.6.0).
								if (!choosing.current) return false;
								choosing.current = false;
								// A pick with no state keeps the one the field shows, so a state
								// select and what it submits never part ways.
								setPlace((was) => ({ ...picked, state: picked.state || was.state }));
								// Only a field the pick filled with a valid value stops being refused.
								const filled: Record<keyof AddressParts, boolean> = {
									street: Boolean(picked.street),
									city: Boolean(picked.city),
									state: Boolean(picked.state),
									zip: isZIP(picked.zip),
								};
								setErrors((was) => ({
									...was,
									...Object.fromEntries(
										(Object.keys(filled) as (keyof AddressParts)[])
											.filter((part) => filled[part])
											.map((part) => [part, undefined]),
									),
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
						<label htmlFor={idOf("topic")}>{labels.topic}</label>
						<select id={idOf("topic")} name="topic">
							{topics?.map((topic) => (
								<option key={topic}>{topic}</option>
							))}
						</select>
					</div>
				)
			)}
			{source && (
				<SourceSelector
					source={source}
					value={sourceAnswer}
					onChange={setSourceAnswer}
					id={idOf("source")}
					hint={source.required ? undefined : labels.optional}
					error={errors.source ? errorWords.source : undefined}
				/>
			)}
			<div className={fieldClass("message")}>
				<label htmlFor={idOf("message")}>{labels.message}</label>
				<textarea
					id={idOf("message")}
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
						inline={consent.inline}
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
				<label htmlFor={idOf("company")}>Company</label>
				<input id={idOf("company")} name="company" type="text" tabIndex={-1} autoComplete="off" />
			</div>
			{/* The spam check's widget, rendered here by the script once it loads.
			    The widget made for the form is invisible, so nothing shows. */}
			{guard && <div ref={turnstile.containerRef} className="contact-guard" />}
			<Button type="submit" size="lg" arrow style={{ width: "100%" }}>
				{status === "sending" ? labels.sending : labels.submit}
			</Button>
			{footnote && <p className="muted form-footnote">{footnote}</p>}
		</form>
	);
}

interface ContactThanksProps {
	thanks: ContactFormThanks;
	values: ContactFormValues;
	sent: ContactFormSent;
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
	sent,
	successMessage,
	shape,
	hasTopic,
	titleRef,
	onAgain,
}: ContactThanksProps) {
	const level = thanks.headingLevel ?? 3;
	const read = (words: ContactThanksWords) =>
		typeof words === "function" ? words(values, sent) : words;
	// The lead as read: a function may answer none (null or false) for one
	// send and words for another, a copy on its way only when one is, and none
	// draws no element at all, as a lead of null does.
	const lead =
		thanks.lead === null || thanks.lead === false ? null : read(thanks.lead ?? successMessage);
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
	const rows: { label: string; value: ReactNode }[] = [];
	if (labels) {
		const { address } = values;
		if (shape.services && values.services.length > 0)
			rows.push({ label: labels.services, value: values.services.join(", ") });
		if (hasTopic && values.topic) rows.push({ label: labels.topic, value: values.topic });
		// A state alone, left at its default, is not an address.
		if (shape.address !== "off" && (address.street || address.city || address.zip))
			rows.push({ label: labels.address, value: addressLine(address) });
		// The visitor's own number and address, read back as links (Component Rules 17).
		const reach = [
			values.phone && <PhoneLink key="phone" phone={values.phone} />,
			values.email && (
				<EmailLink key="email" email={values.email}>
					{values.email}
				</EmailLink>
			),
		].filter(Boolean);
		if (reach.length)
			rows.push({
				label: labels.contact,
				value: reach.flatMap((link, at) => (at ? [", ", link] : [link])),
			});
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
			{lead !== null && lead !== false && lead !== undefined && (
				<p className="contact-thanks-lead">{lead}</p>
			)}
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
