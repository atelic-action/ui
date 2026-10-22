import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { peekAppConfig } from "../config";

interface SidebarContextType {
	isCollapsed: boolean;
	toggleSidebar: () => void;
	setCollapsed: (collapsed: boolean) => void;
	/** Right (AppPage) rail collapse — mirrors the left nav rail. */
	isRailCollapsed: boolean;
	toggleRail: () => void;
	setRailCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
	children: ReactNode;
}

const SIDEBAR_KEY = "sidebarCollapsed";
const RAIL_KEY = "railCollapsed";

/** localStorage under the app's prefix; a no op before the app is configured or where storage is refused. */
function readSaved(name: string): boolean {
	const config = peekAppConfig();
	if (!config) return false;
	try {
		return localStorage.getItem(`${config.storagePrefix}-${name}`) === "true";
	} catch {
		return false;
	}
}

function writeSaved(name: string, value: boolean) {
	const config = peekAppConfig();
	if (!config) return;
	try {
		localStorage.setItem(`${config.storagePrefix}-${name}`, String(value));
	} catch {
		// Storage refused; the state lives in memory for this visit.
	}
}

export function SidebarProvider({ children }: SidebarProviderProps) {
	// Both start open so a prerender and the first client render agree; the
	// saved choice is read in an effect, then written back on every change.
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRailCollapsed, setIsRailCollapsed] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setIsCollapsed(readSaved(SIDEBAR_KEY));
		setIsRailCollapsed(readSaved(RAIL_KEY));
		setReady(true);
	}, []);

	useEffect(() => {
		if (ready) writeSaved(SIDEBAR_KEY, isCollapsed);
	}, [ready, isCollapsed]);

	useEffect(() => {
		if (ready) writeSaved(RAIL_KEY, isRailCollapsed);
	}, [ready, isRailCollapsed]);

	const toggleSidebar = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	const setCollapsed = useCallback((collapsed: boolean) => {
		setIsCollapsed(collapsed);
	}, []);

	const toggleRail = useCallback(() => {
		setIsRailCollapsed((prev) => !prev);
	}, []);

	const setRailCollapsed = useCallback((collapsed: boolean) => {
		setIsRailCollapsed(collapsed);
	}, []);

	const value = useMemo(
		() => ({
			isCollapsed,
			toggleSidebar,
			setCollapsed,
			isRailCollapsed,
			toggleRail,
			setRailCollapsed,
		}),
		[isCollapsed, toggleSidebar, setCollapsed, isRailCollapsed, toggleRail, setRailCollapsed],
	);

	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

/**
 * Tolerant accessor for the right-rail collapse state. Unlike `useSidebar`, it
 * does NOT throw when used outside a `SidebarProvider`: AppPage surfaces are
 * mounted bare in unit tests, so the rail toggle simply degrades to a no-op
 * there rather than blowing up the render.
 */
export function useRail() {
	const context = useContext(SidebarContext);
	return {
		isRailCollapsed: context?.isRailCollapsed ?? false,
		toggleRail: context?.toggleRail ?? (() => {}),
	};
}
