import { Check } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";
import { MonthCalendar } from "../components/MonthCalendar";
import {
	clockLabel,
	dayIn,
	firstDay,
	isWorkingDay,
	lastDay,
	longDayLabel,
	shortDayLabel,
	timeSlots,
} from "../forms/calendar";
import { TURNSTILE_TOKEN_KEY } from "../forms/guard";
import {
	askedForWords,
	calendarRules,
	DEFAULT_CONFIRM_WITHIN,
	DEFAULT_MATERIAL_LABEL,
	findKind,
	findMaterial,
	lengthOf,
	lengthWords,
	modeFor,
	modeWords,
	oneWayNote,
	type ScheduleConfig,
	type ScheduleMode,
	waysFor,
} from "../forms/scheduleConfig";
import { sourceDetailFor } from "../forms/source";
import { addressLine } from "../lib/contactForm";
import { EMAIL_PATTERN, toE164 } from "../lib/contactLinks";
import { type GooglePlacesOptions, googlePlacesProvider } from "../lib/googlePlaces";
import { newTabProps } from "../lib/newTabProps";
import { trackEvent } from "../lib/trackEvent";
import { useTurnstile } from "../lib/turnstile";
import { reportError } from "../monitoring/catcher";
import {
	type AddressParts,
	type AddressProvider,
	AddressSearch,
} from "../primitives/AddressSearch";
import { ChoiceCards } from "../primitives/ChoiceCards";
import { EmailLink } from "../primitives/EmailLink";
import { ExpandableText } from "../primitives/ExpandableText";
import { GoogleMapsAttribution } from "../primitives/GoogleMapsAttribution";
import { PhoneLink } from "../primitives/PhoneLink";
import { SourceSelector } from "../primitives/SourceSelector";
import { useWithBase } from "../routing/BasePathProvider";
import { StepForm, type StepFormLabels } from "./StepForm";

/** What a visitor has entered so far. */
export interface ScheduleRequestValues {
	kind: string;
	material: string;
	/** "visit", "call", or empty before a choice. */
	mode: string;
	day: string;
	time: string;
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	address: AddressParts;
	source: string;
	sourceDetail: string;
	note: string;
	consent: boolean;
}

/** A field the form can refuse, in the page's order. */
export type ScheduleRequestField =
	| "kind"
	| "mode"
	| "day"
	| "time"
	| "firstName"
	| "lastName"
	| "phone"
	| "email"
	| "street"
	| "source";

/** Every word the form draws that is not the business's config, each with a neutral default. */
export interface ScheduleRequestLabels {
	steps: [string, string, string];
	whatTitle: string;
	whatLead: string;
	whenTitle: string;
	whenLead: string;
	whoTitle: string;
	whoLead: string;
	kind: string;
	choose: string;
	modeLegend: string;
	day: string;
	/** The line under the calendar. */
	dayHint: (first: string, holidays: boolean) => string;
	time: string;
	chooseTime: string;
	morning: string;
	afternoon: string;
	/** The line under the time. */
	timeHint: (within: string) => string;
	firstName: string;
	lastName: string;
	phone: string;
	email: string;
	addressSearch: string;
	addressPlaceholder: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	note: string;
	optional: string;
	suggestions: string;
	showMore: string;
	showLess: string;
	send: string;
	sending: string;
	/** The summary's promise. */
	promise: (within: string) => ReactNode;
	/** The count of fields to fix over the step. */
	alert: (count: number, last: boolean) => string;
	doneTitle: (firstName: string) => string;
	/** The line under it: whether a copy went to the visitor decides its last words. */
	doneLead: (email: string, receipt: boolean) => string;
	doneNextHead: string;
	/** What happens next, in order. */
	doneNext: (mode: ScheduleMode, within: string, receipt: boolean, next: string) => string[];
	doneSooner: string;
	/** The call link's words after it. */
	call: (display: string) => string;
	again: string;
	summaryRows: {
		what: string;
		how: string;
		when: string;
		where: string;
		askedFor: string;
		reach: string;
	};
	/** The shell's own words. */
	shell?: Partial<StepFormLabels>;
}

