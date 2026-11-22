import type { Decorator } from "@storybook/react-vite";

/** The shared check, kept here until the group's stories import it from support/. */
export { expectNoSidewaysScroll } from "../support/geometry";

/*
 * The decorators the primitives, components, and artifact stories share. The
 * checks every group shares (the sideways scroll, reduced motion, held
 * fragment jumps, settling) live in stories/support/.
 */

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
