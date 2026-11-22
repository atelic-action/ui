import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { type ArtifactParagraph, Paragraph } from "../../src/artifact";
import { longURL } from "../fixtures/primitives";
import { expectNoSidewaysScroll, inWrap } from "../primitives/support";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

const withLinks: ArtifactParagraph = [
	"The menu is a photo of the chalkboard, so ",
	{ text: "a phone has to pinch it to read", href: "https://kestrelhollow.example.com/menu" },
	", and the hours under it ",
	{ text: "disagree with the map", href: "#hours" },
	". ",
	{ text: "Write to the bakery", href: "mailto:hello@kestrelhollow.example.com" },
	" to ask.",
];

const withQueries: ArtifactParagraph = [
	"A neighbor typing ",
	{ query: "sourdough near me" },
	" finds three other bakeries first, and ",
	{ query: "bakery open sunday", href: "https://search.example.com/?q=bakery+open+sunday" },
	" finds none of them.",
];

/**
 * A document's paragraph carried as data: a plain string, or runs of text,
 * links, and search queries. A link leaving the page opens in a new tab; an
 * anchor or a mail link opens in place. A query is set in curly quotes and
 * italics.
 */
const meta = {
	title: "Artifact/Paragraph",
	component: Paragraph,
	decorators: [inWrap],
	args: { paragraph: "The bread is the best on Alder Street; the site has not caught up with it." },
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain string is one paragraph of words. */
export const PlainString: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/best on Alder Street/).tagName).toBe("P");
	},
};

/** Links among the words: out of the page in a new tab, an anchor and a mail link in place. */
export const Links: Story = {
	args: { paragraph: withLinks },
	play: async ({ canvas }) => {
		const out = canvas.getByRole("link", { name: "a phone has to pinch it to read" });
		await expect(out).toHaveAttribute("target", "_blank");
		await expect(out).toHaveAttribute("rel", expect.stringContaining("noopener"));
		await expect(canvas.getByRole("link", { name: "disagree with the map" })).not.toHaveAttribute(
			"target",
		);
		await expect(canvas.getByRole("link", { name: "Write to the bakery" })).not.toHaveAttribute(
			"target",
		);
	},
};

/** Search queries in curly quotes and italics; the quoted words are the link when it has one. */
export const Queries: Story = {
	args: { paragraph: withQueries },
	play: async ({ canvas }) => {
		const plain = canvas.getByText("“sourdough near me”");
		await expect(plain.tagName).toBe("EM");
		const linked = canvas.getByRole("link", { name: "“bakery open sunday”" });
		await expect(linked.closest("em")).toBeTruthy();
		await expect(linked).toHaveAttribute("target", "_blank");
	},
};

/** A class of the document's own on the paragraph. */
export const WithClass: Story = {
	args: { className: "lead" },
};

/** Runs that are all blank render an empty paragraph. */
export const Blank: Story = {
	args: { paragraph: ["  ", ""] },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector("p")?.textContent?.trim()).toBe("");
	},
};

/**
 * The longest paragraph a read carries, a bare address among the runs, on a
 * phone. It should wrap inside the screen; the address runs past it
 * (stories/findings/primitives.md, `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: {
		paragraph: [
			...withLinks,
			" The full list is at ",
			{ text: longURL, href: longURL },
			", which ",
			{ query: "seasonal tarts fairhaven" },
			" never reaches.",
		],
	},
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
