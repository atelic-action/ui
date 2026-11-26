import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Rank } from "../../src/components";

/**
 * Shows a ranking, a place in an answer, or a dash in a table cell, with its
 * badge toned by what it means. A figure with its badge, for a table cell: the
 * badge in its tone, named for a screen reader by what it means, and the
 * figure beside it.
 */
const meta = {
	title: "Components/Rank",
	component: Rank,
	parameters: { layout: "padded" },
	args: { figure: "3", tone: "good", meaning: "Top three" },
} satisfies Meta<typeof Rank>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The badge's meaning is its name, so the tone is never color alone. */
export const Good: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Top three" })).toBeInTheDocument();
		await expect(canvas.getByText("3")).toBeVisible();
	},
};

export const Warn: Story = { args: { figure: "7", tone: "warn", meaning: "On the first page" } };

export const Bad: Story = { args: { figure: "—", tone: "bad", meaning: "Not placed" } };

export const Info: Story = { args: { figure: "1", tone: "info", meaning: "First" } };

export const Muted: Story = { args: { figure: "12", tone: "muted", meaning: "Off the map" } };

/** Linked in place to the page that holds the rank. */
export const Linked: Story = {
	args: { href: "#local-seo" },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "3" });
		await expect(link).toHaveAttribute("href", "#local-seo");
		await expect(link).not.toHaveAttribute("target");
	},
};

/** Linked out, in a new tab. */
export const LinkedNewTab: Story = {
	args: { href: "https://maps.example.com/?q=bakery", newTab: true },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "3" });
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	},
};

/** Down a column, every badge lines up whatever the figure's width. */
export const Column: Story = {
	render: () => (
		<div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
			<Rank figure="1" tone="good" meaning="First" />
			<Rank figure="12" tone="warn" meaning="On the second page" />
			<Rank figure="—" tone="bad" meaning="Not placed" />
		</div>
	),
	play: async ({ canvas }) => {
		const badges = canvas.getAllByRole("img");
		const lefts = badges.map((b) => Math.round(b.getBoundingClientRect().left));
		await expect(new Set(lefts).size).toBe(1);
		// The figure's slot is a fixed width, so each whole rank is as wide as the next.
		const widths = badges.map((b) =>
			Math.round(b.parentElement?.getBoundingClientRect().width ?? 0),
		);
		await expect(new Set(widths).size).toBe(1);
	},
};
