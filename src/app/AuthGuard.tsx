import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { isPublicRoute } from "./lib/publicRoutes";
import { useAuthStore } from "./stores/authStore";

interface AuthGuardProps {
	children: ReactNode;
}

/**
 * Protects routes that require authentication. What a signed out visitor may
 * load is the app's call, read through publicRoutes.ts: the exact public
 * routes ("/" doubles as the sign in surface, "/oauth/callback" lands the
 * redirect) and the public page patterns. Everything else redirects to "/",
 * which renders the adaptive auth page.
 */
export function AuthGuard({ children }: AuthGuardProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const pathname = useLocation({ select: (location) => location.pathname });

	if (!isAuthenticated && !isPublicRoute(pathname)) {
		return <Navigate to="/" />;
	}

	return <>{children}</>;
}
