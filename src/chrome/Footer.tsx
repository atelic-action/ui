import { Mail, Star, UserRound } from "lucide-react";
import {
	type ComponentProps,
	type CSSProperties,
	type ForwardedRef,
	forwardRef,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { newTabProps } from "../lib/newTabProps";
import { EmailLink } from "../primitives/EmailLink";
import { PhoneLink } from "../primitives/PhoneLink";
import type {
	Brand,
	FooterColumn,
	FooterColumnLink,
	FooterHoursPlacement,
	HoursRow,
	Phone,
	PostalAddress,
} from "../types";
import { LockupParts, LogoTile, lockupWords } from "./BrandLockup";
import { resolveMark, tintClass } from "./brandMark";
import { ClosingBar } from "./ClosingBar";
import { Copyright } from "./Copyright";

/*
 * lucide-react ships no brand marks (removed upstream by policy), and a code
 * glyph standing in for GitHub or a briefcase for LinkedIn misleads the
 * reader. These are the brands' own simple marks, carried by hand as a
 * considered exception to the lucide only rule; like lucide icons they take
 * currentColor and a size prop.
 */
type MarkProps = { size?: number } & ComponentProps<"svg">;

function GitHubMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
			{...rest}
		>
			<path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
		</svg>
	);
}

function LinkedInMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="currentColor"
			{...rest}
		>
			<path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.1h4.56V23H.22V8.1zM8.34 8.1h4.37v2.03h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 6.99V23h-4.55v-7.28c0-1.74-.03-3.97-2.42-3.97-2.42 0-2.79 1.89-2.79 3.84V23H8.34V8.1z" />
		</svg>
	);
}

function FacebookMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
		</svg>
	);
}

function InstagramMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01" />
		</svg>
	);
}

function YouTubeMark({ size = 18, ...rest }: MarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.75}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		>
			<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17 M10 15l5-3-5-3z" />
		</svg>
	);
}

const LINK_ICONS = {
	facebook: FacebookMark,
	github: GitHubMark,
	instagram: InstagramMark,
	linkedin: LinkedInMark,
	mail: Mail,
	star: Star,
	user: UserRound,
	youtube: YouTubeMark,
} as const;

function ColumnLink({ link }: { link: FooterColumnLink }) {
	const Icon = link.icon ? LINK_ICONS[link.icon] : null;
	return (
		<a href={link.href} {...newTabProps(link.href, link.external)}>
			{Icon && <Icon aria-hidden size={18} />}
			{link.label}
		</a>
	);
}

const STARS = [1, 2, 3, 4, 5];

