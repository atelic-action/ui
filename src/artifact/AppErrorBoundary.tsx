import { Component, type ReactNode } from "react";

import { ErrorFallback } from "./ErrorFallback";

interface AppErrorBoundaryState {
	error: unknown;
	hasError: boolean;
}

/**
 * Plain React error boundary rendering the dependency-free ErrorFallback.
 * Replaces Sentry.ErrorBoundary so @sentry/react stays out of the critical
 * bundle: on PSI-class hardware the SDK's hydration cost ran ahead of first
 * paint and Google clocked the page as seconds slower than it is. When a
 * DSN is configured, Sentry's global handlers (attached by the lazy init in
 * router.tsx) still capture errors, including ones caught here.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
	state: AppErrorBoundaryState = { error: null, hasError: false };

	static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
		return { error, hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return (
				<ErrorFallback
					error={this.state.error}
					resetError={() => this.setState({ error: null, hasError: false })}
				/>
			);
		}
		return this.props.children;
	}
}
