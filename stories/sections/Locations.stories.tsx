import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Locations } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { locations, siteWithEmbed } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Shows a business with more than one address, a map beside a card for each.
 * More than one address: the flagship's map beside a card per location, each
 * with its hours, a call, and directions.
 */
const meta = {
	title: "Sections/Locations",
	component: Locations,
	args: {
		site,
		title: "Two counters, one bake",
		lead: "The same loaves at both, out of the Alder Street ovens every morning.",
		locations,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Locations>;

export default meta;
type Story = StoryObj<typeof meta>;

const card = (canvas: ReturnType<typeof within>, name: string) =>
	within(canvas.getByRole("heading", { level: 3, name }).parentElement as HTMLElement);

/** Each card: its name, note, address, hours, and two links, the call never in a new tab. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("the flagship's card carries its note", async () => {
			const alder = card(canvas, "Alder Street");
			await expect(alder.getByText("The original, since 2014")).toBeVisible();
			await expect(alder.getByText("418 Alder Street, Fairhaven CO 80000")).toBeVisible();
			await expect(alder.getByText("Sat and Sun · 08:00 to 14:00")).toBeVisible();
		});
		await step("a call link and a directions link", async () => {
			const lantern = card(canvas, "Lantern Square");
			const call = lantern.getByRole("link", { name: "(555) 555-0144" });
			await expect(call).toHaveAttribute("href", "tel:+15555550144");
			await expect(call).not.toHaveAttribute("target");
			const directions = lantern.getByRole("link", { name: "Directions" });
			await expect(directions).toHaveAttribute("target", "_blank");
		});
		await step("the map sits beside the cards", async () => {
			const map = canvas.getByRole("img", { name: /^Map to/ }).getBoundingClientRect();
			const first = canvas
				.getByRole("heading", { level: 3, name: "Alder Street" })
				.getBoundingClientRect();
			await expect(first.left).toBeGreaterThan(map.right);
		});
	},
};

/** A single location still reads as a card beside the map. */
export const OneLocation: Story = {
	args: { locations: locations.slice(0, 1), eyebrow: "Visit", lead: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(1);
	},
};

/** No screenshot: the flagship's click to load facade, named by its own words. */
export const EmbedFacade: Story = {
	args: { site: siteWithEmbed },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: /Tap to load the map$/ })).toBeVisible();
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** The tablet sits below the side by side step: the cards stack under the map. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const map = canvas.getByRole("img", { name: /^Map to/ }).getBoundingClientRect();
		const first = canvas
			.getByRole("heading", { level: 3, name: "Alder Street" })
			.getBoundingClientRect();
		await expect(first.top).toBeGreaterThanOrEqual(map.bottom);
	},
};

/** Many locations with the longest realistic lines, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		locations: [
			...locations,
			{
				name: "The Riverside blocks, at the ferry landing market",
				address: "2 Ferry Landing, Riverside Market Hall, stall 14, Fairhaven CO 80000",
				hours: ["Saturday only · 07:00 to 12:00, and the holiday Mondays in December"],
				phoneDisplay: "(555) 555-0145",
				phoneE164: "+15555550145",
				mapLink: "https://maps.example.com/?q=2+Ferry+Landing",
				note: "A market stall, from May to October",
			},
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
