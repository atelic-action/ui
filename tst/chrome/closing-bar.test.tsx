import { render, screen } from "@testing-library/react";
import { ClosingBar } from "../../src/chrome";

const line = (container: HTMLElement) => container.textContent?.replace(/\s+/g, " ").trim();

describe("ClosingBar", () => {
	it("credits the practice in one link, opening in a new tab", () => {
		render(<ClosingBar name="Test Practice" />);

		expect(screen.getAllByRole("link")).toHaveLength(1);
		const practice = screen.getByRole("link", { name: "Atelic" });
		expect(practice).toHaveAttribute("href", "https://atelic.me");
		expect(practice).toHaveAttribute("target", "_blank");
		expect(practice).toHaveAttribute("rel", "noopener");
	});

	it("puts the copyright with the name first and the made with note last", () => {
		const { container } = render(<ClosingBar name="Test Practice" attribution="Dr. Rivers" />);
		const row = container.querySelector(".closing-bar-line");

		expect(row?.firstElementChild?.textContent).toBe(
			`© ${new Date().getFullYear()} Test Practice · Dr. Rivers`,
		);
		expect(row?.lastElementChild).toHaveClass("closing-bar-note");
		expect(row?.lastElementChild?.textContent).toBe("Made with \u{1F49A} in Denver, CO by Atelic");
	});

	it("takes a site's own note and drops the credit when told to", () => {
		const { container } = render(
			<ClosingBar name="Test Practice" note="Made with care in Denver" credit={false} />,
		);

		const row = container.querySelector(".closing-bar-line");
		expect(row?.firstElementChild?.textContent).toBe(`© ${new Date().getFullYear()} Test Practice`);
		expect(row?.lastElementChild?.textContent).toBe("Made with care in Denver");
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("is the note alone, with no copyright, on a page that names no business", () => {
		const { container } = render(<ClosingBar />);

		expect(container.querySelector(".closing-bar")).toHaveClass("is-solo");
		expect(line(container)).toBe("Made with \u{1F49A} in Denver, CO by Atelic");
	});
});
