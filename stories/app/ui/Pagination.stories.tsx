import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Pagination } from "../../../src/app/ui";
import { expectNoSidewaysScroll } from "../../support/geometry";
import { pin } from "../../support/viewports";

function Held({ page: initial, onPageChange, ...props }: Parameters<typeof Pagination>[0]) {
	const [page, setPage] = useState(initial);
	return (
		<Pagination
			{...props}
			page={page}
			onPageChange={(next) => {
				setPage(next);
				onPageChange(next);
			}}
		/>
	);
}

/** The visible page numbers, in order, with a gap where pages are elided. */
function shown(nav: HTMLElement) {
	return within(nav)
		.getAllByRole("button")
		.map((button) => button.textContent);
}

/**
 * Moves a reader through a long list in an app one page at a time. Numbered
 * pages with Previous and Next: always the first and last page and the current
 * one with its neighbors, the rest elided. One page renders nothing. Each end
 * button is named for the word it shows ("Previous page", "Next page"), so a
 * voice user can say what they see.
 */
const meta = {
	title: "App/UI/Pagination",
	component: Pagination,
	parameters: { layout: "padded" },
	args: { page: 1, totalPages: 12, onPageChange: fn() },
	render: (args) => <Held {...args} />,
	globals: pin("desktop"),
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On the first page, Previous is off and the current page is marked. */
export const FirstPage: Story = {
	play: async ({ canvas }) => {
		const nav = canvas.getByRole("navigation", { name: "Pagination" });
		await expect(within(nav).getByRole("button", { name: "Previous page" })).toBeDisabled();
		await expect(within(nav).getByRole("button", { name: "Page 1" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(shown(nav)).toEqual(["Previous", "1", "2", "12", "Next"]);
	},
};

/** In the middle, gaps on both sides of the current page and its neighbors. */
export const Middle: Story = {
	args: { page: 6 },
	play: async ({ canvas }) => {
		await expect(shown(canvas.getByRole("navigation", { name: "Pagination" }))).toEqual([
			"Previous",
			"1",
			"5",
			"6",
			"7",
			"12",
			"Next",
		]);
	},
};

/** On the last page, Next is off. */
export const LastPage: Story = {
	args: { page: 12 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled();
		await expect(canvas.getByRole("button", { name: "Page 12" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	},
};

/** Next, Previous, and a page number each move the page and report it; the mark follows. */
export const Navigate: Story = {
	play: async ({ canvas, args }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
		await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
		await userEvent.click(canvas.getByRole("button", { name: "Page 12" }));
		await expect(args.onPageChange).toHaveBeenLastCalledWith(12);
		await expect(canvas.getByRole("button", { name: "Page 12" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
		await expect(args.onPageChange).toHaveBeenLastCalledWith(11);
	},
};

/** The keyboard: Tab walks the controls and Enter presses one. */
export const Keyboard: Story = {
	args: { page: 6 },
	play: async ({ canvas, args }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Previous page" })).toHaveFocus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(args.onPageChange).toHaveBeenCalledWith(1);
	},
};

/** Two pages, no gaps. */
export const TwoPages: Story = {
	args: { totalPages: 2 },
	play: async ({ canvas }) => {
		await expect(shown(canvas.getByRole("navigation", { name: "Pagination" }))).toEqual([
			"Previous",
			"1",
			"2",
			"Next",
		]);
	},
};

/** One page renders nothing. */
export const OnePage: Story = {
	args: { totalPages: 1 },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("navigation")).toBeNull();
	},
};

/** On a phone, three digit pages wrap onto a second line rather than scroll sideways. */
export const Phone: Story = {
	args: { page: 120, totalPages: 240 },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const nav = canvas.getByRole("navigation", { name: "Pagination" });
		await expect(nav.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
		await expectNoSidewaysScroll();
	},
};

/** The end buttons are named with the words they show. */
export const NamedForWhatTheyShow: Story = {
	args: { page: 6 },
	play: async ({ canvas }) => {
		const previous = canvas.getByRole("button", { name: "Previous page" });
		await expect(previous).toHaveTextContent("Previous");
		await expect(previous.getAttribute("aria-label")).toContain(previous.textContent);
		const next = canvas.getByRole("button", { name: "Next page" });
		await expect(next.getAttribute("aria-label")).toContain(next.textContent);
	},
};
