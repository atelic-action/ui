import { newTabProps } from "../lib/newTabProps";
import type { NavLink } from "../types";

export interface NavMegaPanelProps {
	id: string;
	/** The group whose columns and feature card the panel holds. */
	group: NavLink;
	open: boolean;
	currentPath?: string;
	/** Called when a link in the panel is followed, so the header can close it. */
	onNavigate?: () => void;
}

/**
 * The desktop panel a nav group opens: one card under the bar holding the
 * group's link columns and, when it has one, the feature card at the right.
 * It renders whether open or not, `inert` while closed, so the links ship in
 * the static HTML and leave the tab order until it opens. The header owns
 * the open state; this draws it.
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
				<div className="nav-mega-cols">
					{allLabel && (
						<a className="nav-mega-all" href={href} onClick={onNavigate}>
							{allLabel} <span aria-hidden="true">→</span>
						</a>
					)}
					{columns.map((column) => (
						<div className="nav-mega-col" key={column.heading}>
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
											<span className="nav-mega-label">{link.label}</span>
											{link.description && (
												<span className="nav-mega-desc">{link.description}</span>
											)}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				{feature && (
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
							<a
								className="btn btn-primary nav-feature-cta"
								href={feature.cta.href}
								onClick={onNavigate}
								{...newTabProps(feature.cta.href, feature.cta.external)}
							>
								{feature.cta.label}
								<span className="arrow" aria-hidden="true">
									→
								</span>
							</a>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
