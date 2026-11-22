import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "../lib/utils";

/**
 * A bar filled to `value` out of `max` (100 by default). The value reaches the
 * Radix root, so the `progressbar` reports it (`aria-valuenow`); a bar with no
 * value, or a null one, is indeterminate, reports none, and draws empty. A
 * value past either end is held at that end (Radix reads one outside 0 to
 * `max` as no value at all, so 120 of 100 would say indeterminate).
 */
const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
		indicatorClassName?: string;
	}
>(({ className, value, max, indicatorClassName, ...props }, ref) => {
	const ceiling = max ?? 100;
	const held = value == null ? null : Math.min(Math.max(value, 0), Math.max(ceiling, 0));
	const share = held == null || ceiling <= 0 ? 0 : (held / ceiling) * 100;
	return (
		<ProgressPrimitive.Root
			ref={ref}
			value={held}
			max={max}
			className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
				style={{ transform: `translateX(-${100 - share}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
