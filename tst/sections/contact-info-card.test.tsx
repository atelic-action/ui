import { render, screen } from "@testing-library/react";
import { ContactInfoCard } from "../../src/sections/ContactInfoCard";
import { testSite as site } from "./site-fixture";

describe("ContactInfoCard", () => {
	it("renders the single config phone as one Call / Text row by default", () => {
		render(<ContactInfoCard site={site} />);
		expect(screen.getByText("Call / Text")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "(555) 555-0100" })).toHaveAttribute(
			"href",
			"tel:+15555550100",
		);
	});

	it("replaces the config phone with labelled lines when phones are passed", () => {
		render(
			<ContactInfoCard
				site={site}
				phones={[
					{ role: "Owner", display: "(555) 555-0101", e164: "+15555550101" },
					{ role: "Co Owner", display: "(555) 555-0102", e164: "+15555550102" },
				]}
			/>,
		);
		expect(screen.getByText("Owner")).toBeInTheDocument();
		expect(screen.getByText("Co Owner")).toBeInTheDocument();
		expect(screen.queryByText("Call / Text")).toBeNull();
	});

	it("drops the visit row for a business with no storefront", () => {
		render(<ContactInfoCard site={site} showAddress={false} />);
		expect(screen.queryByText("Visit")).toBeNull();
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("takes its heading from the title prop", () => {
		render(<ContactInfoCard site={site} title="Talk to the owners" />);
		expect(screen.getByRole("heading", { name: "Talk to the owners" })).toBeInTheDocument();
	});
});
