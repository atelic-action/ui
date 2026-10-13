import { render, screen } from "@testing-library/react";
import { Button, Chip, ImageFrame } from "../../src/primitives";
import {
	BasePathProvider,
	hasBase,
	joinBase,
	normalizeBasePath,
	stripBase,
	useBasePath,
	useWithBase,
} from "../../src/routing";
import { FeatureGrid, Hero } from "../../src/sections";

describe("normalizeBasePath", () => {
	it("reads the root in every spelling as empty", () => {
		for (const raw of [undefined, "", " ", "/"]) expect(normalizeBasePath(raw)).toBe("");
	});

	it("puts a prefix in one form: leading slash, no trailing slash", () => {
		for (const raw of ["/proto", "proto", "/proto/", "proto/"]) {
			expect(normalizeBasePath(raw)).toBe("/proto");
		}
		expect(normalizeBasePath("/previews/proto")).toBe("/previews/proto");
	});

	it("refuses anything that is not a plain path", () => {
		for (const raw of ["/pro to", "https://x.com/proto", "/proto?x=1", "/proto#a", "//"]) {
			expect(() => normalizeBasePath(raw)).toThrow(/basePath/);
		}
	});
});

describe("joinBase", () => {
	it("prefixes root absolute paths", () => {
		expect(joinBase("/proto", "/")).toBe("/proto/");
		expect(joinBase("/proto", "/faqs")).toBe("/proto/faqs");
		expect(joinBase("/proto", "/services#running")).toBe("/proto/services#running");
		expect(joinBase("/proto", "/images/map.jpg")).toBe("/proto/images/map.jpg");
		expect(joinBase("/proto", "/api/contact")).toBe("/proto/api/contact");
	});

	it("leaves every other kind of link alone", () => {
		for (const href of [
			"https://example.com/book",
			"//cdn.example.com/x.js",
			"mailto:hi@example.com",
			"tel:+15550000000",
			"#main",
			"relative/path",
			"",
		]) {
			expect(joinBase("/proto", href)).toBe(href);
		}
	});

	it("is idempotent, and tells the base from a path that merely starts like it", () => {
		expect(joinBase("/proto", "/proto/faqs")).toBe("/proto/faqs");
		expect(joinBase("/proto", "/proto")).toBe("/proto");
		expect(joinBase("/proto", "/prototype")).toBe("/proto/prototype");
		expect(hasBase("/proto", "/proto?x")).toBe(true);
		expect(hasBase("/proto", "/prototype")).toBe(false);
	});

	it("is a no op at the root", () => {
		expect(joinBase("", "/faqs")).toBe("/faqs");
	});
});

describe("stripBase", () => {
	it("returns the site path for a based URL", () => {
		expect(stripBase("/proto", "/proto/faqs")).toBe("/faqs");
		expect(stripBase("/proto", "/proto/")).toBe("/");
		expect(stripBase("/proto", "/proto")).toBe("/");
		expect(stripBase("/proto", "/proto?k=1")).toBe("/?k=1");
	});

	it("leaves a path without the base alone", () => {
		expect(stripBase("/proto", "/faqs")).toBe("/faqs");
		expect(stripBase("/proto", "/prototype")).toBe("/prototype");
		expect(stripBase("", "/faqs")).toBe("/faqs");
	});
});

function Probe({ path }: { path?: string }) {
	const base = useBasePath();
	const withBase = useWithBase();
	return (
		<p>
			<span data-testid="base">{`[${base}]`}</span>
			<span data-testid="joined">{String(withBase(path))}</span>
		</p>
	);
}

/**
 * The provider replaced the Button and Chip wrappers each site carried: the
 * package's own Button, Chip, and every section that builds a link read the
 * base from it, and with no provider above them render every path as given.
 */
describe("BasePathProvider", () => {
	it("defaults to the root, where every path renders as written", () => {
		render(
			<>
				<Probe path="/faqs" />
				<Button href="/services">Services</Button>
				<Chip href="/about">About</Chip>
			</>,
		);
		expect(screen.getByTestId("base")).toHaveTextContent("[]");
		expect(screen.getByTestId("joined")).toHaveTextContent("/faqs");
		expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
		expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
	});

	it("normalizes the base it is given, and passes undefined through", () => {
		render(
			<BasePathProvider base="proto/">
				<Probe />
			</BasePathProvider>,
		);
		expect(screen.getByTestId("base")).toHaveTextContent("[/proto]");
		expect(screen.getByTestId("joined")).toHaveTextContent("undefined");
	});

	it("prefixes a root path on a Button and leaves every other kind of href alone", () => {
		render(
			<BasePathProvider base="/proto">
				<Button href="/services">Services</Button>
				<Button href="https://example.test/book">Book</Button>
				<Button href="tel:+13035550100">Call</Button>
				<Button href="#pricing">Pricing</Button>
				<Button href="/proto/faqs">FAQs</Button>
			</BasePathProvider>,
		);
		expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute(
			"href",
			"/proto/services",
		);
		expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute(
			"href",
			"https://example.test/book",
		);
		expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+13035550100");
		expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
		expect(screen.getByRole("link", { name: "FAQs" })).toHaveAttribute("href", "/proto/faqs");
	});

	it("still renders a real button when a Button has no href", () => {
		render(
			<BasePathProvider base="/proto">
				<Button type="submit">Send</Button>
			</BasePathProvider>,
		);
		expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
	});

	it("prefixes a root path on a Chip, and renders a span when it has no href", () => {
		render(
			<BasePathProvider base="/proto">
				<Chip href="/services">Dry needling</Chip>
				<Chip>Denver</Chip>
			</BasePathProvider>,
		);
		expect(screen.getByRole("link", { name: "Dry needling" })).toHaveAttribute(
			"href",
			"/proto/services",
		);
		expect(screen.getByText("Denver").tagName).toBe("SPAN");
	});

	it("reaches the images and links a section and a primitive build", () => {
		const { container } = render(
			<BasePathProvider base="/proto">
				<Hero
					title="A bakery"
					image={{ src: "/images/hero.jpg", alt: "The counter" }}
					scrollTarget="#menu"
				/>
				<ImageFrame src="/images/loaf.jpg" alt="A loaf" />
				<FeatureGrid
					title="Bakes"
					items={[{ title: "Sourdough", description: "Daily.", href: "/bread" }]}
				/>
			</BasePathProvider>,
		);
		expect(screen.getByAltText("The counter")).toHaveAttribute("src", "/proto/images/hero.jpg");
		expect(screen.getByAltText("A loaf")).toHaveAttribute("src", "/proto/images/loaf.jpg");
		expect(container.querySelector("a.feature-card")).toHaveAttribute("href", "/proto/bread");
		expect(screen.getByRole("link", { name: "Scroll down" })).toHaveAttribute("href", "#menu");
	});
});