const LABELS: ScheduleRequestLabels = {
	steps: ["What", "When", "Who"],
	whatTitle: "What can we help with?",
	whatLead: "Tell us what you need and how you would like to meet.",
	whenTitle: "When works for you?",
	whenLead: "Pick the day and the time you would like.",
	whoTitle: "Who should we contact?",
	whoLead: "This is how our office reaches you to confirm the time.",
	kind: "What do you need help with?",
	choose: "Choose one",
	modeLegend: "How would you like to meet?",
	day: "Preferred day",
	dayHint: (first, holidays) =>
		`The first day you can ask for is ${first}. We work Monday to Friday${holidays ? ", except federal holidays" : ""}.`,
	time: "What time?",
	chooseTime: "Choose a time",
	morning: "Morning",
	afternoon: "Afternoon",
	timeHint: (within) =>
		`This is the time you are asking for. Our office confirms it with you within ${within}.`,
	firstName: "First name",
	lastName: "Last name",
	phone: "Phone",
	email: "Email",
	addressSearch: "Property address",
	addressPlaceholder: "Start typing your address",
	street: "Street address",
	city: "City",
	state: "State",
	zip: "ZIP",
	note: "Anything we should know?",
	optional: "(optional)",
	suggestions: "Address suggestions",
	showMore: "Show more",
	showLess: "Show less",
	send: "Send Request",
	sending: "Sending…",
	promise: (within) => (
		<>
			<strong>This is a request.</strong> Our office confirms your time within {within}.
		</>
	),
	alert: (count, last) =>
		`${count === 1 ? "One thing needs" : `${count} things need`} fixing before ${last ? "we can send this." : "you can go on."}`,
	doneTitle: (first) => `We have your request${first ? `, ${first}` : ""}.`,
	doneLead: (email, receipt) =>
		`This is a request, not a booked appointment yet.${receipt && email ? ` A copy is on its way to your email address.` : ""}`,
	doneNextHead: "What Happens Next",
	doneNext: (_mode, within, receipt, next) => [
		...(receipt ? ["You get an email with a copy of this request."] : []),
		`Our office confirms your time within ${within}, by phone or text.`,
		next,
	],
	doneSooner: "Need us sooner?",
	call: (display) => `Call ${display}`,
	again: "Make another request",
	summaryRows: {
		what: "What",
		how: "How",
		when: "When",
		where: "Where",
		askedFor: "Asked for",
		reach: "Reach you",
	},
};

const ERRORS: Record<ScheduleRequestField, string> = {
	kind: "Choose what you need help with.",
	mode: "Choose a visit or a call.",
	day: "Pick a day.",
	time: "Pick a time.",
	firstName: "Enter your first name.",
	lastName: "Enter your last name.",
	phone: "Enter a phone number with its area code.",
	email: "Enter an email address we can reply to.",
	street: "Enter the address we are visiting.",
	source: "Please choose an answer.",
};

const BLOCKED_MESSAGE = "We could not send this from your browser. Please call us instead.";
const ERROR_MESSAGE = "Something went wrong sending your request. Please try again, or call us.";

/** The property address: the search over the four fields, as the contact form draws it. */
export interface ScheduleRequestAddress {
	provider?: AddressProvider;
	/** A Maps JavaScript API key: the search offers Google's addresses. */
	googlePlacesKey?: string;
	googlePlacesOptions?: Omit<GooglePlacesOptions, "apiKey">;
	attribution?: ReactNode;
	/** Draws the state as a select of these; a text field when left out. */
	states?: string[];
	defaultState?: string;
}

/** The text consent checkbox: its own box, never ticked for the visitor. */
export interface ScheduleRequestConsent {
	/** The consent wording, verbatim: the checkbox's whole label. */
	text: ReactNode;
	links?: { label: string; href: string; newTab?: boolean }[];
	/** The lines shown while closed. Defaults to 2. */
	lines?: number;
}

