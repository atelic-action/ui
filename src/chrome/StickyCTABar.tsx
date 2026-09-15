import { Phone as PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { CallToAction, Phone } from "../types";

export interface StickyCTABarProps {
	/** The primary action, filling the bar. */
	primaryCTA: CallToAction;
	/** Adds a call shortcut beside the CTA. Omit for a business with no public phone. */
	phone?: Phone;
	/** Scroll depth in pixels before the bar slides in. Defaults to 520. */
	threshold?: number;
	/** The call shortcut's accessible name. Defaults to "Call us". */
	callLabel?: string;
}

/** The phone only bottom bar: the primary CTA and a call shortcut, sliding in once scrolled. */
export function StickyCTABar({
	primaryCTA,
	phone,
	threshold = 520,
	callLabel = "Call us",
}: StickyCTABarProps) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const onScroll = () => setShow(window.scrollY > threshold);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [threshold]);

	return (
		<div className={show ? "sticky-CTA show" : "sticky-CTA"}>
			<a
				className="btn btn-primary"
				href={primaryCTA.href}
				{...newTabProps(primaryCTA.href, primaryCTA.external)}
			>
				{primaryCTA.label}
			</a>
			{phone && (
				<a className="btn btn-ghost btn-call" href={`tel:${phone.e164}`} aria-label={callLabel}>
					<PhoneIcon size={18} aria-hidden="true" />
				</a>
			)}
		</div>
	);
}
