import { render, screen } from "@testing-library/react";
import { Globe } from "lucide-react";
import { IconList } from "../../src/components";

describe("IconList", () => {
	it("leads every item with the list's icon in the list's tone, and hides the bullets from a screen reader", () => {
		const { container } = render(
			<IconList
				icon={<Globe data-testid="globe" size={16} />}
				tone="warn"
				items={[{ body: "old.example.com, the previous site." }, { body: "test.example.com" }]}
			/>,
		);
		expect(container.querySelector(".icon-list")).toHaveAttribute("data-tone", "warn");
		expect(screen.getAllByTestId("globe")).toHaveLength(2);
		for (const bullet of container.querySelectorAll(".icon-list-bullet")) {
			expect(bullet).toHaveAttribute("aria-hidden", "true");
		}
		expect(screen.getByRole("list")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("carries no tone of its own inside a toned ancestor", () => {
		const { container } = render(
			<div data-tone="bad">
				<IconList items={[{ body: "plain" }]} />
			</div>,
		);
		expect(container.querySelector(".icon-list")).not.toHaveAttribute("data-tone");
	});

	it("lets an item bring its own icon and tone, and falls back to a dot", () => {
		const { container } = render(
			<IconList
				items={[
					{ body: "Install the SEO plugin.", icon: <span data-testid="plug" />, tone: "good" },
					{ body: "Fix the Florida link." },
				]}
			/>,
		);
		expect(screen.getByText("Install the SEO plugin.").closest("li")).toHaveAttribute(
			"data-tone",
			"good",
		);
		expect(screen.getByTestId("plug")).toBeInTheDocument();
		expect(screen.getByText("Fix the Florida link.").closest("li")).not.toHaveAttribute(
			"data-tone",
		);
		expect(container.querySelector(".icon-list")).not.toHaveAttribute("data-tone");
		expect(container.querySelectorAll(".icon-list-bullet svg.lucide-dot")).toHaveLength(1);
	});
});
