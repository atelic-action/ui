import type { Preview } from "@storybook/react-vite";
// The package's sheets in the order a site imports them (README, CSS Import
// Order), then the theme last, as a site's theme.css is.
import "../src/styles/base.css";
import "../src/styles/chrome.css";
import "../src/styles/components.css";
import "../src/styles/primitives.css";
import "../src/styles/sections.css";
import "../src/styles/gate.css";
import "../src/styles/artifact.css";
import "./theme.css";
import { viewports } from "../stories/support/viewports";
import { withApp, withEmail, withSiteRoot } from "./decorators";

/**
 * A followed link never leaves the story: a click on any link that is not an
 * in page jump is cancelled at the document, after the component's own
 * handler has run, so a test can follow a link and assert what the
 * component did about it (a panel closing, a menu reporting closed).
 */
function holdLinks(event: MouseEvent) {
	const link = (event.target as Element | null)?.closest?.("a[href]");
	if (link && !link.getAttribute("href")?.startsWith("#")) event.preventDefault();
}

const preview: Preview = {
	// Every component gets its docs page: the stories in one column and the props table.
	tags: ["autodocs"],
	decorators: [withSiteRoot, withEmail, withApp],
	beforeEach: () => {
		document.addEventListener("click", holdLinks);
		// The page scrolls between stories in the browser; every story starts at the top.
		window.scrollTo({ top: 0, behavior: "instant" });
		return () => document.removeEventListener("click", holdLinks);
	},
	parameters: {
		// Sections and chrome are full bleed; a primitive's story asks for padding.
		layout: "fullscreen",
		// A violation fails the story's test. Never weaken this here: a story
		// that exposes one sets `a11y: { test: "todo" }` for itself and logs it
		// in stories/FINDINGS.md (stories/README.md, Findings).
		a11y: { test: "error" },
		viewport: { options: viewports },
		controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
	},
	globalTypes: {
		density: {
			description: "The section spacing on the .atelic-ui root (README, Density)",
			toolbar: {
				title: "Density",
				icon: "component",
				items: [
					{ value: "default", title: "Default" },
					{ value: "compact", title: "Compact" },
					{ value: "comfortable", title: "Comfortable" },
				],
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: { density: "default" },
};

export default preview;
