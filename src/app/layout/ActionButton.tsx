import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";

interface ActionButtonProps {
	/** Lucide icon component */
	icon: LucideIcon;
	/** Button label (visible on larger screens) */
	label: string;
	/** Click handler */
	onClick?: () => void;
	/** Button variant */
	variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
	/** Additional className */
	className?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Loading state */
	loading?: boolean;
	/** Accessible label (defaults to label) */
	"aria-label"?: string;
	/** For use with Link components */
	asChild?: boolean;
	/** Button type */
	type?: "button" | "submit" | "reset";
	/** Children (for asChild usage) */
	children?: React.ReactNode;
}

/**
 * Standardized responsive action button.
 * Shows icon only on mobile, icon + text on larger screens.
 */
export function ActionButton({
	icon: Icon,
	label,
	onClick,
	variant = "outline",
	className,
	disabled,
	loading,
	"aria-label": ariaLabel,
	asChild,
	type = "button",
	children,
}: ActionButtonProps) {
	return (
		<Button
			variant={variant}
			onClick={onClick}
			className={cn("gap-2", className)}
			aria-label={ariaLabel || label}
			disabled={disabled || loading}
			asChild={asChild}
			type={type}
		>
			{asChild ? (
				children
			) : (
				<>
					<Icon className={cn("h-4 w-4 flex-shrink-0", loading && "animate-spin")} />
					<span className="hidden sm:inline">{label}</span>
				</>
			)}
		</Button>
	);
}
