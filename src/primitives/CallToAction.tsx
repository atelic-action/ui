import type { ButtonProps } from "./Button";
import { Button } from "./Button";

/**
 * The two buttons a marketing page uses, by name, so no page picks a variant
 * and a size by hand and no two pages drift. A page's call to action is the
 * PrimaryButton: the hero's, the one under the case studies, the closing
 * section's, every one the same large primary shape with the arrow. A
 * SecondaryButton is the ghost beside it at the same size, always second.
 * The header's own compact button stays the header's. `Button` remains for
 * the few places that need another shape (a form's submit, a dark surface).
 */
export type CallToActionProps = Omit<ButtonProps, "variant" | "size" | "arrow">;

export function PrimaryButton(props: CallToActionProps) {
	return <Button {...props} variant="primary" size="lg" arrow />;
}

export function SecondaryButton(props: CallToActionProps) {
	return <Button {...props} variant="ghost" size="lg" />;
}
