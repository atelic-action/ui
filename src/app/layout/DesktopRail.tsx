import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppConfig, useNav } from "../context/AppContext";
import { cn } from "../lib/utils";
import type { AppUser } from "../types";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { isActivePath, isActiveSection, type NavItem } from "./nav";
import { UserMenu } from "./UserMenu";

export const RAIL_WIDTH = 256;
export const RAIL_WIDTH_COLLAPSED = 80;

interface DesktopRailProps {
	pathname: string;
	collapsed: boolean;
	onToggle: () => void;
	user: AppUser | null;
	onLogout: () => void;
}

function RailLink({
	item,
	active,
	collapsed,
}: {
	item: NavItem;
	active: boolean;
	collapsed: boolean;
}) {
	const Icon = item.icon;
	const className = cn(
		"flex items-center rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-accent",
		collapsed ? "justify-center" : "space-x-3 overflow-hidden",
		active && "bg-primary/10 text-primary font-medium",
	);
	const link = (
		<Link to={item.href} className={className} aria-current={active ? "page" : undefined}>
			<Icon className="h-5 w-5 flex-shrink-0" />
			{!collapsed && <span>{item.label}</span>}
		</Link>
	);
	if (!collapsed) return link;
	return (
		<TooltipProvider>
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>{link}</TooltipTrigger>
				<TooltipContent side="right" className="font-medium text-sm">
					<p>{item.label}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * The desktop navigation rail (lg and up): brand, the sections, the active
 * section's sub pages nested beneath it, and the user block at the foot.
 * Collapsed, it is icons with tooltips and the sub pages fold away; the
 * section landing page carries them as cards, so nothing is lost.
 */
export function DesktopRail({ pathname, collapsed, onToggle, user, onLogout }: DesktopRailProps) {
	const appConfig = useAppConfig();
	const navItems = useNav();
	return (
		<aside
			aria-label="Main navigation"
			style={{ width: collapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH }}
			className={cn(
				"fixed left-0 top-0 z-40 h-screen bg-background border-r border-border/40",
				"hidden lg:block transition-[width] duration-200 ease-out",
			)}
		>
			<div className="flex h-full flex-col">
				<div className="border-b border-border/40">
					<div
						className={cn(
							"flex items-center px-6 py-5",
							collapsed ? "flex-col space-y-3" : "justify-between",
						)}
					>
						<Link
							to="/"
							className={cn(
								"flex items-center overflow-hidden transition-opacity hover:opacity-80",
								collapsed ? "justify-center" : "space-x-2",
							)}
							aria-label={`${appConfig.name} home`}
						>
							<span className="inline-block size-2 rounded-full bg-brand" aria-hidden="true" />
							{!collapsed && (
								<span className="text-lg font-medium tracking-tight">{appConfig.mark}</span>
							)}
						</Link>

						<TooltipProvider>
							<Tooltip delayDuration={0}>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={onToggle}
										className="flex-shrink-0 rounded-lg p-2 hover:bg-accent"
										aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
									>
										{collapsed ? (
											<PanelLeftOpen className="h-5 w-5" />
										) : (
											<PanelLeftClose className="h-5 w-5" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side={collapsed ? "right" : "bottom"}
									className="font-medium text-sm"
								>
									<p>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				<nav className="flex-1 space-y-1 px-4 py-6" aria-label="Primary navigation">
					{navItems
						.filter((item) => !item.mobileOnly)
						.map((item) => {
							const active = isActiveSection(pathname, item);
							const showChildren = active && !collapsed && item.children?.length;
							return (
								<div key={item.href}>
									<RailLink item={item} active={active} collapsed={collapsed} />
									{showChildren ? (
										<ul className="mt-1 space-y-0.5 pb-1" aria-label={`${item.label} pages`}>
											{item.children?.map((child) => {
												const childActive = isActivePath(pathname, child.href);
												const ChildIcon = child.icon;
												return (
													<li key={child.href}>
														<Link
															to={child.href}
															className={cn(
																"flex items-center space-x-2.5 rounded-lg py-2 pl-11 pr-3 text-sm",
																"text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground",
																childActive && "bg-primary/10 text-primary font-medium",
															)}
															aria-current={childActive ? "page" : undefined}
														>
															<ChildIcon className="h-4 w-4 flex-shrink-0" />
															<span>{child.label}</span>
														</Link>
													</li>
												);
											})}
										</ul>
									) : null}
								</div>
							);
						})}
				</nav>

				<div className="border-t border-border/40 p-3">
					<UserMenu user={user} onLogout={onLogout} collapsed={collapsed} />
				</div>
			</div>
		</aside>
	);
}
