// @vitest-environment node
import type { Guard } from "../../src/forms/guard";
import { type DestinationResult, refused, type Submission } from "../../src/forms/relay";
import {
	createScheduleRequest,
	DEFAULT_SCHEDULE_TO,
	officeScheduleEmail,
	readScheduleRequest,
	type ScheduleConfig,
	type ScheduleFields,
	scheduleConfigProblems,
} from "../../src/forms/schedule";

const FROM = "Alder Roofing <forms@example.com>";

const CONFIG: ScheduleConfig = {
	kinds: [
		{ id: "repair", label: "A repair", materials: true, visit: 30, call: 20 },
		{ id: "storm", label: "Storm damage", visit: 30, note: "This one starts with a visit." },
		{ id: "remodel", label: "A remodel", visit: 60, call: 30 },
	],
	materials: [
		{ id: "shingle", label: "Shingle" },
		{ id: "tile", label: "Tile", only: "call", note: "A tile roof starts with a call." },
	],
	materialLabel: "Roof material",
	hours: { open: "08:00", close: "17:00" },
	timeZone: "America/Denver",
	phone: { display: "(555) 555-0100", e164: "+15555550100" },
	source: {
		label: "How did you hear about us?",
		options: ["Google", { label: "Other", detail: { label: "Where?" } }],
	},
};

/** Wednesday, November 25, 2026, at 10:00 in Denver: the first day is Monday the 30th. */
const NOW = () => new Date("2026-11-25T17:00:00Z");
const TODAY = "2026-11-25";

const POST = createScheduleRequest({ from: FROM, config: CONFIG, retryWaitMs: 1, now: NOW });

