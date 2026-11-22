import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { setAppConfig } from "../../src/app/config";
import { AppConfigProvider } from "../../src/app/context/AppContext";
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
import { CountryDropdown, getCountryFlag } from "../../src/app/ui/country-dropdown";
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
import { testConfig, testNav } from "./fixtures";

/*
 * What a screen reader, a keyboard, and the network see of the kit: the
 * names and values the stories found missing, focus that survives a clear,
 * and a flag list that asks no outside host for anything.
 */

// The country list, cut to six (and the two the dropdown leaves out): cmdk
// mounting all two hundred and fifty options takes jsdom about ten seconds.
vi.mock("country-data-list", () => {
	const country = (alpha2: string, alpha3: string, name: string, status = "assigned") => ({
		alpha2,
		alpha3,
		countryCallingCodes: [],
		currencies: [],
		emoji: "x",
		ioc: alpha3,
		languages: [],
		name,
		status,
	});
	return {
		countries: {
			all: [
				country("IS", "ISL", "Iceland"),
				country("IT", "ITA", "Italy"),
				country("KP", "PRK", "North Korea"),
				country("NO", "NOR", "Norway"),
				country("PT", "PRT", "Portugal"),
				country("ES", "ESP", "Spain"),
				country("SE", "SWE", "Sweden"),
				country("YU", "YUG", "Yugoslavia", "deleted"),
			],
		},
	};
});

const LISTED = 6;

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
	// A provider with a flag host records it as the app's config; put the fixture back.
	setAppConfig(testConfig);
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

describe("CountryDropdown", () => {
	function stubObserver() {
		const observed: Element[] = [];
		const instances: { callback: IntersectionObserverCallback; root: Element | null }[] = [];
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				callback: IntersectionObserverCallback;
				root: Element | null;
				constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
					this.callback = callback;
					this.root = (options?.root as Element | null) ?? null;
					instances.push(this);
				}
				observe(target: Element) {
					observed.push(target);
				}
				disconnect() {}
				unobserve() {}
			},
		);
		return { observed, instances };
	}

	/** Open the list and hand back its parts. */
	function openList() {
		// The click opens the popover inside act, so the list is there at once;
		// a waitFor here would sit out cmdk's pending work for seconds.
		fireEvent.click(screen.getByRole("button"));
		const list = document.querySelector<HTMLElement>("[cmdk-list]");
		if (!list) throw new Error("the list did not open");
		const dialog = list.closest<HTMLElement>("[role='dialog']");
		const search = document.querySelector<HTMLElement>("[cmdk-input]");
		return { list, dialog, search };
	}

	/** Close it again inside the test, so cleanup has no open popover to tear down. */
	function closeList() {
		fireEvent.click(screen.getByRole("button"));
		expect(document.querySelector("[cmdk-list]")).toBeNull();
	}

	it("draws the code, fetching nothing, wherever the app names no flag host", () => {
		render(<CountryDropdown value="PT" />);
		expect(document.querySelector("img")).toBeNull();
		// The fallback draws the code, hidden from a reader beside the name.
		const fallback = document.querySelector("[data-flag-fallback]");
		expect(fallback?.textContent).toBe("PT");
		expect(fallback?.closest("[aria-hidden='true']")).not.toBeNull();
	});

	it("loads the trigger's flag from the app config's flag host", () => {
		render(
			<AppConfigProvider config={{ ...testConfig, flagsBaseURL: "/flags/" }} nav={testNav}>
				<CountryDropdown value="PT" />
			</AppConfigProvider>,
		);
		const flag = document.querySelector("img");
		expect(flag).toHaveAttribute("src", "/flags/pt.svg");
		expect(flag).toHaveAttribute("alt", "");
	});

	it("takes the host from a prop over the config", () => {
		render(
			<AppConfigProvider config={{ ...testConfig, flagsBaseURL: "/flags/" }} nav={testNav}>
				<CountryDropdown value="PT" flagsBaseURL="https://cdn.example.com/f/" />
			</AppConfigProvider>,
		);
		expect(document.querySelector("img")).toHaveAttribute(
			"src",
			"https://cdn.example.com/f/pt.svg",
		);
	});

	it("draws the code instead when a flag fails to load", () => {
		render(<CountryDropdown value="PT" flagsBaseURL="/flags/" />);
		const flag = document.querySelector("img") as HTMLImageElement;
		fireEvent.error(flag);
		expect(document.querySelector("img")).toBeNull();
		expect(document.querySelector("[data-flag-fallback]")?.textContent).toBe("PT");
	});

	// Popper and cmdk leave jsdom seconds of work after a popover opens, so the
	// open list is checked in one test.
	it("opens onto a named popover with the search outside the listbox, loading a flag only in view", async () => {
		const { observed, instances } = stubObserver();
		render(<CountryDropdown flagsBaseURL="/flags/" />);
		const { list, dialog, search } = openList();
		expect(dialog).toHaveAttribute("aria-label", "Countries");
		expect(search).toHaveAttribute("role", "combobox");
		expect(dialog?.contains(search)).toBe(true);
		expect(list.getAttribute("role")).toBe("listbox");
		expect(list.contains(search)).toBe(false);
		// The two the dropdown leaves out, a deleted entry and North Korea, are not offered.
		expect(list.textContent).not.toContain("Yugoslavia");
		expect(list.textContent).not.toContain("North Korea");

		// Nothing is asked for until a row is in view: every row draws its code.
		expect(list.querySelectorAll("img")).toHaveLength(0);
		expect(list.querySelectorAll("[data-flag-fallback]")).toHaveLength(LISTED);
		expect(observed).toHaveLength(LISTED);
		expect(instances[0].root).toBe(list);

		// Bring the first three rows into view.
		act(() => {
			for (const instance of instances.slice(0, 3)) {
				instance.callback(
					[{ isIntersecting: true } as IntersectionObserverEntry],
					instance as unknown as IntersectionObserver,
				);
			}
		});
		const shown = Array.from(list.querySelectorAll("img")).map((img) => img.getAttribute("src"));
		expect(shown).toEqual(["/flags/is.svg", "/flags/it.svg", "/flags/no.svg"]);
		closeList();
		// Opening any Radix popover in jsdom stalls the next turn of the event
		// loop for ten seconds or more (a bare Popover does it, so it is not
		// the dropdown's). Take that turn here, where the stall is this test's
		// own, rather than in whichever test runs next, which a slower machine
		// would time out at five seconds for work it never did.
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}, 60_000);
});

describe("getCountryFlag", () => {
	it("is an image named for the country, fetching nothing with no host", () => {
		render(<div>{getCountryFlag("Portugal")}</div>);
		expect(screen.getByRole("img", { name: "Portugal" })).toBeInTheDocument();
		expect(document.querySelector("img")).toBeNull();
	});

	it("loads from the host it is given", () => {
		render(<div>{getCountryFlag("Portugal", "/flags/")}</div>);
		expect(document.querySelector("img")).toHaveAttribute("src", "/flags/pt.svg");
	});

	it("is null for a country the list does not know", () => {
		expect(getCountryFlag("Atlantis")).toBeNull();
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
