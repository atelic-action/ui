import { render, screen } from "@testing-library/react";
import { Gallery } from "../../src/sections/Gallery";

const photos = [
	{
		src: "/images/one.jpg",
		alt: "A run of skylights in a sloped ceiling",
		caption: "The ceiling.",
	},
	{ placeholder: "Photo: the treatment room", caption: "The room." },
	{ src: "/images/three.jpg" },
];

describe("Gallery", () => {
	it("renders a photo tile per entry, lazily loaded", () => {
		const { container } = render(<Gallery title="Our work" photos={photos} />);
		const images = container.querySelectorAll("img");
		expect(images).toHaveLength(2);
		expect(images[0]).toHaveAttribute("src", "/images/one.jpg");
		expect(images[0]).toHaveAttribute("loading", "lazy");
	});

	it("leaves a photo with no alt text out of the accessibility tree", () => {
		render(<Gallery title="Our work" photos={photos} />);
		// One described photo, one decorative (alt=""), one placeholder block.
		expect(screen.getAllByRole("img")).toHaveLength(1);
	});

	it("renders a shot brief as a labeled placeholder when a photo has no src", () => {
		const { container } = render(<Gallery title="Our work" photos={photos} />);
		expect(screen.getByText("Photo: the treatment room")).toBeInTheDocument();
		expect(container.querySelectorAll(".gallery-frame.ph")).toHaveLength(1);
	});

	it("captions only the photos that carry one", () => {
		const { container } = render(<Gallery title="Our work" photos={photos} />);
		expect(container.querySelectorAll("figcaption")).toHaveLength(2);
	});

	it("takes the column count and the alt band from props", () => {
		const { container } = render(
			<Gallery title="Our work" photos={photos} columns={2} surface="alt" />,
		);
		expect(container.querySelector(".gallery-grid")).toHaveClass("cols-2");
		expect(container.querySelector("section")).toHaveClass("surface-alt");
	});
});
