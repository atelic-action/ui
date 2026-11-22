import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { Gallery } from "../../src/sections/Gallery";
import { Locations } from "../../src/sections/Locations";
import { ReviewCarousel } from "../../src/sections/ReviewCarousel";
import { ReviewWall } from "../../src/sections/ReviewWall";
import { testSite } from "./site-fixture";

/*
 * The sections' review fixes: a new tab only through newTabProps (Component
 * Rules 12), and a gallery's keys defined and unique whatever its tiles
 * share. Every name and figure here is made up.
 */

describe("A new tab only through newTabProps", () => {
	const location = {
		name: "Alder Street",
		address: "418 Alder Street",
		hours: ["Tue to Sun, 07:00 to 14:00"],
		phoneDisplay: "(555) 555-0100",
		phoneE164: "+15555550100",
	};

	function link(ui: ReactElement, name: RegExp) {
		render(ui);
		return screen.getByRole("link", { name });
	}

	it("opens a location's directions in a new tab, and a protocol link in place", () => {
		const web = link(
			<Locations
				site={{ name: "Kestrel", address: testSite.address }}
				title="Two shops"
				locations={[{ ...location, mapLink: "https://maps.example.com/alder" }]}
			/>,
			/Directions/,
		);
		expect(web).toHaveAttribute("target", "_blank");
		document.body.innerHTML = "";
		const sms = link(
			<Locations
				site={{ name: "Kestrel", address: testSite.address }}
				title="Two shops"
				locations={[{ ...location, mapLink: "sms:+15555550100" }]}
			/>,
			/Directions/,
		);
		expect(sms).not.toHaveAttribute("target");
	});

	it("opens the carousel's profile in a new tab, and says so only when it does", () => {
		const review = { quote: "The rye is the best in town.", by: "Robin" };
		const web = link(
			<ReviewCarousel
				score="4.9"
				caption="On the map"
				profileURL="https://maps.example.com/kestrel"
				items={[review]}
			/>,
			/On the map/,
		);
		expect(web).toHaveAttribute("target", "_blank");
		expect(web).toHaveAccessibleName("On the map, opens the review profile in a new tab");
		document.body.innerHTML = "";
		const mail = link(
			<ReviewCarousel
				score="4.9"
				caption="Write to us"
				profileURL="mailto:hello@example.com"
				items={[review]}
			/>,
			/Write to us/,
		);
		expect(mail).not.toHaveAttribute("target");
		expect(mail).toHaveAccessibleName("Write to us");
	});

	it("opens a review's source from the wall in a new tab", () => {
		const source = link(
			<ReviewWall
				items={[
					{
						quote: "Worth the early line.",
						by: "Robin",
						date: "2026-10-04",
						sourceURL: "https://reviews.example.com/1",
					},
				]}
			/>,
			/Read the 2026-10-04 review/,
		);
		expect(source).toHaveAttribute("target", "_blank");
		expect(source).toHaveAttribute("rel", "noopener");
	});
});

describe("Gallery keys", () => {
	it("draws every tile, two showing one photo or none with a source, without a key warning", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const { container } = render(
			<Gallery
				title="The counter"
				photos={[
					{ src: "/images/rye.jpg", alt: "Rye" },
					{ src: "/images/rye.jpg", alt: "Rye again" },
					{ placeholder: "Shot: the ovens" },
					{ placeholder: "Shot: the ovens" },
					{ caption: "A tile with no photo" },
					{},
				]}
			/>,
		);
		expect(container.querySelectorAll(".gallery-item")).toHaveLength(6);
		const keyed = error.mock.calls.filter((call) => String(call[0]).includes("key"));
		error.mockRestore();
		expect(keyed).toEqual([]);
	});
});
