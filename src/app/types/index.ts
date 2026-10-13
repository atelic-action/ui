/**
 * The wire protocol every app on this shell shares with its api (pagination
 * and the token pair), and the signed in user as the shell reads it. Domain
 * types are the app's.
 */

import type { UnitPreferences } from "../lib/units";

/**
 * The signed in person, as much of them as the shell reads: the name, the
 * avatar, the username (the segment their public pages live under), and the
 * unit preferences it keeps in step with the units store. An app's own user
 * type extends this and registers itself (see `Register`).
 */
export interface AppUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	username: string | null;
	avatar: string | null;
	units?: UnitPreferences;
}

/**
 * Where an app names its own user type, once, so every hook and store the
 * shell exports hands it back typed in full:
 *
 * ```ts
 * declare module "@atelic-action/ui/app" {
 *   interface Register {
 *     user: User;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: the app augments it, as TanStack's Register is augmented
export interface Register {}

/** The app's registered user type, or `AppUser` when none is registered. */
export type RegisteredUser = Register extends { user: infer U extends AppUser } ? U : AppUser;

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		perPage: number;
	};
}

export interface PaginationLinks {
	self: string;
	first: string;
	prev: string | null;
	next: string | null;
	last: string;
}

export interface TokenResponse {
	token: string;
	refreshToken: string;
	expiresIn: number;
	user: RegisteredUser;
}

export interface RefreshResponse {
	token: string;
	refreshToken: string;
	expiresIn: number;
}
