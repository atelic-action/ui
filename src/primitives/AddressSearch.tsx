import { MapPin } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { latestOnly } from "../lib/latestOnly";

/** One suggestion a provider offers: its main line and the rest beneath it. */
export interface AddressSuggestion {
	/** The provider's own key for the suggestion, handed back to `resolve`. */
	id: string;
	/** The main line, the street: "418 Alder Street". */
	text: string;
	/** The line beneath it, the place: "Fairhaven, CO 80000". */
	secondary?: string;
}

/** A postal address in the four parts a form's fields hold. */
export interface AddressParts {
	street: string;
	city: string;
	state: string;
	zip: string;
}

/**
 * Where suggestions come from. The search knows no service: a site wraps the
 * one it uses (Google's address autocomplete, a postal service's lookup) in
 * these two functions. Each is handed an `AbortSignal` that aborts once its
 * answer can no longer be used, which a provider passes on to `fetch`.
 */
export interface AddressProvider {
	/** The suggestions for what has been typed so far. */
	suggest(query: string, options: { signal: AbortSignal }): Promise<AddressSuggestion[]>;
	/** The four parts of the suggestion the visitor picked. */
	resolve(suggestion: AddressSuggestion, options: { signal: AbortSignal }): Promise<AddressParts>;
	/**
	 * Called on each focus of the field, so a provider that loads a library
	 * can start before the first keystroke rather than at page load, and try
	 * again on a later focus when a load failed.
	 */
	prepare?(): void;
	/** Called when the visitor leaves the field without a pick, so a provider can end its session. */
	abandon?(): void;
}

export interface AddressSearchProps {
	/** Where the suggestions come from. With none, nothing renders. */
	provider?: AddressProvider;
	/** The field's label. */
	label: ReactNode;
	/** A quiet note beside the label, such as "(optional)". */
	hint?: ReactNode;
	placeholder?: string;
	/** Called with the parts of the address the visitor picked. */
	/**
	 * Called with the parts of the address picked. Return false when the
	 * pick is not taken after all (a form that has moved on): the field then
	 * goes back to what the visitor typed (8.6.0).
	 */
	onPick: (address: AddressParts) => boolean | undefined;
	/**
	 * Called the moment a suggestion is chosen, before its parts arrive, so a
	 * form can tell a pick that lands after the visitor moved on.
	 */
	onChoose?: (suggestion: AddressSuggestion) => void;
	/** Drawn under the suggestions, for a provider whose terms ask for it ("Powered by ..."). */
	attribution?: ReactNode;
	/** The suggestion list's accessible name. */
	listLabel?: string;
	/** What a screen reader hears when the suggestions change. */
	countLabel?: (count: number) => string;
	/** Characters typed before the first lookup. Defaults to 3. */
	minLength?: number;
	/** The pause in the typing before a lookup, in milliseconds. Defaults to 250. */
	debounceMs?: number;
	/** The input's id; minted when left out. */
	id?: string;
	className?: string;
}

const defaultCount = (count: number) =>
	count === 0 ? "No suggestions" : count === 1 ? "1 suggestion" : `${count} suggestions`;

/** The line an address reads as once picked: the main line and the rest. */
const pickedText = (suggestion: AddressSuggestion) =>
	[suggestion.text, suggestion.secondary].filter(Boolean).join(", ");

/**
 * A text field that offers addresses as the visitor types and, on a pick,
 * hands back the street, city, state, and ZIP. It knows no service: the
 * suggestions come from `provider`, and with no provider it renders nothing,
 * so the plain address fields beside it stand alone.
 *
 * It is the ARIA combobox with a list popup: the input keeps focus while
 * the arrows move a highlight through the suggestions
 * (`aria-activedescendant`), Enter picks the highlighted one, Escape closes
 * the list, and a click picks one too. A lookup waits for a pause in the
 * typing, and an answer that arrives after a newer question was asked is
 * dropped. The count of suggestions is announced each time it changes.
 * Nothing touches the page until an effect or a handler runs, so it
 * prerenders.
 */
