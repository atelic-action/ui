import { BookOpen, ClipboardList, Croissant, House, Truck } from "lucide-react";
import type { AppConfig, NavItem } from "../../src/app";

/*
 * The fictional bakery's ops app every app story runs in, the way an app's
 * src/app/config.ts reads. Nothing is fetched: the api host is a reserved
 * example domain and the decorator's query client never retries.
 */
export const storyAppConfig: AppConfig = {
	name: "Crumb & Co.",
	mark: "crumb",
	storagePrefix: "storybook-crumb",
	publicRoutes: ["/"],
	publicPages: ["/u/*"],
	apiBaseURL: "https://api.example.test",
};

export const storyAppNav: NavItem[] = [
	{ label: "Home", href: "/", icon: House },
	{
		label: "Orders",
		href: "/orders",
		icon: ClipboardList,
		children: [
			{ label: "Today", href: "/orders", icon: ClipboardList, blurb: "Every order due out today." },
			{
				label: "Wholesale",
				href: "/orders/wholesale",
				icon: Truck,
				blurb: "The cafes on a standing order.",
			},
		],
	},
	{
		label: "Bakes",
		href: "/bakes",
		icon: Croissant,
		children: [
			{
				label: "Recipes",
				href: "/bakes/recipes",
				icon: BookOpen,
				blurb: "The formulas, scaled by the batch.",
			},
		],
	},
];
