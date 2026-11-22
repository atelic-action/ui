import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import type {
	CallToAction,
	HeaderPhone,
	MenuContact,
	NavGroupChildLink,
	NavLink,
	NavPanelSection,
} from "../types";
import { isLinkColumn } from "./navSections";

export interface SiteMenuProps {
	/** Whether the menu is showing. The owner holds this state. */
	open: boolean;
	/**
	 * Called once each time the menu closes on its own: Escape, a followed
	 * link, or the close button. The owner sets its state to closed. A close
	 * the owner asked for, by passing `open={false}`, is not reported back.
	 */
	onClose: () => void;
	/**
	 * The entries in order: a site's nav, or a page's own stops as `#id` links.
	 * An entry with `columns` is a group, an accordion that opens one at a time.
	 */
	links: NavLink[];
	/** The primary action, rendered as a standard button below the entries. */
	primaryCTA?: CallToAction;
	/** The phone, email, and address block at the foot. */
	contact?: MenuContact;
	/**
	 * The numbers the header shows, each a tel link at the foot with its
	 * label, in place of the contact block's one phone.
	 */
	phones?: HeaderPhone[];
	/** The path being read, marking the matching link with aria-current. */
	currentPath?: string;
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
 *
 * A group is an accordion: its label is a control that opens the group's
 * columns under it and closes whichever group was open. Every group starts
 * closed each time the menu opens, the one holding the current page
 * included, so the menu always opens on the short list of entries. A closed
 * group's links stay in the HTML, `inert`.
 */
export function SiteMenu({
	open,
	onClose,
	links,
	primaryCTA,
	contact,
	phones,
	currentPath,
	id,
	label = "Menu",
}: SiteMenuProps) {
	const [openGroup, setOpenGroup] = useState<number | null>(null);
	const groupId = useId();
	const dialogRef = useRef<HTMLDialogElement>(null);
	// Whether the owner already knows the menu is closed. Escape fires cancel
	// and then close, and a followed link closes the dialog and notifies
	// directly, so every path runs through reportClosed and reports once.
	const closedRef = useRef(true);
	// Only a plain entry wears a number, so the numbers count those alone and
	// run 01, 02, 03 down the menu whatever groups sit between them.
	const numbers: number[] = [];
	let counted = 0;
	for (const link of links) numbers.push(link.columns && link.columns.length > 0 ? 0 : ++counted);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		closedRef.current = !open;
		// No group is open when the menu opens, whatever page it opens on.
		if (open) setOpenGroup(null);
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
			{links.map((link, i) =>
				link.columns && link.columns.length > 0 ? (
					<div className="mm-group" key={link.href}>
						<button
							type="button"
							className="mm-link mm-group-btn"
							aria-expanded={openGroup === i}
							aria-controls={`${groupId}${i}`}
							onClick={() => setOpenGroup((current) => (current === i ? null : i))}
						>
							<span>{link.label}</span>
							<ChevronDown className="mm-chevron" size={22} aria-hidden="true" />
						</button>
						<div
							id={`${groupId}${i}`}
							className={["mm-group-panel", openGroup === i && "is-open"].filter(Boolean).join(" ")}
							inert={openGroup !== i}
						>
							{link.allLabel && (
								<a className="mm-group-all" href={link.href} onClick={close}>
									{link.allLabel}
								</a>
							)}
							{link.columns.map((section, index) => (
								<MenuSection
									// biome-ignore lint/suspicious/noArrayIndexKey: a group's sections never reorder while the menu is open
									key={index}
									section={section}
									currentPath={currentPath}
									onNavigate={close}
								/>
							))}
						</div>
					</div>
				) : (
					<a
						key={link.href}
						className="mm-link"
						href={link.href}
						onClick={close}
						aria-current={currentPath === link.href ? "page" : undefined}
					>
						<span>{link.label}</span>
						<span className="idx">{String(numbers[i]).padStart(2, "0")}</span>
					</a>
				),
			)}
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
			{(contact || phones) && <ContactBlock contact={contact ?? {}} phones={phones} />}
		</dialog>
	);
}

/** A short word in a pill after a link's label, as on the desktop panel. */
function Badge({ text }: { text?: string }) {
	return text ? <span className="mm-badge">{text}</span> : null;
}

/**
 * One section of a group, as the phone draws it: a link column with its
 * children indented under their parent, icon rows and cards as plain links
 * of their labels and titles, and a picture as a plain link of its caption,
 * so the page it leads to stays reachable without the photo.
 */
function MenuSection({
	section,
	currentPath,
	onNavigate,
}: {
	section: NavPanelSection;
	currentPath?: string;
	onNavigate: () => void;
}) {
	const link = (
		item: { label: string; href: string; external?: boolean; badge?: string },
		className: string,
	) => (
		<a
			key={item.href}
			className={className}
			href={item.href}
			onClick={onNavigate}
			aria-current={currentPath === item.href ? "page" : undefined}
			{...newTabProps(item.href, item.external)}
		>
			{item.label}
			<Badge text={item.badge} />
		</a>
	);
	const heading = section.kind === "picture" ? undefined : section.heading;
	const headHref = isLinkColumn(section) ? section.href : undefined;
	if (section.kind === "picture") {
		return (
			<div className="mm-group-col">
				{link(
					{ label: section.caption, href: section.href, external: section.external },
					"mm-group-link",
				)}
			</div>
		);
	}
	return (
		<div className="mm-group-col">
			{heading &&
				(headHref ? (
					<a className="mm-group-head" href={headHref} onClick={onNavigate}>
						{heading}
					</a>
				) : (
					<p className="mm-group-head">{heading}</p>
				))}
			{isLinkColumn(section)
				? section.links.map((item) => (
						<div className="mm-group-item" key={item.href}>
							{link(item, "mm-group-link")}
							{item.children?.map((child: NavGroupChildLink) => link(child, "mm-group-sub"))}
						</div>
					))
				: section.kind === "rows"
					? section.rows.map((row) => link(row, "mm-group-link"))
					: section.cards.map((card) =>
							link(
								{ label: card.title, href: card.href, external: card.external },
								"mm-group-link",
							),
						)}
		</div>
	);
}

function ContactBlock({
	contact: { phone, email, address },
	phones,
}: {
	contact: MenuContact;
	phones?: HeaderPhone[];
}) {
	return (
		<div className="mm-contact">
			{/* The number and the address are the two things a phone can act on, so
			    each is a real link: a tel link dials, a mailto opens mail. Protocol
			    links never open a new tab (rule 12). Plain text here read as friction. */}
			{phones
				? phones.map((line) => (
						<span key={line.e164}>
							<a className="mm-contact-link" href={`tel:${line.e164}`}>
								{line.label ? line.label.toUpperCase() : "CALL / TEXT"}&nbsp;&nbsp;{line.display}
							</a>
							<br />
						</span>
					))
				: phone && (
						<>
							<a className="mm-contact-link" href={`tel:${phone.e164}`}>
								CALL / TEXT&nbsp;&nbsp;{phone.display}
							</a>
							<br />
						</>
					)}
			{email && (
				<>
					<a className="mm-contact-link" href={`mailto:${email}`}>
						{email}
					</a>
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
