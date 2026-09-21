import { JSDOM } from "jsdom";

/*
 * Byte equality with jq is impossible and not the bar: React writes `&#x27;`
 * where jq writes `&#39;`, `<br/>` where jq writes `<br>`, and an explicit
 * `<tbody>` where jq leaves the parser to insert one. The bar is the parsed
 * DOM, so both sides go through the same parser and come out as the same
 * canonical tree.
 *
 * Canonicalization: an attribute free `<tbody>` is spliced away, attributes
 * are sorted by name, `style` becomes an ordered list of `prop:value`
 * declarations with whitespace trimmed, the trailing semicolon dropped, and
 * hex colors lowercased, and adjacent text nodes are merged and compared
 * exactly.
 */

export type CanonElement = {
	tag: string;
	attrs: [string, string | string[]][];
	children: Canon[];
};
export type Canon = string | CanonElement;

/**
 * Where the fragment belongs, which decides the element it is parsed inside:
 * the HTML parser drops a `<tr>` that is not inside a table.
 */
export type Context = "rows" | "cells" | "inline" | "document";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const doc = dom.window.document;

function hostFor(context: Context): Element {
	if (context === "rows") return doc.createElement("table");
	if (context === "cells") return doc.createElement("tr");
	return doc.createElement("div");
}

function canonStyle(value: string): string[] {
	return value
		.split(";")
		.map((declaration) => declaration.trim())
		.filter((declaration) => declaration !== "")
		.map((declaration) => {
			const colon = declaration.indexOf(":");
			if (colon < 0) return declaration.toLowerCase();
			const prop = declaration.slice(0, colon).trim().toLowerCase();
			const val = declaration
				.slice(colon + 1)
				.trim()
				.replace(/#[0-9a-fA-F]{3,8}/g, (hex) => hex.toLowerCase());
			return `${prop}:${val}`;
		});
}

function canonAttrs(element: Element): [string, string | string[]][] {
	return [...element.attributes]
		.map((attr): [string, string | string[]] => {
			const name = attr.name.toLowerCase();
			return [name, name === "style" ? canonStyle(attr.value) : attr.value];
		})
		.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

function push(out: Canon[], node: Canon): void {
	const last = out[out.length - 1];
	if (typeof node === "string" && typeof last === "string") out[out.length - 1] = last + node;
	else out.push(node);
}

function canonNodes(nodes: ArrayLike<Node>): Canon[] {
	const out: Canon[] = [];
	for (const node of Array.from(nodes)) {
		if (node.nodeType === 3) {
			push(out, node.textContent ?? "");
			continue;
		}
		if (node.nodeType !== 1) continue;
		const element = node as Element;
		const tag = element.tagName.toLowerCase();
		const children = canonNodes(element.childNodes);
		if (tag === "tbody" && element.attributes.length === 0) {
			for (const child of children) push(out, child);
			continue;
		}
		out.push({ tag, attrs: canonAttrs(element), children });
	}
	return out.filter((node) => node !== "");
}

/** Parses a fragment or a document and returns its canonical tree. */
export function normalize(html: string, context: Context = "rows"): Canon[] {
	if (context === "document") {
		const parsed = new JSDOM(html);
		return canonNodes([parsed.window.document.documentElement]);
	}
	const host = hostFor(context);
	host.innerHTML = html;
	return canonNodes(host.childNodes);
}