export interface ScheduleRequestFormProps {
	/** The business's one config, the same object its function hands `createScheduleRequest`. */
	config: ScheduleConfig;
	/** Where the request is posted: "/api/schedule". */
	endpoint: string;
	/** The property address's search and state list. Without it, the four fields stand alone. */
	address?: ScheduleRequestAddress;
	/** The text consent checkbox; none when left out. */
	consent?: ScheduleRequestConsent;
	/** Cloudflare Turnstile by the widget's site key, run at the send as `ContactForm` runs it. */
	guard?: { siteKey: string };
	labels?: Partial<ScheduleRequestLabels>;
	/** The message under each refused field, each replacing its default. */
	errorText?: Partial<Record<ScheduleRequestField, string>>;
	/** The words for a send stopped as a bot's (a 403 from the guard, or a 429). */
	blockedMessage?: ReactNode;
	/** The words for a send that failed. */
	errorMessage?: ReactNode;
	/**
	 * Called once for each request the endpoint accepted. Defaults to the GA4
	 * `generate_lead` event with `form_name: "schedule"`; it is passed nothing.
	 */
	onLead?: () => void;
	/** What the form opens holding, for a link that arrives with a kind chosen. */
	initial?: Partial<ScheduleRequestValues>;
	/** The step the form opens on, from 0. Defaults to the first. */
	initialStep?: number;
	/** Today on the business's clock, `2026-11-25`, to pin the calendar; read from the clock by default. */
	today?: string;
	/** The level the step's heading is read at. Defaults to 2. */
	headingLevel?: 2 | 3 | 4;
	className?: string;
}

function sendLead() {
	trackEvent("generate_lead", { form_name: "schedule" });
}

const ORDER: ScheduleRequestField[] = [
	"kind",
	"mode",
	"day",
	"time",
	"firstName",
	"lastName",
	"phone",
	"email",
	"street",
	"source",
];

type Errors = Partial<Record<ScheduleRequestField, true>>;

/**
 * A request for a visit or a call, taken in three steps on the `StepForm`
 * shell (What, When, Who), then the request received. It asks for a day and
 * a time and never says booked: the business confirms the time afterward,
 * and every word says so. What can be asked for, the ways each can happen
 * and how long each takes, the materials, the office day, the calendar, the
 * promise, and the phone all come from the business's one `ScheduleConfig`,
 * which its endpoint holds every request to again. A kind or a material that
 * allows one way shows that way as a line, never a choice. The calendar
 * offers no weekend, no federal holiday, no closed day, and no day sooner
 * than the lead, and the times run every slot through the office day, the
 * last early enough to finish by closing. The address is required for a
 * visit and optional for a call.
 */
