import type { Phone } from "../types";

/**
 * A number with the words a site may set beside it: the header's numbers
 * carry a `label`, and a number may carry the `menuLabel` the phone menu
 * and `ContactInfoCard` set with it.
 */
export type LabeledPhone = Phone & { label?: string; menuLabel?: string };

/**
 * The words set with a number: its `menuLabel`, else its `label`, else
 * "Call", which asserts nothing a business may not do (answer texts). The
 * phone menu and `ContactInfoCard` both read them here, so a site states
 * them once.
 */
export function menuPhoneLabel(phone: LabeledPhone): string {
	return phone.menuLabel ?? phone.label ?? "Call";
}
