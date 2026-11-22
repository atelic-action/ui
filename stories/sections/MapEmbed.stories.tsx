import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { MapEmbed } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { mapEmbedStandIn, siteWithEmbed, siteWithoutMap } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
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
	// Each story counts only the fetches made since it began.
	beforeEach: () => {
		storyStart = performance.now();
	},
} satisfies Meta<typeof MapEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

const address = "418 Alder Street, Fairhaven CO 80000";

/** The facade, named by the words it shows: the address, then the hint. */
const facadeName = new RegExp(`^${address}\\s*Tap to load the map$`);

/** When the running story began, so a fetch an earlier story made is not counted. */
let storyStart = 0;

/**
 * Every fetch this story has made for the embed (a prefetch, a script, an
 * image): the page's resource timings are shared by every story the file
 * runs, so only the ones since this story began count. A frame's own
 * navigation is not in this list, so the frames are counted apart.
 */
const embedRequests = () =>
	performance
		.getEntriesByType("resource")
		.filter((entry) => entry.startTime >= storyStart && entry.name.includes(mapEmbedStandIn));

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
 * A screenshot with no directions link: a plain picture, never a link that
 * promises directions and goes nowhere.
 */
export const StaticNoLink: Story = {
	args: { site: { ...site, mapLinkURL: undefined } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", { name: `Map to Kestrel Hollow Bakehouse, ${address}` }),
		).toBeInTheDocument();
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.queryByText("Get Directions")).toBeNull();
	},
};

/**
 * No screenshot: a facade named by the words it shows, the address and the
 * hint, so a reader who presses it by voice says what they see; no request
 * for the embed until it is pressed; then the live map loads in its place.
 */
export const ClickToLoad: Story = {
	args: { site: siteWithEmbed },
	play: async ({ canvas, userEvent, step }) => {
		const facade = canvas.getByRole("button", { name: facadeName });
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
			// The frame is lazy, so under load it can sit blank a while before it navigates.
			await waitFor(() => expect(framePaths()).toEqual([mapEmbedStandIn]), { timeout: 8000 });
		});
	},
};

/** The facade answers the keyboard: Enter loads the map. */
export const ClickToLoadByKeyboard: Story = {
	args: { site: siteWithEmbed },
	play: async ({ canvas, userEvent }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: facadeName })).toHaveFocus();
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
	globals: pin("phone"),
	args: { site: siteWithEmbed },
	play: async ({ canvas }) => {
		const facade = canvas.getByRole("button", { name: facadeName }).getBoundingClientRect();
		await expect(facade.width).toBeGreaterThan(300);
		await expectNoSidewaysScroll();
	},
};
