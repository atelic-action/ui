import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {} from "../types/query";

const mutationCache = new MutationCache({
	onSuccess: (data, _variables, _context, mutation) => {
		const toastConfig = mutation.options.meta?.toast;
		if (!toastConfig?.success) return;
		const title =
			typeof toastConfig.success === "function" ? toastConfig.success(data) : toastConfig.success;
		const description =
			typeof toastConfig.successDescription === "function"
				? toastConfig.successDescription(data)
				: toastConfig.successDescription;
		toast.success(title, description ? { description } : undefined);
	},
	onError: (error, _variables, _context, mutation) => {
		const toastConfig = mutation.options.meta?.toast;
		if (!toastConfig?.error) return;
		toast.error(toastConfig.error, { description: error.message });
	},
});

/**
 * TanStack Query client instance.
 * Exported for use in:
 * - QueryClientProvider (in __root.tsx)
 * - Route loaders (queryClient.ensureQueryData)
 */
export const queryClient = new QueryClient({
	mutationCache,
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});
