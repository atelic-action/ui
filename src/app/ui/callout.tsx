import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface CalloutProps {
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
}

export function Callout({ icon, children, className }: CalloutProps) {
	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground",
				className,
			)}
		>
			{icon && <span className="mt-0.5 shrink-0">{icon}</span>}
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
