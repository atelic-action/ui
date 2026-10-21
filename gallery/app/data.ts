import {
	BookOpen,
	CalendarClock,
	ClipboardList,
	Croissant,
	House,
	LayoutGrid,
	ShieldCheck,
	Truck,
} from "lucide-react";
import type { AppConfig, AppUser, NavItem } from "../../src/app";

/** A fictional bakery's ops app, the way an app's src/app/config.ts reads. */
export const appConfig: AppConfig = {
	name: "Crumb & Co.",
	mark: "crumb",
	storagePrefix: "gallery-crumb",
	publicRoutes: ["/"],
	publicPages: ["/u/*"],
	// Nothing is fetched: the gallery seeds the signed in user into the cache.
	apiBaseURL: "https://api.example.test",
};

export const navItems: NavItem[] = [
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
				label: "Schedule",
				href: "/bakes",
				icon: CalendarClock,
				blurb: "What goes in the oven, and when.",
			},
			{
				label: "Recipes",
				href: "/bakes/recipes",
				icon: BookOpen,
				blurb: "The formulas, scaled by the batch.",
			},
		],
	},
	{ label: "Kit", href: "/kit", icon: LayoutGrid },
	{ label: "States", href: "/states", icon: ShieldCheck },
];

export const demoUser: AppUser = {
	id: "u_rosa",
	email: "rosa@crumb.example",
	firstName: "Rosa",
	lastName: "Delgado",
	username: "rosa",
	avatar: null,
};

export type OrderStatus = "proofing" | "baking" | "packed" | "out";

export interface Order {
	id: string;
	customer: string;
	items: string;
	due: string;
	status: OrderStatus;
	wholesale: boolean;
}

export const orders: Order[] = [
	{
		id: "o1",
		customer: "Juniper Street Cafe",
		items: "48 croissants, 24 pain au chocolat",
		due: "06:30",
		status: "packed",
		wholesale: true,
	},
	{
		id: "o2",
		customer: "Marisol Ortega",
		items: "One olive oil cake, candles",
		due: "09:00",
		status: "baking",
		wholesale: false,
	},
	{
		id: "o3",
		customer: "The Larkspur",
		items: "12 country loaves, 6 baguettes",
		due: "10:15",
		status: "proofing",
		wholesale: true,
	},
	{
		id: "o4",
		customer: "Dev Okafor",
		items: "Two dozen morning buns",
		due: "11:00",
		status: "out",
		wholesale: false,
	},
	{
		id: "o5",
		customer: "Fern & Finch",
		items: "30 cardamom knots",
		due: "13:30",
		status: "proofing",
		wholesale: true,
	},
];

export const statusLabel: Record<OrderStatus, string> = {
	proofing: "Proofing",
	baking: "In the oven",
	packed: "Packed",
	out: "Out the door",
};

export const bakes = [
	{ name: "Croissant dough", start: "03:00", progress: 100 },
	{ name: "Country loaves", start: "04:30", progress: 72 },
	{ name: "Cardamom knots", start: "07:00", progress: 35 },
	{ name: "Olive oil cakes", start: "08:15", progress: 10 },
];

export const recipes = [
	{ name: "Country loaf", yield: "12 loaves", hydration: "78%" },
	{ name: "Croissant", yield: "96 pieces", hydration: "54%" },
	{ name: "Cardamom knot", yield: "40 knots", hydration: "62%" },
];
