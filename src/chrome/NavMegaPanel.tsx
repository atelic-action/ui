import { ChevronRight } from "lucide-react";
import { newTabProps } from "../lib/newTabProps";
import { Button } from "../primitives/Button";
import { TickList } from "../primitives/TickList";
import type {
	NavCardsSection,
	NavGroupChildLink,
	NavGroupColumn,
	NavIconRowsSection,
	NavLink,
	NavPanelSection,
	NavPictureSection,
} from "../types";
import { navIcons } from "./icons";
import { NavBadge } from "./NavBadge";
import { isLinkColumn, panelSections } from "./navSections";

export interface NavMegaPanelProps {
	id: string;
	/** The group whose sections and feature card the panel holds. */
	group: NavLink;
	open: boolean;
	currentPath?: string;
	/** Called when a link in the panel is followed, so the header can close it. */
	onNavigate?: () => void;
}

/**
 * The key a section is listed under: its place and its kind. Two sections
 * may share a heading or an href, so the place keeps every key unique.
 */
function sectionKey(section: NavPanelSection, index: number): string {
	return `${index} ${isLinkColumn(section) ? "links" : section.kind}`;
}

function Badge({ text }: { text?: string }) {
	return <NavBadge text={text} className="nav-mega-badge" />;
}

/** Says whether a link is the panel's current item, as its `aria-current`. */
type Current = (href: string | undefined) => "page" | undefined;

/**
 * The panel's one current item: the first link, in reading order, to the
 * page being read. A panel may link one page several times (the group's own
 * page as its "all" link and a column's head, a child sharing its parent's
 * href), and a reader is told the page is here once. Made fresh each render,
 * and called in the order the links render.
 */
function currentClaim(currentPath?: string): Current {
	let claimed = false;
	return (href) => {
		if (claimed || currentPath === undefined || href !== currentPath) return undefined;
		claimed = true;
		return "page";
	};
}

interface SectionProps {
	current: Current;
	onNavigate?: () => void;
}

