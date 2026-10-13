import type { AppUser } from "../types";

/** The name the shell shows for the signed in user: "First Last", "First", or
 * a neutral fallback while the profile is still loading. */
export function displayName(user: Pick<AppUser, "firstName" | "lastName"> | null | undefined) {
	if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
	if (user?.firstName) return user.firstName;
	return "User";
}

/** Up to two initials for the avatar fallback, "MF" for "Matthew Fornaciari". */
export function avatarInitials(name: string) {
	return (
		name
			.split(" ")
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "U"
	);
}
