/// <reference types="vite/client" />

interface ErrorFallbackProps {
	error: unknown;
	resetError: () => void;
}

/**
 * Fallback UI displayed when the error boundary catches a render error.
 * Deliberately dependency-free (inline styles, no component library) so it
 * renders even when the styling pipeline is part of what broke.
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
	const errorMessage = error instanceof Error ? error.message : "Unknown error";

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
				fontFamily: "system-ui, sans-serif",
				textAlign: "center",
			}}
		>
			{/* minWidth lets the card shrink to a phone whatever the message holds. */}
			<div style={{ maxWidth: 420, minWidth: 0 }}>
				<h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
				<p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
					An unexpected error occurred. Please try again.
				</p>
				{import.meta.env.DEV && (
					// The box scrolls when the message is long, so it takes focus and a
					// keyboard can scroll it; the words wrap to its width.
					<pre
						// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region must be focusable to be scrolled by keyboard
						tabIndex={0}
						style={{
							marginTop: 16,
							maxHeight: 160,
							overflow: "auto",
							whiteSpace: "pre-wrap",
							overflowWrap: "anywhere",
							borderRadius: 8,
							background: "#f4f4f4",
							padding: 12,
							textAlign: "left",
							fontSize: 12,
							color: "#666",
						}}
					>
						{errorMessage}
					</pre>
				)}
				<button
					type="button"
					onClick={resetError}
					style={{
						marginTop: 24,
						padding: "10px 22px",
						borderRadius: 999,
						border: "none",
						background: "#222",
						color: "#fff",
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	);
}
