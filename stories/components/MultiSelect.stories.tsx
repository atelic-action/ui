import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { MultiSelect } from "../../src/components";
import { expectNoSidewaysScroll } from "../support/geometry";
import { layerClosed, layerOpened } from "../support/settle";
import { pin } from "../support/viewports";

const onChange = fn();
const onSubmit = fn((event: SubmitEvent) => event.preventDefault());

const options = [
	"Sandwich loaves",
	"Sourdough",
	"Rye",
	{ value: "cakes", label: "Celebration cakes" },
	"Pastries",
	"Wholesale",
];

/**
 * A button naming what is chosen, over a Radix popover of Radix
 * checkboxes; any number may be ticked. In a form it submits each chosen
 * value under its name.
 */
const meta = {
	title: "Components/MultiSelect",
	component: MultiSelect,
	args: {
		label: "What can we bake for you?",
		hint: "(check all that apply)",
		name: "bakes",
		options,
		placeholder: "Choose any",
		countLabel: (count: number) => `${count} kinds chosen`,
		onChange,
	},
	beforeEach: () => {
		onChange.mockClear();
		onSubmit.mockClear();
	},
	render: (args) => (
		<form
			onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}
			style={{ display: "grid", gap: 16 }}
		>
			<MultiSelect {...args} />
			<button type="reset">Start over</button>
		</form>
	),
	decorators: [
		(Story) => (
			<div className="wrap" style={{ maxWidth: 520, paddingBlock: 24, minHeight: 520 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];
const button = (canvas: Canvas) => canvas.getByRole("button", { name: /What can we bake/ });
const list = (canvas: Canvas) => canvas.getByRole("dialog", { name: /What can we bake/ });
const submitted = (canvas: Canvas) =>
	new FormData(button(canvas).closest("form") as HTMLFormElement).getAll("bakes");

/**
 * A click opens the list onto its first choice; a second click on the
 * button, Escape, and a click outside each close it, Escape handing focus
 * back to the button.
 */
export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("closed, the button names the field and the placeholder", async () => {
			await expect(button(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(button(canvas)).toHaveAccessibleName(
				"What can we bake for you? (check all that apply) Choose any",
			);
		});
		await step("a click opens the list, focus on the first choice", async () => {
			await userEvent.click(button(canvas));
			const opened = await layerOpened(() => list(canvas));
			await expect(button(canvas)).toHaveAttribute("aria-expanded", "true");
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toHaveFocus();
			await expect(opened.getBoundingClientRect().top).toBeGreaterThanOrEqual(
				button(canvas).getBoundingClientRect().bottom,
			);
		});
		await step("Escape closes it and focus returns to the button", async () => {
			const opened = list(canvas);
			await userEvent.keyboard("{Escape}");
			await layerClosed(opened);
			await expect(button(canvas)).toHaveAttribute("aria-expanded", "false");
			await expect(button(canvas)).toHaveFocus();
		});
		await step("a click outside closes it", async () => {
			await userEvent.click(button(canvas));
			const opened = await layerOpened(() => list(canvas));
			await userEvent.click(document.body);
			await layerClosed(opened);
			await expect(button(canvas)).toHaveAttribute("aria-expanded", "false");
		});
		await step("a second click on the button closes it", async () => {
			await userEvent.click(button(canvas));
			const opened = await layerOpened(() => list(canvas));
			await userEvent.click(button(canvas));
			await layerClosed(opened);
		});
	},
};

/**
 * Ticked choices are named on the button, two of them by name and more by
 * count, and submitted with the form in the options' order.
 */
export const ChoosesSeveral: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await userEvent.click(button(canvas));
		await layerOpened(() => list(canvas));
		await step("two ticked: both named, in the options' order", async () => {
			await userEvent.click(canvas.getByRole("checkbox", { name: "Celebration cakes" }));
			await userEvent.click(canvas.getByText("Rye"));
			await expect(canvas.getByRole("checkbox", { name: "Rye" })).toHaveAttribute(
				"aria-checked",
				"true",
			);
			await expect(button(canvas)).toHaveTextContent("Rye, Celebration cakes");
			await expect(onChange).toHaveBeenLastCalledWith(["Rye", "cakes"]);
			await expect(submitted(canvas)).toEqual(["Rye", "cakes"]);
		});
		await step("a third: counted", async () => {
			await userEvent.click(canvas.getByRole("checkbox", { name: "Wholesale" }));
			await expect(button(canvas)).toHaveTextContent("3 kinds chosen");
		});
		await step("one unticked: named again", async () => {
			await userEvent.click(canvas.getByRole("checkbox", { name: "Rye" }));
			await expect(button(canvas)).toHaveTextContent("Celebration cakes, Wholesale");
			await expect(submitted(canvas)).toEqual(["cakes", "Wholesale"]);
		});
		await step("closed, the choices still submit", async () => {
			await userEvent.keyboard("{Escape}");
			await expect(submitted(canvas)).toEqual(["cakes", "Wholesale"]);
		});
	},
};

/**
 * The keyboard alone: Arrow Down opens onto the first choice, the arrows,
 * Home, and End move, Space ticks, and Enter closes back onto the button
 * without sending the form. Tab keeps to the open list, as a Radix
 * popover's focus scope does, so Escape and Enter are the ways out.
 */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Tab reaches the button; Arrow Down opens onto the first choice", async () => {
			await userEvent.tab();
			await expect(button(canvas)).toHaveFocus();
			await userEvent.keyboard("{ArrowDown}");
			await layerOpened(() => list(canvas));
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toHaveFocus();
		});
		await step("the arrows, Home, and End move between choices", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(canvas.getByRole("checkbox", { name: "Sourdough" })).toHaveFocus();
			await userEvent.keyboard("{End}");
			await expect(canvas.getByRole("checkbox", { name: "Wholesale" })).toHaveFocus();
			await userEvent.keyboard("{ArrowDown}");
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toHaveFocus();
			await userEvent.keyboard("{ArrowUp}");
			await expect(canvas.getByRole("checkbox", { name: "Wholesale" })).toHaveFocus();
			await userEvent.keyboard("{Home}");
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toHaveFocus();
		});
		await step("Space ticks", async () => {
			await userEvent.keyboard(" ");
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toBeChecked();
		});
		await step("Enter closes back onto the button and sends nothing", async () => {
			const opened = list(canvas);
			await userEvent.keyboard("{Enter}");
			await layerClosed(opened);
			await expect(button(canvas)).toHaveFocus();
			await expect(onSubmit).not.toHaveBeenCalled();
			await expect(button(canvas)).toHaveTextContent("Sandwich loaves");
		});
		await step("Tab stays in the open list, the last choice wrapping to the first", async () => {
			await userEvent.keyboard("{ArrowDown}");
			const opened = await layerOpened(() => list(canvas));
			await userEvent.keyboard("{End}");
			await userEvent.tab();
			await expect(canvas.getByRole("checkbox", { name: "Sandwich loaves" })).toHaveFocus();
			await userEvent.keyboard("{Escape}");
			await layerClosed(opened);
			await expect(button(canvas)).toHaveFocus();
		});
	},
};

