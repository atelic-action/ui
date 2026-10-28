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

// The list's own panel for a tab, never another list's that shares the id.
function panelIn(root: HTMLElement | null, id: string) {
	const panel = document.getElementById(panelId(id));
	return panel && root?.contains(panel) ? panel : null;
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
	const [held, setHeld] = useState(defaultId ?? tabs[0]?.id ?? "");
	const current = selectedId ?? held;
	const [live, setLive] = useState(false);
	const [pendingScroll, setPendingScroll] = useState<string | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const Heading = `h${headingLevel}` as const;

	const select = (id: string) => {
		if (selectedId === undefined) setHeld(id);
		if (id !== current) onSelect?.(id);
	};

	// Opens what a hash names: a tab by its id, or the panel holding an element.
	const route = (hash: string) => {
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
			return;
		}
		const el = document.getElementById(name);
		const holder = el && tabHolding(rootRef.current, tabs, el);
		if (!holder) return;
		select(holder);
		setPendingScroll(name);
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

	// Once the panel holding the hash's element shows, scroll to it.
	useEffect(() => {
		if (!pendingScroll) return;
		const el = document.getElementById(pendingScroll);
		if (!el) {
			setPendingScroll(null);
			return;
		}
		if (tabHolding(rootRef.current, tabs, el) !== current) return;
		el.scrollIntoView?.();
		setPendingScroll(null);
	}, [current, pendingScroll, tabs]);

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
