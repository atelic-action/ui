import { cn } from "../lib/utils";
import { Button } from "./button";

interface PaginationProps {
	/** Current page, 1-indexed. */
	page: number;
	/** Total number of pages. */
	totalPages: number;
	/** Called with the requested page when a control is clicked. */
	onPageChange: (page: number) => void;
	className?: string;
}

type PageItem = { type: "page"; value: number } | { type: "gap"; key: string };

/**
 * Windowed page list: always shows the first and last page plus the current
 * page and its neighbors, eliding the rest with gaps. Keeps the control compact
 * as the page count grows.
 */
function pageWindow(page: number, totalPages: number): PageItem[] {
	const wanted = [1, totalPages, page, page - 1, page + 1];
	const nums = [...new Set(wanted)].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

	const items: PageItem[] = [];
	let prev = 0;
	let gapId = 0;
	for (const value of nums) {
		if (value - prev > 1) {
			items.push({ type: "gap", key: `gap-${gapId++}` });
		}
		items.push({ type: "page", value });
		prev = value;
	}
	return items;
}

/**
 * Numbered pagination control. Renders nothing for a single page. Purely
 * presentational: the caller owns the page state and slices its own data.
 */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<nav
			aria-label="Pagination"
			className={cn("mt-8 flex flex-wrap items-center justify-center gap-1", className)}
		>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				aria-label="Previous page"
			>
				Prev
			</Button>

			{pageWindow(page, totalPages).map((item) =>
				item.type === "gap" ? (
					<span key={item.key} className="px-2 text-muted-foreground" aria-hidden="true">
						...
					</span>
				) : (
					<Button
						key={item.value}
						variant={item.value === page ? "default" : "outline"}
						size="sm"
						onClick={() => onPageChange(item.value)}
						aria-label={`Page ${item.value}`}
						aria-current={item.value === page ? "page" : undefined}
					>
						{item.value}
					</Button>
				),
			)}

			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(page + 1)}
				disabled={page >= totalPages}
				aria-label="Next page"
			>
				Next
			</Button>
		</nav>
	);
}
