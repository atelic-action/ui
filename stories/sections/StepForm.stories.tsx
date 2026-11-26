import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { ChoiceCards } from "../../src/primitives";
import { StepForm } from "../../src/sections";
import { phone } from "../fixtures/bakery";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const STEPS = ["Bread", "Pickup", "You"];

/** The shell with a sample form of its own, so it can be read alone. */
function Sample(props: Partial<ComponentProps<typeof StepForm>> & { start?: number }) {
	const [at, setAt] = useState(props.start ?? 1);
	const [loaf, setLoaf] = useState("Country sourdough");
	const [when, setWhen] = useState("");
	return (
		<StepForm
			steps={STEPS}
			current={at}
			onStep={setAt}
			onBack={() => setAt((was) => Math.max(0, was - 1))}
			onNext={() => setAt((was) => Math.min(STEPS.length - 1, was + 1))}
			nextLabel={at === STEPS.length - 1 ? "Send" : undefined}
			title={`${STEPS[at]} step`}
			lead="A step's own fields go here. This one is a sample."
			summary={[
				{ label: "Loaf", value: loaf },
				{ label: "Pickup", value: when, detail: when ? "At the counter" : undefined },
			]}
			promise={
				<>
					<strong>A standing line.</strong> What the business promises once this is sent.
				</>
			}
			sentence={[loaf || undefined, when || undefined]}
			phone={phone}
			{...props}
		>
			<div className="field">
				<label htmlFor="sample-loaf">A loaf</label>
				<select id="sample-loaf" value={loaf} onChange={(event) => setLoaf(event.target.value)}>
					<option value="">Choose one</option>
					<option>Country sourdough</option>
					<option>Seeded rye</option>
				</select>
			</div>
			<div className="field">
				<label htmlFor="sample-name">Name on the order</label>
				<input id="sample-name" type="text" autoComplete="name" />
			</div>
			<ChoiceCards
				legend="When would you like it?"
				value={when}
				onChange={setWhen}
				options={[
					{
						value: "Saturday morning",
						label: "Saturday morning",
						description: "From seven, while it lasts.",
					},
					{ value: "Sunday morning", label: "Sunday morning", description: "From eight." },
				]}
			/>
		</StepForm>
	);
}

/**
 * Is the shell a long form is built on when it is taken in steps, with a
 * summary that stays in view; it owns no fields. The shell a form taken in
 * steps is built on: the step names across the top, one step with Back and its
 * button, and a summary that stays in view, beside the step from 900px and in
 * a bar at the foot of a phone. It owns no fields.
 */
const meta = {
	title: "Sections/StepForm",
	component: StepForm,
	// The sample holds the shell's state, so the args the table shows are its props' shape alone.
	args: {
		steps: STEPS,
		current: 1,
		onStep: () => {},
		onBack: () => {},
		onNext: () => {},
		title: "Pickup step",
		summary: [],
		children: null,
	},
	render: () => <Sample />,
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof StepForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The second step: the first a button back to it, the summary pinned beside the step. */
export const Desktop: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("a finished step is a button back to it, and its heading takes focus", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Back to Bread" }));
			await expect(canvas.getByRole("heading", { name: "Bread step" })).toHaveFocus();
		});
		await step("Continue moves on and Back comes back", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
			await expect(canvas.getByRole("heading", { name: "Pickup step" })).toHaveFocus();
			await userEvent.click(canvas.getByRole("button", { name: "Back" }));
			await expect(canvas.getByRole("heading", { name: "Bread step" })).toHaveFocus();
		});
		// A synthetic Enter never drives the platform's implicit submission
		// (stories/README.md), so the story proves the path it takes: the
		// step's button is the submit of the form its fields sit in.
		await step(
			"the step's button submits the step's fields, so Enter in one is the button",
			async () => {
				const field = canvas.getByLabelText("Name on the order") as HTMLInputElement;
				const button = canvas.getByRole("button", { name: "Continue" }) as HTMLButtonElement;
				await expect(button).toHaveAttribute("type", "submit");
				await expect(button.form).toBe(field.form);
				await userEvent.click(button);
				await expect(canvas.getByRole("heading", { name: "Pickup step" })).toHaveFocus();
			},
		);
		await step("the summary sits beside the step", async () => {
			const main = canvas.getByRole("heading", { name: "Pickup step" }).getBoundingClientRect();
			const summary = canvas
				.getByRole("complementary", { name: "Your request so far" })
				.getBoundingClientRect();
			await expect(summary.left).toBeGreaterThan(main.right);
		});
	},
};

/** A tablet: one column, the summary in the bar at the foot of the screen. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: "Your request so far: Country sourdough" }),
		).toBeVisible();
		await expectNoSidewaysScroll();
	},
};

/**
 * A phone: the bar's two lines open the whole summary as a modal sheet,
 * which its close button and the platform's Escape both close, focus going
 * back to the bar.
 */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent, step }) => {
		const opener = canvas.getByRole("button", { name: /Your request so far:/ });
		await step("the bar holds Back, the step's button, and the call button", async () => {
			await expect(canvas.getByRole("button", { name: "Back" })).toBeVisible();
			await expect(canvas.getByRole("button", { name: "Continue" })).toBeVisible();
			await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).toHaveAttribute(
				"href",
				"tel:+15555550142",
			);
		});
		await step("the lines open the sheet, and its close button closes it", async () => {
			await userEvent.click(opener);
			await expect(
				await canvas.findByRole("dialog", { name: "Your request so far" }),
			).toBeVisible();
			await userEvent.click(canvas.getByRole("button", { name: "Close" }));
			await waitFor(() => expect(opener).toHaveFocus());
			await expect(opener).toHaveAttribute("aria-expanded", "false");
		});
		await step("Escape closes it too", async () => {
			await userEvent.click(opener);
			const sheet = (await canvas.findByRole("dialog", {
				name: "Your request so far",
			})) as HTMLDialogElement;
			sheet.requestClose();
			await waitFor(() => expect(opener).toHaveAttribute("aria-expanded", "false"));
		});
		await step("the page never scrolls sideways", async () => {
			await expectNoSidewaysScroll();
		});
	},
};

/** A phone before anything is chosen: the bar offers the number in place of the lines. */
export const PhoneNothingChosen: Story = {
	globals: pin("phone"),
	render: () => <Sample start={0} summary={[{ label: "Loaf" }]} sentence={[]} />,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: /Rather talk now\?/ })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		await expect(canvas.queryByRole("button", { name: "Back" })).toBeNull();
	},
};
