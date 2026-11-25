// @vitest-environment node
import { createContact, PLAIN_FIELDS, readFields } from "../../src/forms/contact";
import { type Source, sourceField } from "../../src/forms/source";

const FROM = "Summit Movement Studio <forms@example.com>";
const DSN = "https://abc@o1.ingest.us.sentry.io/1";
const INGEST = "https://o1.ingest.us.sentry.io/api/1/envelope/";

const SOURCE: Source = {
	label: "How did you hear about us?",
	options: ["Google", "A friend", "Instagram"],
};

const VALID = {
	name: "Jane Doe",
	email: "jane@example.com",
	topic: "Booking",
	message: "Hello",
	company: "",
};

function request(body: unknown): Request {
	return new Request("http://localhost/api/contact", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("sourceField", () => {
	it("is a choice under source, optional, its office row called Heard about us", () => {
		expect(sourceField(SOURCE)).toEqual({
			key: "source",
			kind: "choice",
			label: "Heard about us",
			options: ["Google", "A friend", "Instagram"],
			required: false,
			blank: "Not given",
		});
	});

	it("takes the site's office label and required", () => {
		expect(sourceField({ ...SOURCE, required: true, officeLabel: "Source" })).toMatchObject({
			label: "Source",
			required: true,
		});
	});

	it("keeps its own copy of the answers", () => {
		const options = ["Google"];
		const field = sourceField({ label: "How?", options });
		options.push("Later");
		expect(field.options).toEqual(["Google"]);
	});
});

describe("a choice field", () => {
	const fields = [...PLAIN_FIELDS, sourceField(SOURCE)];

	it("reads an answer on the list as given", () => {
		const read = readFields({ ...VALID, source: "A friend" }, fields);
		expect(read).toMatchObject({ fields: { source: "A friend" }, offList: [] });
	});

	it.each([
		["empty", ""],
		["not words", 7],
	])("reads a %s answer as not given, with nothing to report", (_name, source) => {
		const read = readFields({ ...VALID, source }, fields);
		expect(read).toMatchObject({ fields: { source: "" }, offList: [] });
	});

	it("reads a choice the form did not send at all as null, apart from one left unanswered", () => {
		const read = readFields({ ...VALID }, fields);
		expect(read).toMatchObject({ fields: { source: null }, offList: [] });
	});

	it("matches an option written with a stray space, and records it trimmed", () => {
		const spaced = [
			...PLAIN_FIELDS,
			sourceField({ label: "How?", options: [" Google ", "A friend  "] }),
		];
		expect(readFields({ ...VALID, source: "Google" }, spaced)).toMatchObject({
			fields: { source: "Google" },
			offList: [],
		});
		expect(readFields({ ...VALID, source: " A friend " }, spaced)).toMatchObject({
			fields: { source: "A friend" },
			offList: [],
		});
	});

	it("reads an answer off the list as not given, and names it", () => {
		const read = readFields({ ...VALID, source: "A billboard" }, fields);
		expect(read).toMatchObject({ fields: { source: "" }, offList: ["source"] });
	});

	it("refuses a required choice left empty as missing", () => {
		const required = [...PLAIN_FIELDS, sourceField({ ...SOURCE, required: true })];
		expect(readFields({ ...VALID, source: "" }, required)).toEqual({
			refusal: "Please fill in your heard about us.",
		});
	});

	it("never refuses a required choice answered off its list, which was answered", () => {
		const required = [...PLAIN_FIELDS, sourceField({ ...SOURCE, required: true })];
		expect(readFields({ ...VALID, source: "A billboard" }, required)).toMatchObject({
			fields: { source: "" },
			offList: ["source"],
		});
	});

	it("throws at load for a choice with no options", () => {
		for (const options of [undefined, []]) {
			expect(() =>
				createContact({
					from: FROM,
					fields: [...PLAIN_FIELDS, { key: "plan", label: "Plan", kind: "choice", options }],
				}),
			).toThrow('the choice "plan" lists no options');
		}
	});
});

describe("a choice through the endpoint", () => {
	const post = createContact({ from: FROM, fields: [...PLAIN_FIELDS, sourceField(SOURCE)] });

	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com");
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", DSN);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response('{"id":"re_1"}', { status: 200 })),
		);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	const office = () =>
		JSON.parse(
			String(
				vi.mocked(fetch).mock.calls.find(([url]) => !String(url).startsWith(INGEST))?.[1]?.body,
			),
		);
	const reports = async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
		return vi
			.mocked(fetch)
			.mock.calls.filter(([url]) => String(url).startsWith(INGEST))
			.map(([, init]) => String(init?.body));
	};

	it("prints the answer in the office's email", async () => {
		const response = await post(request({ ...VALID, source: "Instagram" }));
		expect(response.status).toBe(200);
		expect(office().text).toContain("Heard about us: Instagram");
	});

	it("prints the blank words for an empty choice, and nothing for another empty field", async () => {
		await post(request({ ...VALID, topic: "", source: "" }));
		const { text, html } = office();
		expect(text).toContain("Heard about us: Not given");
		expect(html).toContain("Not given");
		expect(text).not.toContain("Topic");
	});

	it("records an answer off the list as not given, delivers it, and reports it on production", async () => {
		vi.stubEnv("VERCEL_ENV", "production");
		const response = await post(request({ ...VALID, source: "A billboard" }));
		expect(response.status).toBe(200);
		expect(office().text).toContain("Heard about us: Not given");
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain(
			"Contact form sent a source answer that is not on its list, and it was recorded as not given",
		);
		expect(sent[0]).not.toContain("billboard");
	});

	it("prints nothing for a choice the form did not send, and reports it on production", async () => {
		vi.stubEnv("VERCEL_ENV", "production");
		const response = await post(request(VALID));
		expect(response.status).toBe(200);
		expect(office().text).not.toContain("Heard about us");
		expect(office().text).not.toContain("Not given");
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain(
			"Contact form: the endpoint lists the choice source and the form did not send it",
		);
	});

	it("says nothing of a choice the form did not send off production, or for a canary", async () => {
		vi.stubEnv("VERCEL_ENV", "preview");
		await post(request(VALID));
		vi.stubEnv("VERCEL_ENV", "production");
		vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
		vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
		await post(request({ ...VALID, canary: "canary-secret" }));
		expect(await reports()).toEqual([]);
	});

	it("says nothing of an answer off the list off production", async () => {
		vi.stubEnv("VERCEL_ENV", "preview");
		await post(request({ ...VALID, source: "A billboard" }));
		expect(await reports()).toEqual([]);
	});

	it("reports a form that sends a source the function does not list", async () => {
		vi.stubEnv("VERCEL_ENV", "production");
		const plain = createContact({ from: FROM });
		await plain(request({ ...VALID, source: "Google" }));
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain("Contact form sends source, which the endpoint's fields do not list");
	});
});
