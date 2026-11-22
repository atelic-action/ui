import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LocationSection } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { siteWithEmbed, siteWithoutMap } from "../fixtures/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The local section: where it is, who it serves, its hours, directions and a
 * call, beside the map. Its eyebrow, closed day, directions pill, and hours
 * heading carry known issues (stories/findings/).
 */
const meta = {
	title: "Sections/LocationSection",
	component: LocationSection,
	tags: ["known-issue"],
	parameters: {
		...knownIssues(
			"eyebrow-contrast",
			"muted-text-contrast",
			"location-hours-heading-order",
			"map-directions-contrast",
		),
	},
	args: {
		site,
		title: "On Alder Street, by the old mill",
		lead: "Park on Birch Row; the shop is the green door on the corner.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof LocationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The copy beside the map, the service areas as one sentence, and both actions. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("the default eyebrow, and the areas as prose", async () => {
			await expect(canvas.getByText("Find us")).toBeVisible();
			await expect(
				canvas.getByText("Proudly serving Fairhaven, Old Mill, and the Riverside blocks."),
			).toBeVisible();
		});
		await step("the hours under their heading", async () => {
			await expect(canvas.getByRole("heading", { level: 4, name: "Hours" })).toBeVisible();
			await expect(canvas.getByText("7:00a to 3:00p")).toBeVisible();
		});
		await step("directions open a new tab, the call never does", async () => {
			await expect(canvas.getByRole("link", { name: /^Get Directions/ })).toHaveAttribute(
				"target",
				"_blank",
			);
			const call = canvas.getByRole("link", { name: "(555) 555-0142" });
			await expect(call).toHaveAttribute("href", "tel:+15555550142");
			await expect(call).not.toHaveAttribute("target");
		});
		await step("the map sits beside the copy", async () => {
			const map = canvas.getByRole("img", { name: /^Map to/ }).getBoundingClientRect();
			const title = canvas.getByRole("heading", { level: 2 }).getBoundingClientRect();
			await expect(map.left).toBeGreaterThan(title.right);
		});
	},
};

/** One area reads as itself, with no list punctuation. */
export const OneArea: Story = {
	args: { site: { ...site, serviceAreas: ["Fairhaven"] } },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Proudly serving Fairhaven.")).toBeVisible();
	},
};

/** No areas: no sentence. */
export const NoAreas: Story = {
	args: { site: { ...site, serviceAreas: [] }, eyebrow: "Visit" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/Proudly serving/)).toBeNull();
		await expect(canvas.getByText("Visit")).toBeVisible();
	},
};

/** The 24 hour clock, from the site's config. */
export const TwentyFourHour: Story = {
	args: { site: { ...site, clock: "24h" } },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("07:00 to 15:00")).toBeVisible();
	},
};

/** No map screenshot: the click to load facade beside the copy. */
export const EmbedFacade: Story = {
	parameters: {
		...knownIssues(
			"eyebrow-contrast",
			"muted-text-contrast",
			"location-hours-heading-order",
			"inset-soft-text-contrast",
			"map-facade-name-mismatch",
		),
	},
	args: { site: siteWithEmbed },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: /Load the map/ })).toBeVisible();
	},
};

/** No map, no directions link, and no phone: the copy and the hours alone. */
export const Minimal: Story = {
	args: { site: { ...siteWithoutMap, phone: undefined }, lead: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** On a phone the map stacks under the copy, inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		title: "On Alder Street, by the old mill and the ferry landing",
		site: {
			...site,
			serviceAreas: [
				"Fairhaven",
				"Old Mill",
				"the Riverside blocks",
				"Lantern Square",
				"Hollow Creek",
			],
		},
	},
	play: async ({ canvas }) => {
		const map = canvas.getByRole("img", { name: /^Map to/ }).getBoundingClientRect();
		const call = canvas.getByRole("link", { name: "(555) 555-0142" }).getBoundingClientRect();
		await expect(map.top).toBeGreaterThanOrEqual(call.bottom);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
