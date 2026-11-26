import { ArrowLeft, Check, ChevronUp, Phone as PhoneIcon, X } from "lucide-react";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { PhoneLink } from "../primitives/PhoneLink";
import type { Phone } from "../types";

/** One row of the summary: what it is and what has been chosen. */
export interface StepFormSummaryRow {
	/** "What", "When". */
	label: string;
	/** What was chosen; none shows the summary's empty words. */
	value?: ReactNode;
	/** A quieter line under the value: "About 30 minutes". */
	detail?: ReactNode;
}

/** Every word the shell draws that is not a step's, each with a neutral default. */
export interface StepFormLabels {
	/** The step names' list. */
	steps: string;
	/** A finished step's name, as a button back to it. */
	backTo: (step: string) => string;
	back: string;
	next: string;
	/** The summary's heading, beside the step and over the sheet. */
	summaryTitle: string;
	/** The summary's name to a screen reader. */
	summaryLabel: string;
	/** A summary row with nothing chosen yet. */
	empty: string;
	/** Before the call link beside the step and in the phone's bar. */
	callPrompt: string;
	/** The call link's words. */
	call: (display: string) => string;
	/** The sheet's close button. */
	close: string;
}

const LABELS: StepFormLabels = {
	steps: "Steps",
	backTo: (step) => `Back to ${step}`,
	back: "Back",
	next: "Continue",
	summaryTitle: "Your Request",
	summaryLabel: "Your request so far",
	empty: "Not chosen yet",
	callPrompt: "Rather talk now?",
	call: (display) => `Call ${display}`,
	close: "Close",
};

export interface StepFormProps {
	/** The steps' names, in order: "What", "When", "Who". */
	steps: string[];
	/** The step showing, from 0. */
	current: number;
	/** Called with a finished step's index when its name is pressed. */
	onStep: (index: number) => void;
	/** Called by Back, shown from the second step on. */
	onBack: () => void;
	/** Called by the step's button and by Enter in a field: check the step, then move on or send. */
	onNext: () => void;
	/** The step's button's words. Defaults to "Continue". */
	nextLabel?: string;
	/** Whether a send is under way: the buttons hold still. */
	busy?: boolean;
	/** The step's heading. */
	title: ReactNode;
	/** The line under it. */
	lead?: ReactNode;
	/** The step's fields. The shell owns none. */
	children: ReactNode;
	/** A notice over the step, such as the count of fields to fix. */
	alert?: ReactNode;
	/** The summary's rows, beside the step from 900px and in the phone's sheet. */
	summary: StepFormSummaryRow[];
	/** The standing line under the summary: what the business promises once this is sent. */
	promise?: ReactNode;
	/**
	 * The summary in the phone's bar, two short lines (what, then when). With
	 * neither line, the bar offers the phone in their place.
	 */
	sentence?: [string?, string?];
	/** The business's phone: the call link beside the step and the bar's call button. */
	phone?: Pick<Phone, "display" | "e164">;
	labels?: Partial<StepFormLabels>;
	/** The level the step's heading is read at. Defaults to 2. */
	headingLevel?: 2 | 3 | 4;
	className?: string;
}

/**
 * The shell a form taken in steps is built on. It owns four things and no
 * fields: the step names across the top, a finished step a button back to
 * it; one step showing at a time, with Back and the step's button; a summary
 * of what has been chosen that stays in view, a card pinned beside the step
 * from 900px and, below that, two short lines in a bar pinned to the foot of
 * the screen that open the whole summary as a sheet, a modal dialog; and the
 * business's phone, a call button in that bar and the number in its place
 * before anything is chosen. Moving to a step puts focus on its heading and
 * the form's top in view. The step's button and Enter in any field both call
 * `onNext`, so the form checks the step before it moves on.
 */
