import type { DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

const Command = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		ref={ref}
		className={cn(
			"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
			className,
		)}
		{...props}
	/>
));
Command.displayName = CommandPrimitive.displayName;

export interface CommandDialogProps extends DialogProps {
	/** The dialog's name, which a screen reader announces as it opens. Defaults to "Commands". */
	title?: string;
	/** Show the title above the search. Hidden by default, still read. */
	showTitle?: boolean;
}

/**
 * The command palette in a dialog. It is opened by state (a shortcut, a
 * button's handler) rather than a trigger of its own, so it remembers what
 * had focus as it opens and hands focus back there as it closes, which
 * Radix does only for a `DialogTrigger`.
 */
const CommandDialog = ({
	children,
	title = "Commands",
	showTitle = false,
	...props
}: CommandDialogProps) => {
	const returnTo = React.useRef<HTMLElement | null>(null);
	return (
		<Dialog {...props}>
			<DialogContent
				aria-describedby={undefined}
				className="overflow-hidden p-0 shadow-lg"
				onOpenAutoFocus={() => {
					const active = document.activeElement;
					returnTo.current =
						active instanceof HTMLElement && active !== document.body ? active : null;
				}}
				onCloseAutoFocus={(event) => {
					const target = returnTo.current;
					returnTo.current = null;
					if (target?.isConnected) {
						event.preventDefault();
						target.focus();
					}
				}}
			>
				<DialogTitle className={showTitle ? "px-4 pt-4 text-base" : "sr-only"}>{title}</DialogTitle>
				<Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
};

const CommandInput = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
	<div className="flex items-center border-b px-3" cmdk-input-wrapper="">
		<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
		<CommandPrimitive.Input
			ref={ref}
			className={cn(
				"flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	</div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		ref={ref}
		className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
		{...props}
	/>
));

CommandList.displayName = CommandPrimitive.List.displayName;

/**
 * The line shown when nothing matches. It sits inside the list, which is a
 * listbox and may hold only options, so it is drawn as one disabled option
 * rather than cmdk's presentational block: a reader hears "No results" as the
 * list's one entry instead of an empty list.
 */
const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const empty = useCommandState((state) => state.filtered.count === 0);
		if (!empty) return null;
		return (
			// biome-ignore lint/a11y/useFocusableInteractive: the list moves its highlight by aria-activedescendant, and this option is disabled
			<div
				ref={ref}
				cmdk-empty=""
				role="option"
				aria-disabled="true"
				aria-selected="false"
				className={cn("py-6 text-center text-sm", className)}
				{...props}
			/>
		);
	},
);

CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Group>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
			className,
		)}
		{...props}
	/>
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

/**
 * A rule between groups, hidden while a search is typed (as cmdk's own is)
 * unless `alwaysRender`. It is drawn with no role, since the list it sits in
 * is a listbox and may hold only options and groups; a rule is decoration.
 */
const CommandSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { alwaysRender?: boolean }
>(({ className, alwaysRender = false, ...props }, ref) => {
	const idle = useCommandState((state) => !state.search);
	if (!alwaysRender && !idle) return null;
	return (
		<div
			ref={ref}
			cmdk-separator=""
			role="none"
			className={cn("-mx-1 h-px bg-border", className)}
			{...props}
		/>
	);
});
CommandSeparator.displayName = "CommandSeparator";

const CommandItem = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
			className,
		)}
		{...props}
	/>
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
			{...props}
		/>
	);
};
CommandShortcut.displayName = "CommandShortcut";

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
};
