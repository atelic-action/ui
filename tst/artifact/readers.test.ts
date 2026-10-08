import {
	mintToken,
	openReader,
	readerId,
	readerLink,
	sealReader,
	whoIsReading,
} from "../../src/artifact/readers";

const sender = "matt@atelic.me";

describe("a sealed reader", () => {
	it("opens to the email with the token it was sealed under", async () => {
		const reader = await sealReader("lawrence@example.com", "tok-lawrence");
		expect(await openReader([reader], "tok-lawrence")).toBe("lawrence@example.com");
	});

	it("lists neither the email nor the token", async () => {
		const reader = await sealReader("lawrence@example.com", "tok-lawrence");
		const listed = JSON.stringify(reader);
		expect(listed).not.toContain("lawrence");
		expect(listed).not.toContain("example.com");
		expect(listed).not.toContain("tok-lawrence");
		expect(reader.id).toBe(await readerId("tok-lawrence"));
	});

	it("opens nobody for a wrong token, no token, or no readers", async () => {
		const reader = await sealReader("lawrence@example.com", "tok-lawrence");
		expect(await openReader([reader], "tok-nobody")).toBeUndefined();
		expect(await openReader([reader], null)).toBeUndefined();
		expect(await openReader([], "tok-lawrence")).toBeUndefined();
		expect(await openReader(undefined, "tok-lawrence")).toBeUndefined();
	});

	it("opens nobody when the sealed text has been tampered with", async () => {
		const reader = await sealReader("lawrence@example.com", "tok-lawrence");
		const broken = { ...reader, sealed: `${reader.sealed.slice(0, -4)}AAAA` };
		expect(await openReader([broken], "tok-lawrence")).toBeUndefined();
	});

	it("finds the right reader among several", async () => {
		const readers = [
			await sealReader("lawrence@example.com", "tok-lawrence"),
			await sealReader("dana@example.com", "tok-dana"),
		];
		expect(await openReader(readers, "tok-dana")).toBe("dana@example.com");
	});
});

describe("who a visit is identified as", () => {
	const nobody = { readers: [], search: "", senderEmail: sender };

	it("identifies the reader whose token is on the link", async () => {
		const readers = [await sealReader("lawrence@example.com", "tok-lawrence")];
		expect(
			await whoIsReading({
				readers,
				search: "?k=tok-lawrence",
				access: "public",
				gateEmail: "",
				senderEmail: sender,
			}),
		).toBe("lawrence@example.com");
	});

	it("leaves a visit with no token, or a wrong one, anonymous", async () => {
		const readers = [await sealReader("lawrence@example.com", "tok-lawrence")];
		const visit = { readers, access: "public" as const, gateEmail: "", senderEmail: sender };
		expect(await whoIsReading({ ...visit, search: "" })).toBeUndefined();
		expect(await whoIsReading({ ...visit, search: "?k=nope" })).toBeUndefined();
	});

	it("identifies a reader who signed in at the wall by the email they signed in with", async () => {
		expect(
			await whoIsReading({ ...nobody, access: "private", gateEmail: "josh@example.com" }),
		).toBe("josh@example.com");
	});

	it("never reads a sign in cookie as an identity on a public artifact", async () => {
		expect(
			await whoIsReading({ ...nobody, access: "public", gateEmail: "josh@example.com" }),
		).toBeUndefined();
	});

	it("never identifies the practice reading its own document", async () => {
		expect(
			await whoIsReading({ ...nobody, access: "private", gateEmail: "Matt@Atelic.me" }),
		).toBeUndefined();
	});

	it("lets the sign in win over a link's token on a private artifact", async () => {
		const readers = [await sealReader("dana@example.com", "tok-dana")];
		expect(
			await whoIsReading({
				readers,
				search: "?k=tok-dana",
				access: "private",
				gateEmail: "josh@example.com",
				senderEmail: sender,
			}),
		).toBe("josh@example.com");
	});

	it("keeps the practice anonymous on a private artifact even through a reader's link", async () => {
		const readers = [await sealReader("dana@example.com", "tok-dana")];
		expect(
			await whoIsReading({
				readers,
				search: "?k=tok-dana",
				access: "private",
				gateEmail: "matt@atelic.me",
				senderEmail: sender,
			}),
		).toBeUndefined();
	});

	it("falls back to the link on a private artifact when nobody is signed in", async () => {
		const readers = [await sealReader("dana@example.com", "tok-dana")];
		expect(
			await whoIsReading({
				readers,
				search: "?k=tok-dana",
				access: "private",
				gateEmail: "",
				senderEmail: sender,
			}),
		).toBe("dana@example.com");
	});
});

describe("a reader's link", () => {
	it("mints a twelve character token that is safe in a URL, new each time", () => {
		const a = mintToken();
		const b = mintToken();
		expect(a).toMatch(/^[A-Za-z0-9_-]{12}$/);
		expect(a).not.toBe(b);
	});

	it("puts the token on the artifact's page", () => {
		expect(readerLink("https://summit.atelic.me", "tok-dana")).toBe(
			"https://summit.atelic.me/writeup?k=tok-dana",
		);
		expect(readerLink("https://summit.atelic.me", "tok-dana", "/proposal")).toBe(
			"https://summit.atelic.me/proposal?k=tok-dana",
		);
	});
});
