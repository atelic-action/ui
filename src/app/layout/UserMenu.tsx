import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useAppConfig } from "../context/AppContext";
import { cn } from "../lib/utils";
import type { AppUser } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { avatarInitials, displayName } from "./identity";

interface UserMenuProps {
	user: AppUser | null;
	onLogout: () => void;
	/** Icon only, for the collapsed desktop rail. */
	collapsed?: boolean;
}

/**
 * The signed in user's block at the foot of the desktop rail: avatar and name
 * opening a small menu with Profile and Log out. Collapsed, it is the avatar
 * alone with the name in a tooltip.
 */
export function UserMenu({ user, onLogout, collapsed = false }: UserMenuProps) {
	const profileHref = useAppConfig().profileHref ?? "/profile";
	const [open, setOpen] = useState(false);
	const name = displayName(user);
	const initials = avatarInitials(name);

	const avatar = (
		<Avatar className="h-9 w-9 border border-border/40 flex-shrink-0">
			<AvatarImage src={user?.avatar ?? undefined} alt={name} />
			<AvatarFallback className="text-sm">{initials}</AvatarFallback>
		</Avatar>
	);

	const trigger = collapsed ? (
		<Button
			variant="ghost"
			size="sm"
			className="w-full p-2 hover:bg-accent"
			aria-label="User menu"
			aria-expanded={open}
			aria-haspopup="true"
		>
			{avatar}
		</Button>
	) : (
		<Button
			variant="ghost"
			className="w-full justify-between px-3 py-2.5 h-auto hover:bg-accent overflow-hidden"
			aria-label="User menu"
			aria-expanded={open}
			aria-haspopup="true"
		>
			<div className="flex items-center space-x-3 min-w-0">
				{avatar}
				<span className="text-sm font-medium truncate">{name}</span>
			</div>
			<ChevronDown
				className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
			/>
		</Button>
	);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			{collapsed ? (
				<TooltipProvider>
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent side="right" className="font-medium text-sm">
							<p>{name}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : (
				<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			)}
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem asChild>
					<Link to={profileHref} className="cursor-pointer">
						<UserIcon className="mr-2 h-4 w-4" />
						<span>Profile</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
					<LogOut className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
