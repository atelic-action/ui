import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevealSlider } from "../../src/sections/RevealSlider";

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
});
