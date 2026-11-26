import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect } from "storybook/test";
import {
	ContactForm,
	ContactInfoCard,
	ContactSection,
	HoursTable,
	InfoRows,
} from "../../src/sections";
import { site } from "../fixtures/bakery";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const side = (
	<>
		<ContactInfoCard site={site} title="Call the Bakery" showAddress={false} />
		<InfoRows
			rows={[
				{
					title: "The Alder Street Bakery",
					lines: ["418 Alder Street", "Fairhaven, CO 80000"],
					action: {
						label: "Get Directions",
						href: "https://maps.example.com/?q=418+Alder+Street",
						icon: "directions",
						newTab: true,
					},
				},
			]}
		/>
		<div>
			<h3>Bakery Hours</h3>
			<HoursTable hours={site.hours} />
		</div>
	</>
);

/**
 * Is a contact page's body: the form beside the other ways to reach the
 * business. A contact page's body: the form in a card, with a heading and a
 * lead, beside a column of the other ways to reach the bakery. One column
 * below the width both need, the card first.
 */
const meta = {
	title: "Sections/ContactSection",
	component: ContactSection,
	args: {
		title: "Send Us a Note",
		lead: "It takes a minute, and it comes straight to the counter.",
		cardId: "message",
		side,
		sideLabel: "Other ways to reach the bakery",
		children: (
			<ContactForm
				endpoint="/api/contact"
				topics={["An order", "A cake", "Wholesale"]}
				successMessage="Thank you. We answer within a day."
				consent={{
					text: "You may text me about this order: when it is ready, and nothing else. Reply STOP to opt out at any time. Message and data rates may apply.",
					lines: 1,
					inline: true,
				}}
			/>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ContactSection>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];
const card = (canvas: Canvas) =>
	canvas.getByRole("button", { name: /Send Message/ }).closest("form")
		?.parentElement as HTMLElement;
const aside = (canvas: Canvas) =>
	canvas.getByRole("complementary", { name: "Other ways to reach the bakery" });

/**
 * Side by side on a desktop: the card wider than the column, in the ratio
 * of its tokens, both from one top edge; the heading a real h2, and the
 * card's id a link target.
 */
export const Default: Story = {
	play: async ({ canvas }) => {
		const main = card(canvas).getBoundingClientRect();
		const column = aside(canvas).getBoundingClientRect();
		await expect(Math.round(main.top)).toBe(Math.round(column.top));
		await expect(column.left).toBeGreaterThan(main.right);
		await expect(main.width / column.width).toBeGreaterThan(1.4);
		await expect(main.width / column.width).toBeLessThan(1.9);
		await expect(canvas.getByRole("heading", { level: 2, name: "Send Us a Note" })).toBeVisible();
		await expect(card(canvas)).toHaveAttribute("id", "message");
		await expectNoSidewaysScroll();
	},
};

/** No heading and no lead: the card holds the form alone. */
export const WithoutTitle: Story = {
	args: { title: undefined, lead: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
		const first = card(canvas).firstElementChild;
		await expect(first?.tagName).toBe("FORM");
	},
};

/** Under a page's own h2, the card's heading reads at level 3. */
export const HeadingLevel: Story = {
	args: { headingLevel: 3 },
	decorators: [
		(Story) => (
			<>
				<h2 className="wrap">Contact</h2>
				<Story />
			</>
		),
	],
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 3, name: "Send Us a Note" })).toBeVisible();
	},
};

/** On a tablet the two no longer fit: one column, the card first, the side column under it at full width. */
export const OneColumn: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const main = card(canvas).getBoundingClientRect();
		const column = aside(canvas).getBoundingClientRect();
		await expect(column.top).toBeGreaterThan(main.bottom);
		await expect(Math.round(column.width)).toBe(Math.round(main.width));
		await expectNoSidewaysScroll();
	},
};

/** On a phone, the same one column. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(aside(canvas).getBoundingClientRect().top).toBeGreaterThan(
			card(canvas).getBoundingClientRect().bottom,
		);
		await expectNoSidewaysScroll();
	},
};

/** The card sets the ground an inline Show more fades over to its own, without the site doing it. */
export const ShowMoreFadesOverTheCard: Story = {
	play: async ({ canvas }) => {
		const ground = getComputedStyle(card(canvas)).getPropertyValue("--expandable-ground").trim();
		await expect(ground).not.toBe("");
		const probe = document.createElement("span");
		probe.style.color = "var(--expandable-ground)";
		card(canvas).appendChild(probe);
		const fade = getComputedStyle(probe).color;
		probe.remove();
		await expect(fade).toBe(getComputedStyle(card(canvas)).backgroundColor);
	},
};

/** A site's own ratio, gap, and card padding, by token. */
export const Tokens: Story = {
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--contact-section-main": "1",
						"--contact-section-side": "1",
						"--contact-section-main-basis": "20rem",
						"--contact-section-side-basis": "20rem",
						"--contact-section-gap": "40px",
						"--contact-section-card-pad": "16px",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const main = card(canvas).getBoundingClientRect();
		const column = aside(canvas).getBoundingClientRect();
		await expect(Math.abs(main.width - column.width)).toBeLessThan(2);
		await expect(Math.round(column.left - main.right)).toBe(40);
		await expect(getComputedStyle(card(canvas)).paddingTop).toBe("16px");
	},
};
