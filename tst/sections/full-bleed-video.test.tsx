import { act, fireEvent, render, screen } from "@testing-library/react";
import { FullBleedVideo } from "../../src/sections";

type Observed = (entries: { isIntersecting: boolean }[]) => void;

let observe: Observed | undefined;

function stubMotion(reduce: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi
			.fn()
			.mockImplementation((query: string) => ({ matches: reduce && query.includes("reduce") })),
	);
}

beforeEach(() => {
	observe = undefined;
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(callback: Observed) {
				observe = callback;
			}
			observe() {}
			disconnect() {}
		},
	);
	vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		this.dispatchEvent(new Event("playing"));
		return Promise.resolve();
	});
	vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		this.dispatchEvent(new Event("pause"));
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("FullBleedVideo", () => {
	it("shows the poster at once and stays on it under reduced motion, never loading the video", () => {
		stubMotion(true);
		const { container } = render(
			<FullBleedVideo src="/clip.mp4" poster="/first-frame.jpg" label="Crews at work" />,
		);
		expect(screen.getByRole("img", { name: "Crews at work" })).toHaveAttribute(
			"src",
			"/first-frame.jpg",
		);
		expect(container.querySelector("video")).toBeNull();
	});

	it("plays once it is on screen, and pauses when it leaves", () => {
		stubMotion(false);
		const { container } = render(
			<FullBleedVideo src="/clip.mp4" poster="/first-frame.jpg" label="Crews at work" />,
		);
		const video = container.querySelector("video") as HTMLVideoElement;
		expect(video).toHaveAttribute("preload", "auto");
		expect(video.muted).toBe(true);
		expect(video).toHaveAttribute("loop");
		expect(video).toHaveAttribute("playsinline");
		expect(video).not.toHaveAttribute("controls");

		act(() => observe?.([{ isIntersecting: true }]));
		expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
		expect(video).toHaveClass("is-on");

		Object.defineProperty(video, "paused", { configurable: true, value: false });
		act(() => observe?.([{ isIntersecting: false }]));
		expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
		expect(video).not.toHaveClass("is-on");
	});

	it("renders the shot brief as a labeled block when there is no first frame yet", () => {
		stubMotion(true);
		render(
			<FullBleedVideo src="/clip.mp4" label="Crews at work" placeholder="Crew on a ridge, wide" />,
		);
		expect(screen.getByRole("img", { name: "Crews at work" })).toHaveTextContent(
			"Crew on a ridge, wide",
		);
	});

	it("offers a pause button only when asked, which holds the video still", () => {
		stubMotion(false);
		const { container, rerender } = render(
			<FullBleedVideo src="/clip.mp4" poster="/f.jpg" label="Crews at work" />,
		);
		expect(screen.queryByRole("button")).toBeNull();

		rerender(<FullBleedVideo src="/clip.mp4" poster="/f.jpg" label="Crews at work" controls />);
		const video = container.querySelector("video") as HTMLVideoElement;
		act(() => observe?.([{ isIntersecting: true }]));
		Object.defineProperty(video, "paused", { configurable: true, value: false });
		fireEvent.click(screen.getByRole("button", { name: "Pause the video" }));
		expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Play the video" })).toBeInTheDocument();
	});
});
