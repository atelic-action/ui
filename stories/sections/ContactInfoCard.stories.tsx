import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ContactInfoCard } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { longEmail } from "../fixtures/sections";
import { brokenWords, expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/** A dark card of direct contact rows: call, email, visit, and the wholesale portal. */
const meta = {
	title: "Sections/ContactInfoCard",
	component: ContactInfoCard,
	args: { site },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap" style={{ maxWidth: 420 }}>
					<h2>Get in touch</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ContactInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every row: the number and the address are links, and the portal opens a new tab. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("heading", { level: 3, name: "Reach us directly" }),
		).toBeVisible();
		const call = canvas.getByRole("link", { name: "(555) 555-0142" });
		await expect(call).toHaveAttribute("href", "tel:+15555550142");
		await expect(call).not.toHaveAttribute("target");
		const mail = canvas.getByRole("link", { name: "hello@kestrelhollow.example.com" });
		await expect(mail).toHaveAttribute("href", "mailto:hello@kestrelhollow.example.com");
		await expect(mail).not.toHaveAttribute("target");
		await expect(canvas.getByText(/418 Alder Street/)).toBeVisible();
		await expect(canvas.getByText(/Fairhaven, CO 80000/)).toBeVisible();
		const portal = canvas.getByRole("link", { name: /Wholesale portal/ });
		await expect(portal).toHaveAttribute("target", "_blank");
	},
};

/** Labeled lines for a business that publishes more than one number. */
export const SeveralPhones: Story = {
	args: {
		title: "Call the right desk",
		phones: [
			{ role: "The shop", display: "(555) 555-0142", e164: "+15555550142" },
			{ role: "Wholesale", display: "(555) 555-0143", e164: "+15555550143" },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("The shop")).toBeVisible();
		await expect(canvas.getByRole("link", { name: "(555) 555-0143" })).toHaveAttribute(
			"href",
			"tel:+15555550143",
		);
		await expect(canvas.queryByText("Call")).toBeNull();
	},
};

/** A business with a service area and no storefront: no Visit row. */
export const NoAddress: Story = {
	args: { showAddress: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("Visit")).toBeNull();
	},
};

/** No phone and no portal: email alone. */
export const EmailOnly: Story = {
	args: { site: { ...site, phone: undefined, footerLinks: [] }, showAddress: false },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("link")).toHaveLength(1);
	},
};

/** A long email address breaks inside its column on a phone, never past the page. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: { site: { ...site, email: longEmail } },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: longEmail })).toBeVisible();
		await expectNoSidewaysScroll();
	},
};

/** An address too long for the card's column on a phone. */
const longDomainEmail = "standingorders@kestrelhollow.example.com";

/**
 * A long email address on a phone breaks after its @ and before a dot,
 * never inside a word, the way the footer's does, and the link still reads
 * and goes to the whole address.
 */
export const LongEmailPhone: Story = {
	globals: pin("phone"),
	args: { site: { ...site, email: longDomainEmail } },
	play: async ({ canvas }) => {
		const mail = canvas.getByRole("link", { name: longDomainEmail });
		await expect(mail).toHaveAttribute("href", `mailto:${longDomainEmail}`);
		await expect(mail.getClientRects().length).toBeGreaterThan(1);
		await expect(brokenWords(mail)).toEqual([]);
		await expectNoSidewaysScroll();
	},
};

/** The single phone row says "Call" unless the site gives its own words, here for a line that answers texts. */
export const PhoneLabel: Story = {
	args: { phoneLabel: "Call or text" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Call or text")).toBeVisible();
		await expect(canvas.queryByText("Call")).toBeNull();
	},
};
