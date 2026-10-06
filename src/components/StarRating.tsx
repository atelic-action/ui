import { Star } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, useState } from "react";

const STEP = 0.5;

export interface StarRatingProps {
	/** The rating, in half star steps from 0.5 up to `max`; null is unrated. */
	value: number | null;
	/** Called with the new rating, or null to clear it. Leave it out for a read only row. */
	onChange?: (value: number | null) => void;
	/** How many stars the scale runs to. */
	max?: number;
	/** The side of one star, in pixels. */
	size?: number;
	/** The color of a filled star: any CSS color. Defaults to the text color around it. */
	fillColor?: string;
	/** The color of a star's outline: any CSS color. Defaults to a faint tint of the text color. */
	outlineColor?: string;
	/** What a screen reader calls the row. */
	label?: string;
	className?: string;
}

/** "4.5 stars", "1 star", "Not rated": the rating as a person would say it. */
export function describeStarRating(value: number | null): string {
	if (value === null) return "Not rated";
	return `${value} ${value === 1 ? "star" : "stars"}`;
}

/**
 * A row of stars that shows a rating in half star steps and, given `onChange`,
 * takes one. Each star is two hit targets, its left half and its right, so a
 * pointer lands on 3.5 or 4 without a second control. Picking the rating
 * already set clears it, which is the only way back to unrated and needs no
 * button of its own.
 *
 * To a keyboard and a screen reader an editable row is one slider: the arrows
 * move half a star, Home clears, End is the top of the scale. The halves stay
 * out of the tab order, so the row is one stop rather than ten. Without
 * `onChange` it is a picture with the rating as its name.
 *
 * The two colors are the `--star-fill` and `--star-outline` custom properties.
 * `fillColor` and `outlineColor` set them on this row; a site may also set
 * them in its own CSS for every row at once.
 */
export function StarRating({
	value,
	onChange,
	max = 5,
	size = 24,
	fillColor,
	outlineColor,
	label = "Rating",
	className,
}: StarRatingProps) {
	const [hover, setHover] = useState<number | null>(null);
	const shown = hover ?? value ?? 0;

	const style = {
		"--star-size": `${size}px`,
		...(fillColor ? { "--star-fill": fillColor } : {}),
		...(outlineColor ? { "--star-outline": outlineColor } : {}),
	} as CSSProperties;
	const classes = ["star-rating", className].filter(Boolean).join(" ");

	const stars = Array.from({ length: max }, (_, i) => i + 1).map((star) => {
		const fill = shown >= star ? "100%" : shown >= star - STEP ? "50%" : "0%";
		return (
			<span key={star} className="star-rating-star">
				<Star aria-hidden="true" size={size} className="star-rating-outline" />
				<span aria-hidden="true" className="star-rating-fill" style={{ width: fill }}>
					<Star size={size} />
				</span>
				{onChange &&
					[star - STEP, star].map((rating, half) => (
						<button
							key={rating}
							type="button"
							tabIndex={-1}
							aria-label={describeStarRating(rating)}
							className={`star-rating-hit ${half === 0 ? "is-left" : "is-right"}`}
							onMouseEnter={() => setHover(rating)}
							onClick={() => {
								// Drop the preview with the pick: the pointer is still on this
								// half, and a preview left up would hide a clear behind the
								// very stars it just emptied.
								setHover(null);
								onChange(rating === value ? null : rating);
							}}
						/>
					))}
			</span>
		);
	});

	if (!onChange) {
		return (
			<span
				role="img"
				aria-label={`${label}: ${describeStarRating(value)}`}
				className={classes}
				style={style}
			>
				{stars}
			</span>
		);
	}

	const set = (next: number | null) => {
		if (next !== value) onChange(next);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		const current = value ?? 0;
		switch (event.key) {
			case "ArrowRight":
			case "ArrowUp":
				set(Math.min(max, current + STEP));
				break;
			case "ArrowLeft":
			case "ArrowDown":
				set(current - STEP > 0 ? current - STEP : null);
				break;
			case "Home":
				set(null);
				break;
			case "End":
				set(max);
				break;
			default:
				return;
		}
		event.preventDefault();
	};

	return (
		<span
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value ?? 0}
			aria-valuetext={describeStarRating(value)}
			className={`${classes} is-editable`}
			style={style}
			onKeyDown={onKeyDown}
			onMouseLeave={() => setHover(null)}
		>
			{stars}
		</span>
	);
}
