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
 * Provides consistent error display across the application.
 */
export function PageError({ message, title = "Error", className }: PageErrorProps) {
	return (
		<Card className={cn("border-destructive/50", className)}>
			<CardContent className="flex items-center gap-3 py-6">
				<AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
				<div>
					<p className="font-medium text-destructive">{title}</p>
					<p className="text-sm text-muted-foreground">{message}</p>
				</div>
			</CardContent>
		</Card>
	);
}
