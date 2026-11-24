/**
 * The runtime of a Design System preview card: mounts one story of a story
 * module the way Storybook's preview does, without Storybook. `design/build.ts`
 * writes one entry per component that imports its story file and calls
 * `mountStory` with the story the card shows, then bundles the entry into the
 * card's `preview.js`.
 *
 * What it reproduces: args, parameters, and globals merged meta first, the
 * story's `render` (else the meta's, else the component with its args), the
 * story's decorators inside the meta's (the first of each list innermost), and
 * the `beforeEach` hooks, meta first. The site root (`withSiteRoot`) is the
 * card's own `#root`, which `preview.html` writes as `.atelic-ui` unless the
 * story sets `parameters.root === false`. A story's `play` never runs.
 */
import { type ComponentType, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

type Args = Record<string, unknown>;

/** The part of Storybook's story context the stories read. */
export interface CardContext {
	args: Args;
	initialArgs: Args;
	parameters: Record<string, unknown>;
	globals: Record<string, unknown>;
	title: string;
	name: string;
	story: string;
	kind: string;
	id: string;
	componentId: string;
	viewMode: "story";
	loaded: Record<string, unknown>;
	argTypes: Record<string, unknown>;
	tags: string[];
	canvasElement: HTMLElement;
	step: (label: string, play: () => unknown) => Promise<void>;
}

type StoryFn = (update?: Partial<CardContext>) => ReactNode;
type Decorator = (Story: StoryFn, context: CardContext) => ReactNode;
type Hook = (context: CardContext) => unknown;
type Render = (args: Args, context: CardContext) => ReactNode;

interface StoryLike {
	name?: string;
	args?: Args;
	parameters?: Record<string, unknown>;
	globals?: Record<string, unknown>;
	render?: Render;
	decorators?: Decorator | Decorator[];
	beforeEach?: Hook | Hook[];
}

interface MetaLike extends StoryLike {
	title: string;
	component?: ComponentType<Args>;
}

function list<T>(value: T | T[] | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function slug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/**
 * Mounts `exportName` of the story module `mod` into the card's `#root`, with
 * `cardArgs` (from `design/cards.json`) over the story's own args.
 */
export async function mountStory(
	mod: Record<string, unknown>,
	exportName: string,
	cardArgs: Args = {},
): Promise<void> {
	const meta = mod.default as MetaLike;
	const story = (mod[exportName] ?? {}) as StoryLike;
	let element = document.getElementById("root");
	if (!element) {
		element = document.createElement("div");
		element.id = "root";
		document.body.append(element);
	}
	const args = { ...meta.args, ...story.args, ...cardArgs };
	const parameters = { ...meta.parameters, ...story.parameters };
	const globals = { density: "default", ...meta.globals, ...story.globals };
	const name = story.name ?? exportName;
	const componentId = slug(meta.title);
	const context: CardContext = {
		args,
		initialArgs: args,
		parameters,
		globals,
		title: meta.title,
		name,
		story: name,
		kind: meta.title,
		id: `${componentId}--${slug(exportName)}`,
		componentId,
		viewMode: "story",
		loaded: {},
		argTypes: {},
		tags: [],
		canvasElement: element,
		step: async () => {},
	};

	// The project's own hold on links (.storybook/preview.tsx): a card is a
	// picture, and a followed link would carry its frame away.
	document.addEventListener("click", (event) => {
		const link = (event.target as Element | null)?.closest?.("a[href]");
		if (link && !link.getAttribute("href")?.startsWith("#")) event.preventDefault();
	});

	// A hook prepares the page for a test (a spy, a cookie, a query string);
	// one that fails leaves the card to render as it can.
	for (const hook of [...list(meta.beforeEach), ...list(story.beforeEach)]) {
		try {
			await hook(context);
		} catch {
			// The card renders without it.
		}
	}

	const component = meta.component;
	const render: Render =
		story.render ??
		meta.render ??
		((props) => (component ? createElement(component, props) : null));

	// Each level's Story is made once, so a decorator that renders again keeps
	// the tree inside it mounted rather than handing React a new component.
	let current = (ctx: CardContext): ReactNode => render(ctx.args, ctx);
	for (const decorator of [...list(story.decorators), ...list(meta.decorators)]) {
		const inner = current;
		const Story: StoryFn = (update) =>
			inner(
				update?.args
					? { ...context, ...update, args: { ...context.args, ...update.args } }
					: context,
			);
		current = (ctx) => decorator(Story, ctx);
	}
	const draw = current;
	function Card() {
		return draw(context);
	}
	createRoot(element).render(createElement(Card));
}
