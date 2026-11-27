import { Search, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useWithBase } from "../routing/BasePathProvider";
import { type FAQCTA, FAQCTALink, type FAQListItem, FAQRow, useCopiedLink } from "./FAQList";
import { JumpRail } from "./JumpRail";
import { PageHero } from "./PageHero";

export type { FAQCTA };

export interface FAQEntry extends FAQListItem {
	/** Stable slug; doubles as the deep-link anchor, e.g. "do-you-take-insurance". */
	id: string;
	/** Plain-text answer for search matching and FAQPage structured data. */
	answerText: string;
}

export interface FAQCategory {
	/** Stable slug; doubles as the section anchor. */
	id: string;
	title: string;
	/** Short label for the sticky tab bar; falls back to title. */
	tabLabel?: string;
	description?: string;
	/** Optional link line rendered under the category's card group. */
	cta?: FAQCTA;
	items: FAQEntry[];
}

export interface FAQBrowserProps {
	hero: { eyebrow?: string; title: ReactNode; lead?: ReactNode };
	categories: FAQCategory[];
	searchPlaceholder?: string;
	browseAllLabel?: string;
	/** Where the no match line sends a reader to ask instead. Defaults to "/contact". */
	contactHref?: string;
}

function matches(query: string, item: FAQEntry): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return item.question.toLowerCase().includes(q) || item.answerText.toLowerCase().includes(q);
}

/**
 * The full FAQ page organism: centered help hero with live search, a sticky
 * category tab bar with scroll spy, and per-category card groups with
 * expand-all, back-to-top, and per-question deep links. Search hides
 * non-matching questions and empty categories.
 */
export function FAQBrowser({
	hero,
	categories,
	searchPlaceholder = "Search questions or keywords",
	browseAllLabel = "Browse all questions ↓",
	contactHref = "/contact",
}: FAQBrowserProps) {
	const withBase = useWithBase();
	const [query, setQuery] = useState("");
	const [openIds, setOpenIds] = useState<Set<string>>(new Set());
	const { copiedID, copy: copyLink } = useCopiedLink();

	const filtered = useMemo(() => {
		const withMatches = categories.map((cat) => ({
			...cat,
			items: cat.items.filter((item) => matches(query, item)),
		}));
		return query.trim() ? withMatches.filter((cat) => cat.items.length > 0) : withMatches;
	}, [categories, query]);

	// Deep link: #<item-id> opens and scrolls to that question on load.
	useEffect(() => {
		const id = window.location.hash.slice(1);
		if (!id) return;
		const target = categories.flatMap((c) => c.items).find((item) => item.id === id);
		if (!target) return;
		setOpenIds((prev) => new Set(prev).add(id));
		requestAnimationFrame(() => {
			document.getElementById(id)?.scrollIntoView({ block: "center" });
		});
	}, [categories]);

	// Clearing the search removes the clear button, and the focus it held
	// would fall to the page; it goes back to the field it cleared instead.
	const searchRef = useRef<HTMLInputElement>(null);
	function clearSearch() {
		setQuery("");
		searchRef.current?.focus();
	}

	function toggle(id: string) {
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleAll(cat: FAQCategory) {
		const allOpen = cat.items.every((item) => openIds.has(item.id));
		setOpenIds((prev) => {
			const next = new Set(prev);
			for (const item of cat.items) {
				if (allOpen) next.delete(item.id);
				else next.add(item.id);
			}
			return next;
		});
	}

	return (
		<>
			<PageHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead}>
				{/* The find block centers on its own reading width under the
				    left-aligned page header: search pill, browse-all beneath it. */}
				<div className="faq-find">
					<div className="faq-search">
						<Search size={18} strokeWidth={1.6} aria-hidden="true" />
						<input
							ref={searchRef}
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={searchPlaceholder}
							aria-label="Search questions"
						/>
						{query && (
							<button
								type="button"
								className="faq-search-clear"
								aria-label="Clear search"
								onClick={clearSearch}
							>
								<X size={16} strokeWidth={2} aria-hidden="true" />
							</button>
						)}
					</div>
					{/* The first category the page renders, which a search may have
					    hidden the first one of; with nothing matching, no link. */}
					{browseAllLabel && filtered[0] && (
						<a className="faq-browse-all" href={`#cat-${filtered[0].id}`}>
							{browseAllLabel}
						</a>
					)}
				</div>
			</PageHero>

			<JumpRail
				ariaLabel="Question categories"
				items={filtered.map((cat) => ({
					id: `cat-${cat.id}`,
					label: cat.tabLabel ?? cat.title,
				}))}
			/>

			<div className="faq-cats">
				{filtered.map((cat) => {
					const allOpen = cat.items.length > 0 && cat.items.every((item) => openIds.has(item.id));
					return (
						<section className="faq-cat" id={`cat-${cat.id}`} key={cat.id}>
							<div className="wrap">
								<h2>{cat.title}</h2>
								<div className="faq-cat-head">
									{cat.description && <p className="faq-cat-desc">{cat.description}</p>}
									<div className="faq-utils">
										<button type="button" className="faq-util" onClick={() => toggleAll(cat)}>
											{allOpen ? "Collapse all" : "Expand all"}
										</button>
										<button
											type="button"
											className="faq-util"
											onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
										>
											Back to top ↑
										</button>
									</div>
								</div>
								<div className="faq-group">
									{cat.items.map((item) => (
										<FAQRow
											key={item.id}
											item={item}
											open={openIds.has(item.id)}
											copied={copiedID === item.id}
											onToggle={() => toggle(item.id)}
											onCopy={() => copyLink(item.id)}
										/>
									))}
								</div>
								{cat.cta && <FAQCTALink cta={cat.cta} className="faq-cat-cta" />}
							</div>
						</section>
					);
				})}
				{query.trim() && filtered.length === 0 && (
					<div className="wrap faq-empty">
						<p>
							No questions match "{query.trim()}". Try another word, or{" "}
							<a href={withBase(contactHref)}>reach out directly</a>. We're happy to help.
						</p>
					</div>
				)}
			</div>
		</>
	);
}
