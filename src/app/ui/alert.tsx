import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const alertVariants = cva(
	"relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
	{
		variants: {
			variant: {
				default: "bg-background text-foreground",
				destructive:
					"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface AlertProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof alertVariants> {
	/**
	 * Announce the alert as it appears: "assertive" is `role="alert"`, which
	 * interrupts, and "polite" is `role="status"`, which waits its turn. Unset,
	 * the alert is a plain block read in its place, right for a notice that is
	 * on the page as it loads. A `role` passed directly still wins.
	 */
	announce?: "assertive" | "polite";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant, announce, ...props }, ref) => (
		<div
			ref={ref}
			role={announce === "assertive" ? "alert" : announce === "polite" ? "status" : undefined}
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	),
);
Alert.displayName = "Alert";

type AlertTitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
	/**
	 * Make the title a heading at this level, for an alert that opens a part
	 * of the page. Unset, it is a paragraph styled as a title, since an alert
	 * rarely starts a section and a fixed level skips levels on most pages.
	 */
	level?: AlertTitleLevel;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
	({ className, level, ...props }, ref) => {
		const Tag = (level ? `h${level}` : "p") as "h2" | "p";
		return (
			<Tag
				ref={ref}
				className={cn("mb-1 font-medium leading-none tracking-tight", className)}
				{...props}
			/>
		);
	},
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