export interface FooterProps {
	/** The identity at the head of the brand column. */
	brand: Brand;
	/**
	 * The Google rating as printed, e.g. "4.8 on Google". It sits under the
	 * logo beside five stars, which are hidden from assistive technology, so
	 * the line is named by these words. Plain text unless `ratingHref` is given.
	 */
	rating?: string;
	/**
	 * Where the rating links: the business's Google profile, where the
	 * reviews are. Given, the whole line (the stars and the words) is one
	 * link, opening in a new tab as the address does.
	 */
	ratingHref?: string;
	/**
	 * The rating link's accessible name, when it should say more than the
	 * words shown, e.g. "4.8 on Google, opens the Google profile". Defaults
	 * to `rating`.
	 */
	ratingLabel?: string;
	/**
	 * The one address, the headquarters. Omit it for a business with no
	 * storefront, and the phone and email stand alone.
	 */
	address?: PostalAddress;
	/** Where the address links: the business's Google profile. */
	addressHref?: string;
	phone?: Phone;
	email?: string;
	/**
	 * The opening hours, already formatted by the site (`SiteShell` formats
	 * the config's `hours`): each row's days and its range, under the brand
	 * column's address by default (see `hoursPlacement`). Optional, and left
	 * out when empty.
	 */
	hours?: HoursRow[];
	/** The hours column's heading. Defaults to "Hours". */
	hoursHeading?: string;
	/**
	 * Where the hours sit: `brand` (the default, 8.8.0) sets them inside the
	 * brand column, under the address, the phone, and the email, as a compact
	 * list of two columns under a small label, so the link columns keep the
	 * row's room; `column` is a column of their own beside the link columns.
	 */
	hoursPlacement?: FooterHoursPlacement;
	/**
	 * The link columns beside the brand column. The default footer carries
	 * four: Company, Resources, Social, and Legal. A column with no links is
	 * left out.
	 */
	columns?: FooterColumn[];
	/** Suffix on the copyright line, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/** The site's own words for the closing bar's right side, in place of the practice's credit. */
	note?: string;
	/**
	 * The practice's credit on the closing bar's right side. Defaults on; off
	 * leaves the right side empty unless the site gives a note. The copyright
	 * prints either way.
	 */
	credit?: boolean;
	/**
	 * The level of the link columns' headings. Defaults to 2: the footer is a
	 * landmark beside the page's main content, so its sections sit one level
	 * under the page's `h1` whatever the page's own outline ends on, and a
	 * page never skips a level into its footer. A site whose footer sits
	 * inside a deeper outline passes its own.
	 */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** The gap between two link columns in the box, as chrome.css sets it. */
const LINK_GAP = 24;

/**
 * How many link columns sit across the box: all of them when every column
 * at the wider of its floor and the widest column's real width fits the
 * box's width with the gaps between, else two, so four columns are only
 * ever four across or two by two. Two or fewer always sit across.
 */
export function linkColumnsFor({
	box,
	widest,
	floor,
	count,
}: {
	/** The box's used width, in pixels, fractions kept. */
	box: number;
	/** The widest column's max-content width, in pixels. */
	widest: number;
	/** Each column's floor: ten of its link text's size, in pixels. */
	floor: number;
	count: number;
}): number {
	if (count <= 2) return count;
	const column = Math.max(widest, floor);
	return count * column + (count - 1) * LINK_GAP <= box ? count : 2;
}

/** The gap between the brand column and the link box when all the columns sit beside it, as chrome.css sets it. */
const BRAND_GAP = 24;

/**
 * The gaps when the columns sit two by two beside the brand (9.10.0): the
 * footer grid's own 32px between the brand and the box, as every other
 * footer sets between its brand and its columns, and inside the box the
 * phone footer's 40px between the rows and 32px between the two columns,
 * the gaps the footer already pairs its columns with.
 */
const BRAND_GAP_TWO = 32;
const LINK_GAP_TWO = 32;

/**
 * Where the link columns sit against the brand column: `beside`, every
 * column across beside the brand; `beside-two`, two by two beside it; and
 * `stacked`, the brand on a row of its own with the columns under it.
 */
export type FooterLayout = "beside" | "beside-two" | "stacked";

/**
 * The footer's layout with the hours in the brand column, from real widths:
 * every column beside the brand when the brand at its own width, the gap,
 * and every column at the wider of its floor and the widest column fit the
 * row; else two by two beside the brand when that fits (9.10.0); else the
 * brand takes a row of its own, with the columns under it every one across
 * when they fit the row and two by two when they do not. Discrete, so the
 * columns are never three and a lone fourth, and the brand never sits
 * beside some of them.
 */
export function footerLayoutFor({
	row,
	brand,
	widest,
	floor,
	count,
}: {
	/** The row's content width, in pixels, fractions kept. */
	row: number;
	/** The brand column's own width with nothing to wrap it. */
	brand: number;
	/** The widest link column's max-content width. */
	widest: number;
	/** Each column's floor: ten of its link text's size. */
	floor: number;
	count: number;
}): { layout: FooterLayout; columns: number } {
	const column = Math.max(widest, floor);
	const across = (columns: number) => columns * column + (columns - 1) * LINK_GAP;
	if (brand + BRAND_GAP + across(count) <= row) return { layout: "beside", columns: count };
	if (count > 2 && brand + BRAND_GAP_TWO + 2 * column + LINK_GAP_TWO <= row) {
		return { layout: "beside-two", columns: 2 };
	}
	return { layout: "stacked", columns: linkColumnsFor({ box: row, widest, floor, count }) };
}

/** A measure of the footer: the widest column, the columns across, and the layout. */
export interface LinkColumnsMeasure {
	widest: number;
	columns: number;
	layout: FooterLayout;
}

/**
 * Measures the link box inside a footer and decides its columns. Every
 * column is set to max-content first, then every width is read, then every
 * column is handed back its own style, so the read costs one layout, before
 * anything paints. The widths are used widths (`getComputedStyle`), fractions
 * kept, which a transform on an ancestor (a scaled preview, an animation)
 * leaves as they are. Null when the box has no width to read yet (no layout,
 * or a page with no footer box), so nothing is decided on a guess.
 */
export function measureLinkColumns(footer: Element): LinkColumnsMeasure | null {
	const box = footer.querySelector<HTMLElement>(".footer-links");
	const grid = box?.parentElement;
	const brand = grid?.querySelector<HTMLElement>(":scope > .footer-brand");
	const view = footer.ownerDocument.defaultView;
	if (!box || !grid || !brand || !view) return null;
	const width = (element: Element) => Number.parseFloat(view.getComputedStyle(element).width);
	const gridStyle = view.getComputedStyle(grid);
	const row =
		Number.parseFloat(gridStyle.width) -
		(gridStyle.boxSizing === "border-box"
			? Number.parseFloat(gridStyle.paddingLeft) + Number.parseFloat(gridStyle.paddingRight)
			: 0);
	const columns = Array.from(box.querySelectorAll<HTMLElement>(":scope > .footer-column"));
	const link = box.querySelector("a") ?? box;
	const floor = 10 * Number.parseFloat(view.getComputedStyle(link).fontSize);
	// Every piece at its own width at once, read, then handed back.
	const pieces = [brand, ...columns];
	const kept = pieces.map(({ style }) => ({
		width: style.width,
		flex: style.flex,
		minWidth: style.minWidth,
	}));
	for (const { style } of pieces) {
		style.flex = "none";
		style.minWidth = "0";
		style.width = "max-content";
	}
	const brandWidth = width(brand);
	const widths = columns.map(width);
	pieces.forEach(({ style }, at) => {
		const own = kept[at];
		if (!own) return;
		style.width = own.width;
		style.flex = own.flex;
		style.minWidth = own.minWidth;
	});
	if (
		!(row > 0) ||
		!Number.isFinite(floor) ||
		!Number.isFinite(brandWidth) ||
		!widths.every(Number.isFinite)
	) {
		return null;
	}
	const widest = Math.max(0, ...widths);
	return {
		widest,
		...footerLayoutFor({ row, brand: brandWidth, widest, floor, count: columns.length }),
	};
}

// Before paint on the client, so the first frame already has the measured
// columns; the prerender has no layout to read and runs a plain effect.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The link box's measure, taken on the client while the hours sit in the
 * brand column, and again whenever the footer or the box changes size, the
 * fonts finish loading, or the columns or their labels change. Null before
 * the first measure, so the prerender and the first paint keep the
 * stylesheet's own choice.
 */
function useLinkColumns(active: boolean, labels: string) {
	const [measure, setMeasure] = useState<LinkColumnsMeasure | null>(null);
	// The footer element, held in a ref rather than state, so handing it over
	// renders nothing again.
	const footerRef = useRef<HTMLElement | null>(null);
	const setFooter = useCallback((element: HTMLElement | null) => {
		footerRef.current = element;
	}, []);
	// The labels are the trigger; the measure reads the DOM they drew.
	useBeforePaint(() => {
		const footer = footerRef.current;
		if (!active || !footer) return;
		const run = () => {
			const next = measureLinkColumns(footer);
			if (!next) return;
			setMeasure((was) =>
				was &&
				was.widest === next.widest &&
				was.columns === next.columns &&
				was.layout === next.layout
					? was
					: next,
			);
		};
		run();
		// A resize is measured on the next frame, never inside the observer's
		// own callback: the measure's choice can resize the box it observes,
		// and a size changed inside the callback is the loop the browser
		// reports ("ResizeObserver loop completed with undelivered
		// notifications"). Several in one frame make one measure.
		let frame = 0;
		const later = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				run();
			});
		};
		const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(later);
		sizes?.observe(footer);
		const box = footer.querySelector(".footer-links");
		if (box) sizes?.observe(box);
		let live = true;
		document.fonts?.ready.then(() => live && later()).catch(() => {});
		return () => {
			live = false;
			if (frame) cancelAnimationFrame(frame);
			sizes?.disconnect();
		};
	}, [active, labels]);
	return { measure: active ? measure : null, setFooter };
}

