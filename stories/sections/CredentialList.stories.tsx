import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CredentialList } from "../../src/sections";
import { credentials, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Lists licenses, certifications, or registrations, each with its code, when a
 * business must show it is qualified. Card rows of credentials, each led by a
 * short mono code.
 */
const meta = {
	title: "Sections/CredentialList",
	component: CredentialList,
	args: { items: credentials },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>What we hold</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof CredentialList>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list")).getAllByRole("listitem");

/** Each row: the code beside the title, the detail under it when there is one. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(rows(canvas)).toHaveLength(3);
		const [first] = rows(canvas);
		const code = within(first).getByText("CFH");
		const title = within(first).getByText("County food handler");
		await expect(code.getBoundingClientRect().right).toBeLessThanOrEqual(
			title.getBoundingClientRect().left,
		);
		const detail = within(first).getByText("Every baker on staff, renewed yearly");
		await expect(detail.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			title.getBoundingClientRect().bottom - 1,
		);
		await expect(within(rows(canvas)[2]).getByText("Bakers' Guild of Fairhaven")).toBeVisible();
	},
};

/** Two up on a desktop, so a long stack stays compact. */
export const TwoUp: Story = {
	play: async ({ canvas }) => {
		const [a, b, c] = rows(canvas);
		await expect(Math.round(a.getBoundingClientRect().top)).toBe(
			Math.round(b.getBoundingClientRect().top),
		);
		await expect(c.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			a.getBoundingClientRect().bottom,
		);
	},
};

/** The cards stack one to a row on a phone. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const [a, b] = rows(canvas);
		await expect(b.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			a.getBoundingClientRect().bottom,
		);
		await expectNoSidewaysScroll();
	},
};

/** The longest realistic rows, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: [
			{
				code: "HACCP",
				title: "Hazard analysis and critical control points, county certified",
				detail: "Every baker on staff, renewed every spring before the market season opens",
			},
			{ code: "GUILD", title: "Bakers' Guild of Fairhaven", detail: "Gold, three years running" },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * One unbroken word in a title, on a phone: the row's text column shrinks to
 * the card and the word breaks where it must, so neither the card nor the
 * page scrolls sideways.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { items: [{ code: "GUILD", title: unbroken, detail: "Gold, three years running" }] },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/** No credentials: an empty list. */
export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
	},
};
