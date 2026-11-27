/**
 * The Design System producer: turns this package into the files of a Claude
 * Design System artifact, under `design/out/project/`, with the publish plan
 * beside them. `bun run design:build`, then `bun run design:check` to render
 * every card and record its height. Nothing here publishes; the session does.
 *
 * What it writes, under `project/`: the component bundle (`components/bundle.js`,
 * one classic script assigning `window.AtelicMarketing`), React and ReactDOM as
 * classic scripts (`components/lib/`), the stylesheet (`components/bundle.css`),
 * the flattened types (`components/index.d.ts`), one card per component with a
 * story (`components/<Comp>/preview.html`, `preview.js`, `README.md`), the
 * fonts, the story pictures (`assets/`), `tokens.json`, and the brand book
 * (`README.md`, from `design/README.md`). Previews derive from each component's
 * primary story and are never authored here; `design/cards.json` only picks a
 * story or a height where the first story makes a poor card.
 *
 * Flags: `--synced=YYYY-MM-DD` dates the sync (else today).
 */
import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build, type Plugin } from "esbuild";
import { type ViewportName, viewports } from "../stories/support/viewports";

const ROOT = resolve(import.meta.dir, "..");
const DESIGN = join(ROOT, "design");
const OUT = join(DESIGN, "out");
const PROJECT = join(OUT, "project");
const COMPONENTS = join(PROJECT, "components");
const NAMESPACE = "AtelicMarketing";
const GROUPS = ["chrome", "components", "primitives", "sections"] as const;
type Group = (typeof GROUPS)[number];

const KB = 1024;
const MB = 1024 * KB;
const CAPS = {
	bundleJS: 6 * MB,
	bundleCSS: 2 * MB,
	lib: 2 * MB,
	types: 1.5 * MB,
	previewHTML: 256 * KB,
	previewJS: 512 * KB,
	componentReadme: 64 * KB,
	readme: 200 * KB,
	tokens: 512 * KB,
	font: 1 * MB,
};

/** The four components the source gives no doc comment, summarized here. */
const WRITTEN_SUMMARIES: Record<string, string> = {
	Button:
		"The base button: a link, or a real button element when given a `type`, in one of three variants (primary, dark, ghost) and two sizes, with an optional arrow; a page's own call to action is `PrimaryButton` or `SecondaryButton`, and `Button` stays for the other shapes (a form's submit, a dark surface, a header's compact button).",
	ComparisonTable:
		"A graded before and after for a case study: one row per graded item, each side carrying a grade and the points behind it, with an after grade in the primary color only where it changed.",
	PrimaryButton:
		"A page's call to action: the large primary button with the arrow, the one shape every hero, case study, and closing section uses, so no page picks a variant and a size by hand.",
	SecondaryButton:
		"The ghost button beside a page's call to action, at the same large size, always second.",
};

/** Theme tokens the page's spacing family takes, by name, when the value is one px length. */
const SPACING = new Set([
	"max-width",
	"nav-height",
	"block-gap",
	"card-min",
	"brand-mark-height",
	"link-columns-min",
	"footer-mark-height",
]);

const log: string[] = [];
const note = (line: string) => {
	log.push(line);
	console.log(`  ${line}`);
};
const fail = (message: string): never => {
	throw new Error(`design:build: ${message}`);
};

const read = (path: string) => readFileSync(path, "utf8");
function write(path: string, text: string | Uint8Array) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text);
}
function copy(from: string, to: string) {
	mkdirSync(dirname(to), { recursive: true });
	copyFileSync(from, to);
}
function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}
function cap(path: string, limit: number) {
	const size = statSync(path).size;
	if (size > limit) fail(`${relative(OUT, path)} is ${size} bytes, over its cap of ${limit}`);
	return size;
}
const kb = (bytes: number) => `${(bytes / KB).toFixed(1)} KB`;

function packageVersion(name: string): string {
	return JSON.parse(read(join(ROOT, "node_modules", name, "package.json"))).version;
}

// ---------------------------------------------------------------------------
// Resolving React to the page's globals
// ---------------------------------------------------------------------------

const JSX_SHIM = `
const React = window.React;
export const Fragment = React.Fragment;
function element(type, props, key, spread) {
	const { children, ...rest } = props || {};
	if (key !== undefined) rest.key = key;
	if (children === undefined) return React.createElement(type, rest);
	if (spread && Array.isArray(children)) return React.createElement(type, rest, ...children);
	return React.createElement(type, rest, children);
}
export function jsx(type, props, key) { return element(type, props, key, false); }
export function jsxs(type, props, key) { return element(type, props, key, true); }
export function jsxDEV(type, props, key) { return element(type, props, key, false); }
`;

/**
 * Resolves `react`, `react-dom`, and the JSX runtime to the page's globals,
 * the ones `components/lib/` defines. `only` limits it to some of them (the
 * ReactDOM library bundles ReactDOM itself and takes only React).
 */
