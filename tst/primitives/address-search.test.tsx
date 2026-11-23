import { act, fireEvent, render, screen } from "@testing-library/react";
import {
	type AddressParts,
	type AddressProvider,
	AddressSearch,
	type AddressSuggestion,
} from "../../src/primitives/AddressSearch";

const ALDER: AddressSuggestion = {
	id: "alder",
	text: "418 Alder Street",
	secondary: "Fairhaven, CO 80000",
};
const ALDER_PARTS: AddressParts = {
	street: "418 Alder Street",
	city: "Fairhaven",
	state: "CO",
	zip: "80000",
};
const BIRCH: AddressSuggestion = {
	id: "birch",
	text: "12 Birch Lane",
	secondary: "Fairhaven, CO 80001",
};

/** A provider whose answers the test releases by hand, in any order. */
function heldProvider() {
	const asked: {
		query: string;
		signal: AbortSignal;
		answer: (list: AddressSuggestion[]) => void;
	}[] = [];
	const provider: AddressProvider = {
		suggest: (query, { signal }) =>
			new Promise((resolve) => {
				asked.push({ query, signal, answer: resolve });
			}),
		resolve: vi.fn(async () => ALDER_PARTS),
	};
	return { provider, asked };
}

const field = () => screen.getByRole("combobox", { name: "Address" });
/** Types into the field as a visitor does, the field focused first. */
const type = (value: string) => {
	if (document.activeElement !== field()) field().focus();
	fireEvent.change(field(), { target: { value } });
};
/** The polite live region the count is announced in. */
const liveRegion = () => document.querySelector('[aria-live="polite"]') as HTMLElement;
const settle = () => act(async () => {});

