import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Avatar, AvatarFallback, AvatarImage } from "../../../src/app/ui";
import { layerOpened, until } from "../../support/settle";

/** A round picture of a person, with their initials while it loads or when it fails. */
const meta = {
	title: "App/UI/Avatar",
	component: Avatar,
	parameters: { layout: "padded" },
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src="/images/email-app/avatar-wren.svg" alt="Wren Okafor" />
			<AvatarFallback>WO</AvatarFallback>
		</Avatar>
	),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The picture, once it loads, named by its alt text. */
export const Picture: Story = {
	play: async ({ canvas }) => {
		await until(() => expect(canvas.getByRole("img", { name: "Wren Okafor" })).toBeVisible());
		await expect(canvas.queryByText("WO")).toBeNull();
	},
};

/** No picture: the initials. */
export const Initials: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarFallback>WO</AvatarFallback>
		</Avatar>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByText("WO")).toBeVisible();
	},
};

/** A picture that fails to load falls back to the initials. */
export const BrokenPicture: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src="/images/email-app/no-such-picture.png" alt="Wren Okafor" />
			<AvatarFallback>WO</AvatarFallback>
		</Avatar>
	),
	play: async ({ canvas }) => {
		await until(() => expect(canvas.getByText("WO")).toBeVisible());
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** Sized by its class. */
export const Large: Story = {
	args: { className: "h-16 w-16" },
	play: async ({ canvas }) => {
		const picture = await layerOpened(() => canvas.getByRole("img", { name: "Wren Okafor" }));
		await expect(Math.round(picture.getBoundingClientRect().width)).toBe(64);
	},
};
