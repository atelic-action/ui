/**
 * The widths a story pins, by name. A story sets
 * `globals: { viewport: { value: "phone" } }`; the test run sizes the page
 * to the named width and height before the story renders, and the toolbar
 * offers the same ones by hand. A story that pins none runs at 1200 by 900,
 * Storybook's own default.
 */
export const viewports = {
	phone: { name: "Phone 390", styles: { width: "390px", height: "844px" }, type: "mobile" },
	// The narrowest phone a site still meets (an older small phone), where a
	// row that fits at 390 runs out of room first.
	smallPhone: {
		name: "Small phone 320",
		styles: { width: "320px", height: "640px" },
		type: "mobile",
	},
	tablet: { name: "Tablet 820", styles: { width: "820px", height: "1180px" }, type: "tablet" },
	// The narrowest tablet a site still meets, the first width the footer
	// lays its columns in one flowing row (760, chrome.css) with any room.
	smallTablet: {
		name: "Small tablet 768",
		styles: { width: "768px", height: "1024px" },
		type: "tablet",
	},
	// A laptop's narrow window, and the width just under the footer's 1100
	// step, where a row with the most columns has the least room.
	laptop: { name: "Laptop 1024", styles: { width: "1024px", height: "768px" }, type: "desktop" },
	wideTablet: {
		name: "Wide tablet 1099",
		styles: { width: "1099px", height: "800px" },
		type: "desktop",
	},
	desktop: { name: "Desktop 1280", styles: { width: "1280px", height: "800px" }, type: "desktop" },
	// The narrowest desktop a bar holding groups shows them at (1180, chrome.css),
	// where the mega panel has the least room.
	narrowDesktop: {
		name: "Narrow desktop 1180",
		styles: { width: "1180px", height: "800px" },
		type: "desktop",
	},
	// The narrowest width the desktop bar shows at (900, chrome.css), where
	// every row a desktop lays out side by side has the least room.
	smallDesktop: {
		name: "Small desktop 900",
		styles: { width: "900px", height: "800px" },
		type: "desktop",
	},
} as const;

export type ViewportName = keyof typeof viewports;

/** The `globals` a story spreads in to pin a width: `globals: pin("phone")`. */
export function pin(name: ViewportName) {
	return { viewport: { value: name, isRotated: false } };
}
