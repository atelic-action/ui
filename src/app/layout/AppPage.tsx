import { Link } from "@tanstack/react-router";
import { PanelRightClose, PanelRightOpen, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useRail } from "../context/SidebarContext";
import { cn } from "../lib/utils";
import { OptionSelect } from "../ui/option-select";

/**
 * AppPage — the shared scaffold every redesigned authenticated surface renders
 * through. It owns the page chrome: a header (crumb · title · live
 * dot · subtitle · aside), an optional summary block, a toolbar slot, the page
 * content, an optional footer, and a canonical right rail.
 *
 * The rail is the new primitive. On desktop (lg+) it is a true full-height
 * column mirroring the left nav rail, scrolling independently beside the main
 * column. On mobile it stacks inline beneath the header. It is optional — pages
 * pass it only when they have an at-a-glance summary.
 *
 * AppPage does NOT render navigation; the app shell (AppLayout) owns the nav
 * rail / tab bar from the single nav config. Styling lives in globals.css under
 * "AppPage scaffold (SHARED) — ap-*".
 */
interface AppPageProps {
	/** Breadcrumb trail, rendered above the title (pass the Breadcrumbs component). */
	crumb?: ReactNode;
	/** Optional content opposite the crumb (a status badge, attribution). */
	aside?: ReactNode;
	/** Optional icon before the title. */
	icon?: ReactNode;
	/** Page title. */
	title: ReactNode;
	/** Show the live (accent) dot beside the title. */
	live?: boolean;
	/** Optional one-line description below the title. */
	subtitle?: ReactNode;
	/** Optional block between the header and the toolbar (mobile + desktop). */
	summary?: ReactNode;
	/** Toolbar slot — typically an AppPageToolbar. */
	toolbar?: ReactNode;
	/** Optional at-a-glance rail. Full-height column on desktop, inline on mobile. */
	rail?: ReactNode;
	/** Optional footer below the content. */
	footer?: ReactNode;
	/** Page content. */
	children: ReactNode;
}

function PageHeader({
	crumb,
	aside,
	icon,
	title,
	live,
	subtitle,
	railToggle,
}: Pick<AppPageProps, "crumb" | "aside" | "icon" | "title" | "live" | "subtitle"> & {
	railToggle?: ReactNode;
}) {
	return (
		<div className="ap-head">
			{(crumb || aside || railToggle) && (
				<div className="ap-crumb">
					<div>{crumb}</div>
					{(aside || railToggle) && (
						<div className="ap-crumb-actions">
							{aside}
							{railToggle}
						</div>
					)}
				</div>
			)}
			<div className="ap-title">
				{icon && <span className="glyph">{icon}</span>}
				<h1>{title}</h1>
				{live && <span className="live" aria-hidden="true" />}
			</div>
			{subtitle && <p className="ap-sub">{subtitle}</p>}
		</div>
	);
}

export function AppPage({
	crumb,
	aside,
	icon,
	title,
	live,
	subtitle,
	summary,
	toolbar,
	rail,
	footer,
	children,
}: AppPageProps) {
	const { isRailCollapsed, toggleRail } = useRail();

	// The collapse toggle lives in the header and only exists when the page has a
	// rail. It is desktop-only (hidden below lg via CSS), since the rail stacks
	// inline on mobile where collapsing is meaningless.
	const railToggle = rail ? (
		<button
			type="button"
			className="ap-rail-toggle"
			onClick={toggleRail}
			aria-label={isRailCollapsed ? "Expand rail" : "Collapse rail"}
			aria-expanded={!isRailCollapsed}
			aria-controls="ap-right-rail"
			title={isRailCollapsed ? "Expand rail" : "Collapse rail"}
		>
			{isRailCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
		</button>
	) : undefined;

	return (
		<div className="ap-page">
			<div className="ap-col">
				<div className="ap-scroll">
					<PageHeader
						crumb={crumb}
						aside={aside}
						icon={icon}
						title={title}
						live={live}
						subtitle={subtitle}
						railToggle={railToggle}
					/>
					{rail && <div className="ap-rail-inline">{rail}</div>}
					{summary}
					{toolbar}
					{children}
					{footer}
				</div>
			</div>
			{rail && (
				<aside id="ap-right-rail" className={cn("ap-rail", isRailCollapsed && "is-collapsed")}>
					{rail}
				</aside>
			)}
		</div>
	);
}

export interface ToolbarFilter {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string; count?: number; disabled?: boolean }[];
	ariaLabel?: string;
}