/**
 * Hands the footer element to the caller's ref and to the footer's own
 * measure. A callback ref that returns a cleanup (React 19) has it called on
 * detach, in place of a call with null, as React would itself.
 */
function useBothRefs(outer: ForwardedRef<HTMLElement>, own: (element: HTMLElement | null) => void) {
	const cleanupRef = useRef<(() => void) | undefined>(undefined);
	// Made again when either ref changes, so React detaches the one it
	// replaces and attaches the new one.
	return useCallback(
		(element: HTMLElement | null) => {
			own(element);
			if (typeof outer === "function") {
				if (element) {
					const returned: unknown = outer(element);
					cleanupRef.current =
						typeof returned === "function" ? (returned as () => void) : undefined;
				} else {
					const cleanup = cleanupRef.current;
					cleanupRef.current = undefined;
					if (cleanup) cleanup();
					else outer(null);
				}
			} else if (outer) {
				outer.current = element;
			}
		},
		[own, outer],
	);
}

/**
 * The site footer: a brand column (the logo, the Google rating, the address
 * linked to the Google profile, the phone, and the email), the hours when the
 * site gives them, the link columns beside it, and the closing bar under it
 * all. The logo is the header's lockup: the mark with the wordmark beside it,
 * or the mark alone when `logo.wordmark` is false.
 *
 * Its `ref` reaches the footer element, for a caller that measures it
 * (`SiteShell` hands it to the contact dock). It is forwarded rather than
 * read as a prop, so a React 18 host, which strips `ref` from a plain
 * function component's props, still delivers it.
 */
