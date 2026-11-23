import type { AddressParts } from "../primitives/AddressSearch";
import { EMAIL_PATTERN, toE164 } from "./contactLinks";

/** Which of the contact form's opt in fields are drawn, and which must be filled. */
export interface ContactFormShape {
	/** First and last name in place of the one name. */
	splitName: boolean;
	phone: "off" | "optional" | "required";
	address: "off" | "optional" | "required";
	/** The services multi select in place of the topic select. */
	services: boolean;
	consent: boolean;
}

/** The shape the form had before 8.5.0, and still has with no opt in prop. */
export const PLAIN_SHAPE: ContactFormShape = {
	splitName: false,
	phone: "off",
	address: "off",
	services: false,
	consent: false,
};

/** What a visitor wrote, read from the form, trimmed. */
export interface ContactFormValues {
	/** The one name, or the first and last joined by a space. */
	name: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	/** The topic chosen, or the chosen services joined by commas. */
	topic: string;
	services: string[];
	address: AddressParts;
	message: string;
	consent: boolean;
	/** The honeypot, verbatim. */
	company: string;
}

/** A field the form can refuse, in the order the form draws them. */
export type ContactFormField =
	| "name"
	| "firstName"
	| "lastName"
	| "phone"
	| "email"
	| "street"
	| "city"
	| "state"
	| "zip"
	| "message";

/** Every refusable field in the page's order, so focus goes to the first refused. */
export const FIELD_ORDER: ContactFormField[] = [
	"name",
	"firstName",
	"lastName",
	"phone",
	"email",
	"street",
	"city",
	"state",
	"zip",
	"message",
];

export type ContactFormRefusals = Partial<Record<ContactFormField, true>>;

/**
 * Whether a typed number is one to dial: one that reads into E.164
 * (`toE164`), the same check the phone link makes. The form's default
 * phone check.
 */
export function isPhoneNumber(value: string): boolean {
	return toE164(value) !== null;
}

/** A US ZIP code, five digits or ZIP+4. */
export function isZIP(value: string): boolean {
	return /^\d{5}(-?\d{4})?$/.test(value.trim());
}

/** An address on one line: "418 Alder Street, Fairhaven, CO 80000", skipping empty parts. */
export function addressLine(address: AddressParts): string {
	const place = [address.state, address.zip].filter(Boolean).join(" ");
	return [address.street, address.city, place].filter(Boolean).join(", ");
}

/** Reads what the visitor wrote from the form's data, for the fields the shape draws. */
export function readContactForm(data: FormData, shape: ContactFormShape): ContactFormValues {
	const text = (key: string) => String(data.get(key) ?? "").trim();
	const firstName = shape.splitName ? text("firstName") : "";
	const lastName = shape.splitName ? text("lastName") : "";
	const services = shape.services ? data.getAll("services").map(String) : [];
	const street = text("street");
	const city = text("city");
	const zip = text("zip");
	// An optional address nobody wrote is no address: a state select's
	// default alone is not the visitor's answer, so it goes too.
	const unwritten = shape.address === "optional" && !street && !city && !zip;
	return {
		name: shape.splitName ? [firstName, lastName].filter(Boolean).join(" ") : text("name"),
		firstName,
		lastName,
		email: text("email"),
		phone: shape.phone === "off" ? "" : text("phone"),
		// The topic is read untrimmed, as it always was.
		topic: shape.services ? services.join(", ") : String(data.get("topic") ?? ""),
		services,
		address:
			shape.address === "off"
				? { street: "", city: "", state: "", zip: "" }
				: { street, city, state: unwritten ? "" : text("state"), zip },
		message: text("message"),
		consent: shape.consent && data.get("consent") !== null,
		company: String(data.get("company") ?? ""),
	};
}

/**
 * The fields to refuse. The name (or the first and the last), a valid email,
 * and the message are always required, as they always were. A required
 * phone must be a number `validPhone` accepts; an optional one is refused
 * only when something is written that it does not accept. A required
 * address needs every part and a ZIP code; an optional one is not checked.
 */
export function checkContactForm(
	values: ContactFormValues,
	shape: ContactFormShape,
	validPhone: (value: string) => boolean = isPhoneNumber,
): ContactFormRefusals {
	const refused: ContactFormRefusals = {};
	if (shape.splitName) {
		if (!values.firstName) refused.firstName = true;
		if (!values.lastName) refused.lastName = true;
	} else if (!values.name) refused.name = true;
	if (shape.phone === "required" && !validPhone(values.phone)) refused.phone = true;
	if (shape.phone === "optional" && values.phone && !validPhone(values.phone)) refused.phone = true;
	if (!EMAIL_PATTERN.test(values.email)) refused.email = true;
	if (shape.address === "required") {
		if (!values.address.street) refused.street = true;
		if (!values.address.city) refused.city = true;
		if (!values.address.state) refused.state = true;
		if (!isZIP(values.address.zip)) refused.zip = true;
	}
	if (!values.message) refused.message = true;
	return refused;
}

/** The first field to fix, in the page's order, or none. */
export function firstRefused(refused: ContactFormRefusals): ContactFormField | undefined {
	return FIELD_ORDER.find((field) => refused[field]);
}

/**
 * The JSON body the form posts. It always carries `name`, `email`, `topic`,
 * `message`, and `company` (the honeypot, verbatim), so a relay that reads
 * only those keeps working whatever the form draws: with the split name,
 * `name` is the first and last joined; with the services, `topic` is the
 * chosen services joined by commas. Each opt in field adds its own keys
 * only when it is drawn: `firstName` and `lastName`; `phone`; `address`, an
 * object of `street`, `city`, `state`, and `zip`; `services`, an array of
 * the chosen values; `consent`, a boolean.
 */
export function contactFormBody(
	values: ContactFormValues,
	shape: ContactFormShape,
): Record<string, unknown> {
	const { name, email, topic, message, company } = values;
	return {
		name,
		email,
		topic,
		message,
		company,
		...(shape.splitName && { firstName: values.firstName, lastName: values.lastName }),
		...(shape.phone !== "off" && { phone: values.phone }),
		...(shape.address !== "off" && { address: values.address }),
		...(shape.services && { services: values.services }),
		...(shape.consent && { consent: values.consent }),
	};
}
