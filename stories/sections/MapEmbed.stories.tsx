import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { MapEmbed } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { mapEmbedStandIn, siteWithEmbed, siteWithoutMap } from "../fixtures/sections";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The location map: a static screenshot linking to directions, or, with no
 * screenshot, a click to load facade over the live embed, which fetches
 * nothing until it is asked for.
 */
const meta = {
	title: "Sections/MapEmbed",
	component: MapEmbed,
	args: { site },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap" style={{ maxWidth: 520 }}>
					<h2>Find us</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof MapEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

const address = "418 Alder Street, Fairhaven CO 80000";

/**
 * Every fetch the page has made for the embed (a prefetch, a script, an
 * image). A frame's own navigation is not in this list, so the frames are
 * counted apart.
 */
const embedRequests = () =>
	performance.getEntriesByType("resource").filter((entry) => entry.name.includes(mapEmbedStandIn));

/** The pages loaded in frames inside the story, by path. */
const framePaths = () =>
	Array.from({ length: window.frames.length }, (_, i) => {
		try {
			return window.frames[i].location.pathname;
		} catch {
			return "cross origin";
		}
	});

/** The screenshot, as one link to directions that opens a new tab. */
export const Static: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("map-directions-contrast") },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", {
			name: `Get directions to Kestrel Hollow Bakehouse, ${address}`,
		});
		await expect(link).toHaveAttribute("href", "https://maps.example.com/?q=418+Alder+Street");
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
		await expect(
			canvas.getByRole("img", { name: `Map to Kestrel Hollow Bakehouse, ${address}` }),
		).toBeInTheDocument();
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/**
 * A screenshot with no directions link. The picture is still wrapped in a
 * link that promises directions, to `#`, which goes nowhere but the top of
 * the page.
 */
export const StaticNoLink: Story = {
	parameters: { ...knownIssues("map-directions-contrast") },
	tags: ["known-issue"],
	args: { site: { ...site, mapLinkURL: undefined } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", { name: `Map to Kestrel Hollow Bakehouse, ${address}` }),
		).toBeInTheDocument();
		await knownBug("map-static-dead-link", async () => {
			await expect(canvas.queryByRole("link", { name: /Get directions/ })).toBeNull();
		});
	},
};

/**
 * No screenshot: a facade naming the address, and no request for the embed
 * until the facade is pressed; then the live map loads in its place.
 */
export const ClickToLoad: Story = {
	args: { site: siteWithEmbed },
	play: async ({ canvas, userEvent, step }) => {
		const facade = canvas.getByRole("button", {
			name: `Load the map to Kestrel Hollow Bakehouse, ${address}`,
		});
		await step("before the press, nothing is fetched", async () => {
			await expect(facade).toHaveTextContent(address);
			await new Promise((resolve) => setTimeout(resolve, 300));
			await expect(embedRequests()).toHaveLength(0);
			await expect(framePaths()).toEqual([]);
			await expect(canvas.queryByTitle(/Map to/)).toBeNull();
		});
		await step("the press loads the live map in its place", async () => {
			await userEvent.click(facade);
			const frame = await waitFor(() =>
				canvas.getByTitle(`Map to Kestrel Hollow Bakehouse, ${address}`),
			);
			await expect(frame).toHaveAttribute("src", siteWithEmbed.mapEmbedURL);
			await expect(canvas.queryByRole("button")).toBeNull();
			await waitFor(() => expect(framePaths()).toEqual([mapEmbedStandIn]), { timeout: 3000 });
		});
	},
};

/** The facade answers the keyboard: Enter loads the map. */
export const ClickToLoadByKeyboard: Story = {
	args: { site: siteWithEmbed },
	play: async ({ canvas, userEvent }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: /Load the map/ })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(canvas.getByTitle(/Map to/)).toBeInTheDocument());
	},
};

/** Neither a screenshot nor an embed: nothing drawn at all. */
export const NoMap: Story = {
	args: { site: siteWithoutMap },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.queryByRole("button")).toBeNull();
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** On a phone the frame fills the column, inside the page. */
export const Phone: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("inset-soft-text-contrast", "map-facade-name-mismatch") },
	globals: pin("phone"),
	args: { site: siteWithEmbed },
	play: async ({ canvas }) => {
		const facade = canvas.getByRole("button", { name: /Load the map/ }).getBoundingClientRect();
		await expect(facade.width).toBeGreaterThan(300);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