export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
	{
		brand,
		rating,
		ratingHref,
		ratingLabel,
		address,
		addressHref,
		phone,
		email,
		hours,
		hoursHeading = "Hours",
		hoursPlacement = "brand",
		columns,
		attribution,
		note,
		credit = true,
		headingLevel = 2,
	},
	ref,
) {
	const { name, logo } = brand;
	// The footer always names the business beside a glyph tile.
	const wordmark = logo?.wordmark === false ? name : (logo?.wordmark ?? name);
	// The band is a dark surface, resolved by the order the header uses.
	const mark = resolveMark(logo, "dark");
	const shown = (columns ?? []).filter((column) => column.links.length > 0);
	const hoursGiven = hours && hours.length > 0 ? hours : null;
	// The hours inside the brand column, or as a column of their own.
	// Any value but "column" (a typo, a value from a later version) takes the
	// default, the brand column.
	const inBrand = hoursPlacement !== "column";
	const hoursShown = inBrand ? null : hoursGiven;
	const hoursInBrand = inBrand ? hoursGiven : null;
	const hoursList = (rows: HoursRow[]) => (
		<dl>
			{rows.map((row, at) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: two rows may share a label (a split day), so the place keeps the key unique; rows never reorder
				<div key={`${at} ${row.label}`}>
					<dt>{row.label}</dt>
					<dd>{row.range}</dd>
				</div>
			))}
		</dl>
	);
	// With the hours in the brand column the link columns share one box, so
	// the row is the brand column and that box: the two sit side by side or
	// each takes a row, and the box alone decides four across or two by two
	// (chrome.css). Anywhere else, and on a phone, the columns stand in the
	// grid as they always have. With no link column there is no box, so it
	// takes no gap in the row (9.7.0).
	const linkBox = Boolean(hoursInBrand) && shown.length > 0;
	const wrapLinks = (links: ReactNode) =>
		linkBox ? (
			<div className="footer-links" data-link-columns={measure?.columns}>
				{links}
			</div>
		) : (
			links
		);
	// Before the client measures, the stylesheet chooses four across or two
	// by two as it always has. Once measured, the box's floor holds the
	// widest column's real width and the measure's own choice is set on the
	// box, which the stylesheet sets as exactly a quarter or exactly a half,
	// so a fourth column is never left alone. The labels drawn start the
	// measure again when they change.
	const labels = linkBox
		? JSON.stringify(
				shown.map((column) => [column.heading, column.links.map((link) => link.label)]),
			)
		: "";
	const { measure, setFooter } = useLinkColumns(linkBox, labels);
	const footerRef = useBothRefs(ref, setFooter);
	const gridStyle = linkBox
		? ({
				"--_link-count": shown.length,
				...(measure &&
					measure.widest > 0 && {
						"--_link-floor": `max(calc(10 * var(--footer-link-size)), ${measure.widest}px)`,
					}),
			} as CSSProperties)
		: undefined;
	const stars = (
		<span className="footer-stars" aria-hidden="true">
			{STARS.map((star) => (
				<Star key={star} size={16} fill="currentColor" />
			))}
		</span>
	);
	const addressLines = address && (
		<>
			{/* A business that publishes a service area but no storefront leaves
			    street empty; a blank line reads as a broken block. */}
			{address.street && <span>{address.street}</span>}
			<span>
				{address.locality}, {address.region}
				{address.postalCode ? ` ${address.postalCode}` : ""}
			</span>
		</>
	);

	return (
		<>
			<footer ref={footerRef} className="footer">
				<div className="wrap">
					<div
						className={[
							"footer-grid",
							hoursShown && "has-hours",
							// Two across, the hours span the row only beside an even count of
							// link columns, so no cell is left alone (chrome.css, the footer).
							hoursShown && shown.length % 2 === 0 && "has-even-columns",
							hoursInBrand && "has-brand-hours",
						]
							.filter(Boolean)
							.join(" ")}
						// The link columns drawn, which the brand placement's floors are
						// measured for (chrome.css), so two or three columns keep the
						// brand column beside them as long as theirs fit, and the widest
						// column's measured width once there is one.
						style={gridStyle}
						// The measure's layout (9.10.0): every column beside the brand,
						// two by two beside it, or the brand on a row of its own.
						data-footer-layout={measure?.layout}
					>
						<div className="footer-brand">
							{logo?.tile ? (
								<p className="footer-wordmark">
									<LogoTile glyph={logo.tile} />
									{wordmark}
									{logo.run && <span className="wordmark-run" aria-hidden="true" />}
								</p>
							) : mark && lockupWords(name, logo) === null ? (
								// Artwork that already spells the name stands alone, named by its alt.
								<img className={tintClass(mark)} src={mark.src} alt={logo?.alt ?? name} />
							) : (
								// The header's lockup on the dark band: the mark with the wordmark
								// beside it, or the words alone when there is no image.
								<p className={mark ? "footer-wordmark footer-lockup" : "footer-wordmark"}>
									<LockupParts name={name} logo={logo} surface="dark" />
								</p>
							)}
							{rating &&
								(ratingHref ? (
									<p className="footer-rating">
										<a
											className="footer-rating-link"
											href={ratingHref}
											aria-label={ratingLabel}
											{...newTabProps(ratingHref, true)}
										>
											{stars}
											{rating}
										</a>
									</p>
								) : (
									<p className="footer-rating">
										{stars}
										{rating}
									</p>
								))}
							{(address || phone || email) && (
								<address className="nap">
									{address &&
										(addressHref ? (
											<a
												className="nap-address"
												href={addressHref}
												{...newTabProps(addressHref, true)}
											>
												{addressLines}
											</a>
										) : (
											<span className="nap-address">{addressLines}</span>
										))}
									{phone && <PhoneLink phone={phone} />}
									{email && <EmailLink email={email} />}
								</address>
							)}
							{hoursInBrand && (
								<div className="footer-brand-hours">
									{/* biome-ignore lint/a11y/useSemanticElements: a heading by role, as the link columns' are (see below) */}
									<div className="footer-heading" role="heading" aria-level={headingLevel}>
										{hoursHeading}
									</div>
									{hoursList(hoursInBrand)}
								</div>
							)}
						</div>
						{hoursShown && (
							<div className="footer-column footer-hours">
								{/* biome-ignore lint/a11y/useSemanticElements: a heading by role, as the link columns' are (see below) */}
								<div className="footer-heading" role="heading" aria-level={headingLevel}>
									{hoursHeading}
								</div>
								{hoursList(hoursShown)}
							</div>
						)}
						{wrapLinks(
							shown.map((column) => (
								<nav key={column.heading} className="footer-column" aria-label={column.heading}>
									{/* A heading by role rather than by element: a site's own bare
								    h2 rule (unlayered, so it beats any rule in the package's
								    layer whatever its weight) is written for a page's section
								    titles and would restyle these small labels. A div that says
								    it is a heading keeps the outline and matches no such rule. */}
									{/* biome-ignore lint/a11y/useSemanticElements: an h2 element would take a site's bare h2 rules, see above */}
									<div className="footer-heading" role="heading" aria-level={headingLevel}>
										{column.heading}
									</div>
									{column.links.map((link, at) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: two links may share a label and a page, so the place keeps the key unique; links never reorder
										<ColumnLink key={at} link={link} />
									))}
								</nav>
							)),
						)}
					</div>
				</div>
			</footer>
			<ClosingBar
				left={<Copyright name={name} attribution={attribution} />}
				right={note ?? (credit ? undefined : null)}
			/>
		</>
	);
});
Footer.displayName = "Footer";
