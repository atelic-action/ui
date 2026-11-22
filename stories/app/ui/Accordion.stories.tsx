import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

const questions = [
	{ value: "cutoff", q: "When do orders close?", a: "At 20:00 the night before the drop." },
	{
		value: "trays",
		q: "How many loaves fit a tray?",
		a: "Twelve country loaves, or twenty four morning buns.",
	},
	{
		value: "returns",
		q: "What happens to a tray a cafe sends back unsold at the end of the day?",
		a: "It is counted, credited, and the bread goes to the shelter on Alder Street.",
	},
];

/** A stack of disclosures: each trigger opens its answer, one at a time or several. */
const meta = {
	title: "App/UI/Accordion",
	component: Accordion,
	parameters: { layout: "padded" },
	args: { type: "single", collapsible: true },
	render: (args) => (
		<Accordion {...args} className="max-w-xl">
			{questions.map((item) => (
				<AccordionItem key={item.value} value={item.value}>
					<AccordionTrigger>{item.q}</AccordionTrigger>
					<AccordionContent>{item.a}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One open at a time: opening a second closes the first, and a second click closes it. */
export const Single: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const first = canvas.getByRole("button", { name: "When do orders close?" });
		const second = canvas.getByRole("button", { name: "How many loaves fit a tray?" });
		await step("every trigger starts closed", async () => {
			for (const trigger of canvas.getAllByRole("button")) {
				await expect(trigger).toHaveAttribute("aria-expanded", "false");
			}
		});
		await step("a click opens the first, its answer a region named by it", async () => {
			await userEvent.click(first);
			await expect(first).toHaveAttribute("aria-expanded", "true");
			const answer = canvas.getByRole("region", { name: "When do orders close?" });
			await expect(answer).toHaveTextContent("At 20:00 the night before the drop.");
			await expect(first).toHaveAttribute("aria-controls", answer.id);
		});
		await step("opening the second closes the first", async () => {
			await userEvent.click(second);
			await expect(second).toHaveAttribute("aria-expanded", "true");
			await expect(first).toHaveAttribute("aria-expanded", "false");
		});
		await step("a second click closes it", async () => {
			await userEvent.click(second);
			await expect(second).toHaveAttribute("aria-expanded", "false");
			await waitFor(() => expect(canvas.queryByRole("region")).toBeNull());
		});
	},
};

/** The keyboard: arrows move between triggers, Home and End jump, Enter and Space toggle. */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent }) => {
		const [first, second, third] = canvas.getAllByRole("button");
		await userEvent.tab();
		await expect(first).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(second).toHaveFocus();
		await userEvent.keyboard("{End}");
		await expect(third).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(first).toHaveFocus();
		await userEvent.keyboard("{Home}{Enter}");
		await expect(first).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard(" ");
		await expect(first).toHaveAttribute("aria-expanded", "false");
	},
};

/** Several open at once. */
export const Multiple: Story = {
	args: { type: "multiple" },
	play: async ({ canvas, userEvent }) => {
		const [first, second] = canvas.getAllByRole("button");
		await userEvent.click(first);
		await userEvent.click(second);
		await expect(first).toHaveAttribute("aria-expanded", "true");
		await expect(second).toHaveAttribute("aria-expanded", "true");
	},
};

/** Opened by default, and not collapsible: its trigger cannot close the last open item. */
export const OpenAndRequired: Story = {
	args: { type: "single", collapsible: false, defaultValue: "trays" },
	play: async ({ canvas, userEvent }) => {
		const trays = canvas.getByRole("button", { name: "How many loaves fit a tray?" });
		await expect(trays).toHaveAttribute("aria-expanded", "true");
		await expect(trays).toHaveAttribute("aria-disabled", "true");
		await userEvent.click(trays);
		await expect(trays).toHaveAttribute("aria-expanded", "true");
	},
};

/** The longest question wraps on a phone beside its chevron. */
export const LongQuestionPhone: Story = {
	globals: pin("phone"),
	args: { type: "single", collapsible: true, defaultValue: "returns" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region")).toBeVisible();
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
