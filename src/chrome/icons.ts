import {
	Calculator,
	CalendarDays,
	CircleHelp,
	CirclePlay,
	ClipboardList,
	CreditCard,
	FileText,
	House,
	type LucideIcon,
	Mail,
	Map as MapIcon,
	MapPin,
	MessageCircle,
	Phone,
	Shield,
	Star,
	Truck,
	Users,
	Wrench,
} from "lucide-react";
import type { ContactDockIcon, NavIcon } from "../types";

/** The lucide icon each name in `NavIcon` draws, in a mega menu panel's icon rows. */
export const navIcons: Record<NavIcon, LucideIcon> = {
	calculator: Calculator,
	calendar: CalendarDays,
	card: CreditCard,
	chat: MessageCircle,
	document: FileText,
	help: CircleHelp,
	home: House,
	mail: Mail,
	map: MapIcon,
	phone: Phone,
	pin: MapPin,
	play: CirclePlay,
	shield: Shield,
	star: Star,
	tool: Wrench,
	truck: Truck,
	users: Users,
};

/**
 * The icon each name in `ContactDockIcon` draws, the same glyphs as the
 * panel's where the names meet. The dock's `map` is the pin, since a dock
 * item leads to a place, and its `form` is the clipboard.
 */
export const dockIcons: Record<ContactDockIcon, LucideIcon> = {
	chat: navIcons.chat,
	phone: navIcons.phone,
	calendar: navIcons.calendar,
	mail: navIcons.mail,
	form: ClipboardList,
	calculator: navIcons.calculator,
	map: navIcons.pin,
};
