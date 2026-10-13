import { type AppConfig, peekAppConfig, setAppConfig } from "./config";
import { useAuthStore } from "./stores/authStore";
import { useUnitsStore } from "./stores/unitsStore";

/**
 * Hand the shell the app's config, and hydrate the persisted stores under its
 * storage prefix. `AppProvider` calls this on its first render, which covers
 * an app that renders it above its router. Call it yourself only where shell
 * code runs before that render: a module that calls the api at import, or a
 * test. Safe to call again; the stores rehydrate only when the prefix changes.
 */
export function configureApp(config: AppConfig): void {
	const previous = peekAppConfig();
	setAppConfig(config);
	if (previous?.storagePrefix === config.storagePrefix) return;
	void useAuthStore.persist.rehydrate();
	void useUnitsStore.persist.rehydrate();
}
