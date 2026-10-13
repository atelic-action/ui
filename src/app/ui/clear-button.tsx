import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

export interface ClearButtonProps {
	onClick?: () => void;
	stopPropagation?: boolean;
	"aria-label"?: string;
	className?: string;
}

export function ClearButton({
	className,
	onClick,
	stopPropagation = false,
	"aria-label": ariaLabel = "Clear",
}: ClearButtonProps) {
	const handleClick = React.useCallback(
		(e: React.MouseEvent) => {
			if (stopPropagation) {
				e.stopPropagation();
			}
			onClick?.();
		},
		[onClick, stopPropagation],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onMouseDown={(e) => e.preventDefault()}
			className={cn(
				"inline-flex cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
				className,
			)}
			aria-label={ariaLabel}
		>
			<X className="h-4 w-4" />
		</button>
	);
}
