import { createJSONStorage, type StateStorage } from "zustand/middleware";
import { peekAppConfig } from "../config";

/**
 * localStorage under the app's prefix, read when it is used rather than when
 * the store is created, since the stores live in the package and the prefix is
 * the app's. Before the app is configured nothing is read or written, and a
 * browser that refuses storage (a private window, the server) is a no op.
 */
const prefixed: StateStorage = {
	getItem: (name) => {
		const config = peekAppConfig();
		if (!config) return null;
		try {
			return localStorage.getItem(`${config.storagePrefix}-${name}`);
		} catch {
			return null;
		}
	},
	setItem: (name, value) => {
		const config = peekAppConfig();
		if (!config) return;
		try {
			localStorage.setItem(`${config.storagePrefix}-${name}`, value);
		} catch {
			// Storage refused; the state lives in memory for this visit.
		}
	},
	removeItem: (name) => {
		const config = peekAppConfig();
		if (!config) return;
		try {
			localStorage.removeItem(`${config.storagePrefix}-${name}`);
		} catch {
			// Nothing stored to remove.
		}
	},
};

export const appStorage = createJSONStorage(() => prefixed);
