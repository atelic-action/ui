import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "../../src/app/ErrorFallback";
import { PageError } from "../../src/app/layout/PageError";
import { PageSkeleton } from "../../src/app/layout/PageSkeleton";
import { Alert, AlertTitle } from "../../src/app/ui/alert";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "../../src/app/ui/command";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../src/app/ui/form";
import { Input } from "../../src/app/ui/input";
import { Pagination } from "../../src/app/ui/pagination";
import { Progress } from "../../src/app/ui/progress";
import { SearchInput } from "../../src/app/ui/search-input";
import { Slider } from "../../src/app/ui/slider";

/*
 * What a screen reader and a keyboard see of the kit: the
 * names and values the stories found missing, and focus that survives a
 * clear.
 */

beforeAll(() => {
	// cmdk measures its list and scrolls its highlight; jsdom has neither.
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
	Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("Progress", () => {
	it("reports its value to a reader", () => {
		render(<Progress value={40} aria-label="Trays baked" />);
		const bar = screen.getByRole("progressbar", { name: "Trays baked" });
		expect(bar).toHaveAttribute("aria-valuenow", "40");
		expect(bar).toHaveAttribute("data-state", "loading");
	});

	it("reads its value against its own max", () => {
		const { container } = render(<Progress value={3} max={4} aria-label="Runs" />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "4");
		const fill = container.querySelector("[data-state] > div") as HTMLElement;
		expect(fill.style.transform).toBe("translateX(-25%)");
	});

	it("stays indeterminate with no value", () => {
		render(<Progress aria-label="Syncing" />);
		const bar = screen.getByRole("progressbar", { name: "Syncing" });
		expect(bar).not.toHaveAttribute("aria-valuenow");
		expect(bar).toHaveAttribute("data-state", "indeterminate");
	});
});

describe("Slider", () => {
	it("names the thumb a reader reaches, not the root", () => {
		render(<Slider defaultValue={[12]} max={48} aria-label="Trays" />);
		expect(screen.getByRole("slider", { name: "Trays" })).toHaveAttribute("aria-valuenow", "12");
	});

	it("passes a label id through to the thumb", () => {
		render(
			<>
				<span id="trays-label">Trays per batch</span>
				<Slider defaultValue={[12]} aria-labelledby="trays-label" />
			</>,
		);
		expect(screen.getByRole("slider", { name: "Trays per batch" })).toBeInTheDocument();
	});

	it("draws a thumb per value, each with its own name", () => {
		render(<Slider defaultValue={[2, 8]} max={10} thumbLabels={["Fewest", "Most"]} />);
		expect(screen.getByRole("slider", { name: "Fewest" })).toHaveAttribute("aria-valuenow", "2");
		expect(screen.getByRole("slider", { name: "Most" })).toHaveAttribute("aria-valuenow", "8");
	});
});

describe("CommandDialog", () => {
	function Palette({ title }: { title?: string }) {
		const [open, setOpen] = useState(false);
		return (
			<>
				<button type="button" onClick={() => setOpen(true)}>
					Open palette
				</button>
				<CommandDialog open={open} onOpenChange={setOpen} title={title}>
					<CommandInput placeholder="Type a command" />
					<CommandList>
						<CommandItem>Bake</CommandItem>
					</CommandList>
				</CommandDialog>
			</>
		);
	}

	it("is a dialog named by its title, Commands by default", async () => {
		const user = userEvent.setup();
		const { unmount } = render(<Palette />);
		await user.click(screen.getByRole("button", { name: "Open palette" }));
		expect(await screen.findByRole("dialog", { name: "Commands" })).toBeInTheDocument();
		unmount();

		render(<Palette title="Jump to a page" />);
		await user.click(screen.getByRole("button", { name: "Open palette" }));
		expect(await screen.findByRole("dialog", { name: "Jump to a page" })).toBeInTheDocument();
	});

	it("hands focus back to what opened it when it closes", async () => {
		const user = userEvent.setup();
		render(<Palette />);
		const opener = screen.getByRole("button", { name: "Open palette" });
		await user.click(opener);
		await screen.findByRole("dialog");
		await user.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		expect(opener).toHaveFocus();
	});
});

describe("Command's list holds only options and groups", () => {
	function List() {
		return (
			<Command>
				<CommandInput placeholder="Search" />
				<CommandList>
					<CommandEmpty>No results.</CommandEmpty>
					<CommandGroup heading="Bread">
						<CommandItem>Sourdough</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Pastry">
						<CommandItem>Croissant</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		);
	}

	it("draws the separator with no role, and hides it while a search is typed", async () => {
		const user = userEvent.setup();
		const { container } = render(<List />);
		const separator = container.querySelector("[cmdk-separator]");
		expect(separator).toHaveAttribute("role", "none");
		expect(screen.queryByRole("separator")).toBeNull();
		await user.type(screen.getByRole("combobox"), "sour");
		expect(container.querySelector("[cmdk-separator]")).toBeNull();
	});

	it("shows nothing matching as one disabled option of the list", async () => {
		const user = userEvent.setup();
		render(<List />);
		expect(screen.queryByText("No results.")).toBeNull();
		await user.type(screen.getByRole("combobox"), "zzz");
		const empty = await screen.findByRole("option", { name: "No results." });
		expect(empty).toHaveAttribute("aria-disabled", "true");
		expect(within(screen.getByRole("listbox")).getAllByRole("option")).toEqual([empty]);
	});
});

describe("Pagination", () => {
	it("names the previous button with the word it shows", () => {
		render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
		const previous = screen.getByRole("button", { name: "Previous page" });
		expect(previous).toHaveTextContent("Previous");
		expect(previous.getAttribute("aria-label")).toContain(previous.textContent ?? "");
	});
});

describe("Alert", () => {
	it("is a plain block by default, not a live region", () => {
		render(<Alert>Saved drafts are kept for a week.</Alert>);
		expect(screen.queryByRole("alert")).toBeNull();
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("announces only when told to, urgently or politely", () => {
		const { rerender } = render(<Alert announce="assertive">The sync failed.</Alert>);
		expect(screen.getByRole("alert")).toHaveTextContent("The sync failed.");
		rerender(<Alert announce="polite">Synced.</Alert>);
		expect(screen.getByRole("status")).toHaveTextContent("Synced.");
	});

	it("titles itself with a paragraph unless given a heading level", () => {
		const { rerender } = render(
			<Alert>
				<AlertTitle>Heads up</AlertTitle>
			</Alert>,
		);
		expect(screen.queryByRole("heading")).toBeNull();
		expect(screen.getByText("Heads up").tagName).toBe("P");
		rerender(
			<Alert>
				<AlertTitle level={2}>Heads up</AlertTitle>
			</Alert>,
		);
		expect(screen.getByRole("heading", { level: 2, name: "Heads up" })).toBeInTheDocument();
	});
});

describe("Form", () => {
	function Fields() {
		const form = useForm({ defaultValues: { trays: "", note: "" } });
		return (
			<Form {...form}>
				<form onSubmit={form.handleSubmit(() => {})}>
					<FormField
						control={form.control}
						name="trays"
						rules={{ required: "Say how many trays." }}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Trays</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="note"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Note</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormDescription>For the bakers.</FormDescription>
							</FormItem>
						)}
					/>
					<button type="submit">Save</button>
				</form>
			</Form>
		);
	}

	const describedIds = (input: HTMLElement) =>
		(input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);

	it("points a field only at the description and message that are on the page", async () => {
		const user = userEvent.setup();
		render(<Fields />);
		const trays = screen.getByRole("textbox", { name: "Trays" });
		const note = screen.getByRole("textbox", { name: "Note" });
		expect(trays).not.toHaveAttribute("aria-describedby");
		expect(note).toHaveAccessibleDescription("For the bakers.");
		for (const id of describedIds(note)) expect(document.getElementById(id)).not.toBeNull();

		await user.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() => expect(trays).toHaveAccessibleDescription("Say how many trays."));
		for (const id of describedIds(trays)) expect(document.getElementById(id)).not.toBeNull();
	});
});

describe("PageSkeleton", () => {
	it("says it is busy in words a reader hears, its blocks hidden", () => {
		const { container } = render(<PageSkeleton />);
		const busy = container.querySelector("[aria-busy='true']");
		expect(busy).not.toBeNull();
		expect(busy).toHaveTextContent("Loading");
		const blocks = busy?.querySelector("[aria-hidden='true']");
		expect(blocks?.className).toContain("animate-pulse");
		expect(blocks?.className).toContain("motion-reduce:animate-none");
	});

	it("takes its own words", () => {
		render(<PageSkeleton label="Loading the orders" />);
		expect(screen.getByText("Loading the orders")).toHaveClass("sr-only");
	});
});

describe("PageError", () => {
	it("is an alert, announced as it appears", () => {
		render(<PageError message="The orders did not load." />);
		expect(screen.getByRole("alert")).toHaveTextContent("The orders did not load.");
	});
});

describe("ErrorFallback", () => {
	it("lets a keyboard reach the details box, and lets its column shrink below a long line", () => {
		render(
			<ErrorFallback error={new Error("GET /a/very/long/path")} resetError={vi.fn()} showDetails />,
		);
		const details = screen.getByText("GET /a/very/long/path");
		expect(details.tagName).toBe("PRE");
		expect(details).toHaveAttribute("tabindex", "0");
		expect(details.parentElement?.className).toContain("min-w-0");
	});
});

describe("SearchInput", () => {
	it("returns focus to the box when the clear button is pressed by keyboard", async () => {
		const user = userEvent.setup();
		function Harness() {
			const [value, setValue] = useState("rye");
			return <SearchInput value={value} onValueChange={setValue} />;
		}
		render(<Harness />);
		const clear = screen.getByRole("button", { name: "Clear search" });
		clear.focus();
		await user.keyboard("{Enter}");
		const box = screen.getByRole("textbox", { name: "Search" });
		expect(box).toHaveValue("");
		expect(box).toHaveFocus();
	});

	it("still forwards its ref to the input", () => {
		const ref = { current: null as HTMLInputElement | null };
		render(<SearchInput ref={ref} value="" onValueChange={vi.fn()} />);
		expect(ref.current?.tagName).toBe("INPUT");
	});
});
