import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, RefreshCw } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { expect, fn, screen, within } from "storybook/test";
import { AppPage, AppPageToolbar, type ToolbarFilter } from "../../src/app";
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../src/app/ui";
import { pin } from "../support/viewports";
import { layerOpened, until } from "./layers";

type ToolbarProps = ComponentProps<typeof AppPageToolbar>;

/** The toolbar on its page, with the search and the filters held in state as an app does. */
function OnAPage({
	initialSearch = "",
	withFilters = true,
	onSearch,
	onFilter,
	...props
}: ToolbarProps & {
	initialSearch?: string;
	withFilters?: boolean;
	onSearch?: (value: string) => void;
	onFilter?: (value: string) => void;
}) {
	const [query, setQuery] = useState(initialSearch);
	const [status, setStatus] = useState("all");
	const filters: ToolbarFilter[] = withFilters
		? [
				{
					value: status,
					onChange: (value) => {
						setStatus(value);
						onFilter?.(value);
					},
					ariaLabel: "Order status",
					options: [
						{ value: "all", label: "All", count: 13 },
						{ value: "proofing", label: "Proofing", count: 2 },
						{ value: "out", label: "Out for delivery", count: 11 },
					],
				},
			]
		: [];
	return (
		<AppPage title="Orders">
			<AppPageToolbar
				search={{
					value: query,
					onChange: (value) => {
						setQuery(value);
						onSearch?.(value);
					},
					placeholder: "Search orders",
				}}
				filters={filters}
				{...props}
			/>
			<p className="px-6 lg:px-9">Showing orders matching “{query}”.</p>
		</AppPage>
	);
}

/**
 * The page's calm tool row: a search box with a clear button, filter
 * dropdowns carrying live counts, and action buttons (ghost or solid, a
 * button or a router link). An optional notice sits in the row on a desktop,
 * after the search and the actions, and under the search on a phone; it is
 * a plain block, never a live region, since a ticking progress line would
 * be announced on every tick.
 */
const meta = {
	title: "App/AppPageToolbar",
	component: AppPageToolbar,
	render: (args) => <OnAPage {...args} />,
	args: {
		actions: [
			{ label: "Sync", icon: <RefreshCw size={16} aria-hidden="true" />, onClick: fn() },
			{
				label: "New order",
				icon: <Plus size={16} aria-hidden="true" />,
				variant: "solid",
				to: "/orders/new",
			},
		],
	},
	globals: pin("desktop"),
} satisfies Meta<ComponentProps<typeof OnAPage>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search, one filter, and two actions on one row on a desktop. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const search = canvas.getByRole("searchbox", { name: "Search orders" });
		const sync = canvas.getByRole("button", { name: "Sync" });
		await expect(
			Math.abs(search.getBoundingClientRect().top - sync.getBoundingClientRect().top),
		).toBeLessThan(16);
		await expect(canvas.getByRole("link", { name: "New order" })).toHaveAttribute(
			"href",
			"/orders/new",
		);
		await expect(canvas.getByRole("combobox", { name: "Order status" })).toHaveTextContent(
			"All · 13",
		);
		// No clear button until there is something to clear.
		await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();
	},
};

/**
 * An action with its trailing time, the last sync. The button is named by
 * the words it shows, the time included, so a voice user can say what they
 * see.
 */
export const ActionWithTime: Story = {
	args: {
		withFilters: false,
		actions: [
			{
				label: "Sync",
				icon: <RefreshCw size={16} aria-hidden="true" />,
				ago: "06:02",
				onClick: fn(),
			},
		],
	},
	play: async ({ canvas }) => {
		const sync = canvas.getByRole("button", { name: "Sync 06:02" });
		await expect(sync).not.toHaveAttribute("aria-label");
		await expect(sync).toHaveTextContent("Sync06:02");
		await expect(canvas.getByText("06:02")).toBeVisible();
	},
};

/** Typing searches, and the clear button empties the box by click. */
export const SearchAndClear: Story = {
	args: { onSearch: fn() },
	play: async ({ canvas, userEvent, step }) => {
		const search = canvas.getByRole("searchbox", { name: "Search orders" });
		await step("typing reaches the page", async () => {
			await userEvent.type(search, "rye");
			await expect(canvas.getByText("Showing orders matching “rye”.")).toBeVisible();
		});
		await step("the clear button empties it and goes away", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));
			await expect(search).toHaveValue("");
			await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();
		});
	},
};

/**
 * Clearing from the keyboard: Tab to the clear button and press Enter. The
 * button removes itself, and focus lands back in the search box.
 */
export const ClearByKeyboard: Story = {
	args: { initialSearch: "rye" },
	play: async ({ canvas, userEvent }) => {
		const search = canvas.getByRole("searchbox", { name: "Search orders" });
		search.focus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Clear search" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(search).toHaveValue("");
		await expect(search).toHaveFocus();
	},
};

