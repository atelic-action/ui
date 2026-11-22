import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { expect, type MockInstance, spyOn, waitFor } from "storybook/test";
import { FullBleedVideo } from "../../src/sections";
import { pin } from "../support/viewports";

/**
 * A silent looping band edge to edge. Whether it asks to play is read off a
 * spy on `HTMLMediaElement.prototype.play` that still calls through; the
 * test browser (Playwright's Chromium) decodes the H.264 clip, so the
 * stories also see it really play and pause.
 */
let play: MockInstance<HTMLMediaElement["play"]>;

const watchPlay = () => {
	play = spyOn(HTMLMediaElement.prototype, "play");
	return () => play.mockRestore();
};

/** Three screens of page above the band, so it starts off screen. */
const BelowTheFold: Decorator = (Story) => (
	<>
		<div style={{ height: "300vh" }}>
			<h1>Country sourdough, rye, and the morning buns.</h1>
		</div>
		<Story />
		<div style={{ height: "100vh" }} />
	</>
);

const meta = {
	title: "Sections/FullBleedVideo",
	component: FullBleedVideo,
	args: {
		src: "/video/bakery-loop.mp4",
		poster: "/images/bakery-loop-first-frame.jpg",
		label: "The ovens warming before the first bake",
	},
	beforeEach: watchPlay,
	globals: pin("desktop"),
} satisfies Meta<typeof FullBleedVideo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The poster shows at once as a plain picture, edge to edge, before the clip is asked for. */
export const PosterFirst: Story = {
	decorators: [BelowTheFold],
	play: async ({ canvas }) => {
		const poster = canvas.getByRole("img", { name: "The ovens warming before the first bake" });
		await expect(poster).toBeVisible();
		await expect(Math.round(poster.getBoundingClientRect().width)).toBe(window.innerWidth);
		await expect(play).not.toHaveBeenCalled();
		// The clip is in the page, loading behind the picture, and not yet shown.
		const video = poster.parentElement?.querySelector("video") as HTMLVideoElement;
		await expect(getComputedStyle(video).opacity).toBe("0");
	},
};

/** It asks to play once it scrolls on screen, and pauses when it scrolls away. */
export const PlaysOnScreen: Story = {
	decorators: [BelowTheFold],
	play: async ({ canvas, step }) => {
		const poster = canvas.getByRole("img", { name: "The ovens warming before the first bake" });
		await step("off screen, nothing plays", async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
			await expect(play).not.toHaveBeenCalled();
		});
		await step("on screen, it asks to play, once, and plays", async () => {
			poster.scrollIntoView({ behavior: "instant" });
			await waitFor(() => expect(play).toHaveBeenCalledOnce());
			const video = play.mock.contexts[0] as HTMLVideoElement;
			await waitFor(() => expect(video.paused).toBe(false), { timeout: 3000 });
			// Faded in over the poster once it is playing.
			await waitFor(() => expect(getComputedStyle(video).opacity).toBe("1"));
		});
		await step("scrolled away, it pauses", async () => {
			const video = play.mock.contexts[0] as HTMLVideoElement;
			window.scrollTo({ top: 0, behavior: "instant" });
			await waitFor(() => expect(video.paused).toBe(true));
		});
	},
};

/**
 * Under `prefers-reduced-motion` the clip is never asked for and the poster
 * stays. Emulated by answering the component's `matchMedia` question, since
 * the test provider has no media emulation a story can reach; the component
 * decides in script, so this is the path a reader's setting takes.
 */
export const ReducedMotion: Story = {
	beforeEach: () => {
		const restorePlay = watchPlay();
		const original = window.matchMedia;
		window.matchMedia = ((query: string) => {
			const list = original.call(window, query);
			if (!query.includes("prefers-reduced-motion")) return list;
			return { ...list, matches: true, media: query } as MediaQueryList;
		}) as typeof window.matchMedia;
		return () => {
			window.matchMedia = original;
			restorePlay();
		};
	},
	play: async ({ canvas }) => {
		const poster = canvas.getByRole("img", { name: "The ovens warming before the first bake" });
		poster.scrollIntoView({ behavior: "instant" });
		await new Promise((resolve) => setTimeout(resolve, 300));
		await expect(play).not.toHaveBeenCalled();
		await expect(poster).toBeVisible();
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** With `controls`, a button over the corner pauses and plays it, and a pause holds. */
export const Controls: Story = {
	args: { controls: true },
	play: async ({ canvas, userEvent, step }) => {
		const pause = await waitFor(() => canvas.getByRole("button", { name: "Pause the video" }), {
			timeout: 3000,
		});
		const video = play.mock.contexts[0] as HTMLVideoElement;
		await step("the button pauses it, and the pause holds", async () => {
			await userEvent.click(pause);
			await waitFor(() => expect(video.paused).toBe(true));
			await new Promise((resolve) => setTimeout(resolve, 300));
			await expect(video.paused).toBe(true);
		});
		await step("and plays it again", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Play the video" }));
			await waitFor(() => expect(video.paused).toBe(false));
			await expect(canvas.getByRole("button", { name: "Pause the video" })).toBeVisible();
		});
	},
};

/** Before the footage exists: the shot brief as a labeled block, at the height asked for. */
export const Placeholder: Story = {
	args: {
		poster: undefined,
		placeholder: "Video: the ovens at dawn, one slow pan, no people",
		height: "220px",
	},
	play: async ({ canvas }) => {
		const block = canvas.getByRole("img", { name: "The ovens warming before the first bake" });
		await expect(block).toHaveTextContent("Video: the ovens at dawn, one slow pan, no people");
		await expect(Math.round(block.getBoundingClientRect().height)).toBe(220);
	},
};

export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const poster = canvas.getByRole("img", { name: "The ovens warming before the first bake" });
		await expect(Math.round(poster.getBoundingClientRect().width)).toBe(390);
		// The default height's floor, clamp(260px, 42vw, 560px), on a phone.
		await expect(Math.round(poster.getBoundingClientRect().height)).toBe(260);
	},
};