function windowGlobals(only?: string[]): Plugin {
	const globals: Record<string, string> = {
		react: "module.exports = window.React;",
		"react-dom": "module.exports = window.ReactDOM;",
		"react-dom/client": "module.exports = window.ReactDOM;",
		"react/jsx-runtime": JSX_SHIM,
		"react/jsx-dev-runtime": JSX_SHIM,
	};
	const names = only ?? Object.keys(globals);
	const filter = new RegExp(`^(${names.map((n) => n.replace(/[/.-]/g, "\\$&")).join("|")})$`);
	return {
		name: "window-globals",
		setup(b) {
			b.onResolve({ filter }, (args) => ({ path: args.path, namespace: "window-global" }));
			b.onLoad({ filter: /.*/, namespace: "window-global" }, (args) => ({
				contents: globals[args.path],
				loader: "js",
			}));
		},
	};
}

/** The Storybook modules a story imports at run time, as the stand ins a card needs. */
function storybookStubs(): Plugin {
	const stubs: Record<string, string> = {
		"storybook/test": join(DESIGN, "stubs/storybook-test.ts"),
		"@storybook/react-vite": join(DESIGN, "stubs/storybook-react-vite.ts"),
		"react-dom/server": join(DESIGN, "stubs/react-dom-server.ts"),
	};
	return {
		name: "storybook-stubs",
		setup(b) {
			b.onResolve(
				{ filter: /^(storybook\/test|@storybook\/react-vite|react-dom\/server)$/ },
				(args) => ({
					path: stubs[args.path],
				}),
			);
		},
	};
}

const PRODUCTION = {
	"process.env.NODE_ENV": '"production"',
	"import.meta.env": "{}",
};

// ---------------------------------------------------------------------------
// The component inventory
// ---------------------------------------------------------------------------

interface Inventory {
	name: string;
	group: Group;
	source: string;
}

