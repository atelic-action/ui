// @vitest-environment node
import { checkSentry } from "../../src/scripts/check-sentry";

const DSN = "https://key@o1.ingest.example.com/42";

describe("checkSentry", () => {
	it("passes any build whose DSN is set", () => {
		for (const VERCEL_ENV of ["production", "preview", undefined]) {
			expect(checkSentry({ env: { VERCEL_ENV, VITE_SENTRY_DSN: DSN }, args: [] }).code).toBe(0);
		}
	});

	it("fails a production build with no DSN, or a DSN of spaces", () => {
		for (const VITE_SENTRY_DSN of [undefined, "", "  "]) {
			const result = checkSentry({ env: { VERCEL_ENV: "production", VITE_SENTRY_DSN }, args: [] });
			expect(result.code).toBe(1);
			expect(result.message).toContain("--allow-missing");
		}
	});

	it("passes a production build with no DSN under the waiver, with a warning", () => {
		const result = checkSentry({ env: { VERCEL_ENV: "production" }, args: ["--allow-missing"] });
		expect(result.code).toBe(0);
		expect(result.message).toContain("WARNING");
	});

	it("passes a preview and a local build with no DSN, naming which", () => {
		expect(checkSentry({ env: { VERCEL_ENV: "preview" }, args: [] })).toEqual({
			code: 0,
			message: expect.stringContaining("this preview build"),
		});
		expect(checkSentry({ env: {}, args: [] }).message).toContain("this local build");
	});

	it("fails any build whose DSN is set but malformed, waiver or not", () => {
		for (const VERCEL_ENV of ["production", "preview", undefined]) {
			for (const VITE_SENTRY_DSN of [
				"not a dsn",
				"https://o1.ingest.example.com/42",
				"https://k@o1.example.com/abc",
			]) {
				const result = checkSentry({
					env: { VERCEL_ENV, VITE_SENTRY_DSN },
					args: ["--allow-missing"],
				});
				expect(result.code, `${VERCEL_ENV} ${VITE_SENTRY_DSN}`).toBe(1);
				expect(result.message).toContain("is not a DSN");
			}
		}
	});
});
