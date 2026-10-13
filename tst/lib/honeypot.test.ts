import { isHoneypotFilled } from "../../src/lib/honeypot";

describe("isHoneypotFilled", () => {
	it("flags any real value as a bot", () => {
		expect(isHoneypotFilled("Totally Real LLC")).toBe(true);
	});

	it("passes an empty, blank, or missing field", () => {
		expect(isHoneypotFilled("")).toBe(false);
		expect(isHoneypotFilled("   ")).toBe(false);
		expect(isHoneypotFilled(undefined)).toBe(false);
		expect(isHoneypotFilled(null)).toBe(false);
	});
});
