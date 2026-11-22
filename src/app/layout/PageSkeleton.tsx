import { Card, CardContent, CardHeader } from "../ui/card";

interface PageSkeletonProps {
	/** Show header skeleton with title and subtitle */
	showHeader?: boolean;
	/** Show action button skeleton in header */
	showHeaderAction?: boolean;
	/** Number of card skeletons to show */
	cardCount?: number;
	/** Layout for cards: single column, two columns, or grid */
	cardLayout?: "single" | "two-column" | "grid";
	/** Additional className */
	className?: string;
	/** The words a screen reader hears while the page loads, visually hidden. Defaults to "Loading". */
	label?: string;
}

/**
 * Standardized loading skeleton for pages.
 * Provides consistent loading states across the application. The blocks are
 * hidden from a screen reader, which hears the busy region's `label` instead,
 * and the pulse stops for a reader who asks for reduced motion.
 */
export function PageSkeleton({
	showHeader = true,
	showHeaderAction = false,
	cardCount = 3,
	cardLayout = "single",
	className,
	label = "Loading",
}: PageSkeletonProps) {
	const gridClasses = {
		single: "space-y-6",
		"two-column": "grid grid-cols-1 gap-6 lg:grid-cols-2",
		grid: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
	};

	return (
		<div aria-busy="true" className={className}>
			<span className="sr-only">{label}</span>
			<div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
				{showHeader && (
					<div className="mb-6 sm:mb-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-2">
								<div className="h-8 w-48 rounded bg-muted sm:h-9" />
								<div className="h-4 w-64 rounded bg-muted sm:h-5" />
							</div>
							{showHeaderAction && <div className="h-10 w-32 rounded bg-muted" />}
						</div>
					</div>
				)}

				<div className={gridClasses[cardLayout]}>
					{Array.from({ length: cardCount }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items never reorder
						<Card key={i}>
							<CardHeader>
								<div className="h-6 w-2/3 rounded bg-muted" />
								<div className="h-4 w-1/2 rounded bg-muted" />
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="h-4 w-full rounded bg-muted" />
								<div className="h-4 w-3/4 rounded bg-muted" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
