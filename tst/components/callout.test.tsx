import { render, screen } from "@testing-library/react";
import { Callout, Checklist } from "../../src/components";

describe("Callout", () => {
	it("puts its tone's icon beside the title and the explainer under it", () => {
		render(
			<Callout title="Most of the wait is your server.">Real phones wait 5.2 seconds.</Callout>,
		);
		expect(screen.getByLabelText("Needs work")).toBeInTheDocument();
		expect(
			screen.getByText("Most of the wait is your server.").closest(".callout"),
		).toHaveAttribute("data-tone", "warn");
		expect(screen.getByText("Real phones wait 5.2 seconds.")).toBeInTheDocument();
	});

	it("takes a tone, a label for it, and the boxed form", () => {
		const { container } = render(
			<Callout tone="info" toneLabel="Missing" variant="box" title="Not yet read" />,
		);
		expect(screen.getByLabelText("Missing")).toBeInTheDocument();
		expect(container.querySelector(".callout")).toHaveClass("is-box");
	});
});

describe("Checklist", () => {
	it("marks each check passed or failed", () => {
		render(
			<Checklist
				items={[
					{ label: "Secure connection", detail: "Valid through 2026-12-30.", pass: true },
					{ label: "One dead link", pass: false },
				]}
			/>,
		);
		expect(screen.getByText("Secure connection").closest("li")).toHaveAttribute(
			"data-tone",
			"good",
		);
		expect(screen.getByText("One dead link").closest("li")).toHaveAttribute("data-tone", "bad");
		expect(screen.getByLabelText("Fails")).toBeInTheDocument();
	});
});
