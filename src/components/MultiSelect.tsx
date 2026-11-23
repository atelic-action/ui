import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";

/** One choice: its submitted value, and the words shown when they differ. */
export interface MultiSelectOption {
	value: string;
	label?: string;
}

export interface MultiSelectProps {
	/** The field's label, and the first half of the button's accessible name. */
	label: ReactNode;
	/** A quiet note beside the label, such as "(check all that apply)". */
	hint?: ReactNode;
	/** The choices, as plain strings or as values with their own words. */
	options: (string | MultiSelectOption)[];
	/**
	 * The name each chosen value is submitted under in a form, once per value,
	 * as checkboxes are, so `FormData.getAll(name)` reads them in the options'
	 * order. Nothing is submitted without it.
	 */
	name?: string;
	/** Chosen on first render, and again when the form resets. */
	defaultValue?: string[];
	/** The button's words while nothing is chosen. */
	placeholder?: string;
	/** How many chosen labels the button lists before it counts them instead. Defaults to 2. */
	listed?: number;
	/** The button's words for more chosen than `listed`. */
	countLabel?: (count: number) => string;
	/** Called with the chosen values, in the options' order, on every change. */
	onChange?: (values: string[]) => void;
	/** The button's id; minted when left out. */
	id?: string;
	className?: string;
}

const optionOf = (option: string | MultiSelectOption) =>
	typeof option === "string"
		? { value: option, label: option }
		: { value: option.value, label: option.label ?? option.value };

const defaultCount = (count: number) => `${count} chosen`;

/**
 * A closed control that names what is chosen and opens to a list of
 * checkboxes, any number of which may be ticked: a form question with more
 * than one answer ("Which services?").
 *
 * Built on Radix: the button is a Popover trigger (`aria-expanded`, and a
 * popup it controls), and each choice is a Radix Checkbox (`role="checkbox"`
 * with `aria-checked`). Checkboxes and not a multi select listbox, because a
 * screen reader announces a checkbox's state the same way everywhere, where
 * a listbox's `aria-multiselectable` selected state is read unevenly; and
 * not cmdk's list, whose options mark the highlighted one `aria-selected`,
 * which in a multi select says a choice is chosen when it is only under the
 * cursor. Radix closes the list on a click outside (leaving focus where the
 * press put it) and on Escape (focus back on the button); Enter in the list
 * closes it too, back on the button, and never sends the form. There is no
 * Done button. Opening lands on the first choice, Space ticks one, the
 * arrows, Home, and End move between them, and Tab keeps to the open list,
 * the last choice wrapping to the first, as the popover's focus scope does.
 *
 * The list renders in place, not in a portal, so it stays under the page's
 * `.atelic-ui` root and its rules reach it. The chosen values are submitted
 * as hidden inputs beside the button, which stay in the form while the list
 * is closed, and a form's reset puts back `defaultValue`. The button lists
 * the chosen labels, up to `listed`, then counts them.
 */
export function MultiSelect({
	label,
	hint,
	options,
	name,
	defaultValue = [],
	placeholder = "Choose one or more",
	listed = 2,
	countLabel = defaultCount,
	onChange,
	id,
	className,
}: MultiSelectProps) {
	const minted = useId();
	const buttonId = id ?? `${minted}-button`;
	const labelId = `${minted}-label`;
	const valueId = `${minted}-value`;
	const buttonRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const choices = options.map(optionOf);
	// Chosen values are always held in the options' order, whatever order they came in.
	const inOrder = (values: string[]) =>
		choices.flatMap((choice) => (values.includes(choice.value) ? [choice.value] : []));
	const [chosen, setChosen] = useState<string[]>(() => inOrder(defaultValue));
	// Read by the handlers, so a reset and a tick in one turn never see a stale list.
	const chosenNow = useRef(chosen);
	chosenNow.current = chosen;
	// The values the form resets to, as first rendered.
	const resetTo = useRef(chosen);

	useEffect(() => {
		const form = buttonRef.current?.form;
		if (!form) return;
		const onReset = () => {
			setOpen(false);
			chosenNow.current = resetTo.current;
			setChosen(resetTo.current);
		};
		form.addEventListener("reset", onReset);
		return () => form.removeEventListener("reset", onReset);
	}, []);

	const toggle = (value: string, on: boolean) => {
		const set = new Set(chosenNow.current);
		if (set.has(value) === on) return;
		if (on) set.add(value);
		else set.delete(value);
		const values = inOrder([...set]);
		chosenNow.current = values;
		setChosen(values);
		onChange?.(values);
	};

	const onListKey = (event: KeyboardEvent<HTMLDivElement>) => {
		const all = Array.from(
			listRef.current?.querySelectorAll<HTMLButtonElement>('[role="checkbox"]') ?? [],
		);
		const at = all.indexOf(event.target as HTMLButtonElement);
		if (at < 0) return;
		const moveTo = (index: number) => {
			event.preventDefault();
			all[(index + all.length) % all.length]?.focus();
		};
		if (event.key === "ArrowDown") moveTo(at + 1);
		else if (event.key === "ArrowUp") moveTo(at - 1);
		else if (event.key === "Home") moveTo(0);
		else if (event.key === "End") moveTo(all.length - 1);
		else if (event.key === "Enter") {
			// A checkbox never takes Enter; here it means done, and never sends the form.
			event.preventDefault();
			setOpen(false);
		}
	};

	const chosenLabels = choices.filter((c) => chosen.includes(c.value)).map((c) => c.label);
	const summary =
		chosenLabels.length === 0
			? placeholder
			: chosenLabels.length <= listed
				? chosenLabels.join(", ")
				: countLabel(chosenLabels.length);

	return (
		<div className={["multi-select", className].filter(Boolean).join(" ")}>
			<label id={labelId} htmlFor={buttonId} className="multi-select-label">
				{label}
				{hint && (
					<>
						{" "}
						<small>{hint}</small>
					</>
				)}
			</label>
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger asChild>
					<button
						ref={buttonRef}
						id={buttonId}
						type="button"
						className="multi-select-button"
						data-empty={chosenLabels.length === 0 || undefined}
						aria-labelledby={`${labelId} ${valueId}`}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown" && !open) {
								event.preventDefault();
								setOpen(true);
							}
						}}
					>
						<span id={valueId} className="multi-select-value">
							{summary}
						</span>
						<ChevronDown className="multi-select-chevron" size={18} aria-hidden="true" />
					</button>
				</Popover.Trigger>
				<Popover.Content
					ref={listRef}
					className="multi-select-list"
					side="bottom"
					align="start"
					sideOffset={4}
					aria-labelledby={labelId}
					onKeyDown={onListKey}
				>
					{choices.map((choice) => {
						const boxId = `${minted}-${choice.value}`;
						return (
							<div key={choice.value} className="multi-select-option">
								<Checkbox.Root
									id={boxId}
									className="multi-select-box"
									checked={chosen.includes(choice.value)}
									onCheckedChange={(state) => toggle(choice.value, state === true)}
								>
									<Checkbox.Indicator className="multi-select-tick">
										<Check size={14} strokeWidth={3} aria-hidden="true" />
									</Checkbox.Indicator>
								</Checkbox.Root>
								<label htmlFor={boxId}>{choice.label}</label>
							</div>
						);
					})}
				</Popover.Content>
			</Popover.Root>
			{name && chosen.map((value) => <input key={value} type="hidden" name={name} value={value} />)}
		</div>
	);
}
