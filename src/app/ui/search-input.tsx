import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { ClearButton } from "./clear-button";
import { Input } from "./input";

export interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
	value: string;
	onValueChange: (value: string) => void;
	onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{ className, value, onValueChange, onClear, onKeyDown, placeholder = "Search...", ...props },
		ref,
	) => {
		const handleClear = React.useCallback(() => {
			onValueChange("");
			onClear?.();
		}, [onValueChange, onClear]);

		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key === "Escape" && value) {
					e.preventDefault();
					handleClear();
				}
				onKeyDown?.(e);
			},
			[value, handleClear, onKeyDown],
		);

		return (
			<div className="relative w-full">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					ref={ref}
					type="text"
					value={value}
					onChange={(e) => onValueChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					// White surface + soft lift so the search bar stands off the warm
					// paper background (--background) rather than blending into it.
					className={cn("bg-card shadow-sm", "pl-10", value ? "pr-10" : "pr-3", className)}
					aria-label="Search"
					{...props}
				/>
				{value && (
					<ClearButton
						onClick={handleClear}
						className="absolute right-3 top-1/2 -translate-y-1/2"
						aria-label="Clear search"
					/>
				)}
			</div>
		);
	},
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
