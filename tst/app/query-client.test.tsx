import { type QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastMeta } from "../../src/app/types/query";

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
	toast: {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

// Import queryClient AFTER mocking sonner so the MutationCache binds to our mock
const { queryClient } = await import("../../src/app/lib/queryClient");

function createWrapper(client?: QueryClient) {
	const qc = client ?? queryClient;
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
	};
}

describe("MutationCache toast integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("success toasts", () => {
		it("shows a toast with a static success string", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => "ok",
						meta: { toast: { success: "It worked" } },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("It worked", undefined);
			});
		});

		it("shows a toast with a dynamic success function", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => ({ count: 5 }),
						meta: {
							toast: {
								success: (data) => `Synced ${(data as { count: number }).count} items`,
							},
						},
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("Synced 5 items", undefined);
			});
		});

		it("includes a static successDescription", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => "ok",
						meta: {
							toast: {
								success: "Saved",
								successDescription: "Your changes have been saved.",
							},
						},
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("Saved", {
					description: "Your changes have been saved.",
				});
			});
		});

		it("includes a dynamic successDescription", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => ({ name: "Profile" }),
						meta: {
							toast: {
								success: "Updated",
								successDescription: (data) =>
									`${(data as { name: string }).name} has been updated.`,
							},
						},
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("Updated", {
					description: "Profile has been updated.",
				});
			});
		});
	});

	describe("error toasts", () => {
		it("shows a toast with the error message as description", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => {
							throw new Error("Network timeout");
						},
						meta: { toast: { error: "Request failed" } },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Request failed", {
					description: "Network timeout",
				});
			});
		});

		it("does not show success toast on error even when success is configured", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => {
							throw new Error("fail");
						},
						meta: { toast: { success: "Done", error: "Oops" } },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Oops", { description: "fail" });
			});
			expect(mockToastSuccess).not.toHaveBeenCalled();
		});
	});

	describe("opt in behavior", () => {
		it("does not show any toast when meta.toast is not set", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => "ok",
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockToastError).not.toHaveBeenCalled();
		});

		it("does not show any toast when meta.toast is empty", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => "ok",
						meta: { toast: {} },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockToastError).not.toHaveBeenCalled();
		});

		it("does not show error toast when only success is configured", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => {
							throw new Error("fail");
						},
						meta: { toast: { success: "Done" } },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});
			expect(mockToastError).not.toHaveBeenCalled();
			expect(mockToastSuccess).not.toHaveBeenCalled();
		});

		it("does not show success toast when only error is configured", async () => {
			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => "ok",
						meta: { toast: { error: "Failed" } },
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockToastError).not.toHaveBeenCalled();
		});
	});

	describe("coexistence with per hook callbacks", () => {
		it("fires both meta.toast and onSuccess callback", async () => {
			const onSuccessSpy = vi.fn();

			const { result } = renderHook(
				() =>
					useMutation<{ id: number }, Error, void>({
						mutationFn: async () => ({ id: 1 }),
						meta: { toast: { success: "Created" } },
						onSuccess: onSuccessSpy,
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("Created", undefined);
				expect(onSuccessSpy).toHaveBeenCalled();
				expect(onSuccessSpy.mock.calls[0][0]).toEqual({ id: 1 });
			});
		});

		it("fires both meta.toast and onError callback", async () => {
			const onErrorSpy = vi.fn();
			const error = new Error("Boom");

			const { result } = renderHook(
				() =>
					useMutation<void, Error, void>({
						mutationFn: async () => {
							throw error;
						},
						meta: { toast: { error: "Something broke" } },
						onError: onErrorSpy,
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Something broke", {
					description: "Boom",
				});
				expect(onErrorSpy).toHaveBeenCalled();
			});
		});

		it("fires onMutate for optimistic updates alongside meta.toast", async () => {
			const onMutateSpy = vi.fn().mockReturnValue({ previous: "snapshot" });

			const { result } = renderHook(
				() =>
					useMutation<string, Error, void>({
						mutationFn: async () => "ok",
						meta: { toast: { success: "Updated" } },
						onMutate: onMutateSpy,
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(onMutateSpy).toHaveBeenCalled();
				expect(mockToastSuccess).toHaveBeenCalledWith("Updated", undefined);
			});
		});
	});

	describe("ToastMeta type coverage", () => {
		it("handles all fields populated at once", async () => {
			const meta: { toast: ToastMeta } = {
				toast: {
					success: (data) => `Created ${(data as { name: string }).name}`,
					successDescription: (data) => `ID: ${(data as { id: number }).id}`,
					error: "Creation failed",
				},
			};

			const { result } = renderHook(
				() =>
					useMutation({
						mutationFn: async () => ({ name: "Widget", id: 42 }),
						meta,
					}),
				{ wrapper: createWrapper() },
			);

			result.current.mutate();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith("Created Widget", {
					description: "ID: 42",
				});
			});
		});
	});
});
