import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ProfileCards } from "../../src/sections";
import { profiles, unbroken } from "../fixtures/sections";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * Equal weight cards for the people behind the counter: a portrait beside a
 * short bio.
 */
const meta = {
	title: "Sections/ProfileCards",
	component: ProfileCards,
	args: {
		id: "bakers",
		eyebrow: "The bakers",
		title: "Three people, one oven",
		lead: "Everyone here bakes, and everyone here answers the phone.",
		items: profiles,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ProfileCards>;

export default meta;
type Story = StoryObj<typeof meta>;

const cards = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list")).getAllByRole("listitem");

/** A linked card is one link named by its person; an unlinked card is plain. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("each card: the portrait beside the name, the role under it", async () => {
			const ines = within(cards(canvas)[0]);
			const portrait = ines.getByRole("img", { name: "Ines at the bench, shaping a loaf" });
			const name = ines.getByRole("heading", { level: 3, name: "Ines Varga" });
			await expect(portrait.getBoundingClientRect().right).toBeLessThanOrEqual(
				name.getBoundingClientRect().left,
			);
			await expect(ines.getByText("Head baker")).toBeVisible();
		});
		await step("a card with an href is one link, its label trailing", async () => {
			const link = canvas.getByRole("link", { name: /Ines Varga/ });
			await expect(link).toHaveAttribute("href", "/team/ines");
			await expect(link).toHaveTextContent("Meet Ines →");
			await expect(canvas.getByRole("link", { name: /Theo Marsh/ })).toHaveTextContent("More →");
		});
		await step("a card with no href is not a link", async () => {
			await expect(within(cards(canvas)[2]).queryByRole("link")).toBeNull();
		});
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** Before the portraits exist: each card its brief, or the word Photo. */
export const Placeholders: Story = {
	args: {
		items: [
			{ ...profiles[0], image: undefined, placeholder: "Portrait: Ines at the bench" },
			{ ...profiles[1], image: undefined },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Portrait: Ines at the bench")).toBeVisible();
		await expect(canvas.getByText("Photo")).toBeVisible();
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** On a phone the cards stack, inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const [a, b] = cards(canvas);
		await expect(b.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			a.getBoundingClientRect().bottom,
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** The longest realistic bios, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: [
			{
				...profiles[0],
				name: "Ines Varga de la Fuente",
				meta: "@kestrelhollow.ines",
				blurb:
					"Mixes the levain every night at ten, shapes every loaf by hand, and has not missed a Saturday since the shop opened on Alder Street in 2014.",
			},
			...profiles.slice(1),
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * One unbroken handle under a name, on a phone. The card's body never breaks
 * it, so the card, and the page, scroll sideways.
 */
export const UnbrokenHandle: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: { items: [{ ...profiles[0], meta: `@${unbroken.toLowerCase()}` }] },
	play: async () => {
		await knownBug("profile-long-word-overflow", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
