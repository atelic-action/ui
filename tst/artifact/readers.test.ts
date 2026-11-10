import { whoIsReading } from "../../src/artifact/readers";

const sender = "matt@atelic.me";

describe("who a visit is identified as", () => {
	it("identifies a reader who signed in at the wall by the email they signed in with", () => {
		expect(whoIsReading({ gateEmail: "lawrence@example.com", senderEmail: sender })).toBe(
			"lawrence@example.com",
		);
	});

	it("trims the cookie's value before reading it", () => {
		expect(whoIsReading({ gateEmail: "  dana@example.com ", senderEmail: sender })).toBe(
			"dana@example.com",
		);
	});

	it("leaves a visit with no sign in anonymous", () => {
		expect(whoIsReading({ gateEmail: "", senderEmail: sender })).toBeUndefined();
		expect(whoIsReading({ gateEmail: "not-an-address", senderEmail: sender })).toBeUndefined();
	});

	it("never identifies the practice reading its own document, whatever the case", () => {
		expect(whoIsReading({ gateEmail: "matt@atelic.me", senderEmail: sender })).toBeUndefined();
		expect(whoIsReading({ gateEmail: "someone@Atelic.me", senderEmail: sender })).toBeUndefined();
	});
});
