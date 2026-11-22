import type { Decorator } from "@storybook/react-vite";
import { expect } from "storybook/test";

/*
 * Helpers the primitives, components, and artifact stories share. They live
 * in the group's own folder rather than stories/support/ (read only while the
 * writers work); a later pass may lift them there.
 */

/** The page never scrolls sideways: the check every phone story ends on. */
export async function expectNoSidewaysScroll() {
	await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
}

/** A dark band behind a piece made for one (`onDark`). */
export const onDarkBand: Decorator = (Story) => (
	<div style={{ background: "var(--surface-dark)", padding: 24, color: "var(--on-dark)" }}>
		<Story />
	</div>
);

/** A page column around a piece, the way a section's `.wrap` sets it. */
export const inWrap: Decorator = (Story) => (
	<div className="wrap" style={{ paddingBlock: 32 }}>
		<Story />
	</div>
);
