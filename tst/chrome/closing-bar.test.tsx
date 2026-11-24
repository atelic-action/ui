import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ClosingBar, Copyright, Credit } from "../../src/chrome";

const CREDIT = "Made with \u{1F49A} in Denver, Colorado by Atelic";
const COPYRIGHT = `© ${new Date().getFullYear()} Test Practice`;
const side = (container: HTMLElement, name: "left" | "right") =>
	container.querySelector(`.closing-bar-${name}`)?.textContent?.replace(/\s+/g, " ").trim();

describe("ClosingBar", () => {
	it("defaults to the copyright with the name on the left and the practice's credit on the right", () => {
		const { container } = render(<ClosingBar name="Test Practice" />);

		expect(side(container, "left")).toBe(COPYRIGHT);
		expect(side(container, "right")).toBe(CREDIT);
		expect(container.querySelector(".closing-bar-line")?.lastElementChild).toHaveClass(
			"closing-bar-right",
		);
	});

	it("takes anything on either side, and either default on either side", () => {
		const { container, unmount } = render(
			<ClosingBar left={<Credit />} right={<Copyright name="Test Practice" />} />,
		);
		expect(side(container, "left")).toBe(CREDIT);
		expect(side(container, "right")).toBe(COPYRIGHT);
		unmount();

		const worded = render(<ClosingBar name="Test Practice" right="Made with care in Denver" />);
		expect(side(worded.container, "left")).toBe(COPYRIGHT);
		expect(side(worded.container, "right")).toBe("Made with care in Denver");
	});

	it("empties a side given null, keeping the other", () => {
		const { container } = render(<ClosingBar name="Test Practice" right={null} />);

		expect(side(container, "left")).toBe(COPYRIGHT);
		expect(container.querySelector(".closing-bar-right")).toBeNull();
		expect(screen.queryByRole("link")).toBeNull();
		expect(container.querySelector(".closing-bar")).not.toHaveClass("is-solo");
	});

	it("centers the right side alone on a page that names no business", () => {
		const { container } = render(<ClosingBar />);

		expect(container.querySelector(".closing-bar")).toHaveClass("is-solo");
		expect(container.querySelector(".closing-bar-left")).toBeNull();
		expect(side(container, "right")).toBe(CREDIT);
	});

	it("renders nothing with both sides empty", () => {
		const { container } = render(<ClosingBar left={null} right={null} />);
		expect(container.firstChild).toBeNull();
	});
});

describe("Copyright", () => {
	it("prints the mark, this year, the name, and the attribution after it", () => {
		const { container } = render(<Copyright name="Test Practice" attribution="Dr. Rivers" />);
		expect(container.textContent).toBe(`${COPYRIGHT} · Dr. Rivers`);
	});
});

describe("Credit", () => {
	it("credits the practice in one link, opening in a new tab", () => {
		render(<Credit />);

		expect(screen.getAllByRole("link")).toHaveLength(1);
		const practice = screen.getByRole("link", { name: "Atelic" });
		expect(practice).toHaveAttribute("href", "https://atelic.me");
		expect(practice).toHaveAttribute("target", "_blank");
		expect(practice).toHaveAttribute("rel", "noopener");
	});

	it("hands its ref the bar's element, forwarded so a React 18 host keeps it", () => {
		const ref = createRef<HTMLDivElement>();
		const { container } = render(<ClosingBar name="Test Practice" ref={ref} />);
		expect(ref.current).toBe(container.querySelector(".closing-bar"));
		expect((ClosingBar as unknown as { $$typeof: symbol }).$$typeof).toBe(
			Symbol.for("react.forward_ref"),
		);
		expect(ClosingBar.displayName).toBe("ClosingBar");
	});
});
