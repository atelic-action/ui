import { render, screen } from "@testing-library/react";
import { CreditBar } from "../../src/chrome";

describe("CreditBar", () => {
	it("credits the practice in one link, opening in a new tab", () => {
		render(<CreditBar />);

		expect(screen.getAllByRole("link")).toHaveLength(1);
		const practice = screen.getByRole("link", { name: "Atelic" });
		expect(practice).toHaveAttribute("href", "https://atelic.me");
		expect(practice).toHaveAttribute("target", "_blank");
		expect(practice).toHaveAttribute("rel", "noopener");
	});

	it("reads as one line of credit copy", () => {
		const { container } = render(<CreditBar />);
		expect(container.textContent?.replace(/\s+/g, " ").trim()).toBe(
			"Developed with \u{1F49A} in Denver by Atelic",
		);
	});
});
