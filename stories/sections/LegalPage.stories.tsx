import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LegalPage } from "../../src/sections";
import { legalDoc, longEmail } from "../fixtures/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A legal document carried as data: its revision date, then its blocks
 * verbatim. The muted dateline fails contrast on this theme (stories/findings/sections.md).
 */
const meta = {
	title: "Sections/LegalPage",
	component: LegalPage,
	args: { doc: legalDoc },
	decorators: [
		(Story) => (
			<>
				<h1 style={{ padding: "0 var(--gutter)" }}>Privacy</h1>
				<Story />
			</>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The date first, the headings as h2, and the capitals left exactly as the source sets them. */
export const Default: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	play: async ({ canvas }) => {
		const updated = canvas.getByText("Last updated: 2026-09-01");
		const first = canvas.getByRole("heading", { level: 2, name: "What we collect" });
		await expect(updated.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			first.getBoundingClientRect().top,
		);
		await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
		await expect(canvas.getByText(/THE SITE IS PROVIDED AS IS/)).toBeVisible();
	},
};

/** A source that states no revision date gets none invented. */
export const NoDate: Story = {
	args: { doc: { ...legalDoc, lastUpdated: null } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/Last updated/)).toBeNull();
	},
};

export const AltSurface: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	args: { surface: "alt" },
};

/** No blocks: only the date. */
export const Empty: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	args: { doc: { ...legalDoc, blocks: [] } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
	},
};

/** A long document with a long contact address, on a phone. */
export const LongestContent: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	globals: pin("phone"),
	args: {
		doc: {
			...legalDoc,
			blocks: [
				...legalDoc.blocks,
				...legalDoc.blocks,
				{ type: "h", text: "How to reach us about your information" },
				{ type: "p", text: `Write to ${longEmail} and we answer within a week.` },
			],
		},
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
