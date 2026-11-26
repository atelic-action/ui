import { type ReactNode, useId } from "react";

/** One answer of a choice seen whole: its name and a line under it. */
export interface ChoiceCardOption {
	/** The value chosen and submitted. */
	value: string;
	/** The answer's name: "At your property". */
	label: ReactNode;
	/** One line under the name: "About 30 minutes. We come out and take a look." */
	description?: ReactNode;
}

export interface ChoiceCardsProps {
	/** The question the group answers, read as the group's name. */
	legend: ReactNode;
	/** Two or three answers; a longer list is a dropdown, not cards. */
	options: ChoiceCardOption[];
	/** The value chosen, empty for none. */
	value: string;
	/** Called with the value the visitor chooses. */
	onChange: (value: string) => void;
	/** The radios' name. A unique one by default. */
	name?: string;
	/** Why the answer is refused; the group is described by it while set. */
	error?: string;
	className?: string;
}

/**
 * A choice seen whole: two or three answers, each a large card holding a
 * native radio, its name, and one line under it. It is a radio group to a
 * keyboard and a screen reader (Tab to the group, the arrows between the
 * answers), and the whole card is the radio's label, so a tap anywhere on it
 * chooses. Use it where the design draws the answers as cards; any other
 * choice is a dropdown.
 */
export function ChoiceCards({
	legend,
	options,
	value,
	onChange,
	name,
	error,
	className,
}: ChoiceCardsProps) {
	const ownId = useId();
	const group = name ?? `${ownId}-choice`;
	const errorId = `${ownId}-error`;
	return (
		<fieldset
			className={["choice-cards", error && "invalid", className].filter(Boolean).join(" ")}
			{...(error && { "aria-describedby": errorId })}
		>
			<legend className="choice-cards-legend">{legend}</legend>
			<div className="choice-cards-list">
				{options.map((option) => {
					const on = option.value === value;
					return (
						<label key={option.value} className={on ? "choice-card is-on" : "choice-card"}>
							<input
								type="radio"
								name={group}
								value={option.value}
								checked={on}
								onChange={() => onChange(option.value)}
							/>
							<strong className="choice-card-label">{option.label}</strong>
							{option.description && (
								<span className="choice-card-description">{option.description}</span>
							)}
						</label>
					);
				})}
			</div>
			{error && (
				<span className="choice-cards-error" id={errorId}>
					{error}
				</span>
			)}
		</fieldset>
	);
}
