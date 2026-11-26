import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { ChoiceCards } from "../../src/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const onChange = fn();

function Controlled(props: ComponentProps<typeof ChoiceCards>) {
	const [value, setValue] = useState(props.value);
	return (
		<ChoiceCards
			{...props}
			value={value}
			onChange={(next) => {
				setValue(next);
				props.onChange(next);
			}}
		/>
	);
}

/**
 * A choice seen whole: two or three answers, each a card holding its radio,
 * its name, and a line under it. A radio group to the keyboard; the whole
 * card chooses.
 */
const meta = {
	title: "Primitives/ChoiceCards",
	component: ChoiceCards,
	args: {
		legend: "How would you like to meet?",
		value: "",
		onChange,
		options: [
			{
				value: "visit",
				label: "At your venue",
				description: "About 1 hour. We come out and look at the space.",
			},
			{
				value: "call",
				label: "By phone",
				description: "About 30 minutes. We call you and talk it through.",
			},
		],
	},
	beforeEach: () => {
		onChange.mockClear();
	},
	render: (args) => <Controlled {...args} />,
	decorators: [
		(Story) => (
			<div className="wrap" style={{ paddingBlock: 24 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ChoiceCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two cards side by side; a click anywhere on a card chooses it, the arrows move between them. */
export const Default: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const group = canvas.getByRole("group", { name: "How would you like to meet?" });
		await step("a click on a card's line chooses it", async () => {
			await userEvent.click(canvas.getByText("About 30 minutes. We call you and talk it through."));
			await expect(canvas.getByRole("radio", { name: /By phone/ })).toBeChecked();
			await expect(onChange).toHaveBeenLastCalledWith("call");
		});
		await step("the arrows move the choice", async () => {
			await userEvent.keyboard("{ArrowLeft}");
			await expect(canvas.getByRole("radio", { name: /At your venue/ })).toBeChecked();
			await expect(canvas.getByRole("radio", { name: /At your venue/ })).toHaveFocus();
		});
		await step("the cards share a line", async () => {
			const [a, b] = canvas
				.getAllByRole("radio")
				.map((radio) => radio.closest("label")?.getBoundingClientRect());
			await expect(a?.top).toBe(b?.top);
			await expect(group).toBeVisible();
		});
	},
};

/** Sent with no answer: the group is described by why. */
export const WithError: Story = {
	args: { error: "Choose a visit or a call." },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("group", { name: "How would you like to meet?" }),
		).toHaveAccessibleDescription("Choose a visit or a call.");
	},
};

/** The narrowest phone: the cards stack before either goes narrower than it reads. */
export const SmallPhone: Story = {
	globals: pin("smallPhone"),
	args: { value: "visit" },
	play: async ({ canvas }) => {
		const [a, b] = canvas
			.getAllByRole("radio")
			.map((radio) => radio.closest("label")?.getBoundingClientRect());
		await expect(b?.top ?? 0).toBeGreaterThanOrEqual(a?.bottom ?? 0);
		await expectNoSidewaysScroll();
	},
};
