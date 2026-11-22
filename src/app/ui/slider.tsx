import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "../lib/utils";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	/**
	 * One accessible name per thumb, in value order, for a range slider whose
	 * thumbs mean different things ("Fewest", "Most"). A thumb with no entry
	 * takes the slider's own `aria-label` or `aria-labelledby`.
	 */
	thumbLabels?: string[];
}

/**
 * A slider with one thumb per value. The thumb is the `slider` a reader
 * reaches, so the name given to `Slider` (`aria-label` or `aria-labelledby`)
 * lands on each thumb rather than on the root, where nothing reads it.
 */
const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
	(
		{
			className,
			thumbLabels,
			"aria-label": ariaLabel,
			"aria-labelledby": ariaLabelledBy,
			value,
			defaultValue,
			min = 0,
			...props
		},
		ref,
	) => {
		const count = Math.max(1, (value ?? defaultValue ?? [min]).length);
		return (
			<SliderPrimitive.Root
				ref={ref}
				value={value}
				defaultValue={defaultValue}
				min={min}
				className={cn("relative flex w-full touch-none select-none items-center", className)}
				{...props}
			>
				<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
					<SliderPrimitive.Range className="absolute h-full bg-primary" />
				</SliderPrimitive.Track>
				{Array.from({ length: count }, (_, index) => {
					const own = thumbLabels?.[index];
					return (
						<SliderPrimitive.Thumb
							// biome-ignore lint/suspicious/noArrayIndexKey: a thumb's position is its identity
							key={index}
							aria-label={own ?? ariaLabel}
							aria-labelledby={own ? undefined : ariaLabelledBy}
							className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
						/>
					);
				})}
			</SliderPrimitive.Root>
		);
	},
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
