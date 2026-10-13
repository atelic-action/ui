import { createContext, type ReactNode, useCallback, useContext } from "react";
import { joinBase, normalizeBasePath } from "./basePath";

/**
 * The base path every link the package renders carries. The package imports
 * no router and reads no build setting, so a site says its base once, here,
 * and `Button`, `Chip`, and every section that builds a link or an image
 * source read it through `useBasePath`. `SiteShell` mounts the provider from
 * its `basePath` prop, so a site that renders its pages inside the shell
 * never mounts it by hand.
 *
 * With no provider above it the base is "", the root, and every path renders
 * as given.
 */
const BasePathContext = createContext("");

export interface BasePathProviderProps {
	/** The prefix the site is served under: "", "/", "proto", and "/proto/" are all read as written. */
	base?: string;
	children: ReactNode;
}

export function BasePathProvider({ base, children }: BasePathProviderProps) {
	return (
		<BasePathContext.Provider value={normalizeBasePath(base)}>{children}</BasePathContext.Provider>
	);
}

/** The base path in force: "" at the root, otherwise "/proto" in normalized form. */
export function useBasePath(): string {
	return useContext(BasePathContext);
}

/**
 * A function that puts the base in force on a root absolute path. External
 * URLs, protocol links, fragments, and paths that already carry the base pass
 * through unchanged, and so does `undefined`, so an optional prop can be
 * handed over as it is.
 */
export function useWithBase(): <T extends string | undefined>(path: T) => T {
	const base = useBasePath();
	return useCallback(
		<T extends string | undefined>(path: T): T =>
			(path === undefined ? path : joinBase(base, path)) as T,
		[base],
	);
}