export function ScheduleRequestForm({
	config,
	endpoint,
	address,
	consent,
	guard,
	labels: labelProps,
	errorText,
	blockedMessage = BLOCKED_MESSAGE,
	errorMessage = ERROR_MESSAGE,
	onLead = sendLead,
	initial,
	initialStep = 0,
	today: pinnedToday,
	headingLevel = 2,
	className,
}: ScheduleRequestFormProps) {
	const labels = { ...LABELS, ...labelProps };
	const errorWords = { ...ERRORS, ...errorText };
	const withBase = useWithBase();
	const uid = useId();
	const idOf = (key: string) => `${uid}-${key}`;
	const rootRef = useRef<HTMLDivElement>(null);
	const doneRef = useRef<HTMLDivElement>(null);
	const rules = calendarRules(config);
	const within = config.confirmWithin ?? DEFAULT_CONFIRM_WITHIN;
	const startState = address?.defaultState ?? address?.states?.[0] ?? "";

	const blank = (): ScheduleRequestValues => ({
		kind: "",
		material: "",
		mode: "",
		day: "",
		time: "",
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		address: { street: "", city: "", state: startState, zip: "" },
		source: "",
		sourceDetail: "",
		note: "",
		consent: false,
	});
	const [values, setValues] = useState<ScheduleRequestValues>(() => ({
		...blank(),
		...initial,
		address: { ...blank().address, ...initial?.address },
	}));
	const [step, setStep] = useState(Math.max(0, Math.min(2, initialStep)));
	const [errors, setErrors] = useState<Errors>({});
	const [notice, setNotice] = useState<ReactNode>(null);
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState<{ values: ScheduleRequestValues; receipt: boolean } | null>(
		null,
	);
	const [focusDone, setFocusDone] = useState(false);
	// Today on the business's clock, read again on each visit to the calendar
	// unless a story pins it, so a tab left open overnight offers the right days.
	const [today, setToday] = useState(() => pinnedToday ?? dayIn(config.timeZone));
	const checking = guard;
	const turnstile = useTurnstile(checking?.siteKey);
	const honeypot = useRef<HTMLInputElement>(null);

	const googleKey = address?.provider ? undefined : address?.googlePlacesKey;
	const googleOptions = JSON.stringify(address?.googlePlacesOptions ?? {});
	const google = useMemo(
		() =>
			googleKey
				? googlePlacesProvider({ apiKey: googleKey, ...JSON.parse(googleOptions) })
				: undefined,
		[googleKey, googleOptions],
	);
	const provider = address?.provider ?? google;
	const attribution = address?.attribution ?? (google ? <GoogleMapsAttribution /> : undefined);

	useEffect(() => {
		if (step === 1 && !pinnedToday) setToday(dayIn(config.timeZone));
	}, [step, pinnedToday, config.timeZone]);

	useEffect(() => {
		if (!focusDone) return;
		doneRef.current?.focus({ preventScroll: true });
		rootRef.current?.scrollIntoView?.({ block: "start" });
		setFocusDone(false);
	}, [focusDone]);

	const set = (patch: Partial<ScheduleRequestValues>) => setValues((was) => ({ ...was, ...patch }));
	const clear = (...fields: ScheduleRequestField[]) => {
		setNotice(null);
		setErrors((was) => {
			const next = { ...was };
			for (const field of fields) delete next[field];
			return next;
		});
	};

	// What was asked for, and the ways it can happen.
	const kind = findKind(config, values.kind);
	const material = findMaterial(config, kind, values.material);
	const ways = waysFor(kind, material);
	const mode = modeFor(kind, material, values.mode);
	const oneWay = Boolean(kind) && ways.length === 1;
	const minutes = kind && mode ? lengthOf(kind, mode) : (config.slotMinutes ?? 30);

	// The calendar and the times.
	const first = firstDay(today, rules);
	const last = lastDay(today, rules);
	const times = timeSlots(rules, minutes);
	const dayOpen = (day: string) => day >= first && day <= last && isWorkingDay(day, rules);
	const time = times.includes(values.time) ? values.time : "";

	// A state alone, left at its default, is not an address.
	const where =
		values.address.street || values.address.city || values.address.zip
			? addressLine(values.address)
			: "";

	const check = (at: number): Errors => {
		const found: Errors = {};
		if (at === 0) {
			if (!kind) found.kind = true;
			else if (!mode) found.mode = true;
		}
		if (at === 1) {
			if (!values.day || !dayOpen(values.day)) found.day = true;
			if (!time) found.time = true;
		}
		if (at === 2) {
			if (!values.firstName.trim()) found.firstName = true;
			if (!values.lastName.trim()) found.lastName = true;
			if (toE164(values.phone) === null) found.phone = true;
			if (!EMAIL_PATTERN.test(values.email.trim())) found.email = true;
			if (mode === "visit" && !values.address.street.trim()) found.street = true;
			if (config.source?.required && !values.source) found.source = true;
		}
		return found;
	};

	/** Focus goes to the first field to fix, where its message is read. */
	const focusField = (field: ScheduleRequestField) => {
		const root = rootRef.current;
		if (!root) return;
		const target =
			field === "mode"
				? root.querySelector<HTMLElement>(".choice-card input")
				: field === "day"
					? root.querySelector<HTMLElement>('.mc-day[tabindex="0"]')
					: root.ownerDocument.getElementById(idOf(field));
		target?.focus();
	};

	const go = (to: number) => {
		setErrors({});
		setNotice(null);
		setStep(to);
	};

	async function send() {
		setSending(true);
		setNotice(null);
		const body: Record<string, unknown> = {
			kind: values.kind,
			material: material?.id ?? "",
			mode,
			day: values.day,
			time,
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			phone: values.phone.trim(),
			email: values.email.trim(),
			address: values.address,
			source: values.source,
			sourceDetail:
				config.source && sourceDetailFor(config.source, values.source)
					? values.sourceDetail.trim()
					: "",
			note: values.note.trim(),
			...(consent && { consent: values.consent }),
			company: honeypot.current?.value ?? "",
		};
		try {
			let token = "";
			if (checking) {
				try {
					token = await turnstile.token();
				} catch (error) {
					reportError(
						new Error(
							`Schedule form: the spam check could not run, and the request was sent without it: ${error instanceof Error ? error.message : String(error)}`,
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
					body: JSON.stringify({ ...body, ...(checking && { [TURNSTILE_TOKEN_KEY]: token }) }),
				});
			} finally {
				if (checking) turnstile.reset();
			}
			if (!response.ok) {
				const answer = (await response.json().catch(() => null)) as {
					error?: unknown;
					code?: unknown;
				} | null;
				if (response.status === 429 || (response.status === 403 && answer?.code === "guard")) {
					setNotice(blockedMessage);
				} else if (
					response.status === 400 &&
					typeof answer?.error === "string" &&
					answer.error &&
					{ what: 0, when: 1, who: 2 }[String(answer.code)] !== undefined
				) {
					// The endpoint held the request to the calendar and said why: the
					// visitor goes back to the step it belongs to.
					const back = { what: 0, when: 1, who: 2 }[String(answer.code)];
					if (back !== undefined && back !== step) setStep(back);
					setNotice(answer.error);
				} else {
					setNotice(errorMessage);
				}
				return;
			}
			const answer = (await response.json().catch(() => null)) as { receipt?: unknown } | null;
			setSent({ values: { ...values, mode, time }, receipt: answer?.receipt === true });
			setFocusDone(true);
			try {
				onLead();
			} catch {
				// The request was sent; the count of it was not.
			}
		} catch {
			setNotice(errorMessage);
		} finally {
			setSending(false);
		}
	}

	const next = () => {
		if (sending) return;
		const found = check(step);
		setErrors(found);
		const firstBad = ORDER.find((field) => found[field]);
		if (firstBad) {
			setNotice(null);
			focusField(firstBad);
			return;
		}
		if (step < 2) {
			// The way and the time as the form now reads them, so a one way
			// request carries its way and a time the length ruled out is dropped.
			set({ mode, time });
			go(step + 1);
			return;
		}
		void send();
	};

	if (sent) {
		return (
			<ScheduleRequestDone
				config={config}
				labels={labels}
				sent={sent}
				rootRef={rootRef}
				titleRef={doneRef}
				headingLevel={headingLevel}
				className={className}
				onAgain={() => {
					setSent(null);
					setValues(blank());
					setErrors({});
					setNotice(null);
					setStep(0);
				}}
			/>
		);
	}

	const refused = (field: ScheduleRequestField) =>
		errors[field]
			? { "aria-invalid": true as const, "aria-describedby": `${idOf(field)}-error` }
			: {};
	const fieldClass = (field?: ScheduleRequestField) =>
		["field", field && errors[field] && "invalid"].filter(Boolean).join(" ");
	const errorLine = (field: ScheduleRequestField) => (
		<span className="err" id={`${idOf(field)}-error`}>
			{errorWords[field]}
		</span>
	);
	const optional = (
		<>
			{" "}
			<small className="field-hint">{labels.optional}</small>
		</>
	);
	const textField = (
		field: "firstName" | "lastName" | "phone" | "email",
		input: { type?: string; autoComplete: string; inputMode?: "tel" },
	) => (
		<div className={fieldClass(field)}>
			<label htmlFor={idOf(field)}>{labels[field]}</label>
			<input
				id={idOf(field)}
				name={field}
				type={input.type ?? "text"}
				autoComplete={input.autoComplete}
				inputMode={input.inputMode}
				value={values[field]}
				onChange={(event) => {
					set({ [field]: event.target.value });
					if (errors[field]) clear(field);
				}}
				{...refused(field)}
			/>
			{errorLine(field)}
		</div>
	);
	const setPart = (part: keyof AddressParts) => (value: string) => {
		setValues((was) => ({ ...was, address: { ...was.address, [part]: value } }));
		if (part === "street" && errors.street) clear("street");
	};
	const stateOptions =
		address?.states && values.address.state && !address.states.includes(values.address.state)
			? [...address.states, values.address.state]
			: address?.states;

	const count = Object.keys(errors).length;
	const alert = notice ?? (count > 0 ? labels.alert(count, step === 2) : null);
	const way = mode ? modeWords(config, mode) : null;
	const timeWords = time ? clockLabel(time) : "";

	const title = [labels.whatTitle, labels.whenTitle, labels.whoTitle][step];
	const lead = [labels.whatLead, labels.whenLead, labels.whoLead][step];

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: focus bubbling up from the fields only warms the Turnstile script, as ContactForm does on its form
		<div
			ref={rootRef}
			className={["schedule-request-form", className].filter(Boolean).join(" ")}
			onFocus={checking ? turnstile.prepare : undefined}
		>
			<StepForm
				steps={labels.steps}
				current={step}
				onStep={go}
				onBack={() => go(Math.max(0, step - 1))}
				onNext={next}
				nextLabel={step === 2 ? (sending ? labels.sending : labels.send) : undefined}
				busy={sending}
				title={title}
				lead={lead}
				alert={alert}
				headingLevel={headingLevel}
				labels={labels.shell}
				phone={config.phone}
				promise={labels.promise(within)}
				summary={[
					{ label: labels.summaryRows.what, value: kind?.label, detail: material?.label },
					{
						label: labels.summaryRows.how,
						value: way?.long,
						detail: kind && mode ? lengthWords(lengthOf(kind, mode)) : undefined,
					},
					{
						label: labels.summaryRows.when,
						value: values.day ? longDayLabel(values.day) : timeWords || undefined,
						detail: values.day ? timeWords : undefined,
					},
					...(where ? [{ label: labels.summaryRows.where, value: where }] : []),
				]}
				sentence={[
					[kind?.label, way?.short].filter(Boolean).join(", ") || undefined,
					[values.day && shortDayLabel(values.day), timeWords].filter(Boolean).join(", ") ||
						undefined,
				]}
			>
				{step === 0 && (
					<>
						<div className={fieldClass("kind")}>
							<label htmlFor={idOf("kind")}>{labels.kind}</label>
							<select
								id={idOf("kind")}
								name="kind"
								value={values.kind}
								onChange={(event) => {
									set({ kind: event.target.value, material: "", mode: "" });
									clear("kind", "mode");
								}}
								{...refused("kind")}
							>
								<option value="">{labels.choose}</option>
								{config.kinds.map((one) => (
									<option key={one.id} value={one.id}>
										{one.label}
									</option>
								))}
							</select>
							{errorLine("kind")}
						</div>
						{kind?.materials && config.materials?.length ? (
							<div className="field">
								<label htmlFor={idOf("material")}>
									{config.materialLabel ?? DEFAULT_MATERIAL_LABEL}
									{optional}
								</label>
								<select
									id={idOf("material")}
									name="material"
									value={material?.id ?? ""}
									onChange={(event) => {
										set({ material: event.target.value });
										clear("mode");
									}}
								>
									<option value="">{labels.choose}</option>
									{config.materials.map((one) => (
										<option key={one.id} value={one.id}>
											{one.label}
										</option>
									))}
								</select>
							</div>
						) : null}
						{oneWay && kind && mode ? (
							<p className="stf-note">
								<strong>{oneWayNote(config, kind, material, mode)}</strong>{" "}
								{`${lengthWords(lengthOf(kind, mode))}.`}
							</p>
						) : (
							<ChoiceCards
								legend={labels.modeLegend}
								name={idOf("mode")}
								value={mode}
								onChange={(chosen) => {
									set({ mode: chosen });
									clear("mode");
								}}
								error={errors.mode ? errorWords.mode : undefined}
								options={ways.map((one) => {
									const words = modeWords(config, one);
									return {
										value: one,
										label: words.label,
										description: kind
											? `${lengthWords(lengthOf(kind, one))}. ${words.line}`
											: words.line,
									};
								})}
							/>
						)}
					</>
				)}

				{step === 1 && (
					<>
						<MonthCalendar
							label={labels.day}
							value={values.day}
							first={first}
							last={last}
							isAvailable={(day) => isWorkingDay(day, rules)}
							onChange={(day) => {
								set({ day });
								clear("day");
							}}
							error={errors.day ? errorWords.day : undefined}
						/>
						<p className="stf-hint">
							{labels.dayHint(longDayLabel(first), config.holidays ?? true)}
						</p>
						<div className={fieldClass("time")}>
							<label htmlFor={idOf("time")}>{labels.time}</label>
							<select
								id={idOf("time")}
								name="time"
								value={time}
								onChange={(event) => {
									set({ time: event.target.value });
									clear("time");
								}}
								{...refused("time")}
							>
								<option value="">{labels.chooseTime}</option>
								{[
									{ label: labels.morning, times: times.filter((one) => one < "12:00") },
									{ label: labels.afternoon, times: times.filter((one) => one >= "12:00") },
								]
									.filter((group) => group.times.length > 0)
									.map((group) => (
										<optgroup key={group.label} label={group.label}>
											{group.times.map((one) => (
												<option key={one} value={one}>
													{clockLabel(one)}
												</option>
											))}
										</optgroup>
									))}
							</select>
							{errorLine("time")}
						</div>
						<p className="stf-hint">{labels.timeHint(within)}</p>
					</>
				)}

				{step === 2 && (
					<>
						<div className="field-row">
							{textField("firstName", { autoComplete: "given-name" })}
							{textField("lastName", { autoComplete: "family-name" })}
						</div>
						<div className="field-row">
							{textField("phone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
							{textField("email", { type: "email", autoComplete: "email" })}
						</div>
						{provider && (
							<AddressSearch
								className="field"
								provider={provider}
								label={labels.addressSearch}
								hint={mode === "call" ? labels.optional : undefined}
								placeholder={labels.addressPlaceholder}
								attribution={attribution}
								listLabel={labels.suggestions}
								onPick={(picked) => {
									setValues((was) => ({
										...was,
										address: { ...picked, state: picked.state || was.address.state },
									}));
									if (picked.street) clear("street");
								}}
							/>
						)}
						<div className={fieldClass("street")}>
							<label htmlFor={idOf("street")}>
								{labels.street}
								{mode === "call" && !provider && optional}
							</label>
							<input
								id={idOf("street")}
								name="street"
								autoComplete="address-line1"
								value={values.address.street}
								onChange={(event) => setPart("street")(event.target.value)}
								{...refused("street")}
							/>
							{errorLine("street")}
						</div>
						<div className="field-row field-row-3">
							<div className="field">
								<label htmlFor={idOf("city")}>{labels.city}</label>
								<input
									id={idOf("city")}
									name="city"
									autoComplete="address-level2"
									value={values.address.city}
									onChange={(event) => setPart("city")(event.target.value)}
								/>
							</div>
							<div className="field">
								<label htmlFor={idOf("state")}>{labels.state}</label>
								{stateOptions ? (
									<select
										id={idOf("state")}
										name="state"
										autoComplete="address-level1"
										value={values.address.state}
										onChange={(event) => setPart("state")(event.target.value)}
									>
										{stateOptions.map((one) => (
											<option key={one}>{one}</option>
										))}
									</select>
								) : (
									<input
										id={idOf("state")}
										name="state"
										autoComplete="address-level1"
										value={values.address.state}
										onChange={(event) => setPart("state")(event.target.value)}
									/>
								)}
							</div>
							<div className="field">
								<label htmlFor={idOf("zip")}>{labels.zip}</label>
								<input
									id={idOf("zip")}
									name="zip"
									autoComplete="postal-code"
									inputMode="numeric"
									value={values.address.zip}
									onChange={(event) => setPart("zip")(event.target.value)}
								/>
							</div>
						</div>
						{config.source && (
							<SourceSelector
								source={config.source}
								id={idOf("source")}
								value={values.source}
								onChange={(source) => {
									if (errors.source) clear("source");
									set({ source, sourceDetail: "" });
								}}
								detail={values.sourceDetail}
								onDetailChange={(sourceDetail) => set({ sourceDetail })}
								hint={config.source.required ? undefined : labels.optional}
								detailHint={labels.optional}
								error={errors.source ? errorWords.source : undefined}
							/>
						)}
						<div className="field">
							<label htmlFor={idOf("note")}>
								{labels.note}
								{optional}
							</label>
							<textarea
								id={idOf("note")}
								name="note"
								value={values.note}
								onChange={(event) => set({ note: event.target.value })}
							/>
						</div>
						{consent && (
							<div className="contact-consent">
								<input
									id={idOf("consent")}
									className="contact-consent-box"
									type="checkbox"
									name="consent"
									checked={values.consent}
									onChange={(event) => set({ consent: event.target.checked })}
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
						{/* Honeypot: visually hidden and skipped by keyboard and screen readers;
						    a request that fills it is quietly dropped by the endpoint. */}
						<div className="hp-field" aria-hidden="true">
							<label htmlFor={idOf("company")}>Company</label>
							<input
								ref={honeypot}
								id={idOf("company")}
								name="company"
								type="text"
								tabIndex={-1}
								autoComplete="off"
							/>
						</div>
						{checking && <div ref={turnstile.containerRef} className="contact-guard" />}
					</>
				)}
			</StepForm>
		</div>
	);
}

interface DoneProps {
	config: ScheduleConfig;
	labels: ScheduleRequestLabels;
	sent: { values: ScheduleRequestValues; receipt: boolean };
	rootRef: RefObject<HTMLDivElement | null>;
	titleRef: RefObject<HTMLDivElement | null>;
	headingLevel: 2 | 3 | 4;
	className?: string;
	onAgain: () => void;
}

/** The request received: said to be a request, read back, with what happens next and the phone. */
function ScheduleRequestDone({
	config,
	labels,
	sent,
	rootRef,
	titleRef,
	headingLevel,
	className,
	onAgain,
}: DoneProps) {
	const { values, receipt } = sent;
	const within = config.confirmWithin ?? DEFAULT_CONFIRM_WITHIN;
	const kind = findKind(config, values.kind);
	const material = findMaterial(config, kind, values.material);
	const mode = (values.mode || "visit") as ScheduleMode;
	const words = modeWords(config, mode);
	const where =
		values.address.street || values.address.city || values.address.zip
			? addressLine(values.address)
			: "";
	const reach = [
		values.phone && <PhoneLink key="phone" phone={values.phone} />,
		values.email && (
			<EmailLink key="email" email={values.email}>
				{values.email}
			</EmailLink>
		),
	].filter(Boolean);
	const rows: { label: string; value: ReactNode }[] = [
		{
			label: labels.summaryRows.what,
			value: [kind?.label, material?.label].filter(Boolean).join(", "),
		},
		{
			label: labels.summaryRows.how,
			value: kind
				? `${words.long}, ${lengthWords(lengthOf(kind, mode)).toLowerCase()}`
				: words.long,
		},
		{ label: labels.summaryRows.askedFor, value: askedForWords(values.day, values.time) },
		...(where ? [{ label: labels.summaryRows.where, value: where }] : []),
		...(reach.length
			? [
					{
						label: labels.summaryRows.reach,
						value: reach.flatMap((link, at) => (at ? [", ", link] : [link])),
					},
				]
			: []),
	];
	return (
		<div
			ref={rootRef}
			className={["schedule-request-form", "is-done", className].filter(Boolean).join(" ")}
		>
			<div className="srf-done">
				<div className="contact-thanks-mark" aria-hidden="true">
					<Check size={26} strokeWidth={2.5} />
				</div>
				{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
				<div
					ref={titleRef}
					className="contact-thanks-title"
					role="heading"
					aria-level={headingLevel}
					tabIndex={-1}
				>
					{labels.doneTitle(values.firstName.trim())}
				</div>
				<p className="contact-thanks-lead">{labels.doneLead(values.email.trim(), receipt)}</p>
				<dl className="contact-thanks-summary">
					{rows.map((row) => (
						<div key={row.label}>
							<dt>{row.label}</dt>
							<dd>{row.value}</dd>
						</div>
					))}
				</dl>
				{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
				<div className="contact-thanks-steps-head" role="heading" aria-level={headingLevel + 1}>
					{labels.doneNextHead}
				</div>
				<ol className="contact-thanks-steps">
					{labels.doneNext(mode, within, receipt, words.next).map((line) => (
						<li key={line}>{line}</li>
					))}
				</ol>
				<p className="srf-sooner">
					{labels.doneSooner}{" "}
					<PhoneLink phone={config.phone}>{labels.call(config.phone.display)}</PhoneLink>
				</p>
				<button type="button" className="contact-thanks-again" onClick={onAgain}>
					{labels.again}
				</button>
			</div>
		</div>
	);
}
