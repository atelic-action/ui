import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";

export interface BadgeItem {
	label: string;
	variant?: BadgeProps["variant"];
	icon?: ReactNode;
}

interface BadgeListProps {
	items: BadgeItem[];
	maxDisplay?: number;
	maxWidth?: string;
	className?: string;
	badgeClassName?: string;
}

export function BadgeList({
	items,
	maxDisplay,
	maxWidth = "max-w-24",
	className,
	badgeClassName,
}: BadgeListProps) {
	if (items.length === 0) return null;

	const displayItems = maxDisplay ? items.slice(0, maxDisplay) : items;
	const remaining = maxDisplay && items.length > maxDisplay ? items.length - maxDisplay : 0;

	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			{displayItems.map((item, index) => (
				<Badge
					// biome-ignore lint/suspicious/noArrayIndexKey: a label may repeat, and the list never reorders
					key={`${item.label}-${index}`}
					variant={item.variant ?? "outline"}
					className={cn("shrink-0 gap-1", maxWidth, badgeClassName)}
				>
					{item.icon}
					<span className="truncate">{item.label}</span>
				</Badge>
			))}
			{remaining > 0 && (
				<Badge variant="outline" className={cn("shrink-0", badgeClassName)}>
					+{remaining}
				</Badge>
			)}
		</div>
	);
}
