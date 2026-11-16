import { newTabProps } from "../lib/newTabProps";

/**
 * The practice's credit: where the site was made and by whom, with the
 * practice in one link. The closing bar's default right side.
 *
 * The heart ships as an escape sequence: the no emoji test bars literal
 * pictographs from `src/`.
 */
export function Credit() {
	return (
		<span className="credit">
			Made with {"\u{1F49A}"} in Denver, Colorado by{" "}
			<a href="https://atelic.me" {...newTabProps("https://atelic.me", true)}>
				Atelic
			</a>
		</span>
	);
}
