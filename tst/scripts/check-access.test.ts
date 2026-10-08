// @vitest-environment node
import { decideAccess, WALL_VARIABLES } from "../../src/scripts/check-access";

const ARMED = {
	GATE_SESSION_SECRET: "a-long-random-secret",
	GATE_ALLOWLIST: "owner@example.com",
	RESEND_API_KEY: "re_example",
};

/**
 * The guard is the structural half of the privacy rule: a private artifact
 * cannot ship to Vercel without its wall. What it must never do is wave a
 * private build through on the host, or stop a local build that is not a
 * deploy at all.
 */
describe("decideAccess", () => {
	it("passes a public artifact anywhere, with or without the wall", () => {
		expect(decideAccess("public", {}).verdict).toBe("pass");
		expect(decideAccess("public", { VERCEL: "1" }).verdict).toBe("pass");
	});

	it("fails a private artifact on Vercel with no wall, naming every variable to set", () => {
		const decision = decideAccess("private", { VERCEL: "1" });
		expect(decision.verdict).toBe("fail");
		for (const name of WALL_VARIABLES) expect(decision.message).toContain(name);
		expect(decision.message).toContain("Environment Variables");
	});

	it("names only what is missing when the wall is half armed", () => {
		const decision = decideAccess("private", {
			VERCEL: "1",
			GATE_SESSION_SECRET: "set",
			GATE_ALLOWLIST: "  ",
		});
		expect(decision.verdict).toBe("fail");
		expect(decision.message).toContain("GATE_ALLOWLIST and RESEND_API_KEY");
		expect(decision.message).not.toContain("Set GATE_SESSION_SECRET");
	});

	it("passes a private artifact on Vercel once all three are set", () => {
		expect(decideAccess("private", { VERCEL: "1", ...ARMED }).verdict).toBe("pass");
	});

	it("lets a local build of a private artifact through with a warning that names what the host will need", () => {
		const decision = decideAccess("private", {});
		expect(decision.verdict).toBe("warn");
		expect(decision.message).toContain("GATE_SESSION_SECRET, GATE_ALLOWLIST and RESEND_API_KEY");
		expect(decideAccess("private", ARMED).verdict).toBe("warn");
	});

	it("fails a config with no access line, locally and on the host alike", () => {
		expect(decideAccess(undefined, {}).verdict).toBe("fail");
		expect(decideAccess("open", { VERCEL: "1", ...ARMED }).verdict).toBe("fail");
	});
});
