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
 * Built with the gate (`@atelic-action/ui/forms/source`): plain TypeScript,
 * no React, so a site's function imports it as shipped.
 */
import type { ContactField } from "./contact.js";

/** How did you hear about us: stated once by a site, read by its form and its function. */
export interface Source {
	/** The question the visitor reads. */
	label: string;
	/** The answers, in the order the select lists them. */
	options: string[];
	/** Whether a send without an answer is refused. Defaults to false. */
	required?: boolean;
	/** The select's empty first row. Defaults to "Choose one". */
	placeholder?: string;
	/** What the office's email calls the row. Defaults to "Heard about us". */
	officeLabel?: string;
}

/** The body key the form sends the answer under. */
export const SOURCE_KEY = "source";

/** The select's empty first row, unless a site words its own. */
export const DEFAULT_SOURCE_PLACEHOLDER = "Choose one";

/** What the office's email calls the row, unless a site words its own. */
export const DEFAULT_SOURCE_OFFICE_LABEL = "Heard about us";

/**
 * The answer as one of the endpoint's fields: a choice out of the site's
 * list, which the office's email prints as "Not given" when the visitor
 * gave none, so the office can tell a skipped question from a field the
 * form never asked.
 */
export function sourceField(source: Source): ContactField {
	return {
		key: SOURCE_KEY,
		kind: "choice",
		label: source.officeLabel ?? DEFAULT_SOURCE_OFFICE_LABEL,
		options: [...source.options],
		required: source.required ?? false,
		blank: "Not given",
	};
}