export interface ToolbarAction {
	label?: string;
	icon?: ReactNode;
	/** Trailing muted timestamp (e.g. "9:38 am"). */
	ago?: string;
	onClick?: () => void;
	variant?: "ghost" | "solid";
	disabled?: boolean;
	ariaLabel?: string;
	/** Render the action as a router Link to this route instead of a button. */
	to?: string;
	/** Escape hatch: render this node verbatim in the action slot (e.g. a
	 * tooltip-wrapped control). Takes precedence over to / button. */
	node?: ReactNode;
}

interface AppPageToolbarProps {
	search?: { value: string; onChange: (value: string) => void; placeholder?: string };
	filters?: ToolbarFilter[];
	actions?: ToolbarAction[];
	/** Optional status line below the toolbar row (e.g. a sync-progress message). */
	notice?: ReactNode;
}

/**
 * AppPageToolbar — search + filter dropdown(s) + action button(s), matching the
 * prototype's calm `ap-tools` row. Filters are native selects carrying live
 * counts; actions use the house buttons (ghost / solid).
 */
export function AppPageToolbar({
	search,
	filters = [],
	actions = [],
	notice,
}: AppPageToolbarProps) {
	return (
		<div className="ap-tools">
			<div className="ap-toolrow">
				{search && (
					<label className="ap-search">
						<Search size={17} aria-hidden="true" />
						<input
							type="search"
							value={search.value}
							onChange={(event) => search.onChange(event.target.value)}
							placeholder={search.placeholder ?? "Search…"}
							aria-label={search.placeholder ?? "Search"}
						/>
						{search.value && (
							<button
								type="button"
								className="ap-search-clear"
								onClick={() => search.onChange("")}
								aria-label="Clear search"
							>
								<X size={15} />
							</button>
						)}
					</label>
				)}
				{actions.length > 0 && (
					<div className="ap-actions">
						{actions.map((action, index) => {
							const key = action.ariaLabel ?? action.label ?? action.to ?? index;
							if (action.node) return <span key={key}>{action.node}</span>;
							const className = `btn-${action.variant ?? "ghost"}`;
							if (action.to) {
								return (
									<Link
										key={key}
										to={action.to}
										disabled={action.disabled}
										className={className}
										aria-label={action.ariaLabel ?? action.label}
									>
										{action.icon}
										{action.label}
									</Link>
								);
							}
							return (
								<button
									key={key}
									type="button"
									className={className}
									onClick={action.onClick}
									disabled={action.disabled}
									aria-label={action.ariaLabel ?? action.label}
								>
									{action.icon}
									{action.label}
									{action.ago && <span className="ago">{action.ago}</span>}
								</button>
							);
						})}
					</div>
				)}
			</div>
			{notice && <div className="ap-toolnotice">{notice}</div>}
			{filters.length > 0 && (
				<div className="ap-selects">
					{filters.map((filter) => (
						<OptionSelect
							key={filter.ariaLabel ?? filter.options[0]?.value}
							value={filter.value}
							onValueChange={filter.onChange}
							ariaLabel={filter.ariaLabel ?? "Filter"}
							className="w-full sm:w-44"
							options={filter.options.map((option) => ({
								value: option.value,
								label: option.count != null ? `${option.label} · ${option.count}` : option.label,
							}))}
						/>
					))}
				</div>
			)}
		</div>
	);
}
