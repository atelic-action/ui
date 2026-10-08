import { webcrypto } from "node:crypto";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Gate, type GatePayload } from "../../src/artifact/Gate";
import { sealDocument } from "./fixtures/sealDocument";

const HTML = '<h1>A Proposal for Summit</h1><p class="gate-lede">Three tiers, one number each.</p>';
const EMAIL = "reader@example.com";
const STORAGE_KEY = "test-gate-email";

const COPY = {
	kicker: "Summit Movement Studio",
	heading: "Your Proposal Is Ready",
	sub: "This document opens with the email address it was sent to.",
	placeholder: "you@company.com",
	errorText: "That email does not open this document.",
	storageKey: STORAGE_KEY,
};

let payload: GatePayload;

/**
 * jsdom ships no SubtleCrypto, so the gate has nothing to decrypt with. Node's
 * own webcrypto is the same API the browser exposes, so standing it up as the
 * global runs the component's real crypto path rather than skipping it.
 */
beforeAll(async () => {
	if (!globalThis.crypto?.subtle) vi.stubGlobal("crypto", webcrypto);
	payload = await sealDocument(HTML, [{ id: "reader", email: EMAIL }]);
});

afterAll(() => {
	vi.unstubAllGlobals();
});

beforeEach(() => {
	localStorage.clear();
	window._hsq = [];
	window.history.replaceState(null, "", "/proposal");
});

function submit(email: string) {
	fireEvent.change(screen.getByLabelText("Your email"), { target: { value: email } });
	fireEvent.click(screen.getByRole("button", { name: /Open Document/ }));
}

describe("Gate", () => {
	it("renders the gate copy, an email input, and nothing of the document", () => {
		render(<Gate payload={payload} {...COPY} />);

		expect(screen.getByText("Summit Movement Studio")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Your Proposal Is Ready" })).toBeInTheDocument();
		expect(screen.getByText(/opens with the email address/)).toBeInTheDocument();
		const input = screen.getByLabelText("Your email");
		expect(input).toHaveAttribute("type", "email");
		expect(input).toHaveAttribute("autocomplete", "email");
		expect(screen.queryByText(/Three tiers/)).not.toBeInTheDocument();
	});

	it("shows the error on a wrong email and still renders no document", async () => {
		render(<Gate payload={payload} {...COPY} />);
		submit("stranger@example.com");

		await waitFor(
			() => {
				expect(screen.getByRole("alert")).toHaveTextContent(COPY.errorText);
			},
			{ timeout: 5000 },
		);
		expect(screen.queryByText(/Three tiers/)).not.toBeInTheDocument();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it("unlocks on the right email, whatever its case, and renders the document", async () => {
		const onUnlock = vi.fn();
		render(<Gate payload={payload} {...COPY} onUnlock={onUnlock} />);
		submit("Reader@Example.COM");

		await waitFor(
			() => {
				expect(screen.getByRole("heading", { name: "A Proposal for Summit" })).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
		expect(screen.getByText("Three tiers, one number each.")).toBeInTheDocument();
		expect(screen.queryByPlaceholderText("you@company.com")).not.toBeInTheDocument();
		// The email as typed, so a return visit walks straight back in.
		expect(localStorage.getItem(STORAGE_KEY)).toBe("Reader@Example.COM");
		expect(onUnlock).toHaveBeenCalledWith(expect.objectContaining({ id: "reader" }));
	});

	it("walks a returning reader straight in from storage", async () => {
		localStorage.setItem(STORAGE_KEY, EMAIL);
		render(<Gate payload={payload} {...COPY} />);

		await waitFor(
			() => {
				expect(screen.getByRole("heading", { name: "A Proposal for Summit" })).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
	});

	it("opens straight from a sent link's query parameter and strips it from the URL", async () => {
		window.history.replaceState(null, "", `/proposal?email=${encodeURIComponent(EMAIL)}`);
		render(<Gate payload={payload} {...COPY} />);

		await waitFor(
			() => {
				expect(screen.getByRole("heading", { name: "A Proposal for Summit" })).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
		expect(window.location.search).toBe("");
		// The link's email persists like a typed one, so the next visit needs no link.
		expect(localStorage.getItem(STORAGE_KEY)).toBe(EMAIL);
	});

	it("pre fills and errors on a bad query parameter, still stripping it", async () => {
		window.history.replaceState(null, "", "/proposal?email=wrong%40example.com");
		render(<Gate payload={payload} {...COPY} />);

		await waitFor(
			() => {
				expect(screen.getByRole("alert")).toHaveTextContent(COPY.errorText);
			},
			{ timeout: 5000 },
		);
		expect(screen.getByLabelText("Your email")).toHaveValue("wrong@example.com");
		expect(window.location.search).toBe("");
		expect(screen.queryByText(/Three tiers/)).not.toBeInTheDocument();
	});

	it("identifies a reader on the named domain, and nobody otherwise", async () => {
		render(<Gate payload={payload} {...COPY} identifyDomain="example.com" />);
		submit(EMAIL);

		await waitFor(
			() => {
				expect(window._hsq).toContainEqual(["identify", { email: EMAIL }]);
			},
			{ timeout: 5000 },
		);
		expect(window._hsq).toContainEqual(["trackPageView"]);
	});

	it("identifies nobody when the reader sits on another domain", async () => {
		render(<Gate payload={payload} {...COPY} identifyDomain="summitmovement.com" />);
		submit(EMAIL);

		await waitFor(
			() => {
				expect(screen.getByRole("heading", { name: "A Proposal for Summit" })).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);
		expect(window._hsq).toEqual([]);
	});
});

describe("Gate, and who it says opened the document", () => {
	beforeEach(() => {
		window._hsq = [];
		window.localStorage.clear();
	});

	it("seals a payload that names no one", () => {
		for (const person of payload.people) {
			expect(Object.keys(person).sort()).toEqual(["id", "iv", "salt", "wrapped"]);
		}
		expect(JSON.stringify(payload).toLowerCase()).not.toContain(EMAIL.toLowerCase());
	});

	it("identifies the reader by the address they typed, lowercased and trimmed", async () => {
		render(<Gate payload={payload} {...COPY} identifyDomain="example.com" />);
		submit(`  ${EMAIL.toUpperCase()} `);
		await waitFor(
			() => expect(window._hsq).toContainEqual(["identify", { email: EMAIL.toLowerCase() }]),
			{ timeout: 5000 },
		);
	});

	it("opens for an address typed without its at sign, and identifies nobody by it", async () => {
		render(<Gate payload={payload} {...COPY} identifyDomain="example.com" />);
		submit(EMAIL.replace("@", ""));
		await waitFor(
			() =>
				expect(screen.getByRole("heading", { name: "A Proposal for Summit" })).toBeInTheDocument(),
			{ timeout: 5000 },
		);
		expect(window._hsq).toEqual([]);
	});

	it("ignores an address an older payload still lists", async () => {
		const older = {
			...payload,
			people: payload.people.map((person) => ({ ...person, email: "someone-else@example.com" })),
		};
		render(<Gate payload={older} {...COPY} identifyDomain="example.com" />);
		submit(EMAIL);
		await waitFor(
			() => expect(window._hsq).toContainEqual(["identify", { email: EMAIL.toLowerCase() }]),
			{ timeout: 5000 },
		);
		expect(JSON.stringify(window._hsq)).not.toContain("someone-else");
	});
});
