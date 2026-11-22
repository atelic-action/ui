import { Component, type ReactNode } from "react";

/**
 * Catches a render crash so a story can assert it happened (inside
 * `knownBug`) instead of the whole story failing to mount. It says what
 * crashed in a plain alert a play function can find by role.
 */
export class CrashBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
	state: { error: Error | null } = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	render() {
		if (this.state.error) return <p role="alert">Crashed: {this.state.error.message}</p>;
		return this.props.children;
	}
}
