/**
 * The session half of the api contract every app on this template shares:
 * exchange an OAuth code for the token pair, and read the signed in user.
 * The shell (UserContext, the OAuth callback) imports this directly and never
 * the app's aggregate, so upstream code has no dependency on app resources.
 */

import type { RegisteredUser, TokenResponse } from "../types";
import { apiFetch } from "./http";
import { toSnakeCase } from "./transformKeys";
import type { UnitPreferences } from "./units";
import { type APIEntityEnvelope, unwrapEntity } from "./unwrap";

export const session = {
	/** Exchange an OAuth code for the JWT pair. */
	token: (code: string) =>
		apiFetch<TokenResponse>("/v1/auth/token", {
			method: "POST",
			body: JSON.stringify({ code }),
		}),

	/** The signed in user. */
	me: async () => {
		const envelope = await apiFetch<APIEntityEnvelope<RegisteredUser>>("/v1/users/me");
		return unwrapEntity(envelope);
	},

	/** Save the person's unit preferences, a system per measure. */
	updateUnits: async (units: UnitPreferences) => {
		const envelope = await apiFetch<APIEntityEnvelope<RegisteredUser>>("/v1/users/me", {
			method: "PATCH",
			body: JSON.stringify({ user: { units: toSnakeCase(units) } }),
		});
		return unwrapEntity(envelope);
	},
};
