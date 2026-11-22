import { Component, type ReactNode } from "react";
import { reportError } from "../monitoring/catcher";
import { ErrorFallback } from "./ErrorFallback";

interface AppErrorBoundaryState {
	error: unknown;
	hasError: boolean;
}

/**
 * Plain React error boundary rendering the dependency free ErrorFallback, so
 * no Sentry code sits in the critical bundle. A render crash it catches
 * never reaches the window's error handlers (React keeps it), so it hands
 * the error to the package's error reporting itself (`reportError`): to the
 * Sentry SDK once `startErrorReporting` has loaded it, and to the early
 * catcher's buffer before that, which the SDK replays when it arrives. With
 * no DSN configured the buffer simply holds it and nothing is sent.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
	state: AppErrorBoundaryState = { error: null, hasError: false };

	static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
		return { error, hasError: true };
	}

	componentDidCatch(error: unknown) {
		reportError(error, "boundary");
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
