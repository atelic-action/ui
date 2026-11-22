import {
	Calculator,
	CalendarDays,
	ChevronRight,
	CircleHelp,
	CirclePlay,
	CreditCard,
	FileText,
	House,
	type LucideIcon,
	Mail,
	Map as MapIcon,
	MapPin,
	MessageCircle,
	Phone,
	Shield,
	Star,
	Truck,
	Users,
	Wrench,
} from "lucide-react";
import { newTabProps } from "../lib/newTabProps";
import { Button } from "../primitives/Button";
import { TickList } from "../primitives/TickList";
import type {
	NavCardsSection,
	NavGroupChildLink,
	NavGroupColumn,
	NavIcon,
	NavIconRowsSection,
	NavLink,
	NavPanelSection,
	NavPictureSection,
} from "../types";
import { isLinkColumn } from "./navSections";

export interface NavMegaPanelProps {
	id: string;
	/** The group whose sections and feature card the panel holds. */
	group: NavLink;
	open: boolean;
	currentPath?: string;
	/** Called when a link in the panel is followed, so the header can close it. */
	onNavigate?: () => void;
}

/** The lucide icon each name in `NavIcon` draws. */
export const navIcons: Record<NavIcon, LucideIcon> = {
	calculator: Calculator,
	calendar: CalendarDays,
	card: CreditCard,
	chat: MessageCircle,
	document: FileText,
	help: CircleHelp,
	home: House,
	mail: Mail,
	map: MapIcon,
	phone: Phone,
	pin: MapPin,
	play: CirclePlay,
	shield: Shield,
	star: Star,
	tool: Wrench,
	truck: Truck,
	users: Users,
};

/** The key a section is listed under: its heading, or its kind and place. */
function sectionKey(section: NavPanelSection, index: number): string {
	if (isLinkColumn(section)) return `links ${section.heading}`;
	if (section.kind === "picture") return `picture ${section.href}`;
	return `${section.kind} ${section.heading ?? index}`;
}

function Badge({ text }: { text?: string }) {
	return text ? <span className="nav-mega-badge">{text}</span> : null;
}

interface SectionProps {
	currentPath?: string;
	onNavigate?: () => void;
}

function LinkColumn({
	column,
	currentPath,
	onNavigate,
}: { column: NavGroupColumn } & SectionProps) {
	const child = (link: NavGroupChildLink) => (
		<li key={link.href}>
			<a
				className="nav-mega-sub"
				href={link.href}
				onClick={onNavigate}
				aria-current={currentPath === link.href ? "page" : undefined}
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
				<a className="nav-mega-head" href={column.href} onClick={onNavigate}>
					{column.heading}
				</a>
			) : (
				<p className="nav-mega-head">{column.heading}</p>
			)}
			<ul>
				{column.links.map((link) => (
					<li key={link.href}>
						<a
							className="nav-mega-link"
							href={link.href}
							onClick={onNavigate}
							aria-current={currentPath === link.href ? "page" : undefined}
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

function PictureSection({ section, onNavigate }: { section: NavPictureSection } & SectionProps) {
	return (
		<a
			className="nav-mega-sec is-picture"
			href={section.href}
			onClick={onNavigate}
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
	currentPath,
	onNavigate,
}: { section: NavIconRowsSection } & SectionProps) {
	return (
		<div className="nav-mega-sec is-rows">
			{section.heading && <p className="nav-mega-head">{section.heading}</p>}
			<ul className="nav-mega-rows">
				{section.rows.map((row) => {
					const Icon = navIcons[row.icon];
					return (
						<li key={row.href}>
							<a
								className={["nav-mega-row", row.highlight && "is-highlight"]
									.filter(Boolean)
									.join(" ")}
								href={row.href}
								onClick={onNavigate}
								aria-current={currentPath === row.href ? "page" : undefined}
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

function CardsSection({ section, onNavigate }: { section: NavCardsSection } & SectionProps) {
	return (
		<div className="nav-mega-sec is-cards">
			{section.heading && <p className="nav-mega-head">{section.heading}</p>}
			<ul className="nav-mega-cards">
				{section.cards.map((card) => (
					<li key={card.href}>
						<a
							className="nav-mega-card-link"
							href={card.href}
							onClick={onNavigate}
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
	const { columns = [], feature, allLabel, href } = group;
	return (
		<div
			id={id}
			className={["nav-mega", open && "is-open"].filter(Boolean).join(" ")}
			inert={!open}
		>
			<div className="nav-mega-card">
				<div className="nav-mega-body">
					{allLabel && (
						<a className="nav-mega-all" href={href} onClick={onNavigate}>
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
										currentPath={currentPath}
										onNavigate={onNavigate}
									/>
								);
							}
							if (section.kind === "picture") {
								return <PictureSection key={key} section={section} onNavigate={onNavigate} />;
							}
							if (section.kind === "rows") {
								return (
									<RowsSection
										key={key}
										section={section}
										currentPath={currentPath}
										onNavigate={onNavigate}
									/>
								);
							}
							return <CardsSection key={key} section={section} onNavigate={onNavigate} />;
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
