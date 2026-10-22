import { render } from "@testing-library/react";
import { HoursTable, LocationSection } from "../../src/sections";
import type { OpeningHours } from "../../src/sections/siteConfig";
import { testSite } from "./site-fixture";

const hours: OpeningHours[] = [
	{
		label: "Monday to Friday",
		labelShort: "Mon to Fri",
		days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
		opens: "09:00",
		closes: "17:00",
	},
	{ label: "Saturday and Sunday", labelShort: "Sat and Sun", days: [] },
];

const times = (container: HTMLElement) =>
	Array.from(container.querySelectorAll(".hours-row .time")).map((el) => el.textContent);

describe("HoursTable", () => {
	it("prints the 12 hour clock by default", () => {
		const { container } = render(<HoursTable hours={hours} />);
		expect(times(container)).toEqual(["9:00a to 5:00p", "Closed"]);
	});

	it("prints the 24 hour clock when asked", () => {
		const { container } = render(<HoursTable hours={hours} clock="24h" />);
		expect(times(container)).toEqual(["09:00 to 17:00", "Closed"]);
		expect(container.querySelectorAll(".hours-row.closed")).toHaveLength(1);
	});
});

describe("LocationSection", () => {
	it("hands the site's clock to its hours table", () => {
		const twelve = render(<LocationSection site={{ ...testSite, hours }} title="Find us" />);
		expect(times(twelve.container)).toEqual(["9:00a to 5:00p", "Closed"]);
		twelve.unmount();

		const twentyFour = render(
			<LocationSection site={{ ...testSite, hours, clock: "24h" }} title="Find us" />,
		);
		expect(times(twentyFour.container)).toEqual(["09:00 to 17:00", "Closed"]);
	});
});
