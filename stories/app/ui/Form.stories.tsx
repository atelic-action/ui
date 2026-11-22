import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { expect, fn, userEvent } from "storybook/test";
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from "../../../src/app/ui";
import { expectNoSidewaysScroll } from "../../support/geometry";
import { until } from "../../support/settle";
import { pin } from "../../support/viewports";

type StandingOrder = { cafe: string; trays: string; note: string };

/** What a valid submit sends, fresh for each story. */
const submitted = { spy: fn() };

/** Every id an element's `aria-describedby` names, and whether each one is on the page. */
function describedBy(element: HTMLElement) {
	return (element.getAttribute("aria-describedby") ?? "")
		.split(" ")
		.filter(Boolean)
		.map((id) => ({ id, found: document.getElementById(id) !== null }));
}

function StandingOrderForm() {
	const form = useForm<StandingOrder>({ defaultValues: { cafe: "", trays: "", note: "" } });
	return (
		<Form {...form}>
			<form
				aria-label="Standing order"
				noValidate
				className="max-w-md space-y-6"
				onSubmit={form.handleSubmit((values) => submitted.spy(values))}
			>
				<FormField
					control={form.control}
					name="cafe"
					rules={{ required: "Name the cafe the order goes to." }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Cafe</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormDescription>As it should print on the delivery label.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="trays"
					rules={{
						required: "Say how many trays.",
						pattern: { value: /^[1-9]\d*$/, message: "Trays are a whole number, one or more." },
					}}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Trays</FormLabel>
							<FormControl>
								<Input inputMode="numeric" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="note"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Note for the driver</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormDescription>Optional.</FormDescription>
						</FormItem>
					)}
				/>
				<Button type="submit">Save the order</Button>
			</form>
		</Form>
	);
}

/**
 * The kit's form parts on react-hook-form: a label, a control, a description,
 * and a message per field, tied together by ids, so a field names its label,
 * is described by its help and its error, and says when it is invalid.
 */
const meta = {
	title: "App/UI/Form",
	component: StandingOrderForm,
	parameters: { layout: "padded" },
	beforeEach: () => {
		submitted.spy = fn();
	},
	render: () => <StandingOrderForm />,
	globals: pin("desktop"),
} satisfies Meta<typeof StandingOrderForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Untouched: each field named by its label, described by its help, and valid. */
export const Untouched: Story = {
	play: async ({ canvas }) => {
		const cafe = canvas.getByRole("textbox", { name: "Cafe" });
		await expect(cafe).toHaveAccessibleDescription("As it should print on the delivery label.");
		await expect(cafe).toHaveAttribute("aria-invalid", "false");
		await expect(
			canvas.getByRole("textbox", { name: "Note for the driver" }),
		).toHaveAccessibleDescription("Optional.");
	},
};

/** Submitting empty marks both required fields invalid, their labels and messages in the kit's red (4.83 to 1), each described by its own message, and sends nothing. */
export const SubmitEmpty: Story = {
	play: async ({ canvas, step }) => {
		const cafe = canvas.getByRole("textbox", { name: "Cafe" });
		const trays = canvas.getByRole("textbox", { name: "Trays" });
		await step("submit with nothing filled in", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
			await until(() => expect(cafe).toHaveAttribute("aria-invalid", "true"));
		});
		await step("each message is tied to its field", async () => {
			await expect(cafe).toHaveAccessibleDescription(
				"As it should print on the delivery label. Name the cafe the order goes to.",
			);
			await expect(trays).toHaveAttribute("aria-invalid", "true");
			await expect(trays).toHaveAccessibleDescription("Say how many trays.");
			await expect(submitted.spy).not.toHaveBeenCalled();
		});
		await step("focus goes to the first invalid field", async () => {
			await expect(cafe).toHaveFocus();
		});
	},
};

/** A wrong value gets its own message, and fixing it clears the message on the next submit. */
export const FixAnError: Story = {
	play: async ({ canvas, step }) => {
		const cafe = canvas.getByRole("textbox", { name: "Cafe" });
		const trays = canvas.getByRole("textbox", { name: "Trays" });
		await step("a wrong tray count is described as wrong", async () => {
			await userEvent.type(cafe, "Larkspur Coffee Bar");
			await userEvent.type(trays, "two");
			await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
			await until(() =>
				expect(trays).toHaveAccessibleDescription("Trays are a whole number, one or more."),
			);
			await expect(cafe).toHaveAttribute("aria-invalid", "false");
		});
		await step("fixed, it submits the values and the message goes", async () => {
			await userEvent.clear(trays);
			await userEvent.type(trays, "4");
			await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
			await until(() =>
				expect(submitted.spy).toHaveBeenCalledWith({
					cafe: "Larkspur Coffee Bar",
					trays: "4",
					note: "",
				}),
			);
			await expect(trays).toHaveAttribute("aria-invalid", "false");
			await expect(canvas.queryByText("Trays are a whole number, one or more.")).toBeNull();
		});
	},
};

/**
 * A field with no description points `aria-describedby` at nothing that is
 * not on the page: untouched it carries none, and once its message shows it
 * names that message alone.
 */
export const DescribedOnlyByWhatShows: Story = {
	play: async ({ canvas }) => {
		const trays = canvas.getByRole("textbox", { name: "Trays" });
		await expect(trays).not.toHaveAttribute("aria-describedby");
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		await until(() => expect(trays).toHaveAccessibleDescription("Say how many trays."));
		await expect(describedBy(trays).every((ref) => ref.found)).toBe(true);
		await expect(describedBy(trays)).toHaveLength(1);
	},
};

/** On a phone the fields take the width and the messages wrap. */
export const ErrorsPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		await until(() => expect(canvas.getByText("Say how many trays.")).toBeVisible());
		await expectNoSidewaysScroll();
	},
};
