import type { Preview } from "@storybook/react-vite";
// The package's sheets in the order a site imports them (README, CSS Import
// Order), then the package's own theme in the place a site's theme.css
// takes, then the fonts and the page ground (./theme.css).
import "../src/styles/base.css";
import "../src/styles/chrome.css";
import "../src/styles/components.css";
import "../src/styles/primitives.css";
import "../src/styles/sections.css";
import "../src/styles/gate.css";
import "../src/styles/artifact.css";
import "../src/styles/theme.css";
import "./theme.css";
import { issues } from "../stories/support/known-issues";
import { judgeFileMarkers, judgeStoryMarkers } from "../stories/support/known-issues/stale";
import { viewports } from "../stories/support/viewports";
import { withApp, withEmail, withSiteRoot } from "./decorators";

/**
 * A followed link never leaves the story: a click on any link that is not an
 * in page jump is cancelled at the window, after the component's own
 * handler and any listener on the document have run, so a test can follow a link and assert what the
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
	// A test file's last story run judges every marker its stories carried:
	// one never seen violating fails the file (stale.ts).
	beforeAll: () => () => judgeFileMarkers(),
	// After each story's play and check, a marker whose bug is gone fails it.
	afterEach: async ({ id, name, parameters, viewMode }) => {
		await judgeStoryMarkers({ id, name, parameters, viewMode, issues });
	},
	beforeEach: () => {
		window.addEventListener("click", holdLinks);
		// The page scrolls between stories in the browser; every story starts at the top.
		window.scrollTo({ top: 0, behavior: "instant" });
		return () => window.removeEventListener("click", holdLinks);
	},
	parameters: {
		// Sections and chrome are full bleed; a primitive's story asks for padding.
		layout: "fullscreen",
		// A violation fails the story's test. Never weaken this here: a story
		// that exposes one is marked for itself and logged in its group's file
		// in stories/findings/ (stories/README.md, Accessibility and Bugs).
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