/** The form's reset puts back the choices it started with. */
export const ResetsWithItsForm: Story = {
	args: { defaultValue: ["Sourdough"] },
	play: async ({ canvas, userEvent }) => {
		await expect(submitted(canvas)).toEqual(["Sourdough"]);
		await userEvent.click(button(canvas));
		await layerOpened(() => list(canvas));
		await userEvent.click(canvas.getByRole("checkbox", { name: "Pastries" }));
		await userEvent.click(canvas.getByRole("checkbox", { name: "Sourdough" }));
		await userEvent.keyboard("{Escape}");
		await expect(submitted(canvas)).toEqual(["Pastries"]);
		await userEvent.click(canvas.getByRole("button", { name: "Start over" }));
		await expect(submitted(canvas)).toEqual(["Sourdough"]);
		await expect(button(canvas)).toHaveTextContent("Sourdough");
	},
};

/** Chosen on first render. */
export const Prechosen: Story = {
	args: { defaultValue: ["Pastries", "Rye"] },
	play: async ({ canvas }) => {
		await expect(button(canvas)).toHaveTextContent("Rye, Pastries");
	},
};

/** On a phone the list is as wide as the button and the page never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(button(canvas));
		const opened = await layerOpened(() => list(canvas));
		const buttonBox = button(canvas).getBoundingClientRect();
		const listBox = opened.getBoundingClientRect();
		await expect(Math.round(listBox.width)).toBe(Math.round(buttonBox.width));
		await expectNoSidewaysScroll();
	},
};

/** Long choices wrap inside the list on the narrowest phone. */
export const LongestContent: Story = {
	globals: pin("smallPhone"),
	args: {
		options: [
			"A standing wholesale order for a cafe, a grocer, or a restaurant kitchen",
			"Something else",
		],
		defaultValue: ["Something else"],
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(button(canvas));
		await layerOpened(() => list(canvas));
		await expectNoSidewaysScroll();
	},
};

/**
 * The button's name keeps the space between the label and its hint even
 * when a page's HTML has lost the space between them (a minifier dropping a
 * whitespace text node): the two are named apart.
 */
export const NameKeepsItsSpaces: Story = {
	play: async ({ canvas }) => {
		const label = canvas.getByText("What can we bake for you?").closest("label") as HTMLElement;
		for (const node of Array.from(label.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) node.remove();
		}
		await expect(button(canvas)).toHaveAccessibleName(
			"What can we bake for you? (check all that apply) Choose any",
		);
	},
};
