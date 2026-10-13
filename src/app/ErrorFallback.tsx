import { Button } from "./ui/button";

export interface ErrorFallbackProps {
	error: unknown;
	resetError: () => void;
	/**
	 * Show the error's message under the apology. The package reads no
	 * environment, so an app passes `import.meta.env.DEV` here to see it while
	 * developing and never in production.
	 */
	showDetails?: boolean;
}

/**
 * Fallback UI displayed when an error boundary catches an error.
 * Provides user feedback and a way to recover.
 */
export function ErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
	const errorMessage = error instanceof Error ? error.message : "Unknown error";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="max-w-md text-center">
				<h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					An unexpected error occurred. Please try again.
				</p>
				{showDetails && (
					<pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-3 text-left text-xs text-muted-foreground">
						{errorMessage}
					</pre>
				)}
				<Button onClick={resetError} className="mt-6">
					Try Again
				</Button>
			</div>
		</div>
	);
}