function LinkColumn({ column, current, onNavigate }: { column: NavGroupColumn } & SectionProps) {
	// A child may share its parent's href, and two links may share one, so
	// every key carries its place.
	const child = (link: NavGroupChildLink, index: number) => (
		<li key={`${index} ${link.href}`}>
			<a
				className="nav-mega-sub"
				href={link.href}
				onClick={onNavigate}
				aria-current={current(link.href)}
				{...newTabProps(link.href, link.external)}
			>
				{link.label}
				<Badge text={link.badge} />
			</a>
		</li>
	);
	return (
		<div className="nav-mega-sec is-links">
			{column.href ? (
				<a
					className="nav-mega-head"
					href={column.href}
					onClick={onNavigate}
					aria-current={current(column.href)}
				>
					{column.heading}
				</a>
			) : (
				<p className="nav-mega-head">{column.heading}</p>
			)}
			<ul>
				{column.links.map((link, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: two links may share an href, so the place keeps the key unique; a panel's links never reorder
					<li key={`${index} ${link.href}`}>
						<a
							className="nav-mega-link"
							href={link.href}
							onClick={onNavigate}
							aria-current={current(link.href)}
							{...newTabProps(link.href, link.external)}
						>
							<span className="nav-mega-label">
								{link.label}
								<Badge text={link.badge} />
							</span>
							{link.description && <span className="nav-mega-desc">{link.description}</span>}
						</a>
						{link.children && link.children.length > 0 && (
							<ul className="nav-mega-children">{link.children.map(child)}</ul>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

function PictureSection({
	section,
	current,
	onNavigate,
}: { section: NavPictureSection } & SectionProps) {
	return (
		<a
			className="nav-mega-sec is-picture"
			href={section.href}
			onClick={onNavigate}
			aria-current={current(section.href)}
			{...newTabProps(section.href, section.external)}
		>
			<img
				className="nav-mega-picture"
				src={section.image.src}
				alt={section.image.alt ?? ""}
				loading="lazy"
				decoding="async"
			/>
			<span className="nav-mega-caption">{section.caption}</span>
		</a>
	);
}

function RowsSection({
	section,
	current,
	onNavigate,
}: { section: NavIconRowsSection } & SectionProps) {
	return (
		<div className="nav-mega-sec is-rows">
			{section.heading && <p className="nav-mega-head">{section.heading}</p>}
			<ul className="nav-mega-rows">
				{section.rows.map((row, index) => {
					const Icon = navIcons[row.icon];
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: two links may share an href, so the place keeps the key unique; a panel's links never reorder
						<li key={`${index} ${row.href}`}>
							<a
								className={["nav-mega-row", row.highlight && "is-highlight"]
									.filter(Boolean)
									.join(" ")}
								href={row.href}
								onClick={onNavigate}
								aria-current={current(row.href)}
								{...newTabProps(row.href, row.external)}
							>
								<span className="nav-mega-row-icon">
									<Icon size={21} strokeWidth={1.75} aria-hidden="true" />
								</span>
								<span className="nav-mega-row-text">
									<span className="nav-mega-row-label">{row.label}</span>
									{row.description && <span className="nav-mega-row-desc">{row.description}</span>}
								</span>
								<ChevronRight className="nav-mega-row-go" size={16} aria-hidden="true" />
							</a>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

function CardsSection({
	section,
	current,
	onNavigate,
}: { section: NavCardsSection } & SectionProps) {
	return (
		<div className="nav-mega-sec is-cards">
			{section.heading && <p className="nav-mega-head">{section.heading}</p>}
			<ul className="nav-mega-cards">
				{section.cards.map((card, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: two links may share an href, so the place keeps the key unique; a panel's links never reorder
					<li key={`${index} ${card.href}`}>
						<a
							className="nav-mega-card-link"
							href={card.href}
							onClick={onNavigate}
							aria-current={current(card.href)}
							{...newTabProps(card.href, card.external)}
						>
							{card.image ? (
								<img
									className="nav-mega-thumb"
									src={card.image.src}
									alt={card.image.alt ?? ""}
									loading="lazy"
									decoding="async"
								/>
							) : (
								<span className="nav-mega-thumb" aria-hidden="true" />
							)}
							<span className="nav-mega-card-text">
								{card.kicker && <span className="nav-mega-kicker">{card.kicker}</span>}
								<span className="nav-mega-card-title">{card.title}</span>
								{card.meta && <span className="nav-mega-meta">{card.meta}</span>}
							</span>
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * The desktop panel a nav group opens: one card under the bar, as wide as
 * the page's wrap, holding the group's sections left to right (link columns,
 * a picture, icon rows, small cards) and, when the group has one, the
 * feature card at the right. It renders whether open or not, `inert` while
 * closed, so the links ship in the static HTML and leave the tab order until
 * it opens. The header owns the open state; this draws it.
 */
export function NavMegaPanel({ id, group, open, currentPath, onNavigate }: NavMegaPanelProps) {
	const { feature, allLabel, href } = group;
	// A section of a kind this version does not know is left out, never drawn as another kind.
	const columns = panelSections(group);
	const current = currentClaim(currentPath);
	return (
		<div
			id={id}
			className={["nav-mega", open && "is-open"].filter(Boolean).join(" ")}
			inert={!open}
		>
			<div className="nav-mega-card">
				<div className="nav-mega-body">
					{allLabel && (
						<a
							className="nav-mega-all"
							href={href}
							onClick={onNavigate}
							aria-current={current(href)}
						>
							{allLabel}
						</a>
					)}
					<div className="nav-mega-sections">
						{columns.map((section, index) => {
							const key = sectionKey(section, index);
							if (isLinkColumn(section)) {
								return (
									<LinkColumn
										key={key}
										column={section}
										current={current}
										onNavigate={onNavigate}
									/>
								);
							}
							if (section.kind === "picture") {
								return (
									<PictureSection
										key={key}
										section={section}
										current={current}
										onNavigate={onNavigate}
									/>
								);
							}
							if (section.kind === "rows") {
								return (
									<RowsSection
										key={key}
										section={section}
										current={current}
										onNavigate={onNavigate}
									/>
								);
							}
							if (section.kind === "cards") {
								return (
									<CardsSection
										key={key}
										section={section}
										current={current}
										onNavigate={onNavigate}
									/>
								);
							}
							return null;
						})}
					</div>
				</div>
				{feature && (
					// The card is the primary field, so its button turns light (.on-primary).
					<div className="nav-feature on-primary">
						{feature.image && (
							<img
								className="nav-feature-img"
								src={feature.image.src}
								alt={feature.image.alt}
								loading="lazy"
								decoding="async"
							/>
						)}
						<div className="nav-feature-body">
							{feature.eyebrow && <p className="nav-feature-eyebrow">{feature.eyebrow}</p>}
							<p className="nav-feature-title">{feature.title}</p>
							{feature.text && <p className="nav-feature-text">{feature.text}</p>}
							{feature.points && feature.points.length > 0 && (
								<TickList className="nav-feature-points" items={feature.points} />
							)}
							<Button
								className="nav-feature-cta"
								href={feature.cta.href}
								newTab={feature.cta.external}
								onClick={onNavigate}
								arrow
							>
								{feature.cta.label}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