const VALID = {
	kind: "repair",
	material: "shingle",
	mode: "visit",
	day: "2026-12-02",
	time: "09:00",
	firstName: "Dana",
	lastName: "Whitfield",
	phone: "(555) 555-0142",
	email: "dana@example.com",
	address: { street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" },
	source: "Other",
	sourceDetail: "The fall fair",
	note: "The north side leaks.",
	consent: true,
	company: "",
};

function request(body: unknown): Request {
	return new Request("http://localhost/api/schedule", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

/** The JSON body of the nth call to Resend. */
function sent(call = 0) {
	return JSON.parse(String(vi.mocked(fetch).mock.calls[call]?.[1]?.body));
}

function passing(): Guard {
	return { name: "test", tokenKey: "turnstile", check: async () => ({ status: "passed" }) };
}

describe("readScheduleRequest", () => {
	const read = (body: Record<string, unknown>) => readScheduleRequest(body, CONFIG, TODAY);
	const refusal = (body: Record<string, unknown>) => {
		const result = read(body);
		return "refusal" in result ? result.refusal : null;
	};

	it("reads a valid request into the fields every destination gets", () => {
		const result = read(VALID);
		expect("fields" in result && result.fields).toEqual({
			kind: "repair",
			kindLabel: "A repair",
			material: "shingle",
			materialLabel: "Shingle",
			mode: "visit",
			modeLabel: "A visit at your property",
			day: "2026-12-02",
			time: "09:00",
			minutes: 30,
			timeZone: "America/Denver",
			appointmentStart: "2026-12-02T09:00:00-07:00",
			appointmentEnd: "2026-12-02T09:30:00-07:00",
			firstName: "Dana",
			lastName: "Whitfield",
			name: "Dana Whitfield",
			phone: "(555) 555-0142",
			email: "dana@example.com",
			address: { street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" },
			source: "Other",
			sourceDetail: "The fall fair",
			note: "The north side leaks.",
			textConsent: true,
		} satisfies ScheduleFields);
	});

	it("takes the length from the way, never from the form", () => {
		const result = read({ ...VALID, kind: "remodel", material: "", time: "09:00", minutes: 5 });
		expect("fields" in result && result.fields.minutes).toBe(60);
		expect("fields" in result && result.fields.appointmentEnd).toBe("2026-12-02T10:00:00-07:00");
	});

	it("refuses a forged or stale day by name, sending the visitor back to When", () => {
		expect(refusal({ ...VALID, day: "2026-12-05" })).toEqual({
			code: "when",
			error: "That day is a weekend, and we work Monday to Friday. Please pick another day.",
		});
		expect(refusal({ ...VALID, day: "2026-12-25" })?.error).toBe(
			"That day is a holiday (Christmas Day). Please pick another day.",
		);
		expect(refusal({ ...VALID, day: "2026-11-27" })?.error).toBe(
			"That day is sooner than we can schedule. The first day you can ask for is Monday, November 30.",
		);
		expect(refusal({ ...VALID, day: "2027-03-01" })?.code).toBe("when");
		expect(refusal({ ...VALID, day: "2026-02-30" })?.error).toBe(
			"Please pick a day from the calendar.",
		);
		expect(
			readScheduleRequest(
				{ ...VALID, day: "2026-12-03" },
				{ ...CONFIG, closedDays: ["2026-12-03"] },
				TODAY,
			),
		).toEqual({
			refusal: { code: "when", error: "Our office is closed that day. Please pick another day." },
		});
	});

	it("refuses a time off the grid, before opening, or too late to finish by closing", () => {
		for (const time of ["09:15", "07:30", "17:00", "", "nine"]) {
			expect(refusal({ ...VALID, time })?.code).toBe("when");
		}
		// A remodel visit takes an hour, so 16:30 would run past closing.
		expect(refusal({ ...VALID, kind: "remodel", material: "", time: "16:30" })?.error).toBe(
			"That time is not one we offer. Please pick another time.",
		);
		expect(refusal({ ...VALID, time: "16:30" })).toBeNull();
	});

	it("holds the way to the kind and the material", () => {
		// Storm damage is a visit only, and a tile roof a call only.
		expect(refusal({ ...VALID, kind: "storm", material: "", mode: "call" })?.code).toBe("what");
		expect(refusal({ ...VALID, material: "tile", mode: "visit" })?.code).toBe("what");
		const tile = read({ ...VALID, material: "tile", mode: "", address: {} });
		expect("fields" in tile && tile.fields.mode).toBe("call");
		expect("fields" in tile && tile.fields.minutes).toBe(20);
		expect(refusal({ ...VALID, mode: "" })).toEqual({
			code: "what",
			error: "Please choose a visit or a call.",
		});
		expect(refusal({ ...VALID, kind: "chimney" })?.code).toBe("what");
	});

	it("needs an address for a visit and none for a call", () => {
		expect(refusal({ ...VALID, address: { state: "CO" } })).toEqual({
			code: "who",
			error: "Please add the address we are visiting.",
		});
		const call = read({ ...VALID, mode: "call", address: { state: "CO" } });
		expect("fields" in call && call.fields.address).toBeNull();
	});

	it("names every missing way to reach them, and a number nobody can dial", () => {
		expect(refusal({ ...VALID, firstName: "", phone: " " })?.error).toBe(
			"Please fill in your first name and phone.",
		);
		expect(refusal({ ...VALID, phone: "12" })?.error).toBe(
			"Please add a phone number we can call.",
		);
		expect(refusal({ ...VALID, email: "dana@" })?.error).toBe(
			"Email is not an email address we can write to.",
		);
		expect(refusal({ ...VALID, note: "x".repeat(5001) })?.error).toBe(
			"The note is over 5000 characters.",
		);
	});

	it("keeps a source answer on the list and a detail only for an answer that asks for one", () => {
		const google = read({ ...VALID, source: "Google", sourceDetail: "should not travel" });
		expect("fields" in google && google.fields.sourceDetail).toBe("");
		const off = read({ ...VALID, source: "A billboard" });
		expect("fields" in off && off.fields.source).toBe("");
		expect("offList" in off && off.offList).toBe(true);
	});
});

describe("the text consent row", () => {
	it("is left out of the office email when the form never asked", () => {
		const { consent: _asked, ...without } = { ...VALID, consent: true };
		const result = readScheduleRequest(without, CONFIG, TODAY);
		if (!("fields" in result)) throw new Error("refused");
		expect(result.fields.textConsent).toBeNull();
		expect(officeScheduleEmail(result.fields, CONFIG).text).not.toContain("Text consent");
	});
});

describe("a required source answer", () => {
	it("is refused when it is left out, and let through for a canary", () => {
		const config = { ...CONFIG, source: { ...CONFIG.source, required: true } } as typeof CONFIG;
		const blank = readScheduleRequest({ ...VALID, source: "" }, config, TODAY);
		expect("refusal" in blank && blank.refusal.code).toBe("who");
		expect("fields" in readScheduleRequest({ ...VALID, source: "Google" }, config, TODAY)).toBe(
			true,
		);
		expect("fields" in readScheduleRequest({ ...VALID, source: "" }, config, TODAY, false)).toBe(
			true,
		);
	});
});

describe("officeScheduleEmail", () => {
	it("leads with the requested day and time, and says nothing is booked", () => {
		const result = readScheduleRequest(VALID, CONFIG, TODAY);
		if (!("fields" in result)) throw new Error("refused");
		const email = officeScheduleEmail(result.fields, CONFIG);
		expect(email.subject).toBe("Schedule request: Wednesday, December 2 at 9:00 am, A repair");
		expect(email.text.split("\n")[0]).toBe("Asked for: Wednesday, December 2 at 9:00 am MST");
		expect(email.text).toContain("nothing is set until the office confirms it");
		for (const words of [
			"Dana Whitfield",
			"418 Alder Street",
			"Roof material: Shingle",
			"Other (The fall fair)",
			"Text consent: Checked",
			"The north side leaks.",
		]) {
			expect(email.text).toContain(words);
		}
		expect(email.html).toContain('href="tel:+15555550142"');
		expect(email.replyTo).toBe("dana@example.com");
	});

	it("escapes what the customer typed", () => {
		const result = readScheduleRequest({ ...VALID, note: "<img src=x onerror=1>" }, CONFIG, TODAY);
		if (!("fields" in result)) throw new Error("refused");
		const { html } = officeScheduleEmail(result.fields, CONFIG);
		expect(html).not.toContain("<img");
		expect(html).toContain("&lt;img");
	});
});

describe("createScheduleRequest", () => {
	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("SCHEDULE_TO", "office@example.com");
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", "");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 })),
		);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("tells the office about a valid request", async () => {
		const response = await POST(request(VALID));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
		expect(fetch).toHaveBeenCalledTimes(1);
		const payload = sent();
		expect(payload.to).toEqual(["office@example.com"]);
		expect(payload.reply_to).toEqual(["dana@example.com"]);
		expect(payload.subject).toContain("Wednesday, December 2");
	});

	it("keys the office's email by the browser's id under the site's host, and makes its own for a bad one", async () => {
		const submissionID = "0b6f3c1e-7d2a-4c5b-9e8f-1a2b3c4d5e6f";
		const got: string[] = [];
		const crm = {
			name: "crm",
			async send(submission: Submission<ScheduleFields>): Promise<DestinationResult> {
				got.push(submission.id);
				return { status: "delivered" };
			},
		};
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			destinations: [crm],
			now: NOW,
		});
		await handler(request({ ...VALID, submissionID }));
		await handler(request({ ...VALID, submissionID }));
		await handler(request({ ...VALID, submissionID: "forged" }));
		const keys = vi
			.mocked(fetch)
			.mock.calls.map(([, init]) => new Headers(init?.headers).get("Idempotency-Key"));
		expect(keys.slice(0, 2)).toEqual([`localhost/${submissionID}`, `localhost/${submissionID}`]);
		expect(got.slice(0, 2)).toEqual([submissionID, submissionID]);
		expect(got[2]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(keys[2]).toBe(`localhost/${got[2]}`);
	});

	it("keys the office's email by the guard's verdict when it names a guard", async () => {
		const submissionID = "0b6f3c1e-7d2a-4c5b-9e8f-1a2b3c4d5e6f";
		let verdict: "passed" | "unanswered" = "passed";
		const guard: Guard = {
			name: "test",
			tokenKey: "turnstile",
			check: async () =>
				verdict === "passed"
					? { status: "passed" }
					: { status: "unanswered", cause: new Error("down") },
		};
		const handler = createScheduleRequest({ from: FROM, config: CONFIG, guard, now: NOW });
		await handler(request({ ...VALID, turnstile: "t", submissionID }));
		verdict = "unanswered";
		await handler(request({ ...VALID, turnstile: "t", submissionID }));
		const keys = vi
			.mocked(fetch)
			.mock.calls.map(([, init]) => new Headers(init?.headers).get("Idempotency-Key"));
		expect(keys).toEqual([
			`localhost/${submissionID}/checked`,
			`localhost/${submissionID}/unchecked`,
		]);
	});

	it("sends byte identical Resend bodies on two tries of the same fill, the confirmation's too", async () => {
		const submissionID = "0b6f3c1e-7d2a-4c5b-9e8f-1a2b3c4d5e6f";
		let minute = 0;
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			guard: passing(),
			confirmation: {},
			// A minute apart, as a resubmit is: nothing of the clock reaches an email.
			now: () => new Date(NOW().getTime() + 60_000 * minute++),
		});
		await handler(request({ ...VALID, turnstile: "t", submissionID }));
		await handler(request({ ...VALID, turnstile: "t", submissionID }));
		const calls = vi.mocked(fetch).mock.calls;
		const byKey = new Map<string, string[]>();
		for (const [, init] of calls) {
			const key = String(new Headers(init?.headers).get("Idempotency-Key"));
			byKey.set(key, [...(byKey.get(key) ?? []), String(init?.body)]);
		}
		expect(byKey.size).toBe(2);
		for (const [key, bodies] of byKey) {
			expect(bodies, key).toHaveLength(2);
			expect(bodies[1], key).toBe(bodies[0]);
		}
	});

	it("tells the form to renew its id only when every destination definitely refused", async () => {
		vi.mocked(fetch).mockImplementation(async () => new Response("{}", { status: 422 }));
		const refusedOnce = await POST(request(VALID));
		expect(refusedOnce.status).toBe(502);
		expect(await refusedOnce.json()).toMatchObject({ renew: true });
		vi.mocked(fetch).mockImplementation(async () => new Response("{}", { status: 503 }));
		const downTwice = await POST(request(VALID));
		expect(downTwice.status).toBe(502);
		expect(await downTwice.json()).not.toHaveProperty("renew");
	});

	it("falls back to CONTACT_TO, then to the practice's inbox", async () => {
		vi.stubEnv("SCHEDULE_TO", "");
		vi.stubEnv("CONTACT_TO", "front@example.com");
		await POST(request(VALID));
		expect(sent(0).to).toEqual(["front@example.com"]);
		vi.stubEnv("CONTACT_TO", "");
		await POST(request(VALID));
		expect(sent(1).to).toEqual([DEFAULT_SCHEDULE_TO]);
	});

	it("hands every destination the request with its appointment instants", async () => {
		const got: Submission<ScheduleFields>[] = [];
		const crm = {
			name: "crm",
			async send(submission: Submission<ScheduleFields>): Promise<DestinationResult> {
				got.push(submission);
				return { status: "delivered" };
			},
		};
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			destinations: [crm],
			now: NOW,
		});
		await handler(request(VALID));
		expect(got[0]?.fields.appointmentStart).toBe("2026-12-02T09:00:00-07:00");
		expect(got[0]?.fields.appointmentEnd).toBe("2026-12-02T09:30:00-07:00");
		expect(got[0]?.fields.mode).toBe("visit");
	});

	it("refuses a forged weekend request by name, and nobody is sent anything", async () => {
		const response = await POST(request({ ...VALID, day: "2026-12-06" }));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ ok: false, code: "when" });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("reads today on the business's clock, not the server's", async () => {
		// 05:00 UTC on Saturday the 28th is still Friday the 27th in Denver,
		// two business days before Tuesday, December 1.
		const late = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			now: () => new Date("2026-11-28T05:00:00Z"),
		});
		expect((await late(request({ ...VALID, day: "2026-12-01" }))).status).toBe(200);
		expect((await late(request({ ...VALID, day: "2026-11-30" }))).status).toBe(400);
	});

	it("answers 502 when nobody took the request, so it is never answered as sent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("{}", { status: 422 })),
		);
		const response = await POST(request(VALID));
		expect(response.status).toBe(502);
	});

	it("answers 500 when it cannot deliver at all", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		const response = await POST(request(VALID));
		expect(response.status).toBe(500);
	});

	it("quietly drops a honeypot catch", async () => {
		const response = await POST(request({ ...VALID, company: "Bots Inc" }));
		expect(response.status).toBe(200);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("refuses what the guard calls a bot before anyone sees it", async () => {
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			now: NOW,
			guard: {
				name: "test",
				tokenKey: "turnstile",
				check: async () => ({ status: "failed", cause: new Error("no") }),
			},
		});
		const response = await handler(request({ ...VALID, turnstile: "bad" }));
		expect(response.status).toBe(403);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("sends the customer's confirmation only behind a guard that passed", async () => {
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			now: NOW,
			guard: passing(),
			confirmation: {},
		});
		const response = await handler(request({ ...VALID, turnstile: "ok" }));
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: true });
		expect(fetch).toHaveBeenCalledTimes(2);
		const copy = sent(1);
		expect(copy.to).toEqual(["dana@example.com"]);
		expect(copy.from).toBe("Alder Roofing <no-reply@example.com>");
		expect(copy.subject).toBe("We have your request for Wednesday, December 2");
		expect(copy.reply_to).toBeUndefined();
		expect(copy.text).toContain("This is a request, not a booked appointment yet.");
	});

	it("sends no confirmation when the guard could not answer", async () => {
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			now: NOW,
			guard: {
				name: "test",
				tokenKey: "turnstile",
				check: async () => ({ status: "unanswered", cause: new Error("down"), quiet: true }),
			},
			confirmation: {},
		});
		const response = await handler(request({ ...VALID, turnstile: "" }));
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(sent(0).text).toContain("This one was not checked for spam.");
	});

	it("sends a canary to the canary inbox alone, skipping the calendar", async () => {
		vi.stubEnv("CONTACT_CANARY_TOKEN", "secret");
		vi.stubEnv("CONTACT_CANARY_TO", "canary@example.com");
		const crm = { name: "crm", send: vi.fn(async () => refused(new Error("never"))) };
		const handler = createScheduleRequest({
			from: FROM,
			config: CONFIG,
			destinations: [crm],
			now: NOW,
		});
		const response = await handler(request({ canary: "secret", kind: "repair", mode: "visit" }));
		expect(response.status).toBe(200);
		expect(sent().to).toEqual(["canary@example.com"]);
		expect(sent().subject).toMatch(/^\[Canary\] /);
		expect(crm.send).not.toHaveBeenCalled();
	});

	it("throws when it loads for a config with a problem, or a confirmation with no guard", () => {
		expect(() =>
			createScheduleRequest({ from: FROM, config: { ...CONFIG, timeZone: "Mars/Olympus" } }),
		).toThrow(/not an IANA timezone/);
		expect(() => createScheduleRequest({ from: FROM, config: CONFIG, confirmation: {} })).toThrow(
			/only ever sent behind a guard/,
		);
		expect(
			scheduleConfigProblems({
				...CONFIG,
				kinds: [
					{ id: "x", label: "X" },
					{ id: "x", label: "Y", visit: 30 },
				],
				hours: { open: "17:00", close: "08:00" },
			}),
		).toEqual([
			'the kind "x" is listed twice',
			'the kind "x" offers neither a visit nor a call',
			"its hours close before they open",
		]);
	});
});
