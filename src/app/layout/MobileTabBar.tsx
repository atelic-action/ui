import { Link } from "@tanstack/react-router";
import { useNav } from "../context/AppContext";
import { cn } from "../lib/utils";
import { isActiveSection } from "./nav";

/**
 * The bottom tab bar below the desktop breakpoint: one tab per section, the
 * fast path between them. Sub pages live in the menu sheet and on each
 * section's landing page. Padded for the home indicator on notched phones.
 */
export function MobileTabBar({ pathname }: { pathname: string }) {
	const navItems = useNav();
	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden"
			aria-label="Mobile navigation"
		>
			<div className="flex h-16 items-center justify-around">
				{navItems
					.filter((item) => !item.desktopOnly)
					.map((item) => {
						const Icon = item.icon;
						const active = isActiveSection(pathname, item);
						return (
							<Link
								key={item.href}
								to={item.href}
								className={cn(
									"flex h-full flex-1 flex-col items-center justify-center py-2 transition-colors duration-150 active:bg-accent",
									active ? "bg-primary/5 text-primary" : "text-muted-foreground",
								)}
								aria-current={active ? "page" : undefined}
								aria-label={item.label}
							>
								<Icon className={cn("mb-1 h-5 w-5", active && "text-primary")} />
								<span className={cn("text-xs", active && "font-medium")}>{item.label}</span>
							</Link>
						);
					})}
			</div>
		</nav>
	);
}
