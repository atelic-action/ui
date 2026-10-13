import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
}

export class CardErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("CardErrorBoundary caught:", error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				<Card className="border-destructive/30">
					<CardContent className="py-6 text-center text-sm text-muted-foreground">
						Unable to display this item
					</CardContent>
				</Card>
			);
		}

		return this.props.children;
	}
}
