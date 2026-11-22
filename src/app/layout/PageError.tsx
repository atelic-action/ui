import { AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "../ui/card";

interface PageErrorProps {
	/** Error message to display */
	message: string;
	/** Optional title (defaults to "Error") */
	title?: string;
	/** Additional className */
	className?: string;
}

/**
 * Standardized error state for pages.
 * Provides consistent error display across the application. It is an alert,
 * so a screen reader announces it once as it appears: the reader who started
 * the load hears that it failed. Render it only when the error happens, not
 * ahead of time with its words swapped in.
 */
export function PageError({ message, title = "Error", className }: PageErrorProps) {
	return (
		<Card role="alert" className={cn("border-destructive/50", className)}>
			<CardContent className="flex items-center gap-3 py-6">
				<AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive-ink" aria-hidden="true" />
				<div>
					<p className="font-medium text-destructive-ink">{title}</p>
					<p className="text-sm text-muted-foreground">{message}</p>
				</div>
			</CardContent>
		</Card>
	);
}
