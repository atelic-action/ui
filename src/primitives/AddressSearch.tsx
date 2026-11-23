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
	 * Called once, on the field's first focus, so a provider that loads a
	 * library can start before the first keystroke rather than at page load.
	 */
	prepare?(): void;
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
	onPick: (address: AddressParts) => void;
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
	const hasProvider = Boolean(provider);
	const prepared = useRef(false);

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
		const timer = setTimeout(() => {
			const source = latestProvider.current;
			if (!source) return;
			lookups
				.run((signal) => source.suggest(asked, { signal }))
				.then(
					(answer) => {
						if (answer.stale) return;
						setSuggestions(answer.value);
						setActive(-1);
						setOpen(answer.value.length > 0);
						setAnnounce(latestCount.current(answer.value.length));
					},
					// A lookup that fails offers nothing; the plain fields still take the address.
					() => {
						setSuggestions([]);
						setOpen(false);
					},
				);
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [query, hasProvider, minLength, debounceMs, lookups]);

	// A form's reset empties the search with the rest of the form.
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
	}, [lookups, resolves]);

	if (!provider) return null;

	const pick = (suggestion: AddressSuggestion) => {
		const text = pickedText(suggestion);
		picked.current = text;
		lookups.cancel();
		setQuery(text);
		setOpen(false);
		setActive(-1);
		resolves
			.run((signal) => provider.resolve(suggestion, { signal }))
			.then(
				(answer) => {
					if (!answer.stale) latestPick.current(answer.value);
				},
				() => {},
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
				{label}
				{hint && (
					<>
						{" "}
						<small>{hint}</small>
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
					aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
					autoComplete="off"
					placeholder={placeholder}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={onKeyDown}
					onFocus={() => {
						if (prepared.current) return;
						prepared.current = true;
						latestProvider.current?.prepare?.();
					}}
					onBlur={() => {
						setOpen(false);
						setActive(-1);
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
			<output className="visually-hidden">{announce}</output>
		</div>
	);
}
