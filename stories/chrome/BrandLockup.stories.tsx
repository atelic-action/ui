import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BrandLockup } from "../../src/chrome";
import { brand, wordmarkBrand } from "../fixtures/bakery";
import { knownIssues } from "../support/known-issues";

/** The header's identity as one link: the mark, the wordmark, and the trailing run. */
const meta = {
	title: "Chrome/BrandLockup",
	component: BrandLockup,
	parameters: { layout: "padded" },
	args: { brand },
} satisfies Meta<typeof BrandLockup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mark picture beside the wordmark; the picture is silent, the link names the business. */
export const MarkAndWordmark: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		await expect(link).toHaveAttribute("href", "/");
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** A wordmark with the trailing run and no picture. */
export const WordmarkWithRun: Story = {
	args: { brand: wordmarkBrand },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" }),
		).toHaveTextContent("kestrel hollow");
	},
};

/**
 * A glyph tile in place of a picture. The tile's letter runs into the
 * wordmark's in the visible text ("KKestrel Hollow"), which the link's name
 * does not contain (FINDINGS.md).
 */
export const Tile: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("tile-lockup-name") },
	args: {
		brand: { name: "Kestrel Hollow Bakehouse", logo: { tile: "K", wordmark: "Kestrel Hollow" } },
	},
};

/** A sent document's lockup: the sender, a times sign, then the recipient's mark. */
export const WithRecipient: Story = {
	args: {
		brand: {
			name: "atelic",
			logo: { wordmark: "atelic", run: true },
			recipient: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow Bakehouse" },
		},
	},
	decorators: [
		(Story) => (
			<div style={{ background: "var(--surface-dark)", padding: 16 }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "atelic × Kestrel Hollow Bakehouse home" }),
		).toBeVisible();
	},
};

/** The site sets the link's name when "<name> home" will not do. */
export const AriaLabel: Story = {
	args: { ariaLabel: "Kestrel Hollow, the front page" },
	play: async ({ canvas }) => {
		// The name keeps the visible wordmark in it, so a voice user can say what they see.
		await expect(
			canvas.getByRole("link", { name: "Kestrel Hollow, the front page" }),
		).toBeVisible();
	},
};

/** The longest realistic name, set as the wordmark too. */
export const LongName: Story = {
	args: {
		brand: {
			name: "Kestrel Hollow Bakehouse and Wholesale Kitchen",
			logo: { wordmark: "Kestrel Hollow Bakehouse and Wholesale Kitchen", run: true },
		},
	},
};
