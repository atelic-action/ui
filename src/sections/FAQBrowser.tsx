import { Check, ChevronDown, Link2, Search, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import { useWithBase } from "../routing/BasePathProvider";
import { JumpRail } from "./JumpRail";
import { PageHero } from "./PageHero";

export interface FAQCta {
	label: string;
	href: string;
	newTab?: boolean;
}

export interface FAQEntry {
	/** Stable slug; doubles as the deep-link anchor, e.g. "do-you-take-insurance". */
	id: string;
	question: string;
	answer: ReactNode;
	/** Plain-text answer for search matching and FAQPage structured data. */
	answerText: string;
	/** Optional link rendered at the end of the open answer. */
	cta?: FAQCta;
}

export interface FAQCategory {
	/** Stable slug; doubles as the section anchor. */
	id: string;
	title: string;
	/** Short label for the sticky tab bar; falls back to title. */
	tabLabel?: string;
	description?: string;
	/** Optional link line rendered under the category's card group. */
	cta?: FAQCta;
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

function CTALink({ cta, className }: { cta: FAQCta; className?: string }) {
	const withBase = useWithBase();
	return (
		<a className={className} href={withBase(cta.href)} {...newTabProps(cta.href, cta.newTab)}>
			{cta.label} <span className="arrow">→</span>
		</a>
	);
}

function FAQRow({
	item,
	open,
	copied,
	onToggle,
	onCopy,
}: {
	item: FAQEntry;
	open: boolean;
	copied: boolean;
	onToggle: () => void;
	onCopy: () => void;
}) {
	const answerRef = useRef<HTMLDivElement>(null);

	return (
		<div className={["faq-row", open && "open"].filter(Boolean).join(" ")} id={item.id}>
			<div className="faq-row-head">
				<button type="button" className="faq-row-q" aria-expanded={open} onClick={onToggle}>
					{item.question}
				</button>
				<div className="faq-row-icons">
					<button
						type="button"
						className={["faq-icon-btn", "faq-link-btn", copied && "copied"]
							.filter(Boolean)
							.join(" ")}
						aria-label={copied ? "Link copied" : "Copy link to this question"}
						onClick={onCopy}
					>
						{copied ? (
							<Check size={16} strokeWidth={2} aria-hidden="true" />
						) : (
							<Link2 size={16} strokeWidth={1.6} aria-hidden="true" />
						)}
					</button>
					<button
						type="button"
						className="faq-icon-btn faq-chevron"
						aria-label={open ? "Collapse answer" : "Expand answer"}
						aria-expanded={open}
						onClick={onToggle}
					>
						<ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
					</button>
				</div>
			</div>
			<div
				className="faq-row-a"
				ref={answerRef}
				style={{ maxHeight: open ? (answerRef.current?.scrollHeight ?? 0) : 0 }}
			>
				<div className="faq-row-a-inner">
					{item.answer}
					{item.cta && <CTALink cta={item.cta} className="faq-answer-cta" />}
				</div>
			</div>
		</div>
	);
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
	const [copiedId, setCopiedId] = useState<string | null>(null);

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

	function toggle(id: string) {
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	// Copy only — updating the URL here would trip the router's scroll handling.
	function copyLink(id: string) {
		const url = `${window.location.origin}${window.location.pathname}#${id}`;
		navigator.clipboard?.writeText(url).catch(() => {});
		setCopiedId(id);
		window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
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
								onClick={() => setQuery("")}
							>
								<X size={16} strokeWidth={2} aria-hidden="true" />
							</button>
						)}
					</div>
					{browseAllLabel && categories[0] && (
						<a className="faq-browse-all" href={`#cat-${categories[0].id}`}>
							{browseAllLabel}
						</a>
					)}
				</div>
			</PageHero>

			<JumpRail
				ariaLabel="Question categories"
				items={categories.map((cat) => ({
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
											copied={copiedId === item.id}
											onToggle={() => toggle(item.id)}
											onCopy={() => copyLink(item.id)}
										/>
									))}
								</div>
								{cat.cta && <CTALink cta={cat.cta} className="faq-cat-cta" />}
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
