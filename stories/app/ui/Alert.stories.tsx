import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Info } from "lucide-react";
import { expect } from "storybook/test";
import { AppPage } from "../../../src/app";
import { Alert, AlertDescription, AlertTitle } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

/**
 * A boxed message with an optional icon, a title, and a description. A plain
 * block read in its place unless told to `announce`: `"assertive"` is an
 * alert, `"polite"` a status. Its title is a paragraph unless given a
 * heading `level`.
 */
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

/** The default box: a calm notice on the page as it loads, announced by nothing and no heading. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Saturday drops move to 07:00")).toBeVisible();
		await expect(canvas.queryByRole("alert")).toBeNull();
		await expect(canvas.queryByRole("status")).toBeNull();
		await expect(canvas.queryByRole("heading")).toBeNull();
	},
};

/** Told to, it announces urgently: an `alert`. */
export const Assertive: Story = {
	args: { announce: "assertive" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("alert")).toHaveTextContent("Saturday drops move to 07:00");
	},
};

/** Or politely, waiting its turn: a `status`. */
export const Polite: Story = {
	args: { announce: "polite" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("status")).toHaveTextContent("Saturday drops move to 07:00");
		await expect(canvas.queryByRole("alert")).toBeNull();
	},
};

/** The destructive variant colors the words red (4.83 to 1 on the page). */
export const Destructive: Story = {
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

/** On a page under its `h1`, the title adds no heading, so the page's levels stay whole. */
export const OnAPage: Story = {
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
		await expect(canvas.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
			"Orders",
		]);
		await expect(canvas.getByText("Saturday drops move to 07:00")).toBeVisible();
	},
};

/** An alert that opens a part of the page takes the next heading level. */
export const TitleAsAHeading: Story = {
	render: (args) => (
		<AppPage title="Orders">
			<div className="px-6 lg:px-9">
				<Alert {...args}>
					<AlertTitle level={2}>Winter drops</AlertTitle>
					<AlertDescription>Every Saturday van leaves at 07:00.</AlertDescription>
				</Alert>
			</div>
		</AppPage>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 2, name: "Winter drops" })).toBeVisible();
	},
};

/** A long title and description wrap on a phone beside the icon. */
export const LongContentPhone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
