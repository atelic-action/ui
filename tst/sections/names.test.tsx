import { fireEvent, render, screen } from "@testing-library/react";
import { LocationSection } from "../../src/sections/LocationSection";
import { MapEmbed } from "../../src/sections/MapEmbed";
import { ProcessSteps } from "../../src/sections/ProcessSteps";
import { RevealSlider } from "../../src/sections/RevealSlider";
import { testSite } from "./site-fixture";

/*
 * Names that match what is seen and meaning a screen reader can reach: the
 * slider's keys and what its value means, the map's facade named by its own
 * words and a screenshot with no link drawn as a picture, and headings that
 * never skip a level. Every name here is made up.
 */

describe("RevealSlider, by keyboard", () => {
	const halves = {
		before: { label: "Today", placeholder: "The old page" },
		after: { label: "The rebuild", placeholder: "The new page" },
	};

	it("answers every slider key: arrows, a page step, and the two ends", () => {
		render(<RevealSlider {...halves} />);
		const slider = screen.getByRole("slider");
		const press = (key: string) => fireEvent.keyDown(slider, { key });
		const now = () => slider.getAttribute("aria-valuenow");
		press("ArrowUp");
		expect(now()).toBe("53");
		press("ArrowDown");
		press("ArrowLeft");
		expect(now()).toBe("47");
		press("PageUp");
		expect(now()).toBe("57");
		press("PageDown");
		press("PageDown");
		expect(now()).toBe("37");
		press("End");
		expect(now()).toBe("100");
		press("ArrowRight");
		expect(now()).toBe("100");
		press("Home");
		expect(now()).toBe("0");
		press("ArrowLeft");
		expect(now()).toBe("0");
	});

	it("says what the value means, by the halves' own labels unless the page says it", () => {
		const { unmount } = render(<RevealSlider {...halves} startAt={40} />);
		expect(screen.getByRole("slider")).toHaveAttribute(
			"aria-valuetext",
			"40% Today, 60% The rebuild",
		);
		unmount();
		render(<RevealSlider {...halves} valueText={(value) => `${value} percent of the old page`} />);
		expect(screen.getByRole("slider")).toHaveAttribute(
			"aria-valuetext",
			"50 percent of the old page",
		);
	});
});

describe("MapEmbed", () => {
	const site = {
		name: "Kestrel Hollow Bakehouse",
		address: testSite.address,
		mapImage: "/images/map.png",
	};

	it("draws a screenshot with nowhere to send a reader as a plain picture, never a link to #", () => {
		const { container } = render(<MapEmbed site={site} />);
		expect(screen.queryByRole("link")).toBeNull();
		expect(container.querySelector("a")).toBeNull();
		expect(
			screen.getByRole("img", { name: /Map to Kestrel Hollow Bakehouse/ }),
		).toBeInTheDocument();
		expect(screen.queryByText("Get Directions")).toBeNull();
	});

	it("links a screenshot to directions in a new tab when it has them", () => {
		render(<MapEmbed site={{ ...site, mapLinkURL: "https://maps.example.com/kestrel" }} />);
		const link = screen.getByRole("link", { name: /Get directions to Kestrel Hollow Bakehouse/ });
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener");
	});

	it("names the facade by the words it shows, so a reader can press it by voice", () => {
		render(
			<MapEmbed
				site={{ ...site, mapImage: undefined, mapEmbedURL: "https://maps.example.com/embed" }}
			/>,
		);
		// Named from its content, the address and the hint it shows, with no
		// label of its own over them that a reader would not see.
		const facade = screen.getByRole("button");
		expect(facade).not.toHaveAttribute("aria-label");
		expect(facade).toHaveAccessibleName(/^123 Main St, Denver CO 80205\s*Tap to load the map$/);
	});
});

describe("Headings that never skip a level", () => {
	it("sets each step's title one below the band's, h3 under the default h2", () => {
		const { unmount } = render(
			<ProcessSteps
				title="How an order comes together"
				steps={[{ title: "Ask", description: "Write to us." }]}
			/>,
		);
		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
			"How an order comes together",
		);
		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Ask");
		unmount();
		render(
			<ProcessSteps
				title="How an order comes together"
				headingLevel={3}
				steps={[{ title: "Ask", description: "Write to us." }]}
			/>,
		);
		expect(screen.getByRole("heading", { level: 3 })).toHaveClass("process-title");
		expect(screen.getByRole("heading", { level: 4 })).toHaveClass("step-title");
	});

	it("sets the hours heading one below the location section's title", () => {
		const { unmount } = render(<LocationSection site={testSite} title="Find the bakery" />);
		expect(screen.getByRole("heading", { level: 3, name: "Hours" })).toBeInTheDocument();
		unmount();
		render(<LocationSection site={testSite} title="Find the bakery" headingLevel={4} />);
		expect(screen.getByRole("heading", { level: 4, name: "Find the bakery" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 5, name: "Hours" })).toBeInTheDocument();
	});
});
