import { useEffect, useRef } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { CallToAction, MenuContact, NavLink } from "../types";

export interface SiteMenuProps {
	/** Whether the menu is showing. The owner holds this state. */
	open: boolean;
	/**
	 * Called once each time the menu closes on its own: Escape, a followed
	 * link, or the close button. The owner sets its state to closed. A close
	 * the owner asked for, by passing `open={false}`, is not reported back.
	 */
	onClose: () => void;
	/** The entries in order: a site's nav, or a page's own stops as `#id` links. */
	links: NavLink[];
	/** The primary action, rendered as a standard button below the entries. */
	primaryCTA?: CallToAction;
	/** The phone, email, and address block at the foot. */
	contact?: MenuContact;
	id?: string;
	/** The dialog's accessible name. Defaults to "Menu". */
	label?: string;
}

/**
 * The full screen overlay menu for small screens, on a native modal
 * `<dialog>`: the platform supplies Escape, focus containment, and focus
 * return to the burger. The dialog renders closed on the server and opens
 * only in an effect, so the menu stays safe to prerender. Page scroll holds
 * still through chrome.css while the dialog is open.
 */
export function SiteMenu({
	open,
	onClose,
	links,
	primaryCTA,
	contact,
	id,
	label = "Menu",
}: SiteMenuProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	// Whether the owner already knows the menu is closed. Escape fires cancel
	// and then close, and a followed link closes the dialog and notifies
	// directly, so every path runs through reportClosed and reports once.
	const closedRef = useRef(true);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		closedRef.current = !open;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	const reportClosed = () => {
		if (closedRef.current) return;
		closedRef.current = true;
		onClose();
	};

	// A followed link closes the dialog before the browser navigates, so the
	// scroll lock is already lifted when an in page jump lands. The owner
	// hears about it now rather than when the close event's task runs.
	const close = () => {
		const dialog = dialogRef.current;
		if (dialog?.open) dialog.close();
		reportClosed();
	};

	return (
		<dialog
			ref={dialogRef}
			id={id}
			className="mobile-menu"
			aria-label={label}
			onCancel={reportClosed}
			onClose={reportClosed}
		>
			<button type="button" className="mm-close" aria-label="Close menu" onClick={close}>
				<span />
				<span />
			</button>
			{links.map((link, i) => (
				<a key={link.href} className="mm-link" href={link.href} onClick={close}>
					<span>{link.label}</span>
					<span className="idx">{String(i + 1).padStart(2, "0")}</span>
				</a>
			))}
			{primaryCTA && (
				<a
					className="btn btn-primary btn-lg mm-cta"
					href={primaryCTA.href}
					onClick={close}
					{...newTabProps(primaryCTA.href, primaryCTA.external)}
				>
					{primaryCTA.label}
				</a>
			)}
			{contact && <ContactBlock contact={contact} />}
		</dialog>
	);
}

function ContactBlock({ contact: { phone, email, address } }: { contact: MenuContact }) {
	return (
		<div className="mm-contact">
			{phone && (
				<>
					CALL / TEXT&nbsp;&nbsp;{phone.display}
					<br />
				</>
			)}
			{email && (
				<>
					{email}
					<br />
				</>
			)}
			{address && (
				<>
					{/* A business that publishes a service area but no storefront leaves
					    street empty; without the guard the separator dangles. */}
					{address.street && <>{address.street.toUpperCase()} · </>}
					{address.locality.toUpperCase()}, {address.region}
					{address.postalCode ? ` ${address.postalCode}` : ""}
				</>
			)}
		</div>
	);
}
