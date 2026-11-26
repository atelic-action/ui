import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { expect, fn } from "storybook/test";
import { SourceSelector } from "../../src/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const onChange = fn();

/** The selector, its answer kept in the story's own state as a form keeps it. */
function Controlled(props: ComponentProps<typeof SourceSelector>) {
	const [value, setValue] = useState(props.value);
	return (
		<SourceSelector
			{...props}
			value={value}
			onChange={(next) => {
				setValue(next);
				props.onChange(next);
			}}
		/>
	);
}

/** The selector with its detail kept beside its answer, as a form that takes the detail keeps it. */
function WithDetail(props: ComponentProps<typeof SourceSelector>) {
	const [value, setValue] = useState(props.value);
	const [detail, setDetail] = useState("");
	return (
		<SourceSelector
			{...props}
			value={value}
			onChange={(next) => {
				setValue(next);
				props.onChange(next);
			}}
			detail={detail}
			onDetailChange={setDetail}
		/>
	);
}

/**
 * How a visitor heard about the business: a labeled native select of the
 * site's answers, an empty first row before them. The same `Source` a site
 * hands `ContactForm` and its function's `sourceField`.
 */
const meta = {
	title: "Primitives/SourceSelector",
	component: SourceSelector,
	args: {
		source: {
			label: "How did you hear about us?",
			options: ["Google", "A friend", "Instagram", "Walked by the shop", "Something else"],
		},
		value: "",
		hint: "(optional)",
		onChange,
	},
	beforeEach: () => {
		onChange.mockClear();
	},
	render: (args) => <Controlled {...args} />,
	decorators: [
		(Story) => (
			<div className="wrap" style={{ maxWidth: 560, paddingBlock: 24 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof SourceSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chosen from the list, the answer is handed up; the empty first row hands up none. */
export const Default: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const select = canvas.getByLabelText(/How did you hear about us\?/);
		await step("it opens on the empty first row", async () => {
			await expect(select).toHaveValue("");
			await expect(canvas.getByRole("option", { name: "Choose one" })).toBeInTheDocument();
		});
		await step("choosing an answer calls onChange with it", async () => {
			await userEvent.selectOptions(select, "A friend");
			await expect(onChange).toHaveBeenLastCalledWith("A friend");
			await expect(select).toHaveValue("A friend");
		});
		await step("going back to the first row calls onChange with nothing", async () => {
			await userEvent.selectOptions(select, "Choose one");
			await expect(onChange).toHaveBeenLastCalledWith("");
		});
	},
};

/**
 * Required and left unanswered: the select is marked invalid, outlined, and
 * described by the error under it, until an answer is chosen.
 */
export const RequiredWithError: Story = {
	args: {
		source: {
			label: "How did you hear about us?",
			options: ["Google", "A friend", "Instagram"],
			required: true,
		},
		hint: undefined,
		error: "Please choose an answer.",
	},
	play: async ({ canvas, userEvent, step }) => {
		const select = canvas.getByLabelText("How did you hear about us?");
		await step("it is required, marked invalid, and names its error", async () => {
			await expect(select).toBeRequired();
			await expect(select).toHaveAttribute("aria-invalid", "true");
			await expect(select).toHaveAccessibleDescription("Please choose an answer.");
			await expect(canvas.getByText("Please choose an answer.")).toBeVisible();
		});
		await step("an answer can still be chosen", async () => {
			await userEvent.selectOptions(select, "Google");
			await expect(onChange).toHaveBeenLastCalledWith("Google");
		});
	},
};

/** A long list with long answers, on a phone: the select keeps to the column. */
export const LongList: Story = {
	args: {
		source: {
			label: "Before you found us here, where did you first hear about the studio?",
			placeholder: "Choose the one that fits best",
			options: [
				"Google search",
				"Google Maps",
				"A friend or a family member",
				"A doctor, a physical therapist, or another provider who referred me",
				"Instagram",
				"Facebook",
				"A community event at the library",
				"Walked or drove past the studio",
				"A newsletter",
				"Something else",
			],
		},
	},
	globals: pin("phone"),
	play: async ({ canvas, userEvent, step }) => {
		const select = canvas.getByLabelText(/where did you first hear/);
		await step("every answer is offered after the empty row", async () => {
			await expect(canvas.getAllByRole("option")).toHaveLength(11);
		});
		await step("the longest answer can be chosen", async () => {
			await userEvent.selectOptions(
				select,
				"A doctor, a physical therapist, or another provider who referred me",
			);
			await expect(onChange).toHaveBeenLastCalledWith(
				"A doctor, a physical therapist, or another provider who referred me",
			);
		});
		await step("the page never scrolls sideways", async () => {
			await expectNoSidewaysScroll();
		});
	},
};

/**
 * An answer that asks for a detail (9.5.0): once it is chosen, a short text
 * field under the select takes what the visitor types, on a form that hands
 * the selector `onDetailChange`.
 */
export const AsksForDetail: Story = {
	args: {
		source: {
			label: "How did you hear about us?",
			options: [
				"Google",
				"Instagram",
				{ label: "A referral", detail: { label: "Who referred you?", placeholder: "A name" } },
			],
		},
	},
	render: (args) => <WithDetail {...args} />,
	play: async ({ canvas, userEvent, step }) => {
		await step("no detail field until the answer that asks for one", async () => {
			await expect(canvas.queryByLabelText(/Who referred you/)).toBeNull();
			await userEvent.selectOptions(
				canvas.getByLabelText(/How did you hear about us/),
				"A referral",
			);
		});
		await step("then the detail field takes what is typed", async () => {
			const detail = canvas.getByLabelText(/Who referred you/);
			await userEvent.type(detail, "A neighbor");
			await expect(detail).toHaveValue("A neighbor");
		});
	},
};
