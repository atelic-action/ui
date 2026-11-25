import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/*
 * Component Rules 17 is met by two primitives: PhoneLink and EmailLink build
 * every tel: and mailto: link the package draws. A protocol written by hand
 * anywhere else in src/ fails here. The files left alone only test or name
 * the protocols; the contact form's mail handoff is a navigation, not a link;
 * and the contact endpoint writes the office's email, HTML for a mail client
 * where no component renders, so its two links are written there.
 */

const SRC = join(import.meta.dirname, "..", "src");
const ALLOWED = new Set([
	"primitives/PhoneLink.tsx",
	"primitives/EmailLink.tsx",
	"lib/newTabProps.ts",
	"lib/phoneText.tsx",
	"forms/contact.ts",
	"routing/basePath.ts",
	"scripts/check-contacts.ts",
	"types.ts",
]);
const HANDOFF = /window\.location\.href = `mailto:/;
const PROTOCOL = /[`'"](tel|mailto):/;

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return files(path);
		return /\.(ts|tsx)$/.test(name) ? [path] : [];
	});
}

/** Lines of code, not of comments, that write a protocol by hand. */
function handWritten(source: string): string[] {
	return source.split("\n").filter((line) => {
		const code = line.trim();
		if (/^(\*|\/\/|\/\*|\{\/\*)/.test(code)) return false;
		return PROTOCOL.test(code) && !HANDOFF.test(code);
	});
}

describe("tel: and mailto: links", () => {
	it("are built by PhoneLink and EmailLink alone", () => {
		const found = files(SRC)
			.filter((path) => !ALLOWED.has(relative(SRC, path)))
			.flatMap((path) =>
				handWritten(readFileSync(path, "utf8")).map(
					(line) => `${relative(SRC, path)}: ${line.trim()}`,
				),
			);
		expect(found).toEqual([]);
	});

	it("would catch one", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: a line of source as the check reads it, not a template
		expect(handWritten("\t<a href={`tel:${phone.e164}`}>call</a>")).toHaveLength(1);
		expect(handWritten('\t<a href="mailto:hello@example.com">write</a>')).toHaveLength(1);
		expect(handWritten("\t * A `tel:` link, in a comment.")).toHaveLength(0);
		expect(
			// biome-ignore lint/suspicious/noTemplateCurlyInString: a line of source as the check reads it, not a template
			handWritten("\t\twindow.location.href = `mailto:${to}?subject=${subject}`;"),
		).toHaveLength(0);
	});
});
