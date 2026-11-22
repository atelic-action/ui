import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import { telText } from "../lib/phoneText";
import { Button } from "../primitives/Button";
import type {
	Brand,
	CallToAction,
	HeaderPhone,
	MenuContact,
	NavGroupChildLink,
	NavLink,
	NavPanelSection,
	Phone,
	SiteMenuSurface,
} from "../types";
import { BrandLockup } from "./BrandLockup";
import { NavBadge } from "./NavBadge";
import { isGroup, isLinkColumn, panelSections } from "./navSections";

/** A number as the menu lists it: the header's, or the contact block's one phone. */
type MenuPhone = Phone & { label?: string; menuLabel?: string };

/**
 * The words the menu sets with a number: its `menuLabel`, else its `label`,
 * else "Call", which asserts nothing a business may not do (answer texts).
 */
export function menuPhoneLabel(phone: MenuPhone): string {
	return phone.menuLabel ?? phone.label ?? "Call";
}

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
	/**
	 * The primary action, rendered as a standard button below the entries, in
	 * its `menuLabel` when it has one, else its `label`.
	 */
	primaryCTA?: CallToAction;
	/**
	 * The phone, email, and address block at the foot of the dark sheet. The
	 * light sheet draws its one phone as a card when `phones` is empty, and
	 * leaves the email and the address out, as its design does.
	 */
	contact?: MenuContact;
	/**
	 * The numbers the header shows, each a tel link at the foot with its
	 * `menuLabel`, else its `label`, else "Call", in place of the contact
	 * block's one phone.
	 */
	phones?: HeaderPhone[];
	/**
	 * The path being read, marking the matching link with aria-current and,
	 * for the eye, the 2px underline the bar marks its current entry with.
	 */
	currentPath?: string;
	id?: string;
	/** The dialog's accessible name. Defaults to "Menu". */
	label?: string;
	/**
	 * The sheet's look. `dark` (the default) is the full screen sheet on the
	 * dark surface. `light` sets the page's ground: the brand's lockup and a
	 * round close button across the top, the entries as rows under hairlines,
	 * and a foot on the alternate ground holding the call to action and a
	 * card per number; it shows no email and no address, which the dark
	 * sheet's contact block does. The behavior is the same on both.
	 */
	surface?: SiteMenuSurface;
	/** The identity the light sheet's top row draws, linking home. */
	brand?: Brand;
}

