import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge } from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";

/** A small rounded label: a status, a count, a tag. */
const meta = {
	title: "App/UI/Badge",
	component: Badge,
	parameters: { layout: "padded" },
	args: { children: "Standing order" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Standing order")).toBeVisible();
	},
};

export const Secondary: Story = { args: { variant: "secondary", children: "Trial" } };

export const Outline: Story = { args: { variant: "outline", children: "Paused" } };

/** The destructive badge: white on the kit's red, which fails contrast. */
export const Destructive: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast") },
	args: { variant: "destructive", children: "Overdue" },
};

/** Every variant on one line, as a table's status column shows them. */
export const AllVariants: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast") },
	render: () => (
		<div className="flex gap-2">
			<Badge>Active</Badge>
			<Badge variant="secondary">Trial</Badge>
			<Badge variant="outline">Paused</Badge>
			<Badge variant="destructive">Overdue</Badge>
		</div>
	),
	play: async ({ canvas }) => {
		const tops = ["Active", "Trial", "Paused", "Overdue"].map((word) =>
			Math.round(canvas.getByText(word).getBoundingClientRect().top),
		);
		await expect(new Set(tops).size).toBe(1);
	},
};