/** The PascalCase value exports of the four barrels, in barrel order, with their source files. */
function inventory(): Inventory[] {
	const found: Inventory[] = [];
	for (const group of GROUPS) {
		const barrel = read(join(ROOT, "src", group, "index.ts"));
		for (const match of barrel.matchAll(/export\s+(type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/g)) {
			if (match[1]) continue;
			const from = match[3] as string;
			if (!from.startsWith("./")) continue;
			for (const raw of (match[2] as string).split(",")) {
				const name = raw.trim();
				if (
					!name ||
					name.startsWith("type ") ||
					!/^[A-Z][A-Za-z0-9]*$/.test(name) ||
					!/[a-z]/.test(name)
				)
					continue;
				const base = join(ROOT, "src", group, from);
				const source = [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx")].find(existsSync);
				if (!source) fail(`no source file for ${name} (${from})`);
				found.push({ name, group, source: source as string });
			}
		}
	}
	return found;
}

/** The doc comment directly above the component's export, `export function
 * <name>` or `export const <name> =` (a forwardRef), as plain text. */
function docComment(source: string, name: string): string | undefined {
	const text = read(source);
	const at = text.search(new RegExp(`^export (?:function ${name}\\b|const ${name} =)`, "m"));
	if (at < 0) return undefined;
	const before = text.slice(0, at).trimEnd();
	if (!before.endsWith("*/")) return undefined;
	const start = before.lastIndexOf("/**");
	if (start < 0) return undefined;
	const body = before
		.slice(start + 3, -2)
		.split("\n")
		.map((line) => line.replace(/^\s*\* ?/, "").trimEnd())
		.join("\n")
		.trim();
	// Paragraphs stay apart; lines inside one join.
	return body
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.replace(/\s*\n\s*/g, " "))
		.join("\n\n");
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

interface StoryModule {
	default: {
		title: string;
		component?: unknown;
		parameters?: Record<string, unknown>;
		globals?: Record<string, unknown>;
	};
	[name: string]: unknown;
}

interface Card {
	name: string;
	group: Group;
	storyFile: string;
	story: string;
	width: number;
	viewportHeight: number;
	height: number;
	heightFrom: "cards.json" | "measured" | "default";
	root: boolean;
	padded: boolean;
}

interface CardChoice {
	story?: string;
	args?: Record<string, unknown>;
	group?: string;
	height?: number;
	width?: number;
}

/**
 * Loads every story module of the four groups under bun, through one node
 * bundle with Storybook stubbed, beside the barrels, so a story's meta
 * `component` is matched to its export by identity.
 */
async function loadStories(files: string[]) {
	const metaDir = join(OUT, "meta");
	const entry = join(metaDir, "entry.ts");
	const lines = [
		...GROUPS.map((g) => `export * as ${g} from ${JSON.stringify(join(ROOT, "src", g))};`),
		...files.map((file, i) => `import * as s${i} from ${JSON.stringify(file)};`),
		`export const stories = [${files.map((_, i) => `s${i}`).join(", ")}];`,
	];
	write(entry, lines.join("\n"));
	const outfile = join(metaDir, "meta.mjs");
	await build({
		entryPoints: [entry],
		outfile,
		bundle: true,
		format: "esm",
		platform: "node",
		packages: "external",
		jsx: "automatic",
		logLevel: "error",
		plugins: [storybookStubs()],
	});
	const loaded = (await import(pathToFileURL(outfile).href)) as Record<string, unknown> & {
		stories: StoryModule[];
	};
	const barrels: Record<string, unknown> = {};
	for (const g of GROUPS) Object.assign(barrels, loaded[g] as Record<string, unknown>);
	return { barrels, stories: loaded.stories };
}

/** The named story exports of a story file, in source order. */
function storyNames(file: string): string[] {
	return [...read(file).matchAll(/^export const (\w+)\b/gm)].map((m) => m[1] as string);
}

function viewportOf(globals: Record<string, unknown> | undefined): {
	width: number;
	height: number;
} {
	const value = (globals?.viewport as { value?: string } | undefined)?.value;
	const viewport = value ? viewports[value as ViewportName] : undefined;
	if (value && !viewport) fail(`unknown viewport ${value}`);
	if (!viewport) return { width: 1200, height: 900 };
	return {
		width: Number.parseInt(viewport.styles.width, 10),
		height: Number.parseInt(viewport.styles.height, 10),
	};
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

interface Token {
	name: string;
	value: string;
	usage?: string;
}

interface Declaration {
	name: string;
	value: string;
	comment?: string;
	sheet: string;
}

/** The custom properties declared in the blocks of a sheet whose selector is exactly `selector`. */
function declarations(sheet: string, selector: string): Declaration[] {
	const text = read(join(ROOT, "src/styles", sheet));
	const found: Declaration[] = [];
	const escaped = selector.replace(/[.()[\]]/g, "\\$&");
	for (const block of text.matchAll(new RegExp(`(?:^|[\\s}])${escaped}\\s*\\{([^}]*)\\}`, "g"))) {
		// The comment just above the block speaks for it until one inside does.
		const above = text.slice(0, block.index).trimEnd();
		let comment = above.endsWith("*/")
			? above
					.slice(above.lastIndexOf("/*") + 2, -2)
					.replace(/\s+/g, " ")
					.trim()
			: undefined;
		for (const part of (block[1] as string).matchAll(
			/\/\*([\s\S]*?)\*\/|(--[\w-]+)\s*:\s*([^;]+);/g,
		)) {
			if (part[1] !== undefined) {
				comment = part[1].replace(/\s+/g, " ").trim();
				continue;
			}
			found.push({
				name: (part[2] as string).slice(2),
				value: (part[3] as string).replace(/\s+/g, " ").trim(),
				comment,
				sheet,
			});
		}
	}
	return found;
}

/**
 * The "What it colors or sets" cell of each token row in the README's token
 * tables: `single` from a row of one token, `shared` from a row naming several.
 */
function readmeUsage(): { single: Map<string, string>; shared: Map<string, string> } {
	const single = new Map<string, string>();
	const shared = new Map<string, string>();
	for (const match of read(join(ROOT, "README.md")).matchAll(
		/^\| ((?:`--[\w-]+`(?:, )?)+) \| [^|\n]* \| ([^\n]*) \|$/gm,
	)) {
		const names = [...(match[1] as string).matchAll(/`--([\w-]+)`/g)].map((m) => m[1] as string);
		const cell = (match[2] as string).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
		const into = names.length === 1 ? single : shared;
		for (const name of names) if (!into.has(name)) into.set(name, cell);
	}
	return { single, shared };
}

/** A clause of a comment that defines the token by name: "--block-gap is the space ...". */
function namedClause(comment: string | undefined, name: string): string | undefined {
	const clause = comment && new RegExp(`--${name} is ([^;.]+)`).exec(comment)?.[1];
	return clause ? `${clause.charAt(0).toUpperCase()}${clause.slice(1)}` : undefined;
}

function firstSentence(text: string): string {
	const match = /^(.*?[.!?])(\s|$)/.exec(text);
	return (match ? (match[1] as string) : text).trim();
}

/** `rgb(1 2 3 / 0.5)` as `rgba(1, 2, 3, 0.5)`, the comma form every reader parses. */
function commaColors(value: string): string {
	return value.replace(
		/rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/g,
		(_, r, g, b, a) => (a === undefined ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`),
	);
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/;
const PX = /^-?\d+(?:\.\d+)?px$/;
const VAR = /^var\(--([\w-]+)\)$/;
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

function tokens(version: string, synced: string) {
	// What a card renders with, weakest first: the defaults (a selector that
	// weighs nothing), the base sheet's density settings on .atelic-ui at the
	// default density, then the theme (its own layer, above both).
	const theme = declarations("theme.css", ".atelic-ui");
	const base = declarations("base.css", ".atelic-ui");
	const defaults = declarations("defaults.css", ":where(.atelic-ui)");
	const byName = new Map<string, Declaration>();
	for (const d of [...defaults, ...base, ...theme]) {
		const earlier = byName.get(d.name);
		if (earlier && earlier.sheet === d.sheet) fail(`--${d.name} is declared twice in ${d.sheet}`);
		if (earlier)
			note(`--${d.name}: ${d.sheet} (${d.value}) replaces ${earlier.sheet} (${earlier.value})`);
		byName.set(d.name, d);
	}
	const names = [...new Set([...theme, ...defaults, ...base].map((d) => d.name))];
	const ordered = names.map((name) => byName.get(name) as Declaration);
	const cells = readmeUsage();
	const usageOf = (d: Declaration) => {
		const text =
			cells.single.get(d.name) ??
			namedClause(d.comment, d.name) ??
			cells.shared.get(d.name) ??
			(d.comment ? firstSentence(d.comment) : undefined);
		return text ? text.slice(0, 1000) : undefined;
	};
	const entry = (d: Declaration, value: string): Token => {
		const usage = usageOf(d);
		return usage ? { name: d.name, value, usage } : { name: d.name, value };
	};

	const isColor = (value: string) => HEX.test(value) || RGB.test(commaColors(value));
	const colorNames = new Set(ordered.filter((d) => isColor(d.value)).map((d) => d.name));
	const color: Token[] = [];
	const radius: Token[] = [];
	const spacing: Token[] = [];
	const shadow: Token[] = [];
	const weight: Token[] = [];
	const families: Record<string, string> = {};
	const skipped: string[] = [];
	const skip = (d: Declaration, why: string) => skipped.push(`\`--${d.name}\` (${why})`);

	for (const d of ordered) {
		const value = d.value;
		const alias = VAR.exec(value)?.[1];
		const family = /^font-(sans|serif|mono|brand|script)$/.exec(d.name)?.[1];
		if (family) {
			const stack = alias ? byName.get(alias)?.value : value;
			if (!stack || /[;{}<>\\()]/.test(stack)) skip(d, "a font stack the page cannot read");
			else families[family] = stack;
		} else if (isColor(value)) {
			color.push(entry(d, HEX.test(value) ? value.toLowerCase() : commaColors(value)));
		} else if (alias && colorNames.has(alias)) {
			color.push(entry(d, `{${alias}}`));
		} else if (value === "currentColor") {
			skip(d, "currentColor, the inherited color, which no token value can name");
		} else if (/clamp\(|calc\(|min\(|max\(/.test(value)) {
			skip(d, "a fluid or computed value");
		} else if (d.name.startsWith("radius-") && PX.test(value)) {
			radius.push(entry(d, value));
		} else if (SPACING.has(d.name) && PX.test(value)) {
			spacing.push(entry(d, value));
		} else if (/^(shadow-|primary-shadow)/.test(d.name)) {
			shadow.push(entry(d, commaColors(value)));
		} else if (d.name.startsWith("weight-") && /^\d+$/.test(value)) {
			weight.push(entry(d, value));
		} else if (/\s/.test(value)) {
			skip(d, "a shorthand of several values");
		} else if (/^[a-z-]+$/i.test(value)) {
			skip(d, "a keyword");
		} else {
			skip(d, "a value outside the families the page shows");
		}
	}

	const all = [...color, ...radius, ...spacing, ...shadow, ...weight];
	const seen = new Set<string>();
	for (const t of all) {
		if (!NAME.test(t.name)) fail(`token name ${t.name} does not fit the page's names`);
		if (seen.has(t.name)) fail(`token ${t.name} appears twice across the families`);
		seen.add(t.name);
	}

	const weights = new Map(weight.map((t) => [t.name, Number(t.value)]));
	const groups = typeScale(weights);

	const tokensJSON = {
		name: "Atelic Marketing",
		version: 1,
		meta: { source: "ui", package: "@atelic-action/ui", version, synced },
		color: { themes: [{ id: "light", name: "Light" }], tokens: color },
		type: {
			fonts: [
				{ family: "Geist", file: "fonts/Geist-Variable.woff2", weight: "100 900", style: "normal" },
				{
					family: "Geist Mono",
					file: "fonts/GeistMono-Variable.woff2",
					weight: "100 900",
					style: "normal",
				},
			],
			families,
			groups,
		},
		spacing: { tokens: spacing },
		radius: { tokens: radius },
		shadow: { tokens: shadow },
		weight: {
			note: "The weights every sheet asks for by name; a font kit with fewer weights maps each to one it has.",
			tokens: weight,
		},
	};
	const counts = {
		color: color.length,
		radius: radius.length,
		spacing: spacing.length,
		shadow: shadow.length,
		weight: weight.length,
		families: Object.keys(families).length,
		styles: groups.reduce((n, g) => n + g.styles.length, 0),
	};
	return { tokensJSON, skipped, counts };
}

interface TypeStyle {
	name: string;
	fontSize: string;
	lineHeight?: string | number;
	fontWeight?: number;
	usage?: string;
}

/**
 * The base sheet's type, as the page's text styles: the root's body size and
 * leading, the four heading sizes (a fluid one at its largest, with the
 * clamp in its usage), and long form prose.
 */
function typeScale(weights: Map<string, number>) {
	const base = read(join(ROOT, "src/styles/base.css"));
	const sheet = base.replace(/\/\*[\s\S]*?\*\//g, "");
	const rule = (selector: string) => {
		const props: Record<string, string> = {};
		for (const block of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
			const list = (block[1] as string).split(",").map((s) => s.trim());
			if (!list.includes(selector)) continue;
			for (const m of (block[2] as string).matchAll(/(?:^|;|\s)([a-z-]+)\s*:\s*([^;]+);/g)) {
				props[m[1] as string] = (m[2] as string).trim();
			}
		}
		return props;
	};
	const weightOf = (value?: string) => {
		const last = value && [...value.matchAll(/var\(--([\w-]+)\)/g)].pop()?.[1];
		const name = value && (VAR.exec(value)?.[1] ?? last);
		return name ? weights.get(name) : value && /^\d+$/.test(value) ? Number(value) : undefined;
	};
	const sized = (name: string, props: Record<string, string>, usage: string): TypeStyle => {
		const declared = props["font-size"] ?? "";
		// A heading size held to its column (9.12.0) is its clamp inside a min().
		const fitted = /^min\((clamp\([^)]*\)),\s*var\(--heading-fit\)\)$/.exec(declared);
		const size = fitted ? (fitted[1] as string) : declared;
		const fluid = /^clamp\(([^,]+),([^,]+),([^)]+)\)$/.exec(size);
		const held = fitted ? " Held to --heading-fit, so its longest word fits its column." : "";
		const style: TypeStyle = {
			name,
			fontSize: fluid ? (fluid[3] as string).trim() : size,
			usage: fluid ? `${usage} Fluid, ${size}; shown at its largest.${held}` : usage,
		};
		const leading = props["line-height"];
		if (leading) style.lineHeight = /^[\d.]+$/.test(leading) ? Number(leading) : leading;
		const w = weightOf(props["font-weight"]);
		if (w) style.fontWeight = w;
		return style;
	};
	const headings = (["h1", "h2", "h3", "h4"] as const).map((h) =>
		sized(h, rule(`.atelic-ui ${h}`), `The ${h} element under .atelic-ui.`),
	);
	const text = [
		sized("body", rule(".atelic-ui"), "The root's body text: every paragraph and list."),
		sized("prose", rule(".atelic-ui .prose p"), "A paragraph of long form copy (.prose)."),
	];
	const valid = (s: TypeStyle) => /^\d+(\.\d+)?(px|rem|em)$/.test(s.fontSize);
	for (const s of [...headings, ...text]) if (!valid(s)) fail(`type style ${s.name} has no size`);
	return [
		{ name: "Headings", family: "sans", styles: headings },
		{ name: "Text", family: "sans", styles: text },
	];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

function flattenTypes(): { text: string; renamed: string[] } {
	const out = join(OUT, "index.d.ts");
	const run = spawnSync(
		join(ROOT, "node_modules/.bin/dts-bundle-generator"),
		[
			"--project",
			join(DESIGN, "tsconfig.dts.json"),
			"--no-check",
			"--export-referenced-types",
			"--no-banner",
			"-o",
			out,
			join(DESIGN, "entry.ts"),
		],
		{ encoding: "utf8" },
	);
	if (run.status !== 0) fail(`dts-bundle-generator failed:\n${run.stdout}\n${run.stderr}`);
	const renamed = [...`${run.stdout}${run.stderr}`.matchAll(/^- (\w+) \(from ([^)]+)\)/gm)].map(
		(m) => `${m[1]} (${relative(ROOT, (m[2] as string).replace(/\.d\.ts$/, ".tsx"))})`,
	);
	return { text: read(out), renamed };
}

/** A declaration of `name` in the flattened types: an interface or a type alias, whole. */
function declarationOf(types: string, name: string): string | undefined {
	const start = types.search(new RegExp(`^(export )?(declare )?(interface|type) ${name}\\b`, "m"));
	if (start < 0) return undefined;
	let depth = 0;
	for (let i = start; i < types.length; i++) {
		const ch = types[i];
		if (ch === "{" || ch === "(" || ch === "<" || ch === "[") depth++;
		else if (ch === "}" || ch === ")" || (ch === ">" && types[i - 1] !== "=") || ch === "]") {
			depth--;
			if (depth === 0 && ch === "}" && types.slice(start, i).match(/^[^=]*interface /)) {
				return types.slice(start, i + 1);
			}
		} else if (ch === ";" && depth === 0) return types.slice(start, i + 1);
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// The build
// ---------------------------------------------------------------------------

async function main() {
	const started = Date.now();
	const syncedFlag = process.argv.find((a) => a.startsWith("--synced="))?.slice(9);
	const synced = syncedFlag ?? new Date().toISOString().slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(synced)) fail(`--synced takes YYYY-MM-DD, not ${synced}`);
	const pkg = JSON.parse(read(join(ROOT, "package.json")));
	const version = pkg.version as string;
	const sha = spawnSync("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"], {
		encoding: "utf8",
	}).stdout.trim();
	const cardsJSON = JSON.parse(read(join(DESIGN, "cards.json"))) as Record<string, CardChoice>;

	rmSync(PROJECT, { recursive: true, force: true });
	rmSync(join(OUT, "entries"), { recursive: true, force: true });
	rmSync(join(OUT, "meta"), { recursive: true, force: true });
	mkdirSync(COMPONENTS, { recursive: true });
	console.log(`design:build: @atelic-action/ui ${version} at ${sha}, synced ${synced}`);

	// a. The inventory and the bundle.
	const components = inventory();
	console.log(`- ${components.length} components in the four barrels`);
	const header = `/* @ds-bundle: ${JSON.stringify({
		format: 4,
		namespace: NAMESPACE,
		components: components.map((c) => ({ name: c.name })),
	})} */\n`;
	const bundled = await build({
		entryPoints: [join(DESIGN, "entry.ts")],
		write: false,
		bundle: true,
		format: "iife",
		globalName: NAMESPACE,
		minify: true,
		jsx: "automatic",
		platform: "browser",
		target: "es2020",
		define: PRODUCTION,
		logLevel: "error",
		legalComments: "none",
		footer: { js: `window.${NAMESPACE}=${NAMESPACE};` },
		plugins: [windowGlobals()],
	});
	let bundleJS = (bundled.outputFiles[0] as { text: string }).text;
	bundleJS = guardInline(bundleJS, "components/bundle.js");
	write(join(COMPONENTS, "bundle.js"), header + bundleJS);
	const bundleSize = cap(join(COMPONENTS, "bundle.js"), CAPS.bundleJS);
	console.log(`- components/bundle.js ${kb(bundleSize)}`);

	// b. React and ReactDOM as classic scripts.
	const libDir = join(COMPONENTS, "lib");
	mkdirSync(join(OUT, "lib-entries"), { recursive: true });
	const reactEntry = join(OUT, "lib-entries/react.ts");
	const reactDOMEntry = join(OUT, "lib-entries/react-dom.ts");
	write(reactEntry, 'export * from "react";\nexport { default } from "react";\n');
	write(reactDOMEntry, 'export * from "react-dom";\nexport * from "react-dom/client";\n');
	const lib = async (entry: string, globalName: string, outfile: string, plugins: Plugin[]) => {
		await build({
			entryPoints: [entry],
			outfile,
			bundle: true,
			format: "iife",
			globalName,
			minify: true,
			platform: "browser",
			target: "es2020",
			define: PRODUCTION,
			logLevel: "error",
			legalComments: "none",
			nodePaths: [join(ROOT, "node_modules")],
			footer: { js: `window.${globalName}=${globalName};` },
			plugins,
		});
		write(outfile, guardInline(read(outfile), relative(PROJECT, outfile)));
		return cap(outfile, CAPS.lib);
	};
	const reactSize = await lib(reactEntry, "React", join(libDir, "react.js"), []);
	const reactDOMSize = await lib(reactDOMEntry, "ReactDOM", join(libDir, "react-dom.js"), [
		windowGlobals(["react"]),
	]);
	const libraries = [
		{
			name: "react",
			version: packageVersion("react"),
			global: "React",
			file: "components/lib/react.js",
		},
		{
			name: "react-dom",
			version: packageVersion("react-dom"),
			global: "ReactDOM",
			file: "components/lib/react-dom.js",
		},
	];
	const exported = proveLibraries(libDir, join(COMPONENTS, "bundle.js"));
	for (const c of components) {
		const kind = typeof exported[c.name];
		if (kind !== "function" && kind !== "object") fail(`${c.name} is not exported by the bundle`);
	}
	console.log(`- components/lib/react.js ${kb(reactSize)}, react-dom.js ${kb(reactDOMSize)}`);

	// c. The stylesheet.
	await build({
		entryPoints: [join(DESIGN, "styles.css")],
		outfile: join(COMPONENTS, "bundle.css"),
		bundle: true,
		minify: true,
		logLevel: "error",
		legalComments: "none",
	});
	const css = read(join(COMPONENTS, "bundle.css"));
	if (/<\/style/i.test(css)) fail("components/bundle.css holds a literal </style");
	const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)/g)].map((m) => m[1] as string);
	const remote = urls.filter((u) => !u.startsWith("data:"));
	if (remote.length) fail(`components/bundle.css loads ${remote.join(", ")}`);
	console.log(`- components/bundle.css ${kb(cap(join(COMPONENTS, "bundle.css"), CAPS.bundleCSS))}`);

	// d. Fonts.
	for (const font of ["Geist-Variable.woff2", "GeistMono-Variable.woff2"]) {
		copy(join(ROOT, "stories/public/fonts", font), join(PROJECT, "fonts", font));
		cap(join(PROJECT, "fonts", font), CAPS.font);
	}

	// e. tokens.json.
	const { tokensJSON, skipped, counts } = tokens(version, synced);
	write(join(PROJECT, "tokens.json"), `${JSON.stringify(tokensJSON, null, "\t")}\n`);
	cap(join(PROJECT, "tokens.json"), CAPS.tokens);
	console.log(
		`- tokens.json: ${Object.entries(counts)
			.map(([k, v]) => `${v} ${k}`)
			.join(", ")}; ${skipped.length} skipped`,
	);

	// h. The flattened types (before the READMEs, which quote them).
	const { text: flat, renamed } = flattenTypes();
	let types = flat;
	const aliases: string[] = [];
	for (const c of components) {
		if (declarationOf(types, `${c.name}Props`)) continue;
		const param = new RegExp(`declare function ${c.name}\\([^:)]*: (\\w+)\\)`).exec(types)?.[1];
		if (param) {
			types += `\n/** ${c.name} takes ${param}. */\nexport type ${c.name}Props = ${param};\n`;
			aliases.push(`${c.name}Props = ${param}`);
		}
	}
	write(join(COMPONENTS, "index.d.ts"), types);
	cap(join(COMPONENTS, "index.d.ts"), CAPS.types);
	console.log(
		`- components/index.d.ts ${kb(types.length)} by dts-bundle-generator; renamed: ${renamed.join(", ") || "none"}; aliases added: ${aliases.join(", ") || "none"}`,
	);

	// f. Previews: one card per component with a story.
	const storyFiles = GROUPS.flatMap((g) =>
		walk(join(ROOT, "stories", g)).filter((f) => f.endsWith(".stories.tsx")),
	).sort();
	const { barrels, stories } = await loadStories(storyFiles);
	const byComponent = new Map<string, { file: string; mod: StoryModule }[]>();
	stories.forEach((mod, i) => {
		const file = storyFiles[i] as string;
		const head = mod.default.title.split("/")[0]?.toLowerCase() ?? "";
		if (!(GROUPS as readonly string[]).includes(head)) return;
		const name = Object.entries(barrels).find(([, v]) => v === mod.default.component)?.[0];
		if (!name) return;
		byComponent.set(name, [...(byComponent.get(name) ?? []), { file, mod }]);
	});

	const measured = existsSync(join(OUT, "heights.json"))
		? (JSON.parse(read(join(OUT, "heights.json"))) as Record<string, number>)
		: {};
	const cards: Card[] = [];
	const floors: { name: string; group: Group; why: string }[] = [];
	const entries: Record<string, string> = {};
	for (const c of components) {
		const candidates = byComponent.get(c.name) ?? [];
		const found =
			candidates.find((s) => s.file.endsWith(`/${c.name}.stories.tsx`)) ?? candidates[0];
		if (!found) {
			floors.push({ name: c.name, group: c.group, why: "no story renders it" });
			continue;
		}
		const choice = cardsJSON[c.name] ?? {};
		const names = storyNames(found.file);
		const story = choice.story ?? names[0];
		if (!story || !names.includes(story)) fail(`${c.name}: no story ${story} in ${found.file}`);
		const storyObject = (found.mod[story as string] ?? {}) as {
			globals?: Record<string, unknown>;
			parameters?: Record<string, unknown>;
		};
		const globals = { ...found.mod.default.globals, ...storyObject.globals };
		const parameters = { ...found.mod.default.parameters, ...storyObject.parameters };
		const group = (choice.group ?? found.mod.default.title.split("/")[0]?.toLowerCase()) as Group;
		const height =
			choice.height ?? (measured[c.name] !== undefined ? measured[c.name] : undefined) ?? 400;
		cards.push({
			name: c.name,
			group,
			storyFile: relative(ROOT, found.file),
			story: story as string,
			width: choice.width ?? viewportOf(globals).width,
			viewportHeight: viewportOf(globals).height,
			height: height as number,
			heightFrom:
				choice.height !== undefined
					? "cards.json"
					: measured[c.name] !== undefined
						? "measured"
						: "default",
			root: parameters.root !== false,
			padded: parameters.layout === "padded",
		});
		const entry = join(OUT, "entries", `${c.name}.tsx`);
		write(
			entry,
			[
				`import * as stories from ${JSON.stringify(found.file)};`,
				`import { mountStory } from ${JSON.stringify(join(DESIGN, "preview.tsx"))};`,
				`void mountStory(stories, ${JSON.stringify(story)}, ${JSON.stringify(choice.args ?? {})});`,
				"",
			].join("\n"),
		);
		entries[`${c.name}/preview`] = entry;
	}
	await build({
		entryPoints: entries,
		outdir: COMPONENTS,
		bundle: true,
		format: "iife",
		minify: true,
		jsx: "automatic",
		platform: "browser",
		target: "es2020",
		define: PRODUCTION,
		logLevel: "error",
		legalComments: "none",
		plugins: [storybookStubs(), windowGlobals()],
	});
	let largest = { name: "", size: 0 };
	for (const card of cards) {
		const path = join(COMPONENTS, card.name, "preview.js");
		const text = guardInline(
			read(path)
				.replace(/(["'`])\/images\//g, "$1../../assets/Images/")
				.replace(/(["'`])\/video\//g, "$1../../assets/Video/"),
			relative(PROJECT, path),
		);
		write(path, text);
		const size = cap(path, CAPS.previewJS);
		if (size > largest.size) largest = { name: card.name, size };
		writePreviewHTML(card);
	}
	console.log(
		`- ${cards.length} cards; the largest preview.js is ${largest.name}, ${kb(largest.size)}`,
	);
	for (const [from, to] of [
		["images", "Images"],
		["video", "Video"],
	] as const) {
		const dir = join(ROOT, "stories/public", from);
		for (const file of walk(dir)) copy(file, join(PROJECT, "assets", to, relative(dir, file)));
	}

	// g. Each component's README.
	for (const c of components) {
		const card = cards.find((k) => k.name === c.name);
		const doc = docComment(c.source, c.name);
		const written = WRITTEN_SUMMARIES[c.name];
		if (!doc && !written) fail(`${c.name} has no doc comment and no written summary`);
		if (doc && written) note(`${c.name} now has a doc comment; drop its written summary`);
		const props = declarationOf(types, `${c.name}Props`);
		const alias = /^export type \w+Props = (\w+);$/.exec(props ?? "")?.[1];
		const shown = alias ? declarationOf(types, alias) : props;
		const lines = [`# ${c.name}`, "", doc ?? (written as string), ""];
		if (!doc)
			lines.push("_Summary written by the producer: the source carries no doc comment._", "");
		lines.push("## Props", "");
		if (shown) {
			if (alias) lines.push(`\`${c.name}Props\` is \`${alias}\`:`, "");
			lines.push("```ts", shown, "```", "");
		} else lines.push("Takes no props.", "");
		lines.push("## Story", "");
		lines.push(
			card
				? `The card renders \`${card.story}\` from \`${card.storyFile}\`.`
				: "No story renders it, so it has no live card.",
			"",
		);
		lines.push(`Source: \`${relative(ROOT, c.source)}\`.`, "");
		const path = join(COMPONENTS, c.name, "README.md");
		write(path, lines.join("\n"));
		cap(path, CAPS.componentReadme);
	}
	for (const floor of floors) {
		write(
			join(COMPONENTS, floor.name, "preview.html"),
			`<!-- @dsCard group="${floor.group}" floor static height=120 -->\n<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>\n`,
		);
	}

	// i. The brand book, with what did not sync.
	const notSynced = [
		"",
		"## Not Synced",
		"",
		"Written by `design/build.ts` on every build.",
		"",
		"**Tokens skipped**, each a value the token families cannot hold; the sheets still define them, so every component reads them as before:",
		"",
		...skipped.map((s) => `- ${s}`),
		"",
		"**Components without a live card:**",
		"",
		...(floors.length ? floors.map((f) => `- \`${f.name}\`: ${f.why}`) : ["- None."]),
		"",
	];
	write(
		join(PROJECT, "README.md"),
		`${read(join(DESIGN, "README.md")).trimEnd()}\n${notSynced.join("\n")}`,
	);
	cap(join(PROJECT, "README.md"), CAPS.readme);

	// k. The manifest of the build: cards for the check, the publish plan, the proposed index.
	write(join(OUT, "cards.json"), `${JSON.stringify(cards, null, "\t")}\n`);
	const files = walk(PROJECT)
		.map((f) => relative(OUT, f))
		.sort();
	const proposedIndex = {
		namespace: NAMESPACE,
		libraries,
		editing: "code",
		lastChange: {
			by: "Forni",
			via: `Claude Code · atelic-action/ui@${sha}`,
			at: new Date().toISOString(),
			note: `synced from ui ${version}`,
		},
	};
	write(join(OUT, "index.proposed.json"), `${JSON.stringify(proposedIndex, null, "\t")}\n`);
	write(
		join(OUT, "publish-plan.json"),
		`${JSON.stringify(
			{
				root: "design/out",
				files: Object.fromEntries(files.map((f) => [f, f])),
				proposedIndex,
				removeOldLayout: true,
				removePrefixes: [
					"project/components/chrome/",
					"project/components/components/",
					"project/components/primitives/",
					"project/components/sections/",
					"project/_preview/",
					"project/_vendor/",
					"project/_ds_bundle.js",
					"project/_ds_bundle.css",
					"project/_ds_manifest.json",
					"project/styles.css",
					"project/manifest.json",
					"project/migration-map.json",
					"project/assets/notes/",
					"project/fonts/fonts.css",
				],
				removeFontsExcept: [
					"project/fonts/Geist-Variable.woff2",
					"project/fonts/GeistMono-Variable.woff2",
				],
			},
			null,
			"\t",
		)}\n`,
	);
	write(
		join(OUT, "build.log"),
		`${[...log, "Tokens skipped:", ...skipped.map((s) => `- ${s}`)].join("\n")}\n`,
	);
	console.log(
		`design:build: ${files.length} files in design/out/project (${((Date.now() - started) / 1000).toFixed(1)}s); ${floors.length} floor cards; heights ${
			cards.filter((c) => c.heightFrom === "default").length
		} default, run design:check to measure`,
	);
}

/**
 * A script the page inlines must hold no literal `</script` or `<!--`. Inside a
 * string either is rewritten to an equivalent escape; any left is a failure.
 */
function guardInline(text: string, label: string): string {
	let out = text;
	const before = (out.match(/<\/script|<!--/gi) ?? []).length;
	if (before) {
		out = out.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "\\x3C!--");
		note(`${label}: escaped ${before} literal </script or <!-- inside strings`);
	}
	return out;
}

/** Evaluates the libraries and the bundle against a bare window, proving the globals hold. */
function proveLibraries(libDir: string, bundle: string): Record<string, unknown> {
	const window: Record<string, unknown> = {};
	const run = (file: string) => new Function("window", read(file))(window);
	run(join(libDir, "react.js"));
	const React = window.React as Record<string, unknown> | undefined;
	for (const key of ["createElement", "Fragment", "useState", "useEffect", "forwardRef"]) {
		if (!React?.[key]) fail(`components/lib/react.js leaves window.React.${key} undefined`);
	}
	run(join(libDir, "react-dom.js"));
	const ReactDOM = window.ReactDOM as Record<string, unknown> | undefined;
	for (const key of ["createRoot", "hydrateRoot", "createPortal", "flushSync"]) {
		if (!ReactDOM?.[key])
			fail(`components/lib/react-dom.js leaves window.ReactDOM.${key} undefined`);
	}
	run(bundle);
	const exported = window[NAMESPACE] as Record<string, unknown> | undefined;
	if (!exported) fail(`components/bundle.js leaves window.${NAMESPACE} undefined`);
	return exported as Record<string, unknown>;
}

function writePreviewHTML(card: Card) {
	const attributes = [`id="root"`];
	if (card.root) attributes.push(`class="atelic-ui"`);
	if (card.padded) attributes.push(`style="padding:16px"`);
	const html = [
		`<!-- @dsCard group="${card.group}" height=${card.height} width=${card.width} -->`,
		`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><div ${attributes.join(" ")}></div><script src="./preview.js"></script></body></html>`,
		"",
	].join("\n");
	const path = join(COMPONENTS, card.name, "preview.html");
	write(path, html);
	cap(path, CAPS.previewHTML);
}

await main();
