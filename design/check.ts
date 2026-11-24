/**
 * The render check of the Design System: serves `design/out/project/` and
 * opens every card the way the system's page frames it (a tokens sheet, the
 * component stylesheet, React, ReactDOM, and the bundle preloaded, then the
 * card's own body), in headless Chromium at the card's width. It fails on any
 * console error, failed request, or a root under 24px tall, writes each
 * measured height into the card's marker unless `design/cards.json` gives one,
 * and prints one line per card. A card whose height follows the viewport's (a
 * story set in a page of `100vh` screens, a fixed bar over one) would grow
 * without end in a frame that grows to fit, so it is held at the height of
 * the viewport its story pins, the screen Storybook shows it in. Run `bun run design:build` first; `--shots`
 * also saves each card's full page picture to `design/out/shots/`.
 *
 * The tokens sheet here is a stand in for the one the page compiles from
 * `tokens.json`, compiled the same way: the color and shadow tokens on
 * `:root` and the first theme, the other families on `:root`, a face per font.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, normalize, resolve, sep } from "node:path";
import { chromium } from "playwright";

const DESIGN = resolve(import.meta.dir);
const OUT = join(DESIGN, "out");
const PROJECT = join(OUT, "project");
const MIN_HEIGHT = 24;
const PAGES_AT_ONCE = 6;
const SHOTS = process.argv.includes("--shots");

interface Card {
	name: string;
	group: string;
	width: number;
	viewportHeight: number;
	height: number;
	heightFrom: "cards.json" | "measured" | "viewport" | "default";
}

interface Token {
	name: string;
	value: string;
}

interface TokensJSON {
	color: { themes: { id: string }[]; tokens: Token[] };
	type: {
		fonts: { family: string; file: string; weight: string; style: string }[];
		families: Record<string, string>;
	};
	[family: string]: unknown;
}

const read = (path: string) => readFileSync(path, "utf8");

function tokensCSS(tokens: TokensJSON): string {
	const value = (t: Token) => {
		const alias = /^\{(.+)\}$/.exec(t.value)?.[1];
		return alias ? `var(--${alias})` : t.value;
	};
	const declare = (list: Token[]) => list.map((t) => `--${t.name}: ${value(t)};`).join(" ");
	const first = tokens.color.themes[0]?.id ?? "light";
	const shadow = (tokens.shadow as { tokens: Token[] } | undefined)?.tokens ?? [];
	const others = Object.entries(tokens)
		.filter(([key]) => !["color", "type", "shadow", "meta", "name", "version"].includes(key))
		.flatMap(([, family]) => (family as { tokens?: Token[] }).tokens ?? []);
	const faces = tokens.type.fonts.map(
		(f) =>
			`@font-face { font-family: "${f.family}"; src: url(/${f.file}) format("woff2"); font-weight: ${f.weight}; font-style: ${f.style}; }`,
	);
	const families = Object.entries(tokens.type.families)
		.map(([key, stack]) => `--font-${key}: ${stack};`)
		.join(" ");
	return [
		...faces,
		`:root, [data-theme="${first}"] { ${declare([...tokens.color.tokens, ...shadow])} }`,
		`:root { ${declare(others)} ${families} }`,
	].join("\n");
}

function framed(previewHTML: string): string {
	const body = /<body[^>]*>[\s\S]*<\/body>/.exec(previewHTML)?.[0];
	if (!body) throw new Error("a preview.html without a body");
	return [
		'<!doctype html><html data-theme="light"><head><meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		'<link rel="stylesheet" href="/__check/tokens.css">',
		'<link rel="stylesheet" href="/components/bundle.css">',
		'<script src="/components/lib/react.js"></script>',
		'<script src="/components/lib/react-dom.js"></script>',
		'<script src="/components/bundle.js"></script>',
		`</head>${body}</html>`,
	].join("");
}

const TYPES: Record<string, string> = {
	".js": "text/javascript",
	".css": "text/css",
	".html": "text/html",
	".json": "application/json",
	".svg": "image/svg+xml",
	".jpg": "image/jpeg",
	".png": "image/png",
	".mp4": "video/mp4",
	".woff2": "font/woff2",
};

async function main() {
	if (!existsSync(join(OUT, "cards.json"))) throw new Error("run bun run design:build first");
	const cards = JSON.parse(read(join(OUT, "cards.json"))) as Card[];
	const stylesheet = tokensCSS(JSON.parse(read(join(PROJECT, "tokens.json"))) as TokensJSON);

	// Loopback only, and only files under the project folder: the separator
	// keeps a sibling folder whose name starts the same from matching.
	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(request) {
			const path = decodeURIComponent(new URL(request.url).pathname);
			if (path === "/__check/tokens.css") {
				return new Response(stylesheet, { headers: { "content-type": "text/css" } });
			}
			const card = /^\/components\/(\w+)\/__check\.html$/.exec(path)?.[1];
			if (card) {
				const html = framed(read(join(PROJECT, "components", card, "preview.html")));
				return new Response(html, { headers: { "content-type": "text/html" } });
			}
			const file = normalize(join(PROJECT, path));
			if (!file.startsWith(PROJECT + sep) || !existsSync(file) || !statSync(file).isFile()) {
				return new Response("not found", { status: 404 });
			}
			const type = TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream";
			return new Response(Bun.file(file), { headers: { "content-type": type } });
		},
	});

	const browser = await chromium.launch();
	const results: { card: Card; height: number; followsViewport: boolean; errors: string[] }[] = [];
	const queue = [...cards];
	async function worker() {
		for (let card = queue.shift(); card; card = queue.shift()) {
			const page = await browser.newPage({
				viewport: { width: card.width, height: card.viewportHeight },
			});
			const errors: string[] = [];
			page.on("console", (m) => {
				if (m.type() === "error") errors.push(m.text());
			});
			page.on("pageerror", (e) => errors.push(e.message));
			page.on("requestfailed", (r) => errors.push(`failed ${r.url()}`));
			page.on("response", (r) => {
				if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
			});
			try {
				await page.goto(`${server.url.origin}/components/${card.name}/__check.html`, {
					waitUntil: "networkidle",
					timeout: 20000,
				});
				await page.evaluate(() => document.fonts.ready);
				await page.waitForTimeout(150);
			} catch (error) {
				errors.push(String(error));
			}
			const rootHeight = () =>
				page.evaluate(() => document.getElementById("root")?.scrollHeight ?? 0).catch(() => 0);
			const height = await rootHeight();
			if (height < MIN_HEIGHT) errors.push(`#root is ${height}px tall`);
			await page.setViewportSize({ width: card.width, height: card.viewportHeight + 300 });
			await page.waitForTimeout(150);
			const followsViewport = (await rootHeight()) !== height;
			await page.setViewportSize({ width: card.width, height: card.viewportHeight });
			await page.waitForTimeout(150);
			if (SHOTS) {
				await page
					.screenshot({ path: join(OUT, "shots", `${card.name}.png`), fullPage: true })
					.catch((error) => errors.push(`no picture: ${error}`));
			}
			results.push({ card, height, followsViewport, errors });
			await page.close();
		}
	}
	await Promise.all(Array.from({ length: PAGES_AT_ONCE }, worker));
	await browser.close();
	server.stop(true);

	results.sort((a, b) => cards.indexOf(a.card) - cards.indexOf(b.card));
	const heights: Record<string, number> = {};
	for (const { card, height, followsViewport } of results) {
		const measured = Math.min(
			4000,
			Math.max(40, Math.ceil((followsViewport ? card.viewportHeight : height) / 10) * 10),
		);
		heights[card.name] = measured;
		if (card.heightFrom === "cards.json") continue;
		const path = join(PROJECT, "components", card.name, "preview.html");
		writeFileSync(path, read(path).replace(/^(<!-- @dsCard [^>]*?height=)\d+/, `$1${measured}`));
		card.height = measured;
		card.heightFrom = followsViewport ? "viewport" : "measured";
	}
	writeFileSync(join(OUT, "heights.json"), `${JSON.stringify(heights, null, "\t")}\n`);
	writeFileSync(join(OUT, "cards.json"), `${JSON.stringify(cards, null, "\t")}\n`);

	const size = (name: string) =>
		`${(Bun.file(join(PROJECT, "components", name, "preview.js")).size / 1024).toFixed(1)} KB`;
	console.log("component | group | width | height (from) | preview.js");
	for (const { card } of results) {
		console.log(
			`${card.name} | ${card.group} | ${card.width} | ${card.height} (${card.heightFrom}) | ${size(card.name)}`,
		);
	}
	const failed = results.filter((r) => r.errors.length);
	for (const { card, errors } of failed) {
		console.error(`FAIL ${card.name}:\n  ${[...new Set(errors)].join("\n  ")}`);
	}
	console.log(`design:check: ${results.length} cards, ${failed.length} failed`);
	if (failed.length) process.exit(1);
}

await main();
