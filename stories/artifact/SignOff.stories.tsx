import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SignOff } from "../../src/artifact";
import { person } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Closes a document with the sender's script line, photo, name, role, and
 * address. The close a document ends on: the script line, then the photo
 * beside the name, the role, and the address as a mail link.
 */
const meta = {
	title: "Artifact/SignOff",
	component: SignOff,
	decorators: [inWrap],
	args: { signOff: "Warmly,", person },
} satisfies Meta<typeof SignOff>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The photo named for the person, the name, and the address as a mail link that opens in place. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Ada Fennimore" })).toBeVisible();
		await expect(canvas.getByText("Warmly,")).toBeVisible();
		const mail = canvas.getByRole("link", { name: "hello@studio.example.com" });
		await expect(mail).toHaveAttribute("href", "mailto:hello@studio.example.com");
		await expect(mail).not.toHaveAttribute("target");
	},
};

/** The role takes nodes, a link to the studio among them. */
export const RoleWithLink: Story = {
	args: {
		person: {
			...person,
			role: (
				<>
					Founder, <a href="https://studio.example.com">Larkmoor Studio</a>
				</>
			),
		},
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Larkmoor Studio" })).toBeVisible();
	},
};

/**
 * The longest name, role, and address on a phone stay inside the screen:
 * the address moves to a line of its own and breaks only when it is longer
 * than the column.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		person: {
			...person,
			name: "Adelaide Fennimore-Castellanos",
			role: "Founder and principal, Larkmoor Studio",
			mailHref: "mailto:adelaide.fennimore-castellanos@studio.example.com",
			mailLabel: "adelaide.fennimore-castellanos@studio.example.com",
		},
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
