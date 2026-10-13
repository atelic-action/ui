import { Link } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppConfig, useNav } from "../context/AppContext";
import { cn } from "../lib/utils";
import type { AppUser } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../ui/sheet";
import { avatarInitials, displayName } from "./identity";
import { isActivePath, isActiveSection } from "./nav";

interface MobileMenuProps {
	pathname: string;
	user: AppUser | null;
	onLogout: () => void;
}

const ROW =
	"flex min-h-12 items-center gap-3 rounded-lg px-3 text-base transition-colors duration-150 active:bg-accent";

/**
 * The hamburger menu for phones and tablets: a right side sheet holding the
 * whole map (every section with its sub pages beneath it) and, at the foot,
 * the signed in user with Profile and Log out. The tab bar stays the fast
 * path between sections; this is where everything else lives. It closes
 * itself on navigation.
 */
export function MobileMenu({ pathname, user, onLogout }: MobileMenuProps) {
	const appConfig = useAppConfig();
	const navItems = useNav();
	const [open, setOpen] = useState(false);
	const name = displayName(user);

	// Any navigation, by tap or by history, shuts the sheet.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a dependency of the effect body
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="-mr-2 h-11 w-11 text-foreground hover:bg-accent"
					aria-label="Open menu"
					aria-expanded={open}
				>
					<Menu className="h-6 w-6" />
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="flex w-[84vw] max-w-sm flex-col gap-0 p-0">
				<SheetTitle className="sr-only">Menu</SheetTitle>
				<SheetDescription className="sr-only">
					Every page in the app, and your account.
				</SheetDescription>

				<div className="flex h-14 items-center border-b border-border/40 px-5">
					<Link
						to="/"
						className="flex items-center space-x-2"
						aria-label={`${appConfig.name} home`}
					>
						<span className="inline-block size-2 rounded-full bg-brand" aria-hidden="true" />
						<span className="text-lg font-medium tracking-tight">{appConfig.mark}</span>
					</Link>
				</div>

				<nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Menu">
					<ul className="space-y-0.5">
						{navItems.map((item) => {
							const Icon = item.icon;
							const active = isActiveSection(pathname, item);
							// A section with sub pages lights its row only on its own landing
							// page; deeper in, the sub page row carries the highlight.
							const exact = pathname === item.href;
							return (
								<li key={item.href}>
									<Link
										to={item.href}
										className={cn(
											ROW,
											"font-medium",
											active && !item.children ? "bg-primary/10 text-primary" : "text-foreground",
											item.children && exact && "bg-primary/10 text-primary",
										)}
										aria-current={exact ? "page" : undefined}
									>
										<Icon className="h-5 w-5 flex-shrink-0" />
										<span>{item.label}</span>
									</Link>
									{item.children ? (
										<ul className="mb-1 mt-0.5 space-y-0.5" aria-label={`${item.label} pages`}>
											{item.children.map((child) => {
												const ChildIcon = child.icon;
												const childActive = isActivePath(pathname, child.href);
												return (
													<li key={child.href}>
														<Link
															to={child.href}
															className={cn(
																ROW,
																"min-h-11 pl-11 text-[15px]",
																childActive
																	? "bg-primary/10 font-medium text-primary"
																	: "text-muted-foreground",
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
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="border-t border-border/40 px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
					<Link
						to="/profile"
						className={cn(ROW, "min-h-14", pathname.startsWith("/profile") && "bg-primary/10")}
						aria-current={pathname.startsWith("/profile") ? "page" : undefined}
					>
						<Avatar className="h-9 w-9 flex-shrink-0 border border-border/40">
							<AvatarImage src={user?.avatar ?? undefined} alt={name} />
							<AvatarFallback className="text-sm">{avatarInitials(name)}</AvatarFallback>
						</Avatar>
						<span className="flex min-w-0 flex-col">
							<span className="truncate text-sm font-medium">{name}</span>
							<span className="text-xs text-muted-foreground">Profile</span>
						</span>
					</Link>
					<button type="button" onClick={onLogout} className={cn(ROW, "w-full text-destructive")}>
						<LogOut className="h-5 w-5 flex-shrink-0" />
						<span>Log out</span>
					</button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
