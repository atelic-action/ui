import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Info } from "lucide-react";
import { expect } from "storybook/test";
import { AppPage } from "../../../src/app";
import { Alert, AlertDescription, AlertTitle } from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";
import { pin } from "../../support/viewports";

/** A boxed message with an optional icon, a title, and a description. */
const meta = {
	title: "App/UI/Alert",
	component: Alert,
	parameters: { layout: "padded" },
	render: (args) => (
		<Alert {...args}>
			<Info className="h-4 w-4" aria-hidden="true" />
			<AlertTitle>Saturday drops move to 07:00</AlertTitle>
			<AlertDescription>
				The market opens late through the winter, so the first van leaves an hour later.
			</AlertDescription>
		</Alert>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default box. Every alert is a live `alert`, even a calm notice. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("alert")).toHaveTextContent("Saturday drops move to 07:00");
		await expect(
			canvas.getByRole("heading", { name: "Saturday drops move to 07:00" }),
		).toBeVisible();
	},
};

/** The destructive variant colors the words red, which fails contrast. */
export const Destructive: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast") },
	args: { variant: "destructive" },
	render: (args) => (
		<Alert {...args}>
			<CircleAlert className="h-4 w-4" aria-hidden="true" />
			<AlertTitle>The ledger did not sync</AlertTitle>
			<AlertDescription>Orders after 05:00 are not counted yet.</AlertDescription>
		</Alert>
	),
};

/** Without an icon the words start at the box's padding. */
export const NoIcon: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle>No drops on Thanksgiving</AlertTitle>
			<AlertDescription>The bakehouse is closed 2026-11-26.</AlertDescription>
		</Alert>
	),
};

/**
 * On a page under its `h1`. The title is always an `h5`, so the page skips
 * from level one to level five.
 */
export const OnAPage: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("alert-title-heading-level") },
	render: (args) => (
		<AppPage title="Orders">
			<div className="px-6 lg:px-9">
				<Alert {...args}>
					<Info className="h-4 w-4" aria-hidden="true" />
					<AlertTitle>Saturday drops move to 07:00</AlertTitle>
					<AlertDescription>Through the winter.</AlertDescription>
				</Alert>
			</div>
		</AppPage>
	),
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("heading", { level: 5, name: "Saturday drops move to 07:00" }),
		).toBeVisible();
	},
};

/** A long title and description wrap on a phone beside the icon. */
export const LongContentPhone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
