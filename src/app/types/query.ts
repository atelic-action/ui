export interface ToastMeta {
	success?: string | ((data: unknown) => string);
	successDescription?: string | ((data: unknown) => string);
	error?: string;
}

declare module "@tanstack/react-query" {
	interface Register {
		mutationMeta: { toast?: ToastMeta };
	}
}
