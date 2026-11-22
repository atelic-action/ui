import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ContactForm } from "../../src/sections/ContactForm";
import { FAQBrowser } from "../../src/sections/FAQBrowser";
import { JumpRail } from "../../src/sections/JumpRail";
import { LogoMarquee } from "../../src/sections/LogoMarquee";

/*
 * What the sections announce and where they leave focus: a refused field
 * and a send's outcome said aloud, focus kept on the field a reader must fix
 * and on the search a reader cleared, the rail's current stop, and a moving
 * row read once and able to stop. Every name and figure here is made up.
 */

/** A scroll spy stand in: every observed section reports itself in view. */
class InView {
	constructor(private readonly report: (entries: Partial<IntersectionObserverEntry>[]) => void) {}
	observe(target: Element) {
		this.report([{ isIntersecting: true, target }]);
	}
	unobserve() {}
	disconnect() {}
}

beforeEach(() => {
	vi.stubGlobal("IntersectionObserver", InView);
});
afterEach(() => {
	vi.unstubAllGlobals();
});

describe("ContactForm, said to a screen reader", () => {
	const props = {
		endpoint: "/api/contact",
		topics: ["Bread", "Something else"],
		successMessage: "Thank you, we will write back today.",
		errorMessage: "Sending failed.",
	};

	it("marks each refused field invalid, describes it by its message, and moves focus to the first", () => {
		render(<ContactForm {...props} />);
		fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robin" } });
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		const name = screen.getByLabelText("Your name");
		const email = screen.getByLabelText("Email");
		const message = screen.getByLabelText("Message");
		expect(name).not.toHaveAttribute("aria-invalid");
		expect(name).not.toHaveAttribute("aria-describedby");
		expect(email).toHaveAttribute("aria-invalid", "true");
		expect(email).toHaveAccessibleDescription("Please enter a valid email.");
		expect(message).toHaveAccessibleDescription("Please add a short message.");
		expect(email).toHaveFocus();
	});

	it("drops the refusal once the field is fixed and the form sent again", () => {
		render(<ContactForm {...props} />);
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		expect(screen.getByLabelText("Your name")).toHaveFocus();
		fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robin" } });
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		expect(screen.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
		expect(screen.getByLabelText("Email")).toHaveFocus();
	});

	it("announces the thanks in a status region that is there before it arrives", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
		render(<ContactForm {...props} />);
		const status = screen.getByRole("status");
		expect(status).toBeEmptyDOMElement();
		fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robin" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "robin@example.com" } });
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: "Two loaves, please." },
		});
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		await waitFor(() => expect(status).toHaveTextContent("Thank you, we will write back today."));
		// The same region, not a new one, so a screen reader watching it hears it.
		expect(screen.getByRole("status")).toBe(status);
	});

	it("announces a failed send in the same region", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
		render(<ContactForm {...props} />);
		fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Robin" } });
		fireEvent.change(screen.getByLabelText("Email"), { target: { value: "robin@example.com" } });
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: "Two loaves, please." },
		});
		fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sending failed."));
	});

	it("gives two forms on one page their own ids, so every label names its own field", () => {
		render(
			<>
				<ContactForm {...props} />
				<ContactForm {...props} />
			</>,
		);
		const names = screen.getAllByLabelText("Your name");
		expect(names).toHaveLength(2);
		expect(names[0]).not.toBe(names[1]);
		const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("ContactForm focus across renders", () => {
	it("keeps the refused field focused while its message shows", async () => {
		render(<ContactForm endpoint="/api/contact" topics={["Bread"]} successMessage="Thanks." />);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));
		});
		expect(screen.getByLabelText("Your name")).toHaveFocus();
		expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription(
			"Please enter your name.",
		);
	});
});

describe("FAQBrowser and JumpRail", () => {
	const categories = [
		{
			id: "bread",
			title: "Bread",
			items: [
				{
					id: "rye",
					question: "Is the rye sour?",
					answer: <p>Lightly.</p>,
					answerText: "Lightly.",
				},
			],
		},
	];

	it("returns focus to the search field when the search is cleared", () => {
		render(<FAQBrowser hero={{ title: "Questions" }} categories={categories} />);
		const search = screen.getByRole("searchbox", { name: "Search questions" });
		fireEvent.change(search, { target: { value: "rye" } });
		const clear = screen.getByRole("button", { name: "Clear search" });
		clear.focus();
		fireEvent.click(clear);
		expect(search).toHaveFocus();
		expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
	});

	it("draws no empty navigation when the search matches nothing", () => {
		render(<FAQBrowser hero={{ title: "Questions" }} categories={categories} />);
		expect(screen.getByRole("navigation", { name: "Question categories" })).toBeInTheDocument();
		fireEvent.change(screen.getByRole("searchbox"), { target: { value: "croissant" } });
		expect(screen.queryByRole("navigation", { name: "Question categories" })).toBeNull();
	});

	it("marks the stop in view as the current location, and only that one", () => {
		// The stand in reports every section in view at once; the last one wins.
		render(
			<>
				<JumpRail
					items={[
						{ id: "loaves", label: "Loaves" },
						{ id: "cakes", label: "Cakes" },
					]}
				/>
				<div id="loaves" />
				<div id="cakes" />
			</>,
		);
		// The spy observes on mount, after the stops rendered without a current one.
		const rail = screen.getByRole("navigation", { name: "Page sections" });
		const current = within(rail)
			.getAllByRole("link")
			.filter((link) => link.hasAttribute("aria-current"));
		expect(current).toHaveLength(1);
		expect(current[0]).toHaveAttribute("aria-current", "location");
		expect(current[0]).toHaveClass("active");
	});

	it("draws nothing with no stops", () => {
		const { container } = render(<JumpRail items={[]} />);
		expect(container).toBeEmptyDOMElement();
	});
});

describe("LogoMarquee", () => {
	const items = ["Wood fired", "Stone milled", "Since 2014"];

	it("hides the loop's copy from assistive tech, so each item is read once", () => {
		const { container } = render(<LogoMarquee items={items} />);
		const groups = container.querySelectorAll(".marquee-group");
		expect(groups).toHaveLength(2);
		expect(groups[0]).not.toHaveAttribute("aria-hidden");
		expect(groups[1]).toHaveAttribute("aria-hidden", "true");
		for (const item of items) {
			const read = screen
				.getAllByText(item)
				.filter((chip) => !chip.closest("[aria-hidden='true']"));
			expect(read).toHaveLength(1);
		}
	});

	it("pauses and restarts the row from one quiet toggle, named by a prop", () => {
		const { container } = render(<LogoMarquee items={items} pauseLabel="Pause the credentials" />);
		const toggle = screen.getByRole("button", { name: "Pause the credentials" });
		const marquee = container.querySelector(".marquee") as HTMLElement;
		expect(toggle).toHaveAttribute("aria-pressed", "false");
		expect(marquee).not.toHaveAttribute("data-paused");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-pressed", "true");
		expect(marquee).toHaveAttribute("data-paused");
		fireEvent.click(toggle);
		expect(marquee).not.toHaveAttribute("data-paused");
	});

	it("names the toggle Pause by default", () => {
		render(<LogoMarquee items={items} />);
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
	});
});
