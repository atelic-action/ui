/**
 * `react-dom/server` as a preview card sees it. One story renders to a string
 * inside its play function, which a card never runs, so the name only has to
 * exist; the card carries no server renderer.
 */
export function renderToString(): string {
	throw new Error("react-dom/server is not loaded in a Design System card");
}
