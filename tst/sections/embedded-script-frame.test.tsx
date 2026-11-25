import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { EMBED_WAIT_MS, EmbeddedScriptFrame } from "../../src/sections";

/** Each test its own script, since the record of what was added is shared by the page. */
let count = 0;
function nextSrc(): string {
	count += 1;
	return `https://widget.example.com/embed.js?id=test-${count}`;
}

function scripts(src: string): HTMLScriptElement[] {
	return Array.from(document.head.querySelectorAll("script")).filter(
		(script) => script.getAttribute("src") === src,
	);
}

function frame(src: string, extra: Partial<Parameters<typeof EmbeddedScriptFrame>[0]> = {}) {
	return (
		<EmbeddedScriptFrame
			src={src}
			mountId="vendor-mount"
			title="Instant estimate"
			fallback="The estimator did not load. Call us instead."
			{...extra}
		/>
	);
}

function mountElement(): HTMLElement {
	const element = document.getElementById("vendor-mount");
	if (!element) throw new Error("no mount");
	return element;
}

/** What a vendor's script does: append its iframe into the mount, then let it load. */
async function vendorArrives(): Promise<HTMLIFrameElement> {
	const iframe = document.createElement("iframe");
	await act(async () => {
		mountElement().appendChild(iframe);
	});
	return iframe;
}

afterEach(() => {
	vi.useRealTimers();
	for (const script of Array.from(document.head.querySelectorAll("script"))) script.remove();
});

describe("EmbeddedScriptFrame", () => {
	it("adds the vendor's script once, async, in the head", () => {
		const src = nextSrc();
		render(frame(src));
		const added = scripts(src);
		expect(added).toHaveLength(1);
		expect(added[0]?.async).toBe(true);
	});

	it("adds it once under strict mode's doubled effects", () => {
		const src = nextSrc();
		render(<StrictMode>{frame(src)}</StrictMode>);
		expect(scripts(src)).toHaveLength(1);
	});

	it("adds no second tag on a remount", () => {
		const src = nextSrc();
		const first = render(frame(src));
		first.unmount();
		render(frame(src));
		expect(scripts(src)).toHaveLength(1);
	});

	it("draws the mount empty by its id, and React writes nothing into it", async () => {
		const src = nextSrc();
		const { rerender } = render(frame(src));
		const element = mountElement();
		expect(element.childNodes).toHaveLength(0);
		const theirs = document.createElement("div");
		await act(async () => {
			element.appendChild(theirs);
		});
		rerender(frame(src, { loadingLabel: "Still loading" }));
		expect(mountElement()).toBe(element);
		expect(Array.from(element.childNodes)).toEqual([theirs]);
		// The status is drawn beside the mount, never inside it.
		expect(element.contains(screen.getByRole("status"))).toBe(false);
	});

	it("names the region by its title", () => {
		render(frame(nextSrc()));
		expect(screen.getByRole("region", { name: "Instant estimate" })).toBeInTheDocument();
	});

	it("shows the spinner until the vendor's iframe has loaded", async () => {
		render(frame(nextSrc()));
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
		const iframe = await vendorArrives();
		// An iframe that is there but not yet loaded keeps the wait.
		expect(screen.getByRole("status")).toBeInTheDocument();
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("finds an iframe the vendor nests deeper in the mount", async () => {
		render(frame(nextSrc()));
		const wrapper = document.createElement("div");
		const iframe = document.createElement("iframe");
		await act(async () => {
			mountElement().appendChild(wrapper);
		});
		await act(async () => {
			wrapper.appendChild(iframe);
		});
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("shows the fallback once the wait runs out", () => {
		vi.useFakeTimers();
		render(frame(nextSrc()));
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS - 1);
		});
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.getByRole("status")).toHaveTextContent(
			"The estimator did not load. Call us instead.",
		);
	});

	it("waits as long as timeoutMS says", () => {
		vi.useFakeTimers();
		render(frame(nextSrc(), { timeoutMS: 2_000 }));
		act(() => {
			vi.advanceTimersByTime(2_000);
		});
		expect(screen.getByRole("status")).toHaveTextContent("Call us instead");
	});

	it("shows the fallback at once when the script fails", () => {
		const src = nextSrc();
		render(frame(src));
		act(() => {
			scripts(src)[0]?.dispatchEvent(new Event("error"));
		});
		expect(screen.getByRole("status")).toHaveTextContent("Call us instead");
	});

	it("takes a failed script out, so a later mount tries again with one tag", () => {
		const src = nextSrc();
		const first = render(frame(src));
		act(() => {
			scripts(src)[0]?.dispatchEvent(new Event("error"));
		});
		expect(scripts(src)).toHaveLength(0);
		first.unmount();
		render(frame(src));
		expect(scripts(src)).toHaveLength(1);
	});

	it("lets a tool that loads after the fallback take its place", async () => {
		vi.useFakeTimers();
		render(frame(nextSrc()));
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS);
		});
		expect(screen.getByRole("status")).toHaveTextContent("Call us instead");
		const iframe = await vendorArrives();
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("uses a tag already on the page rather than adding a second", () => {
		const src = nextSrc();
		const theirs = document.createElement("script");
		theirs.src = src;
		document.head.appendChild(theirs);
		render(frame(src));
		expect(scripts(src)).toEqual([theirs]);
	});
});
