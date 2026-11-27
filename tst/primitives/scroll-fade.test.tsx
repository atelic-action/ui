import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ScrollFade } from "../../src/primitives/ScrollFade";

/*
 * jsdom lays nothing out, so the box's heights are given here: the
 * scrolling box is `box` pixels tall and its content `content`, read the
 * way the component reads them.
 */
let sizes = { box: 100, content: 100 };

const boxOf = (container: HTMLElement) =>
	container.querySelector(".scroll-fade-box") as HTMLDivElement;

beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, "clientHeight", {
		configurable: true,
		get(this: HTMLElement) {
			return this.classList.contains("scroll-fade-box") ? sizes.box : 0;
		},
	});
	Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
		configurable: true,
		get(this: HTMLElement) {
			return this.classList.contains("scroll-fade-box") ? sizes.content : 0;
		},
	});
});

afterAll(() => {
	Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
	Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
});

describe("ScrollFade", () => {
	it("prerenders with no fade and no tab stop, so nothing is hidden before the script runs", () => {
		const html = renderToString(<ScrollFade>Every word of the quote.</ScrollFade>);
		expect(html).toContain("Every word of the quote.");
		expect(html).not.toContain("data-fade");
		expect(html).not.toContain("tabindex");
		expect(html).toContain("--_sf-lines:6");
	});

	it("is neither a region nor a tab stop when its content fits", () => {
		sizes = { box: 100, content: 100 };
		const { container } = render(<ScrollFade ariaLabel="The quote">Short.</ScrollFade>);
		const box = boxOf(container);
		expect(box).not.toHaveAttribute("tabindex");
		expect(box).not.toHaveAttribute("role");
		expect(box).not.toHaveAttribute("data-fade-top");
		expect(box).not.toHaveAttribute("data-fade-bottom");
	});

	it("fades the bottom and takes focus as a named region when there is more below", () => {
		sizes = { box: 100, content: 300 };
		render(<ScrollFade ariaLabel="The quote">Long.</ScrollFade>);
		const region = screen.getByRole("region", { name: "The quote" });
		expect(region).toHaveAttribute("tabindex", "0");
		expect(region).toHaveAttribute("data-fade-bottom");
		expect(region).not.toHaveAttribute("data-fade-top");
	});

	it("fades the top once scrolled, and only the top at the end", () => {
		sizes = { box: 100, content: 300 };
		const { container } = render(<ScrollFade>Long.</ScrollFade>);
		const box = boxOf(container);
		box.scrollTop = 80;
		fireEvent.scroll(box);
		expect(box).toHaveAttribute("data-fade-top");
		expect(box).toHaveAttribute("data-fade-bottom");
		box.scrollTop = 200;
		fireEvent.scroll(box);
		expect(box).toHaveAttribute("data-fade-top");
		expect(box).not.toHaveAttribute("data-fade-bottom");
	});

	it("scrolls back to its top when its reset key changes", () => {
		sizes = { box: 100, content: 300 };
		const { container, rerender } = render(<ScrollFade resetKey={0}>Long.</ScrollFade>);
		const box = boxOf(container);
		box.scrollTop = 120;
		rerender(<ScrollFade resetKey={0}>Long.</ScrollFade>);
		expect(box.scrollTop).toBe(120);
		act(() => {
			rerender(<ScrollFade resetKey={1}>Long.</ScrollFade>);
		});
		expect(box.scrollTop).toBe(0);
	});

	it("takes a CSS length in place of lines", () => {
		const { container } = render(<ScrollFade maxHeight="12rem">Text.</ScrollFade>);
		expect(boxOf(container).style.getPropertyValue("--_sf-max")).toBe("12rem");
	});
});
