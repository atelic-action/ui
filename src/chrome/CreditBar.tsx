/**
 * The standardized developer credit: a full width band, visually separate
 * from anything above it, centered and muted. Footer renders it at its foot,
 * and a page that drops the footer renders it on its own.
 *
 * The heart ships as an escape sequence: the no emoji test bars literal
 * pictographs from `src/`.
 */
export function CreditBar() {
	return (
		<div className="credit-bar">
			Developed with {"\u{1F49A}"} in Denver by{" "}
			<a href="https://atelic.me" target="_blank" rel="noopener">
				Atelic
			</a>
		</div>
	);
}
