import { render } from "@testing-library/react";
import { holdPhoneNumbers, isTel } from "../../src/lib/phoneText";

describe("holdPhoneNumbers", () => {
	it("wraps each phone number in a run of words, and leaves the words around it", () => {
		const { container } = render(
			<p>{holdPhoneNumbers("Call (555) 555-0142 or +1 555 555 0143 today")}</p>,
		);
		expect(
			Array.from(container.querySelectorAll(".tel-number"), (span) => span.textContent),
		).toEqual(["(555) 555-0142", "+1 555 555 0143"]);
		expect(container.textContent).toBe("Call (555) 555-0142 or +1 555 555 0143 today");
	});

	it("leaves a year, a short count, and anything not a string alone", () => {
		const { container } = render(<p>{holdPhoneNumbers("Since 2014, 11 cafes, 1,200 loaves")}</p>);
		expect(container.querySelector(".tel-number")).toBeNull();
		const node = <b>(555) 555-0142</b>;
		expect(holdPhoneNumbers(node)).toBe(node);
	});

	it("knows a call link by its href", () => {
		expect(isTel("tel:+15555550142")).toBe(true);
		expect(isTel("/contact")).toBe(false);
		expect(isTel(undefined)).toBe(false);
	});
});
