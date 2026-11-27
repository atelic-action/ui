import { Check, ChevronDown, Link2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import { useOpenHeight } from "../lib/useOpenHeight";
import { useWithBase } from "../routing/BasePathProvider";

export interface FAQCTA {
	label: string;
	href: string;
	newTab?: boolean;
}

/** One question in a list: what `FAQList` and `FAQBrowser` both draw as a row. */
export interface FAQListItem {
	/** Stable slug; the row's `id`, so `#<id>` opens it and its address can be shared. */
	id: string;
	question: string;
	answer: ReactNode;
	/** Optional link rendered at the end of the open answer. */
	cta?: FAQCTA;
}

/** The words a row's controls are named by, each with a neutral default. */
export interface FAQRowLabels {
	/** The link button's name. Defaults to "Copy link to this question". */
	linkLabel?: string;
	/** Its name for a moment after the link is copied. Defaults to "Link copied". */
	copiedLabel?: string;
	/** The chevron's name while closed. Defaults to "Expand answer". */
	expandLabel?: string;
	/** The chevron's name while open. Defaults to "Collapse answer". */
	collapseLabel?: string;
}

export function FAQCTALink({ cta, className }: { cta: FAQCTA; className?: string }) {
	const withBase = useWithBase();
	return (
		<a className={className} href={withBase(cta.href)} {...newTabProps(cta.href, cta.newTab)}>
			{cta.label} <span className="arrow">→</span>
		</a>
	);
}

/**
 * The one question row: the question as the fold's control, a link button
 * that copies the address of the question (`#<id>`), and the chevron. The
 * answer stays in the HTML while closed, `inert`, so a search engine reads
 * it and its links leave the tab order. Internal to the package; `FAQList`
 * and `FAQBrowser` both draw their rows with it.
 */
export function FAQRow({
	item,
	open,
	copied,
	onToggle,
	onCopy,
	linkLabel = "Copy link to this question",
	copiedLabel = "Link copied",
	expandLabel = "Expand answer",
	collapseLabel = "Collapse answer",
}: {
	item: FAQListItem;
	open: boolean;
	copied: boolean;
	onToggle: () => void;
	onCopy: () => void;
} & FAQRowLabels) {
	const { ref, maxHeight } = useOpenHeight(open);

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
						aria-label={copied ? copiedLabel : linkLabel}
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
						aria-label={open ? collapseLabel : expandLabel}
						aria-expanded={open}
						onClick={onToggle}
					>
						<ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
					</button>
				</div>
			</div>
			{/* Closed, the answer stays in the HTML for crawlers but is inert, so
			    its links are out of the tab order and out of a screen reader's
			    reach while it is clipped to nothing. */}
			<div className="faq-row-a" style={{ maxHeight }} inert={!open}>
				<div className="faq-row-a-inner" ref={ref}>
					{item.answer}
					{item.cta && <FAQCTALink cta={item.cta} className="faq-answer-cta" />}
				</div>
			</div>
		</div>
	);
}

/**
 * Which question's link was just copied, for the moment its button says so.
 * Copy only: updating the address here would trip a router's scroll handling.
 */
export function useCopiedLink() {
	const [copiedID, setCopiedID] = useState<string | null>(null);
	const copy = useCallback((id: string) => {
		const url = `${window.location.origin}${window.location.pathname}#${id}`;
		navigator.clipboard?.writeText(url).catch(() => {});
		setCopiedID(id);
		window.setTimeout(() => setCopiedID((current) => (current === id ? null : current)), 1600);
	}, []);
	return { copiedID, copy } as const;
}

export interface FAQListProps extends FAQRowLabels {
	/** The questions, in order. */
	items: FAQListItem[];
	id?: string;
	className?: string;
}

/**
 * A list of questions that fold open, with no numbers: each row the
 * question, a link button that copies the question's address, and the
 * chevron. The answers stay in the page while closed. Arriving at, or
 * following a link to, `#<id>` opens that question and scrolls it into view.
 * The rows are `FAQBrowser`'s own, so the help page and a short list of
 * questions on any page read alike.
 */
export function FAQList({ items, id, className, ...labels }: FAQListProps) {
	const [openIDs, setOpenIDs] = useState<Set<string>>(new Set());
	const { copiedID, copy } = useCopiedLink();

	useEffect(() => {
		const openFromHash = () => {
			const target = window.location.hash.slice(1);
			if (!target || !items.some((item) => item.id === target)) return;
			setOpenIDs((prev) => new Set(prev).add(target));
			requestAnimationFrame(() => {
				document.getElementById(target)?.scrollIntoView({ block: "center" });
			});
		};
		openFromHash();
		window.addEventListener("hashchange", openFromHash);
		return () => window.removeEventListener("hashchange", openFromHash);
	}, [items]);

	function toggle(itemID: string) {
		setOpenIDs((prev) => {
			const next = new Set(prev);
			if (next.has(itemID)) next.delete(itemID);
			else next.add(itemID);
			return next;
		});
	}

	return (
		<div className={["faq-group", className].filter(Boolean).join(" ")} id={id}>
			{items.map((item) => (
				<FAQRow
					key={item.id}
					item={item}
					open={openIDs.has(item.id)}
					copied={copiedID === item.id}
					onToggle={() => toggle(item.id)}
					onCopy={() => copy(item.id)}
					{...labels}
				/>
			))}
		</div>
	);
}
