import { render, screen } from "@testing-library/react";
import { Hammer } from "lucide-react";
import { Bubble } from "../../src/primitives";

describe("Bubble", () => {
	it("sets the number inside when given one, at the default size", () => {
		const { container } = render(<Bubble num="01" />);
		expect(screen.getByText("01")).toHaveClass("bubble-num");
		expect(container.querySelector(".bubble-badge")).toBeNull();
		expect(container.querySelector(".bubble")).toHaveClass("bubble-md");
	});

	it("sets the icon inside and the number on the badge when given both", () => {
		const { container } = render(<Bubble icon={<Hammer size={22} />} num="02" />);
		expect(container.querySelector(".bubble svg")).not.toBeNull();
		expect(screen.getByText("02")).toHaveClass("bubble-badge");
		expect(container.querySelector(".bubble-num")).toBeNull();
	});

	it("wears no badge with an icon alone", () => {
		const { container } = render(<Bubble icon={<Hammer size={22} />} />);
		expect(container.querySelector(".bubble svg")).not.toBeNull();
		expect(container.querySelector(".bubble-badge")).toBeNull();
	});

	it("wears its size class, the dark form, and any extra class", () => {
		const { container } = render(<Bubble num="03" size="lg" onDark className="step" />);
		expect(container.querySelector(".bubble")).toHaveClass("bubble-lg", "on-dark", "step");
	});

	it("is hidden from assistive tech, since the heading beside it carries the meaning", () => {
		const { container } = render(<Bubble num="04" size="sm" />);
		expect(container.querySelector(".bubble")).toHaveAttribute("aria-hidden", "true");
	});
});
