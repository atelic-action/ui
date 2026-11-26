import { type ReactNode, useId } from "react";
import {
	DEFAULT_SOURCE_PLACEHOLDER,
	SOURCE_DETAIL_KEY,
	SOURCE_DETAIL_LIMIT,
	SOURCE_KEY,
	type Source,
	sourceDetailFor,
	sourceOptions,
} from "../forms/source";

export interface SourceSelectorProps {
	/** The question, the answers, and whether one is required: the site's one `Source`. */
	source: Source;
	/** The answer chosen, empty for none. */
	value: string;
	/** Called with the answer the visitor chooses, empty when they go back to none. */
	onChange: (value: string) => void;
	/** The select's id. A unique one by default. */
	id?: string;
	/** The name the answer is submitted under. Defaults to "source". */
	name?: string;
	/** A quiet note beside the label, such as "(optional)". */
	hint?: ReactNode;
	/** Why the answer is refused; the select is marked invalid and described by it while set. */
	error?: string;
	className?: string;
	/**
	 * The detail typed for the chosen answer, when its option asks for one
	 * (9.5.0). With `onDetailChange`, a text field under the select takes it
	 * while such an answer is chosen; without, no detail field is drawn.
	 */
	detail?: string;
	/** Called with the detail as it is typed (9.5.0). */
	onDetailChange?: (detail: string) => void;
	/** Beside the detail's label, such as "(optional)". Defaults to the select's `hint`. */
	detailHint?: ReactNode;
}

/**
 * How did you hear about us: a labeled native select of the site's answers,
 * an empty first row before them. Controlled, so it sits on any form; a
 * native select, so a phone shows its own picker. An answer whose option
 * asks for a detail draws a short text field under the select while it is
 * chosen, on a form that hands it `onDetailChange` (9.5.0).
 */
export function SourceSelector({
	source,
	value,
	onChange,
	id,
	name = SOURCE_KEY,
	hint,
	error,
	className,
	detail = "",
	onDetailChange,
	detailHint,
}: SourceSelectorProps) {
	const ownId = useId();
	const selectId = id ?? `${ownId}-source`;
	const errorId = `${selectId}-error`;
	const asked = onDetailChange ? sourceDetailFor(source, value) : undefined;
	const noteFor = detailHint ?? hint;
	return (
		<>
			<div
				className={["field", "source-selector", error && "invalid", className]
					.filter(Boolean)
					.join(" ")}
			>
				<label htmlFor={selectId}>
					{source.label}
					{hint && (
						<>
							{" "}
							<small className="field-hint">{hint}</small>
						</>
					)}
				</label>
				<select
					id={selectId}
					name={name}
					required={source.required}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					{...(error && { "aria-invalid": true, "aria-describedby": errorId })}
				>
					<option value="">{source.placeholder ?? DEFAULT_SOURCE_PLACEHOLDER}</option>
					{sourceOptions(source).map((option) => (
						<option key={option.label} value={option.label}>
							{option.label}
						</option>
					))}
				</select>
				{error && (
					<span className="err" id={errorId}>
						{error}
					</span>
				)}
			</div>
			{asked && (
				<div className="field source-selector-detail">
					<label htmlFor={`${selectId}-detail`}>
						{asked.label}
						{noteFor && (
							<>
								{" "}
								<small className="field-hint">{noteFor}</small>
							</>
						)}
					</label>
					<input
						id={`${selectId}-detail`}
						name={SOURCE_DETAIL_KEY}
						type="text"
						maxLength={SOURCE_DETAIL_LIMIT}
						placeholder={asked.placeholder}
						value={detail}
						onChange={(event) => onDetailChange?.(event.target.value)}
					/>
				</div>
			)}
		</>
	);
}
