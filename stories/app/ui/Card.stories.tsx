import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../../src/app/ui";
import { expectNoSidewaysScroll } from "../../support/geometry";
import { pin } from "../../support/viewports";

/**
 * Groups a title, content, and actions into one boxed unit in an app. The
 * kit's card: a header (title, description), content, and a footer, each
 * optional.
 */
const meta = {
	title: "App/UI/Card",
	component: Card,
	parameters: { layout: "padded" },
	render: (args) => (
		<Card {...args} className="max-w-md">
			<CardHeader>
				<CardTitle>Larkspur Coffee Bar</CardTitle>
				<CardDescription>Standing order, Monday to Saturday.</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Four trays at 06:15: two of morning buns, one country, one rye.</p>
			</CardContent>
			<CardFooter className="gap-2">
				<Button variant="outline">Edit</Button>
				<Button>Call</Button>
			</CardFooter>
		</Card>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every part, top to bottom. The title is a plain block, not a heading. */
export const Composed: Story = {
	play: async ({ canvas }) => {
		const order = [
			canvas.getByText("Larkspur Coffee Bar"),
			canvas.getByText("Standing order, Monday to Saturday."),
			canvas.getByText(/Four trays at 06:15/),
			canvas.getByRole("button", { name: "Edit" }),
		].map((element) => element.getBoundingClientRect().top);
		await expect([...order].sort((a, b) => a - b)).toEqual(order);
		await expect(canvas.queryByRole("heading")).toBeNull();
	},
};

/** Content alone, the way a stat or a list is boxed. */
export const ContentOnly: Story = {
	render: (args) => (
		<Card {...args} className="max-w-md">
			<CardContent className="pt-6">13 orders out today.</CardContent>
		</Card>
	),
};

/** A long title and description wrap on a phone. */
export const LongContentPhone: Story = {
	globals: pin("phone"),
	render: (args) => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>The Alder Street Reading Room and Tea House at the Old Mill</CardTitle>
				<CardDescription>
					Paused since 2026-10-02 while the kitchen is refitted; the standing order resumes when
					they call.
				</CardDescription>
			</CardHeader>
		</Card>
	),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
