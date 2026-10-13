import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";

interface FormActionButtonsProps {
	/** Submit handler (if not using form submission) */
	onSave?: () => void;
	/** Cancel handler */
	onCancel: () => void;
	/** Loading/submitting state */
	isLoading?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** Save button text */
	saveText?: string;
	/** Cancel button text */
	cancelText?: string;
	/** Additional className for the container */
	className?: string;
	/** Whether to show the cancel button */
	showCancel?: boolean;
}

/**
 * Standardized form action buttons for save/cancel operations.
 * Responsive layout that stacks on mobile.
 */
export function FormActionButtons({
	onSave,
	onCancel,
	isLoading = false,
	disabled = false,
	saveText = "Save",
	cancelText = "Cancel",
	className,
	showCancel = true,
}: FormActionButtonsProps) {
	return (
		<div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}>
			{showCancel && (
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					{cancelText}
				</Button>
			)}
			<Button
				type={onSave ? "button" : "submit"}
				variant="default"
				disabled={disabled || isLoading}
				onClick={onSave}
				className="w-full sm:w-auto"
			>
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Saving...
					</>
				) : (
					saveText
				)}
			</Button>
		</div>
	);
}
