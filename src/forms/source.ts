/**
 * The Source Selector's settings: how a visitor heard about the business,
 * stated once by a site and read by both halves of its form. The page hands
 * it to `ContactForm` (`source`), which draws the `SourceSelector`; the
 * function hands it to `sourceField`, which lists the answer among the
 * endpoint's fields. One object, so the question the visitor reads and the
 * answers the endpoint accepts can never drift apart.
 *
 *   export const source: Source = {
 *     label: "How did you hear about us?",
 *     options: ["Google", "A friend", "Instagram", "Something else"],
 *   };
 *
 * An answer may ask for a detail the visitor types (9.5.0): an option
 * written `{ label, detail: { label, placeholder? } }` draws a short text
 * field under the select once it is chosen, on a form that takes the detail
 * (`ScheduleRequestForm`), and the typed words travel with the answer as
 * `sourceDetail`.
 *
 *   options: ["Google", { label: "Other", detail: { label: "Where?" } }],
 *
 * Built with the gate (`@atelic-action/ui/forms/source`): plain TypeScript,
 * no React, so a site's function imports it as shipped.
 */
import type { ContactField } from "./contact.js";

/** A detail an answer asks the visitor to type: "Who referred you?" */
export interface SourceDetail {
	/** The text field's label. */
	label: string;
	/** Its placeholder. None by default. */
	placeholder?: string;
}

/** An answer written out, for one that asks for a detail (9.5.0). */
export interface SourceOption {
	/** The answer as the visitor reads it and the endpoint records it. */
	label: string;
	/** A detail to type once this answer is chosen. */
	detail?: SourceDetail;
}

/** How did you hear about us: stated once by a site, read by its form and its function. */
export interface Source {
	/** The question the visitor reads. */
	label: string;
	/**
	 * The answers, in the order the select lists them: each its words, or an
	 * option that asks for a detail (9.5.0).
	 */
	options: (string | SourceOption)[];
	/** Whether a send without an answer is refused. Defaults to false. */
	required?: boolean;
	/** The select's empty first row. Defaults to "Choose one". */
	placeholder?: string;
	/** What the office's email calls the row. Defaults to "Heard about us". */
	officeLabel?: string;
}

/** The body key the form sends the answer under. */
export const SOURCE_KEY = "source";

/** The body key the typed detail travels under, beside the answer (9.5.0). */
export const SOURCE_DETAIL_KEY = "sourceDetail";

/** The most characters a typed detail may hold. */
export const SOURCE_DETAIL_LIMIT = 200;

/** The select's empty first row, unless a site words its own. */
export const DEFAULT_SOURCE_PLACEHOLDER = "Choose one";

/** What the office's email calls the row, unless a site words its own. */
export const DEFAULT_SOURCE_OFFICE_LABEL = "Heard about us";

/** Every answer written out, whichever way the site wrote it. */
export function sourceOptions(source: Source): SourceOption[] {
	return source.options.map((option) => (typeof option === "string" ? { label: option } : option));
}

/** The answers' words, in order: what the select offers and the endpoint accepts. */
export function sourceLabels(source: Source): string[] {
	return sourceOptions(source).map((option) => option.label);
}

/** The detail an answer asks for, or undefined when it asks for none. */
export function sourceDetailFor(source: Source, answer: string): SourceDetail | undefined {
	return sourceOptions(source).find((option) => option.label === answer)?.detail;
}

/**
 * The answer as one of the endpoint's fields: a choice out of the site's
 * list. The office's email prints "Not given" when the form sent the
 * question and the visitor skipped it, and nothing when the form did not
 * send it at all, which production reports as a form and a function that
 * disagree.
 */
export function sourceField(source: Source): ContactField {
	return {
		key: SOURCE_KEY,
		kind: "choice",
		label: source.officeLabel ?? DEFAULT_SOURCE_OFFICE_LABEL,
		options: sourceLabels(source),
		required: source.required ?? false,
		blank: "Not given",
	};
}