/**
 * The full screen overlay menu for small screens, on a native modal
 * `<dialog>`: the platform supplies Escape, focus containment, and focus
 * return to the burger. The dialog renders closed on the server and opens
 * only in an effect, so the menu stays safe to prerender. Page scroll holds
 * still through chrome.css while the dialog is open, and the contact dock's
 * launcher steps aside.
 *
 * A group is an accordion: its label is a control that opens the group's
 * columns under it and closes whichever group was open. Every group starts
 * closed each time the menu opens, the one holding the current page
 * included, so the menu always opens on the short list of entries. A closed
 * group's links stay in the HTML, `inert`.
 *
 * Two sheets share every behavior and differ in look alone (`surface`): the
 * dark one, and the light one with the lockup across the top and the call to
 * action and the numbers in a foot.
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
	surface = "dark",
	brand,
}: SiteMenuProps) {
	const light = surface === "light";
	// The header's numbers, when there are any; an empty list is none, so the
	// contact block's one phone stands in on either sheet.
	const headerPhones = phones && phones.length > 0 ? phones : undefined;
	const [openGroup, setOpenGroup] = useState<number | null>(null);
	const groupId = useId();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	// Whether the owner already knows the menu is closed. Escape fires cancel
	// and then close, and a followed link closes the dialog and notifies
	// directly, so every path runs through reportClosed and reports once.
	const closedRef = useRef(true);
	// Only a plain entry wears a number, so the numbers count those alone and
	// run 01, 02, 03 down the menu whatever groups sit between them. The light
	// sheet sets none.
	const numbers: number[] = [];
	let counted = 0;
	for (const link of links) numbers.push(isGroup(link) ? 0 : ++counted);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		closedRef.current = !open;
		// No group is open when the menu opens, whatever page it opens on.
		if (open) setOpenGroup(null);
		if (open && !dialog.open) {
			dialog.showModal();
			// The light sheet's first stop is the lockup's home link, so focus
			// starts on its close button, where the dark sheet's already does.
			if (light) closeRef.current?.focus();
		}
		if (!open && dialog.open) dialog.close();
	}, [open, light]);

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

	// The menu's own words for the action, else the bar's.
	const menuCTA = primaryCTA && { ...primaryCTA, label: primaryCTA.menuLabel ?? primaryCTA.label };

	const closeButton = (
		<button
			ref={closeRef}
			type="button"
			className="mm-close"
			aria-label="Close menu"
			onClick={close}
		>
			{light ? (
				<X size={20} aria-hidden="true" />
			) : (
				<>
					<span />
					<span />
				</>
			)}
		</button>
	);

	const entries = links.map((link, i) =>
		isGroup(link) ? (
			// biome-ignore lint/suspicious/noArrayIndexKey: a one page site points several entries at one page or anchor, so the place keeps the key unique; the menu never reorders
			<div className="mm-group" key={i}>
				<button
					type="button"
					className="mm-link mm-group-btn"
					aria-expanded={openGroup === i}
					aria-controls={`${groupId}${i}`}
					onClick={() => setOpenGroup((current) => (current === i ? null : i))}
				>
					<span>{link.label}</span>
					<ChevronDown className="mm-chevron" size={light ? 20 : 22} aria-hidden="true" />
				</button>
				<div
					id={`${groupId}${i}`}
					className={["mm-group-panel", openGroup === i && "is-open"].filter(Boolean).join(" ")}
					inert={openGroup !== i}
				>
					{link.allLabel && (
						<a
							className="mm-group-all"
							href={link.href}
							onClick={close}
							aria-current={currentPath === link.href ? "page" : undefined}
						>
							{link.allLabel}
						</a>
					)}
					{panelSections(link).map((section, index) => (
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
				// biome-ignore lint/suspicious/noArrayIndexKey: as above, entries may share an href
				key={i}
				className="mm-link"
				href={link.href}
				onClick={close}
				aria-current={currentPath === link.href ? "page" : undefined}
			>
				<span className="mm-label">{link.label}</span>
				{!light && <span className="idx">{String(numbers[i]).padStart(2, "0")}</span>}
			</a>
		),
	);

	if (light) {
		// A card per number the header shows, else the contact block's one phone.
		const cards: MenuPhone[] = headerPhones ?? (contact?.phone ? [contact.phone] : []);
		return (
			<dialog
				ref={dialogRef}
				id={id}
				className="mobile-menu is-light"
				aria-label={label}
				onCancel={reportClosed}
				onClose={reportClosed}
			>
				<div className="mm-top">
					{brand && <BrandLockup brand={brand} surface="light" onClick={close} />}
					{closeButton}
				</div>
				<div className="mm-list">{entries}</div>
				{(menuCTA || cards.length > 0) && (
					<div className="mm-foot">
						{menuCTA && (
							<Button
								size="lg"
								className="mm-cta"
								href={menuCTA.href}
								newTab={menuCTA.external}
								arrow={menuCTA.arrow}
								onClick={close}
							>
								{menuCTA.label}
							</Button>
						)}
						{cards.map((line) => {
							const words = menuPhoneLabel(line);
							return (
								// The words and the number are one name, spaced as they read.
								<a
									key={line.e164}
									className="mm-phone-card"
									href={`tel:${line.e164}`}
									aria-label={`${words} ${line.display}`}
								>
									<span className="mm-phone-label">{words}</span>
									<span className="mm-phone-number tel-number">{line.display}</span>
								</a>
							);
						})}
					</div>
				)}
			</dialog>
		);
	}

	return (
		<dialog
			ref={dialogRef}
			id={id}
			className="mobile-menu"
			aria-label={label}
			onCancel={reportClosed}
			onClose={reportClosed}
		>
			{closeButton}
			{entries}
			{menuCTA && (
				<Button
					size="lg"
					className="mm-cta"
					href={menuCTA.href}
					newTab={menuCTA.external}
					onClick={close}
				>
					{menuCTA.label}
				</Button>
			)}
			{(contact || headerPhones) && <ContactBlock contact={contact ?? {}} phones={headerPhones} />}
		</dialog>
	);
}

/** A short word in a pill after a link's label, as on the desktop panel. */
function Badge({ text }: { text?: string }) {
	return <NavBadge text={text} className="mm-badge" />;
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
	// A child may share its parent's href, and two rows may share one, so a
	// link is keyed by its place, never its href alone.
	const link = (
		item: { label: string; href: string; external?: boolean; badge?: string; quiet?: boolean },
		className: string,
		key: string,
	) => (
		<a
			key={key}
			className={item.quiet ? `${className} is-quiet` : className}
			href={item.href}
			onClick={onNavigate}
			aria-current={currentPath === item.href ? "page" : undefined}
			{...newTabProps(item.href, item.external)}
		>
			<span className="mm-label">{telText(item.href, item.label)}</span>
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
					"picture",
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
				? section.links.map((item, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: two links may share an href, so the place keeps the key unique; a group's links never reorder
						<div className="mm-group-item" key={`${index} ${item.href}`}>
							{link(item, "mm-group-link", "self")}
							{item.children?.map((child: NavGroupChildLink, childIndex) =>
								link(child, "mm-group-sub", `child ${childIndex}`),
							)}
						</div>
					))
				: section.kind === "rows"
					? section.rows.map((row, index) => link(row, "mm-group-link", `row ${index}`))
					: section.cards.map((card, index) =>
							link(
								{ label: card.title, href: card.href, external: card.external },
								"mm-group-link",
								`card ${index}`,
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
								{menuPhoneLabel(line).toUpperCase()}&nbsp;&nbsp;{line.display}
							</a>
							<br />
						</span>
					))
				: phone && (
						<>
							<a className="mm-contact-link" href={`tel:${phone.e164}`}>
								{menuPhoneLabel(phone).toUpperCase()}&nbsp;&nbsp;{phone.display}
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
