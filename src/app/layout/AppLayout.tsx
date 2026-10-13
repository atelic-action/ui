import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAppConfig } from "../context/AppContext";
import { useSidebar } from "../context/SidebarContext";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { isPublicPage } from "../lib/publicRoutes";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { DesktopRail, RAIL_WIDTH, RAIL_WIDTH_COLLAPSED } from "./DesktopRail";
import { MobileMenu } from "./MobileMenu";
import { MobileTabBar } from "./MobileTabBar";

interface AppLayoutProps {
	children: ReactNode;
}

/**
 * The chrome around a public page for a visitor who is not signed in: the
 * brand on the left, a sign in link on the right, and the page. No rail, no
 * tab bar, nothing that assumes an account.
 */
function PublicShell({ children }: AppLayoutProps) {
	const appConfig = useAppConfig();
	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-30 border-b border-border/40 bg-background">
				<div className="flex h-14 items-center justify-between px-4 lg:px-6">
					<Link
						to="/"
						className="flex items-center space-x-2 transition-opacity hover:opacity-80"
						aria-label={`${appConfig.name} home`}
					>
						<span className="inline-block size-2 rounded-full bg-brand" aria-hidden="true" />
						<span className="text-lg font-medium tracking-tight">{appConfig.mark}</span>
					</Link>
					<Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
						Sign in
					</Link>
				</div>
			</header>
			<main className="flex min-h-[calc(100vh-3.5rem)] flex-col">{children}</main>
		</div>
	);
}

/**
 * The app shell around every authenticated page. Mobile first: below the
 * desktop breakpoint it is a slim top bar (brand, hamburger menu) over the
 * page with the section tab bar pinned to the bottom. At lg and up the top
 * bar and tab bar give way to the navigation rail on the left. Every nav
 * surface reads the one nav the app hands `AppProvider`.
 */
export function AppLayout({ children }: AppLayoutProps) {
	const appConfig = useAppConfig();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { isCollapsed, toggleSidebar } = useSidebar();
	const isDesktop = useIsDesktop();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	const handleLogout = () => {
		logout();
		navigate({ to: "/", replace: true });
	};

	if (!isAuthenticated) {
		return isPublicPage(pathname) ? <PublicShell>{children}</PublicShell> : children;
	}

	return (
		<div className="min-h-screen bg-background">
			<DesktopRail
				pathname={pathname}
				collapsed={isCollapsed}
				onToggle={toggleSidebar}
				user={user}
				onLogout={handleLogout}
			/>

			<div
				style={{ paddingLeft: isDesktop ? (isCollapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH) : 0 }}
				className={cn(
					"flex min-h-screen flex-col transition-[padding-left] duration-200 ease-out",
					"pb-16 lg:pb-0",
				)}
			>
				<header className="sticky top-0 z-30 border-b border-border/40 bg-background lg:hidden">
					<div className="flex h-14 items-center justify-between px-4">
						<Link
							to="/"
							className="flex items-center space-x-2 transition-opacity hover:opacity-80"
							aria-label={`${appConfig.name} home`}
						>
							<span className="inline-block size-2 rounded-full bg-brand" aria-hidden="true" />
							<span className="text-lg font-medium tracking-tight">{appConfig.mark}</span>
						</Link>
						<MobileMenu pathname={pathname} user={user} onLogout={handleLogout} />
					</div>
				</header>

				<main className="flex flex-1 flex-col">{children}</main>
			</div>

			{!isDesktop && <MobileTabBar pathname={pathname} />}
		</div>
	);
}