/** A filter opens on its options with their counts, and picking one reports it. */
export const PickAFilter: Story = {
	args: { onFilter: fn() },
	play: async ({ canvas, args, userEvent }) => {
		const filter = canvas.getByRole("combobox", { name: "Order status" });
		await userEvent.click(filter);
		const listbox = within(await layerOpened(() => screen.getByRole("listbox")));
		await userEvent.click(listbox.getByRole("option", { name: "Proofing · 2" }));
		await until(() => expect(filter).toHaveTextContent("Proofing · 2"));
		await expect(args.onFilter).toHaveBeenCalledWith("proofing");
		await until(() => expect(filter).toHaveFocus());
	},
};

/** A ghost action calls its handler; a disabled one takes no click. */
export const Actions: Story = {
	args: {
		withFilters: false,
		actions: [
			{ label: "Sync", icon: <RefreshCw size={16} aria-hidden="true" />, onClick: fn() },
			{ label: "Export", onClick: fn(), disabled: true },
			{
				ariaLabel: "New order",
				icon: <Plus size={16} aria-hidden="true" />,
				variant: "solid",
				onClick: fn(),
			},
		],
	},
	play: async ({ canvas, args, userEvent }) => {
		const [sync, exporting, create] = args.actions ?? [];
		await userEvent.click(canvas.getByRole("button", { name: "Sync" }));
		await expect(sync?.onClick).toHaveBeenCalledOnce();
		const exportButton = canvas.getByRole("button", { name: "Export" });
		await expect(exportButton).toBeDisabled();
		exportButton.click();
		await expect(exporting?.onClick).not.toHaveBeenCalled();
		// An icon only action is named by its aria label.
		await userEvent.click(canvas.getByRole("button", { name: "New order" }));
		await expect(create?.onClick).toHaveBeenCalledOnce();
	},
};

/** An action may be any node, such as a control wrapped in a tooltip. */
export const NodeAction: Story = {
	args: {
		withFilters: false,
		actions: [
			{
				ariaLabel: "Print labels",
				node: (
					<TooltipProvider>
						<Tooltip delayDuration={0}>
							<TooltipTrigger asChild>
								<Button variant="outline" size="sm">
									Print labels
								</Button>
							</TooltipTrigger>
							<TooltipContent>Prints one label per tray.</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				),
			},
		],
	},
	play: async ({ canvas, userEvent }) => {
		const print = canvas.getByRole("button", { name: "Print labels" });
		await userEvent.hover(print);
		await until(() =>
			expect(screen.getByRole("tooltip")).toHaveTextContent("Prints one label per tray."),
		);
		await expect(print).toHaveAccessibleDescription("Prints one label per tray.");
	},
};

/**
 * The notice is a plain block, not a live region, so its ticks are never
 * announced. On a desktop the tools are one wrapping row, and the notice
 * sits in it beside the search and the actions, before the filter.
 */
export const WithNotice: Story = {
	args: { notice: "Synced 40 of 120 orders…" },
	play: async ({ canvas }) => {
		const notice = canvas.getByText("Synced 40 of 120 orders…");
		await expect(
			notice.closest("[aria-live], [role=status], [role=log], [role=alert], output"),
		).toBeNull();
		await expect(canvas.queryByRole("status")).toBeNull();
		const search = canvas.getByRole("searchbox", { name: "Search orders" }).getBoundingClientRect();
		const sync = canvas.getByRole("button", { name: "Sync" }).getBoundingClientRect();
		const box = notice.getBoundingClientRect();
		// On the search's line, after the actions.
		await expect(box.top).toBeLessThan(search.bottom);
		await expect(box.bottom).toBeGreaterThan(search.top);
		await expect(box.left).toBeGreaterThanOrEqual(sync.right);
	},
};

/**
 * On a phone the row stacks: the notice under the search, the filter under
 * the notice at the full width, and nothing scrolls sideways.
 */
export const Phone: Story = {
	args: { notice: "Synced 40 of 120 orders…" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const search = canvas.getByRole("searchbox", { name: "Search orders" });
		const filter = canvas.getByRole("combobox", { name: "Order status" });
		const notice = canvas.getByText("Synced 40 of 120 orders…");
		await expect(notice.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			search.getBoundingClientRect().bottom,
		);
		await expect(filter.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			notice.getBoundingClientRect().bottom,
		);
		await expect(filter.getBoundingClientRect().width).toBeGreaterThan(window.innerWidth / 2);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** Search alone: no filters and no actions. */
export const SearchOnly: Story = {
	args: { actions: [], withFilters: false },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("searchbox", { name: "Search orders" })).toBeVisible();
		await expect(canvas.queryByRole("combobox")).toBeNull();
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};