export function StepForm({
	steps,
	current,
	onStep,
	onBack,
	onNext,
	nextLabel,
	busy = false,
	title,
	lead,
	children,
	alert,
	summary,
	promise,
	sentence,
	phone,
	labels: labelProps,
	headingLevel = 2,
	className,
}: StepFormProps) {
	const labels = { ...LABELS, ...labelProps };
	const formId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLDivElement>(null);
	const sheetRef = useRef<HTMLDialogElement>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const shownStep = useRef(current);

	// A new step: its heading takes focus, and the form's top comes into view.
	useEffect(() => {
		if (shownStep.current === current) return;
		shownStep.current = current;
		titleRef.current?.focus({ preventScroll: true });
		const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		rootRef.current?.scrollIntoView?.({ block: "start", behavior: still ? "auto" : "smooth" });
	}, [current]);

	// The sheet is the platform's modal dialog: it traps focus, Escape closes
	// it, and focus goes back to the bar's summary when it does.
	useLayoutEffect(() => {
		const sheet = sheetRef.current;
		if (!sheet) return;
		if (sheetOpen && !sheet.open) sheet.showModal?.();
		if (!sheetOpen && sheet.open) sheet.close();
	}, [sheetOpen]);

	// Past 900px the sheet is hidden and the summary sits beside the step, so a
	// sheet left open (a phone turned sideways) closes rather than stay modal unseen.
	useEffect(() => {
		if (!sheetOpen || typeof window.matchMedia !== "function") return;
		const wide = window.matchMedia("(min-width: 900px)");
		const close = () => {
			if (wide.matches) setSheetOpen(false);
		};
		wide.addEventListener?.("change", close);
		return () => wide.removeEventListener?.("change", close);
	}, [sheetOpen]);

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (!busy) onNext();
	};

	const [what, when] = sentence ?? [];
	const said = [what, when].filter(Boolean).join(", ");
	const button = nextLabel ?? labels.next;
	const rows = (
		<dl className="stf-sum">
			{summary.map((row) => {
				const filled = row.value !== undefined && row.value !== null && row.value !== "";
				return (
					<div key={row.label}>
						<dt>{row.label}</dt>
						<dd className={filled ? undefined : "is-empty"}>
							{filled ? row.value : labels.empty}
							{filled && row.detail && <small>{row.detail}</small>}
						</dd>
					</div>
				);
			})}
		</dl>
	);
	const promiseLine = promise && <p className="stf-promise">{promise}</p>;

	return (
		<div ref={rootRef} className={["step-form", className].filter(Boolean).join(" ")}>
			<div className="stf-main">
				<ol className="stf-steps" aria-label={labels.steps}>
					{steps.map((name, index) => {
						const state = index < current ? "is-done" : index === current ? "is-now" : undefined;
						return (
							<li
								key={name}
								className={state}
								aria-current={index === current ? "step" : undefined}
							>
								{index < current ? (
									<button
										type="button"
										className="stf-step"
										aria-label={labels.backTo(name)}
										onClick={() => onStep(index)}
									>
										<i aria-hidden="true">
											<Check size={16} strokeWidth={3} />
										</i>
										<span>{name}</span>
									</button>
								) : (
									<span className="stf-step">
										<i aria-hidden="true">{index + 1}</i>
										<span>{name}</span>
									</span>
								)}
							</li>
						);
					})}
				</ol>

				{alert && (
					<div className="form-alert" role="alert">
						{alert}
					</div>
				)}

				{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
				<div
					ref={titleRef}
					className="stf-title"
					role="heading"
					aria-level={headingLevel}
					tabIndex={-1}
				>
					{title}
				</div>
				{lead && <p className="stf-lead">{lead}</p>}

				<form id={formId} className="stf-fields" onSubmit={submit} noValidate>
					{children}
				</form>

				<div className="stf-actions">
					{current > 0 && (
						<button type="button" className="stf-back" onClick={onBack} disabled={busy}>
							{labels.back}
						</button>
					)}
					<StepButton formId={formId} busy={busy}>
						{button}
					</StepButton>
				</div>
			</div>

			<aside className="stf-summary" aria-label={labels.summaryLabel}>
				{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
				<div className="stf-summary-title" role="heading" aria-level={headingLevel + 1}>
					{labels.summaryTitle}
				</div>
				{rows}
				{promiseLine}
				{phone && (
					<p className="stf-summary-call">
						{labels.callPrompt} <PhoneLink phone={phone}>{labels.call(phone.display)}</PhoneLink>
					</p>
				)}
			</aside>

			<div className="stf-bar">
				<div className="stf-bar-top">
					{said ? (
						<button
							type="button"
							className="stf-bar-sum"
							aria-haspopup="dialog"
							aria-expanded={sheetOpen}
							aria-label={`${labels.summaryLabel}: ${said}`}
							onClick={() => setSheetOpen(true)}
						>
							<span>
								<strong>{what}</strong>
								{when && <em>{when}</em>}
							</span>
							<ChevronUp aria-hidden="true" size={18} strokeWidth={2.25} />
						</button>
					) : (
						phone && (
							<PhoneLink className="stf-bar-talk" phone={phone}>
								<span>{labels.callPrompt}</span>
								<strong>{labels.call(phone.display)}</strong>
							</PhoneLink>
						)
					)}
				</div>
				<div className="stf-bar-actions">
					{current > 0 && (
						<button
							type="button"
							className="stf-bar-back"
							aria-label={labels.back}
							onClick={onBack}
							disabled={busy}
						>
							<ArrowLeft aria-hidden="true" size={22} strokeWidth={2.25} />
						</button>
					)}
					<StepButton formId={formId} busy={busy}>
						{button}
					</StepButton>
					{phone && (
						<PhoneLink
							className="stf-bar-call"
							phone={phone}
							aria-label={labels.call(phone.display)}
						>
							<PhoneIcon aria-hidden="true" size={22} strokeWidth={2} />
						</PhoneLink>
					)}
				</div>
			</div>

			<dialog
				ref={sheetRef}
				className="stf-sheet"
				aria-label={labels.summaryLabel}
				onClose={() => setSheetOpen(false)}
				// A press on the backdrop lands on the dialog itself, outside its box.
				onClick={(event) => {
					if (event.target === event.currentTarget) setSheetOpen(false);
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") setSheetOpen(false);
				}}
			>
				<div className="stf-sheet-body">
					<div className="stf-sheet-head">
						{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
						<div className="stf-summary-title" role="heading" aria-level={headingLevel + 1}>
							{labels.summaryTitle}
						</div>
						<button
							type="button"
							className="stf-sheet-close"
							aria-label={labels.close}
							onClick={() => setSheetOpen(false)}
						>
							<X aria-hidden="true" size={20} strokeWidth={2.25} />
						</button>
					</div>
					{rows}
					{promiseLine}
				</div>
			</dialog>
		</div>
	);
}

/** The step's button: a submit for the step's form, wherever it sits. */
function StepButton({
	formId,
	busy,
	children,
}: {
	formId: string;
	busy: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="submit"
			form={formId}
			className="btn btn-primary btn-lg stf-next"
			aria-disabled={busy || undefined}
		>
			{children}
		</button>
	);
}