export function AddressSearch({
	provider,
	label,
	hint,
	placeholder,
	onPick,
	onChoose,
	attribution,
	listLabel = "Suggestions",
	countLabel = defaultCount,
	minLength = 3,
	debounceMs = 250,
	id,
	className,
}: AddressSearchProps) {
	const minted = useId();
	const inputId = id ?? `${minted}-input`;
	const listId = `${minted}-list`;
	const labelTextId = `${minted}-label`;
	const hintId = `${minted}-hint`;
	const optionId = (index: number) => `${minted}-option-${index}`;
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const [announce, setAnnounce] = useState("");
	// The text a pick wrote into the field, so writing it asks nothing.
	const picked = useRef<string | null>(null);
	const lookups = useMemo(() => latestOnly(), []);
	const resolves = useMemo(() => latestOnly(), []);
	// The latest of each function prop, read when it is needed, so a site
	// passing an inline function or provider never starts a lookup by rendering.
	const latestPick = useRef(onPick);
	latestPick.current = onPick;
	const latestProvider = useRef(provider);
	latestProvider.current = provider;
	const latestCount = useRef(countLabel);
	latestCount.current = countLabel;
	// The provider whose answer the offered suggestions are, which a pick
	// resolves through even if the site has passed a new one since.
	const offeredBy = useRef<AddressProvider | null>(null);
	// A press on a suggestion, from before the blur it may cause until its
	// click: that blur is the pick's, and leaves the list, the suggestions,
	// and the provider's session alone (8.6.0).
	const picking = useRef(false);
	// The blur's cleanup, held past the click so a pick can call it off.
	const leaving = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	// The pause before a lookup, held so a blur can stop it.
	const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const hasProvider = Boolean(provider);

	useEffect(() => {
		if (!hasProvider) return;
		if (picked.current === query) return;
		picked.current = null;
		const asked = query.trim();
		if (asked.length < minLength) {
			lookups.cancel();
			setSuggestions([]);
			setOpen(false);
			setActive(-1);
			return;
		}
		pending.current = setTimeout(() => {
			const source = latestProvider.current;
			if (!source) return;
			lookups
				.run((signal) => source.suggest(asked, { signal }))
				.then(
					(answer) => {
						if (answer.stale) return;
						offeredBy.current = source;
						setSuggestions(answer.value);
						setActive(-1);
						// Never opens under a field the visitor has left.
						setOpen(answer.value.length > 0 && document.activeElement === inputRef.current);
						setAnnounce(latestCount.current(answer.value.length));
					},
					// A lookup that fails offers nothing; the plain fields still take the address.
					() => {
						setSuggestions([]);
						setOpen(false);
					},
				);
		}, debounceMs);
		return () => clearTimeout(pending.current);
	}, [query, hasProvider, minLength, debounceMs, lookups]);

	// A form's reset empties the search with the rest of the form.
	// biome-ignore lint/correctness/useExhaustiveDependencies: hasProvider is read through the input it puts on the page, which the effect finds by ref
	useEffect(() => {
		const form = inputRef.current?.form;
		if (!form) return;
		const onReset = () => {
			lookups.cancel();
			resolves.cancel();
			picked.current = null;
			setQuery("");
			setSuggestions([]);
			setOpen(false);
			setActive(-1);
		};
		form.addEventListener("reset", onReset);
		return () => form.removeEventListener("reset", onReset);
		// The input exists only once there is a provider, so a provider that
		// arrives after the first render attaches the listener then.
	}, [lookups, resolves, hasProvider]);

	if (!provider) return null;

	/** What leaving the field does once no pick is under way. */
	const leave = () => {
		clearTimeout(pending.current);
		lookups.cancel();
		setOpen(false);
		setActive(-1);
		// The session and the suggestions go only after any click has landed.
		leaving.current = setTimeout(() => {
			latestProvider.current?.abandon?.();
			// Nothing stale is offered after the visitor leaves; typing again asks anew.
			setSuggestions([]);
		}, 0);
	};

	const pick = (suggestion: AddressSuggestion) => {
		picking.current = false;
		clearTimeout(leaving.current);
		const text = pickedText(suggestion);
		// What the visitor typed, to go back to if the pick cannot be resolved.
		const typed = query;
		onChoose?.(suggestion);
		picked.current = text;
		lookups.cancel();
		setQuery(text);
		// The suggestions belong to the session the pick ends; none are offered again.
		setSuggestions([]);
		setOpen(false);
		setActive(-1);
		const source = offeredBy.current ?? provider;
		resolves
			.run((signal) => source.resolve(suggestion, { signal }))
			.then(
				(answer) => {
					if (answer.stale) return;
					// A form that has moved on declines the pick: the field goes back
					// to what was typed, as it does when the address cannot be read.
					if (latestPick.current(answer.value) === false) {
						picked.current = null;
						setQuery(typed);
					}
				},
				() => {
					// The address could not be read: the field goes back to what was
					// typed, which asks again, so the field never shows an address the
					// form did not receive.
					picked.current = null;
					setQuery(typed);
				},
			);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const count = suggestions.length;
		if (event.key === "ArrowDown" && count > 0) {
			event.preventDefault();
			if (!open) setOpen(true);
			setActive((index) => (index + 1) % count);
		} else if (event.key === "ArrowUp" && count > 0) {
			event.preventDefault();
			if (!open) setOpen(true);
			setActive((index) => (index <= 0 ? count - 1 : index - 1));
		} else if (event.key === "Enter" && open && active >= 0) {
			// Picks the highlighted address rather than sending the form.
			event.preventDefault();
			const chosen = suggestions[active];
			if (chosen) pick(chosen);
		} else if (event.key === "Escape" && open) {
			event.preventDefault();
			setOpen(false);
			setActive(-1);
		}
	};

	return (
		<div className={["address-search", className].filter(Boolean).join(" ")}>
			<label htmlFor={inputId} className="address-search-label">
				<span id={labelTextId}>{label}</span>
				{hint && (
					<>
						{" "}
						<small id={hintId}>{hint}</small>
					</>
				)}
			</label>
			<div className="address-search-bar">
				<MapPin className="address-search-pin" size={20} aria-hidden="true" />
				<input
					ref={inputRef}
					id={inputId}
					className="address-search-input"
					type="text"
					role="combobox"
					aria-expanded={open}
					aria-controls={listId}
					aria-autocomplete="list"
					// The words and the hint named apart, so the name always has the space between them.
					aria-labelledby={hint ? `${labelTextId} ${hintId}` : labelTextId}
					aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
					autoComplete="off"
					placeholder={placeholder}
					value={query}
					onChange={(event) => {
						// Typing again drops a pick still being read, so it never lands late.
						resolves.cancel();
						setQuery(event.target.value);
					}}
					onKeyDown={onKeyDown}
					onFocus={() => latestProvider.current?.prepare?.()}
					onBlur={() => {
						// A press on a suggestion moved focus first (a touch browser, a
						// screen reader): the pick is coming, and keeps what it needs.
						if (picking.current) return;
						// Leaving the field stops the pause and the lookup in flight,
						// so no answer reopens the list behind the visitor.
						leave();
					}}
				/>
			</div>
			<div className="address-search-popup" hidden={!open}>
				<div id={listId} className="address-search-list" role="listbox" aria-label={listLabel}>
					{suggestions.map((suggestion, index) => (
						// biome-ignore lint/a11y/useFocusableInteractive: focus stays in the field, which moves the highlight by aria-activedescendant
						// biome-ignore lint/a11y/useKeyWithClickEvents: the keys live on the field, for the same reason
						<div
							key={suggestion.id}
							id={optionId(index)}
							role="option"
							aria-selected={index === active}
							className="address-search-option"
							// Keeps focus in the field, so the press is a pick and not a blur.
							onMouseDown={(event) => event.preventDefault()}
							onPointerDown={() => {
								picking.current = true;
							}}
							// A press that slides off without a click is no pick after all.
							onPointerLeave={() => {
								if (!picking.current) return;
								picking.current = false;
								if (document.activeElement !== inputRef.current) leave();
							}}
							onClick={() => pick(suggestion)}
						>
							<span className="address-search-option-text">{suggestion.text}</span>
							{suggestion.secondary && (
								<span className="address-search-option-secondary">{suggestion.secondary}</span>
							)}
						</div>
					))}
				</div>
				{attribution && <div className="address-search-attribution">{attribution}</div>}
			</div>
			{/* An explicit live region under Component Rules 14: a combobox's count
			    has to be heard as it changes, and it changes once per pause in the
			    typing, never on a tick. React writes the words only when they differ,
			    so the same count is not announced twice. */}
			<div className="visually-hidden" aria-live="polite">
				{announce}
			</div>
		</div>
	);
}
