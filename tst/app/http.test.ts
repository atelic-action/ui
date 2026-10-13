import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./fixtures";

vi.mock("../../src/app/lib/tokenRefresh", () => ({
	ensureValidToken: vi.fn().mockResolvedValue(false),
	handleUnauthorized: vi.fn().mockResolvedValue(false),
}));

import { apiFetch, publicFetch } from "../../src/app/lib/http";
import { ensureValidToken } from "../../src/app/lib/tokenRefresh";

const json = (body: unknown, init: ResponseInit = {}) =>
	new Response(JSON.stringify(body), { status: 200, ...init });

describe("publicFetch", () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("reads without a session, where apiFetch refuses to", async () => {
		fetchMock.mockResolvedValue(json({ data: { entity: { first_name: "Test" } } }));

		await expect(apiFetch("/v1/users/someone/notes/1")).rejects.toThrow("Session expired");
		await expect(publicFetch("/v1/users/someone/notes/1")).resolves.toEqual({
			data: { entity: { firstName: "Test" } },
		});
	});

	it("sends no bearer token and never touches the refresh path", async () => {
		fetchMock.mockResolvedValue(json({}));
		vi.mocked(ensureValidToken).mockClear();

		await publicFetch("/v1/users/someone/notes/1");

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://api.example.test/v1/users/someone/notes/1");
		expect(new Headers(init.headers).has("Authorization")).toBe(false);
		expect(ensureValidToken).not.toHaveBeenCalled();
	});

	it("raises the api's message on a 404", async () => {
		fetchMock.mockResolvedValue(json({ error: "Not found" }, { status: 404 }));

		await expect(publicFetch("/v1/users/nobody/notes/1")).rejects.toThrow("API error: Not found");
	});
});
