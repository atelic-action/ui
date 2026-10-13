import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RevealSlider } from "../../src/sections/RevealSlider";

const sheet = readFileSync(resolve(__dirname, "../../src/styles/sections.css"), "utf8");

/** The declarations of the one rule whose selector is exactly `selector`. */
function rule(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = sheet.match(new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, "m"));
	if (!match) throw new Error(`no rule for ${selector}`);
	return match[1].replace(/\/\*[\s\S]*?\*\//g, "");
}

const briefs = {
	before: { label: "Before", placeholder: "Screenshot: the old page" },
	after: { label: "After", placeholder: "Screenshot: the rebuilt page" },
};

describe("RevealSlider", () => {
	it("renders a shot brief for a side with no image yet", () => {
		render(<RevealSlider {...briefs} />);
		expect(screen.getByText("Screenshot: the old page")).toBeInTheDocument();
		expect(screen.getByText("Screenshot: the rebuilt page")).toBeInTheDocument();
	});

	/*
	 * Two identical blocks make the drag look broken, since crossing the
	 * divider changes nothing on screen. Each side carries its own tone class.
	 */
	it("tones the two placeholders differently", () => {
		const { container } = render(<RevealSlider {...briefs} />);
		expect(container.querySelectorAll(".rslider-ph.is-before")).toHaveLength(1);
		expect(container.querySelectorAll(".rslider-ph.is-after")).toHaveLength(1);
	});

	it("renders images once both sides have a src, masking the before layer", () => {
		const { container } = render(
			<RevealSlider
				before={{ src: "/images/old.jpg", alt: "The old page", label: "Before" }}
				after={{ src: "/images/new.jpg", alt: "The rebuilt page", label: "After" }}
				startAt={30}
			/>,
		);
		const images = container.querySelectorAll("img.rslider-img");
		expect(images).toHaveLength(2);
		const masked = container.querySelector<HTMLElement>(".rslider-before");
		expect(masked?.style.clipPath).toBe("inset(0 70% 0 0)");
	});

	/*
	 * What the two frames hold is the page's business, so the default names
	 * neither of them and a page that can be specific passes its own.
	 */
	it("takes the handle's accessible name from props, neutral by default", () => {
		const { unmount } = render(<RevealSlider {...briefs} />);
		expect(screen.getByRole("slider")).toHaveAccessibleName("Drag to compare before and after");
		unmount();

		render(<RevealSlider {...briefs} ariaLabel="Drag to compare the old page and the rebuild" />);
		expect(screen.getByRole("slider")).toHaveAccessibleName(
			"Drag to compare the old page and the rebuild",
		);
	});

	it("steps the divider with the arrow keys", () => {
		render(<RevealSlider {...briefs} startAt={50} />);
		const handle = screen.getByRole("slider");
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		expect(handle).toHaveAttribute("aria-valuenow", "53");
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(handle).toHaveAttribute("aria-valuenow", "47");
	});

	/*
	 * touch-action: none on the whole frame swallowed every swipe that began
	 * on it, so a phone could not scroll past a slider that filled the screen.
	 * The frame lets a vertical pan through; the handle, where a drag starts,
	 * keeps every touch.
	 */
	it("lets a vertical swipe on the frame scroll the page, and keeps the handle's touches", () => {
		expect(rule(".atelic-ui .rslider")).toMatch(/touch-action:\s*pan-y;/);
		expect(rule(".atelic-ui .rslider")).not.toMatch(/touch-action:\s*none/);
		expect(rule(".atelic-ui .rslider-handle")).toMatch(/touch-action:\s*none;/);
	});

	it("moves the divider only once a drag has started on the handle", () => {
		// jsdom has no PointerEvent, and the generic Event it falls back to
		// drops clientX; a MouseEvent carries it.
		if (typeof globalThis.PointerEvent === "undefined") {
			vi.stubGlobal("PointerEvent", class extends MouseEvent {});
		}
		const { container } = render(<RevealSlider {...briefs} startAt={50} />);
		const frame = container.querySelector<HTMLElement>(".rslider");
		const handle = screen.getByRole("slider");
		if (!frame) throw new Error("no frame");
		frame.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;
		fireEvent.pointerMove(frame, { clientX: 20 });
		expect(handle).toHaveAttribute("aria-valuenow", "50");
		fireEvent.pointerDown(handle, { clientX: 150 });
		expect(handle).toHaveAttribute("aria-valuenow", "75");
		fireEvent.pointerMove(frame, { clientX: 40 });
		expect(handle).toHaveAttribute("aria-valuenow", "20");
		fireEvent.pointerUp(frame);
		fireEvent.pointerMove(frame, { clientX: 180 });
		expect(handle).toHaveAttribute("aria-valuenow", "20");
		vi.unstubAllGlobals();
	});
});
