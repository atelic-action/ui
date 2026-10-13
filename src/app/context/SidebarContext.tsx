import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

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

export function SidebarProvider({ children }: SidebarProviderProps) {
	const [isCollapsed, setIsCollapsed] = useState(() => {
		// Load collapsed state from localStorage with error handling
		try {
			const saved = localStorage.getItem("sidebarCollapsed");
			return saved === "true";
		} catch {
			// Fallback if localStorage is not available
			return false;
		}
	});

	const [isRailCollapsed, setIsRailCollapsed] = useState(() => {
		try {
			return localStorage.getItem("railCollapsed") === "true";
		} catch {
			return false;
		}
	});

	// Save sidebar state to localStorage with error handling
	useEffect(() => {
		try {
			localStorage.setItem("sidebarCollapsed", String(isCollapsed));
		} catch {
			// Silently fail if localStorage is not available
		}
	}, [isCollapsed]);

	useEffect(() => {
		try {
			localStorage.setItem("railCollapsed", String(isRailCollapsed));
		} catch {
			// Silently fail if localStorage is not available
		}
	}, [isRailCollapsed]);

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
