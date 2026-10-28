import * as RadixTabs from "@radix-ui/react-tabs";
import { type ReactNode, useEffect, useRef, useState } from "react";

export interface TabsItem {
	/**
	 * The tab's name in the URL: the tab is `<id>-tab` and its panel
	 * `<id>-panel`, and a hash of `#<id>` opens it.
	 */
	id: string;
	/** The tab's visible name, and its panel's heading on paper. */
	label: ReactNode;
	content: ReactNode;
}

export interface TabsProps {
	tabs: TabsItem[];
	/** The tab open on first render when uncontrolled; the first when left out. */
	defaultId?: string;
	/** Held by the caller: the open tab. Pass `onSelect` with it. */
	selectedId?: string;
	/** Called with a tab's id whenever the reader or a hash picks it. */
	onSelect?: (id: string) => void;
	/** The tab list's accessible name; site copy, so it has no default. */
	ariaLabel: string;
	/** The level of the heading each panel prints under; 2 when left out. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	className?: string;
}

const panelId = (id: string) => `${id}-panel`;
const tabId = (id: string) => `${id}-tab`;

// An attribute selector for an id; quoted, so any id is safe in it.
const byId = (id: string) => `[id="${id.replace(/["\\]/g, "\\$&")}"]`;

// An element inside this list by its id, never another list's that shares it.
function elementIn(root: HTMLElement | null, id: string) {
	return root?.querySelector<HTMLElement>(byId(id)) ?? null;
}

// The list's own panel for a tab: a direct child of its root.
function panelIn(root: HTMLElement | null, id: string) {
	return root?.querySelector<HTMLElement>(`:scope > ${byId(panelId(id))}`) ?? null;
}

// The tab whose panel holds the element, if it is one of this list's.
function tabHolding(root: HTMLElement | null, tabs: TabsItem[], el: Element) {
	return tabs.find((tab) => panelIn(root, tab.id)?.contains(el))?.id;
}

/**
 * Panels behind a row of tabs, on Radix for the keyboard and the roles.
 *
 * Every panel stays in the page. Before the script runs, CSS hides the
 * inactive ones; once it runs, they carry `hidden="until-found"`, so a
 * browser's find in page and a link to an element inside one both reveal
 * it, and the tab follows. A hash names a tab by its id, or any element in
 * a panel by that element's id: on load, on a hash change, and on a click of
 * a link to the hash already in the address bar, the panel holding it opens
 * and the page scrolls to the element. On paper there are no tabs: the list
 * is hidden and every panel prints under its label as a heading.
 */
export function Tabs({
	tabs,
	defaultId,
	selectedId,
	onSelect,
	ariaLabel,
	headingLevel = 2,
	className,
}: TabsProps) {
	// An id that names no tab falls back to the first, so a panel always shows.
	const first = tabs[0]?.id ?? "";
	const known = (id: string | undefined): id is string =>
		id !== undefined && tabs.some((tab) => tab.id === id);
	const [held, setHeld] = useState(known(defaultId) ? defaultId : first);
	const wanted = selectedId ?? held;
	const current = known(wanted) ? wanted : first;
	const [live, setLive] = useState(false);
	// The element to land on once its tab is the open one.
	const [pendingScroll, setPendingScroll] = useState<{ tab: string; target: string } | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const Heading = `h${headingLevel}` as const;

	const select = (id: string) => {
		if (selectedId === undefined) setHeld(id);
		if (id !== current) onSelect?.(id);
	};

	// Opens what a hash names: a tab by its id, or the panel holding an element,
	// and lands on the tab row or the element. A new hash drops any landing
	// still waiting on a tab the caller never opened.
	const route = (hash: string) => {
		setPendingScroll(null);
		let name: string;
		try {
			name = decodeURIComponent(hash.replace(/^#/, ""));
		} catch {
			return;
		}
		if (!name) return;
		const named = tabs.find((tab) => [tab.id, tabId(tab.id), panelId(tab.id)].includes(name));
		if (named) {
			select(named.id);
			setPendingScroll({ tab: named.id, target: tabId(named.id) });
			return;
		}
		const el = elementIn(rootRef.current, name);
		const holder = el && tabHolding(rootRef.current, tabs, el);
		if (!holder) return;
		select(holder);
		setPendingScroll({ tab: holder, target: name });
	};

	// The listeners below are bound once, so they read the latest route here.
	const routeRef = useRef(route);
	routeRef.current = route;
	const tabsRef = useRef(tabs);
	tabsRef.current = tabs;
	const selectRef = useRef(select);
	selectRef.current = select;

	useEffect(() => {
		setLive(true);
		routeRef.current(window.location.hash);
		const onHashChange = () => routeRef.current(window.location.hash);
		// A link to the hash already in the address bar fires no hashchange.
		const onClick = (event: MouseEvent) => {
			const link = (event.target as Element | null)?.closest?.("a[href^='#']");
			if (link instanceof HTMLAnchorElement && link.hash === window.location.hash)
				routeRef.current(link.hash);
		};
		// Find in page, or a fragment, revealed an inactive panel.
		const onBeforeMatch = (event: Event) => {
			const holder =
				event.target instanceof Element &&
				tabHolding(rootRef.current, tabsRef.current, event.target);
			if (holder) selectRef.current(holder);
		};
		const root = rootRef.current;
		window.addEventListener("hashchange", onHashChange);
		document.addEventListener("click", onClick);
		root?.addEventListener("beforematch", onBeforeMatch);
		return () => {
			window.removeEventListener("hashchange", onHashChange);
			document.removeEventListener("click", onClick);
			root?.removeEventListener("beforematch", onBeforeMatch);
		};
	}, []);

	// Inactive panels are hidden until found; React holds `hidden` as a
	// boolean, so the browser's own value is set here.
	useEffect(() => {
		for (const tab of tabs) {
			const panel = panelIn(rootRef.current, tab.id);
			if (!panel) continue;
			if (tab.id === current) panel.removeAttribute("hidden");
			else panel.setAttribute("hidden", "until-found");
		}
	}, [current, tabs]);

	// Once the tab the hash named is open, scroll to its row or its element.
	useEffect(() => {
		if (!pendingScroll || pendingScroll.tab !== current) return;
		elementIn(rootRef.current, pendingScroll.target)?.scrollIntoView?.();
		setPendingScroll(null);
	}, [current, pendingScroll]);

	return (
		<RadixTabs.Root
			ref={rootRef}
			className={["tabs", live && "is-live", className].filter(Boolean).join(" ")}
			value={current}
			onValueChange={select}
		>
			<RadixTabs.List className="tabs-list" aria-label={ariaLabel}>
				{tabs.map((tab) => (
					<RadixTabs.Trigger
						key={tab.id}
						value={tab.id}
						className="tabs-tab"
						id={tabId(tab.id)}
						aria-controls={panelId(tab.id)}
					>
						{tab.label}
					</RadixTabs.Trigger>
				))}
			</RadixTabs.List>
			{tabs.map((tab) => (
				<RadixTabs.Content
					key={tab.id}
					value={tab.id}
					className="tabs-panel"
					id={panelId(tab.id)}
					aria-labelledby={tabId(tab.id)}
					forceMount
					// A panel hidden until found still draws its own box, so only the
					// open one takes a stop in the tab order.
					tabIndex={tab.id === current ? 0 : -1}
				>
					<Heading className="tabs-print-heading">{tab.label}</Heading>
					{tab.content}
				</RadixTabs.Content>
			))}
		</RadixTabs.Root>
	);
}
