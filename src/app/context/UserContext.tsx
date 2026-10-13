import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { session } from "../lib/session";
import type { UnitPreferences } from "../lib/units";
import { useAuthStore } from "../stores/authStore";
import { DEFAULT_SYSTEMS, useUnitsStore } from "../stores/unitsStore";
import type { AppUser, RegisteredUser } from "../types";

export interface UserContextValue<U extends AppUser = RegisteredUser> {
	user: U | null;
	isLoading: boolean;
	error: Error | null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const authUser = useAuthStore((state) => state.user);

	const {
		data: apiUser,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["user", "me"],
		queryFn: () => session.me(),
		enabled: isAuthenticated,
	});

	// Use auth store user as fallback while fetching, or API user when available
	const user = apiUser ?? authUser;

	useUnitsSync(apiUser ?? null);

	const value: UserContextValue = {
		user,
		isLoading: isAuthenticated && isLoading,
		error: error as Error | null,
	};

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

const sameSystems = (a: Partial<UnitPreferences> | undefined, b: UnitPreferences) =>
	(Object.keys(b) as (keyof UnitPreferences)[]).every((measure) => a?.[measure] === b[measure]);

/** The account's snapshot as last hydrated into the store, or null while signed out. */
interface Hydrated {
	id: string;
	units: Partial<UnitPreferences> | undefined;
}

const sameSnapshot = (
	a: Hydrated | null,
	id: string,
	units: Partial<UnitPreferences> | undefined,
) =>
	a !== null &&
	a.id === id &&
	(Object.keys(DEFAULT_SYSTEMS) as (keyof UnitPreferences)[]).every(
		(measure) => a.units?.[measure] === units?.[measure],
	);

/**
 * Keeps the units store and the person's account in step. When the api user
 * arrives, or comes back from a refetch holding a different choice (made on
 * another device), their saved choices hydrate the store; from then on a
 * change in the store is written back, so the same choice follows them to
 * every device and to what the api itself writes in their units (a Strava
 * description). Nothing is written while signed out, and nothing is written
 * for a change the account already holds, so hydration never echoes.
 *
 * Saves go one at a time, in order, and only the newest one's response lands
 * in the query cache: each save carries the whole snapshot, so an older
 * response arriving late would otherwise hydrate the store backwards. A save
 * outlives no account: after a sign out or a switch, what the old account
 * queued is dropped and what it had in flight is not written to the cache.
 */
function useUnitsSync(apiUser: AppUser | null) {
	const queryClient = useQueryClient();
	const hydrated = useRef<Hydrated | null>(null);
	const account = useRef<string | null>(null);
	const queue = useRef<Promise<unknown>>(Promise.resolve());
	const latest = useRef(0);
	const { mutate: save } = useMutation({
		// A save belongs to the account that made it: one still queued when
		// that account signs out is dropped rather than written to the next.
		mutationFn: (units: UnitPreferences) => {
			const owner = account.current;
			const run = queue.current.then(() =>
				owner !== null && owner === account.current ? session.updateUnits(units) : null,
			);
			queue.current = run.catch(() => undefined);
			return run;
		},
		onMutate: () => ({ seq: ++latest.current, owner: account.current }),
		onSuccess: (saved, _units, context) => {
			if (saved && context.seq === latest.current && context.owner === account.current) {
				queryClient.setQueryData(["user", "me"], saved);
			}
		},
	});

	useEffect(() => {
		account.current = apiUser?.id ?? null;
		if (!apiUser) {
			hydrated.current = null;
			return;
		}
		if (!sameSnapshot(hydrated.current, apiUser.id, apiUser.units)) {
			hydrated.current = { id: apiUser.id, units: apiUser.units };
			useUnitsStore.getState().hydrate(apiUser.units);
		}
		return useUnitsStore.subscribe((state) => {
			if (!sameSystems(apiUser.units, state.systems)) save(state.systems);
		});
	}, [apiUser, save]);
}

/**
 * The signed in user: the api's copy once it arrives, the one stored at sign
 * in until then. Typed as the app's registered user; pass a type to narrow it
 * further at one call site.
 */
export function useUser<U extends AppUser = RegisteredUser>(): UserContextValue<U> {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context as unknown as UserContextValue<U>;
}
