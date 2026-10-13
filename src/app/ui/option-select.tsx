import { cn } from "../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export interface SelectOption {
	value: string;
	label: string;
}

interface OptionSelectProps {
	/** Currently selected option value. Omit (undefined) to show the placeholder. */
	value?: string;
	/** Fired with the newly selected option value. */
	onValueChange: (value: string) => void;
	/** Options to render, in display order. */
	options: SelectOption[];
	/** Accessible name for the trigger (also the combobox name in tests). */
	ariaLabel: string;
	/** Shown when no value matches (value is always set in most filters). */
	placeholder?: string;
	/** Width / layout classes for the trigger; the white surface is baked in. */
	className?: string;
}

/**
 * Thin, reusable wrapper over the Radix Select primitives for the common case:
 * a single-select driven by a flat `options` array. Bakes in the raised white
 * surface used for filters/search so callers only pass width + the options.
 * Reach for the raw Select primitives only when you need grouping, custom item
 * rendering, or anything this does not express.
 *
 * Note: Radix forbids an empty-string option value. For an "all / none" option,
 * use a sentinel value and map it back in the caller's onValueChange.
 */
export function OptionSelect({
	value,
	onValueChange,
	options,
	ariaLabel,
	placeholder,
	className,
}: OptionSelectProps) {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger className={cn("bg-card shadow-sm", className)} aria-label={ariaLabel}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