describe("AddressSearch", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders nothing without a provider", () => {
		const { container } = render(<AddressSearch label="Address" onPick={() => {}} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("asks only after a pause in the typing, and not before the third character", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("41");
		act(() => vi.advanceTimersByTime(500));
		expect(asked).toHaveLength(0);
		type("418");
		act(() => vi.advanceTimersByTime(100));
		type("418 A");
		act(() => vi.advanceTimersByTime(249));
		expect(asked).toHaveLength(0);
		act(() => vi.advanceTimersByTime(1));
		expect(asked.map((a) => a.query)).toEqual(["418 A"]);
	});

	it("drops an earlier answer that arrives after a later one, and aborts its request", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		type("12 B");
		act(() => vi.advanceTimersByTime(250));
		expect(asked).toHaveLength(2);
		expect(asked[0]?.signal.aborted).toBe(true);
		await act(async () => asked[1]?.answer([BIRCH]));
		await act(async () => asked[0]?.answer([ALDER]));
		expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
			"12 Birch LaneFairhaven, CO 80001",
		]);
		expect(field()).toHaveAttribute("aria-expanded", "true");
	});

	it("picks with the keyboard: the arrows move the highlight, Enter picks and resolves the parts", async () => {
		const { provider, asked } = heldProvider();
		const onPick = vi.fn();
		render(<AddressSearch provider={provider} label="Address" onPick={onPick} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER, BIRCH]));
		fireEvent.keyDown(field(), { key: "ArrowDown" });
		fireEvent.keyDown(field(), { key: "ArrowDown" });
		fireEvent.keyDown(field(), { key: "ArrowUp" });
		const first = screen.getAllByRole("option")[0];
		expect(first).toHaveAttribute("aria-selected", "true");
		expect(field()).toHaveAttribute("aria-activedescendant", first?.id);
		const enter = fireEvent.keyDown(field(), { key: "Enter" });
		expect(enter).toBe(false);
		await settle();
		expect(provider.resolve).toHaveBeenCalledWith(ALDER, expect.anything());
		expect(onPick).toHaveBeenCalledWith(ALDER_PARTS);
		expect(field()).toHaveValue("418 Alder Street, Fairhaven, CO 80000");
		expect(field()).toHaveAttribute("aria-expanded", "false");
		// Writing the picked line into the field asks nothing more.
		act(() => vi.advanceTimersByTime(1000));
		expect(asked).toHaveLength(1);
	});

	it("leaves Enter to the form when nothing is highlighted", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		expect(fireEvent.keyDown(field(), { key: "Enter" })).toBe(true);
	});

	it("closes on Escape and on blur, and keeps what was typed", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		fireEvent.keyDown(field(), { key: "Escape" });
		expect(field()).toHaveAttribute("aria-expanded", "false");
		fireEvent.keyDown(field(), { key: "ArrowDown" });
		expect(field()).toHaveAttribute("aria-expanded", "true");
		fireEvent.blur(field());
		expect(field()).toHaveAttribute("aria-expanded", "false");
		expect(field()).toHaveValue("4 A");
	});

	it("announces the count, and says so when nothing matches", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER, BIRCH]));
		expect(liveRegion()).toHaveTextContent("2 suggestions");
		type("zzz");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[1]?.answer([]));
		expect(liveRegion()).toHaveTextContent("No suggestions");
		expect(field()).toHaveAttribute("aria-expanded", "false");
	});

	it("offers nothing when the provider fails, and the field still takes text", async () => {
		const provider: AddressProvider = {
			suggest: () => Promise.reject(new Error("quota")),
			resolve: async () => ALDER_PARTS,
		};
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		await settle();
		expect(field()).toHaveAttribute("aria-expanded", "false");
		expect(field()).toHaveValue("418");
	});

	it("never starts a lookup by rendering, whatever functions it is passed inline", async () => {
		const { provider, asked } = heldProvider();
		const { rerender } = render(
			<AddressSearch
				provider={{ ...provider }}
				label="Address"
				onPick={() => {}}
				countLabel={(n) => `${n}`}
			/>,
		);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		for (let i = 0; i < 3; i += 1) {
			rerender(
				<AddressSearch
					provider={{ ...provider }}
					label="Address"
					onPick={() => {}}
					countLabel={(n) => `${n}`}
				/>,
			);
			act(() => vi.advanceTimersByTime(250));
		}
		expect(asked).toHaveLength(1);
	});

	it("announces the count in a polite live region that is not a status role", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		expect(liveRegion().tagName).toBe("DIV");
		expect(liveRegion()).not.toHaveAttribute("role");
		expect(liveRegion()).toHaveTextContent("1 suggestion");
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("asks nothing when the field is left before the pause ends", () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("418");
		fireEvent.blur(field());
		act(() => vi.advanceTimersByTime(1000));
		expect(asked).toHaveLength(0);
	});

	it("never opens the list for an answer that lands after the field was left", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		field().blur();
		fireEvent.blur(field());
		expect(asked[0]?.signal.aborted).toBe(true);
		await act(async () => asked[0]?.answer([ALDER]));
		expect(field()).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});

	it("offers nothing stale after a blur: Arrow Down on a refocus brings no old list", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER, BIRCH]));
		fireEvent.blur(field());
		field().focus();
		fireEvent.keyDown(field(), { key: "ArrowDown" });
		expect(field()).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});

	it("resolves a pick through the provider that offered it, even after the site passed a new one", async () => {
		/** A provider that can resolve only what it offered itself, as Google's does. */
		const makeProvider = () => {
			const offered = new Set<string>();
			const provider: AddressProvider = {
				suggest: async () => {
					offered.add(ALDER.id);
					return [ALDER];
				},
				resolve: async (suggestion) => {
					if (!offered.has(suggestion.id)) throw new Error("That suggestion is no longer offered.");
					return ALDER_PARTS;
				},
			};
			return provider;
		};
		const onPick = vi.fn();
		const { rerender } = render(
			<AddressSearch provider={makeProvider()} label="Address" onPick={onPick} />,
		);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		await settle();
		rerender(<AddressSearch provider={makeProvider()} label="Address" onPick={onPick} />);
		fireEvent.click(screen.getByRole("option"));
		await settle();
		expect(onPick).toHaveBeenCalledWith(ALDER_PARTS);
	});

	it("tells the provider it was abandoned when the field is left", () => {
		const { provider } = heldProvider();
		const abandon = vi.fn();
		render(<AddressSearch provider={{ ...provider, abandon }} label="Address" onPick={() => {}} />);
		field().focus();
		fireEvent.blur(field());
		expect(abandon).toHaveBeenCalledOnce();
	});

	it("drops a pick still being read when the visitor types again", async () => {
		const { provider, asked } = heldProvider();
		let finish: (parts: AddressParts) => void = () => {};
		provider.resolve = vi.fn(
			() =>
				new Promise<AddressParts>((resolve) => {
					finish = resolve;
				}),
		);
		const onPick = vi.fn();
		render(<AddressSearch provider={provider} label="Address" onPick={onPick} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		fireEvent.click(screen.getByRole("option"));
		type("12 B");
		await act(async () => finish(ALDER_PARTS));
		expect(onPick).not.toHaveBeenCalled();
	});

	it("asks the provider to prepare on each focus, and never before one", () => {
		const { provider } = heldProvider();
		const prepare = vi.fn();
		render(<AddressSearch provider={{ ...provider, prepare }} label="Address" onPick={() => {}} />);
		expect(prepare).not.toHaveBeenCalled();
		fireEvent.focus(field());
		fireEvent.blur(field());
		fireEvent.focus(field());
		expect(prepare).toHaveBeenCalledTimes(2);
	});

	it("offers nothing more after a pick: Arrow Down does not bring the old list back", async () => {
		const { provider, asked } = heldProvider();
		render(<AddressSearch provider={provider} label="Address" onPick={() => {}} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER, BIRCH]));
		fireEvent.click(screen.getAllByRole("option")[0] as HTMLElement);
		await settle();
		fireEvent.keyDown(field(), { key: "ArrowDown" });
		expect(field()).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});

	it("goes back to what was typed when a pick cannot be resolved, and asks again", async () => {
		const { provider, asked } = heldProvider();
		provider.resolve = vi.fn(() => Promise.reject(new Error("details failed")));
		const onPick = vi.fn();
		render(<AddressSearch provider={provider} label="Address" onPick={onPick} />);
		type("4 A");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		fireEvent.click(screen.getByRole("option"));
		await settle();
		expect(onPick).not.toHaveBeenCalled();
		expect(field()).toHaveValue("4 A");
		act(() => vi.advanceTimersByTime(250));
		expect(asked.map((a) => a.query)).toEqual(["4 A", "4 A"]);
	});

	it("empties with its form's reset when its provider arrives after the first render", async () => {
		const { provider, asked } = heldProvider();
		const view = (withProvider: boolean) => (
			<form>
				<AddressSearch
					provider={withProvider ? provider : undefined}
					label="Address"
					onPick={() => {}}
				/>
			</form>
		);
		const { rerender } = render(view(false));
		rerender(view(true));
		type("418");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		act(() => {
			(field() as HTMLInputElement).form?.reset();
		});
		expect(field()).toHaveValue("");
	});

	it("empties with its form's reset", async () => {
		const { provider, asked } = heldProvider();
		render(
			<form>
				<AddressSearch provider={provider} label="Address" onPick={() => {}} />
			</form>,
		);
		type("418");
		act(() => vi.advanceTimersByTime(250));
		await act(async () => asked[0]?.answer([ALDER]));
		act(() => {
			(field() as HTMLInputElement).form?.reset();
		});
		expect(field()).toHaveValue("");
		expect(field()).toHaveAttribute("aria-expanded", "false");
	});
});
