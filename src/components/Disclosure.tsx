import { ChevronDown } from "lucide-react";
import { type ReactNode, useId } from "react";

interface DisclosureBaseProps {
	/** What the section is, and the toggle's accessible name. */
	label: ReactNode;
	className?: string;
	children: ReactNode;
}

/**
 * Held by the caller: an app's section. The caller keeps `open`, so it can
 * remember which sections were folded, and a closed body is not rendered.
 */
export interface DisclosureControlledProps extends DisclosureBaseProps {
	open: boolean;
	onToggle: () => void;
	/**
	 * Sits beside the label and outside the toggle's name: a count, a flag, a
	 * small chart. A tap on it still folds the section.
	 */
	meta?: ReactNode;
	/** Makes the label a real heading at this level; leave it out for none. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** The panel's id; minted when left out. */
	panelId?: string;
	summary?: never;
	defaultOpen?: never;
}

/**
 * Left to the browser: a document's fold. A native details element that keeps
 * its own state and its detail in the page, so it opens before any script
 * loads, find in page opens it, and it prints open.
 */
export interface DisclosureNativeProps extends DisclosureBaseProps {
	/**
	 * What the detail shows, in a sentence, under the label, so a reader who
	 * never opens it still has the point and the detail needs no explaining
	 * once open.
	 */
	summary?: ReactNode;
	/** Open on first render; closed by default. */
	defaultOpen?: boolean;
	open?: never;
	onToggle?: never;
	meta?: never;
	headingLevel?: never;
	panelId?: never;
}

export type DisclosureProps = DisclosureControlledProps | DisclosureNativeProps;

/**
 * A section the reader opens and closes, in one of two forms chosen by
 * whether the caller passes `onToggle`.
 *
 * Controlled (`open` and `onToggle`), it is an app's card: a header row that
 * folds a body the caller holds, and a closed body is not rendered, so a long
 * list costs nothing until asked for. The label is the toggle, so its name
 * reads "Produce, collapsed" and not "Produce 10 items"; `meta` is a sibling
 * for that reason. The toggle's `::after` stretches over the whole header
 * row, so a tap anywhere on it, meta and chevron included, folds the section.
 *
 * Uncontrolled, it is a document's fold: a labeled line over a summary, as a
 * native details element. It opens with a click, a tap, Enter, or Space, works
 * before any script loads, a browser's find in page opens it, and it prints
 * open. The writeup's "more" blocks are this form.
 */
export function Disclosure(props: DisclosureProps) {
	if (props.onToggle) return <ControlledDisclosure {...props} />;
	return <NativeDisclosure {...props} />;
}

function NativeDisclosure({
	label,
	summary,
	defaultOpen,
	className,
	children,
}: DisclosureNativeProps) {
	return (
		<details
			className={["disclosure", "is-native", className].filter(Boolean).join(" ")}
			open={defaultOpen}
		>
			<summary className="disclosure-head">
				<span className="disclosure-text">
					<span className="disclosure-label">{label}</span>
					{summary && <span className="disclosure-summary">{summary}</span>}
				</span>
				<ChevronDown className="disclosure-chevron" size={18} aria-hidden="true" />
			</summary>
			<div className="disclosure-body">{children}</div>
		</details>
	);
}

function ControlledDisclosure({
	label,
	open,
	onToggle,
	meta,
	headingLevel,
	panelId,
	className,
	children,
}: DisclosureControlledProps) {
	const minted = useId();
	const id = panelId ?? minted;
	const Root = headingLevel ? "section" : "div";
	const Title = headingLevel ? (`h${headingLevel}` as const) : "div";

	return (
		<Root className={["disclosure", open && "is-open", className].filter(Boolean).join(" ")}>
			<div className="disclosure-head">
				<Title className="disclosure-title">
					<button
						type="button"
						className="disclosure-toggle"
						onClick={onToggle}
						aria-expanded={open}
						aria-controls={id}
					>
						{label}
					</button>
				</Title>
				{meta != null && meta !== false && <span className="disclosure-meta">{meta}</span>}
				<ChevronDown className="disclosure-chevron" size={16} aria-hidden="true" />
			</div>
			{open && (
				<div className="disclosure-body" id={id}>
					{children}
				</div>
			)}
		</Root>
	);
}
