import { act, render, screen } from "@testing-library/react";
import { StrictMode, useLayoutEffect } from "react";
import { EMBED_WAIT_MS, EmbeddedScriptFrame } from "../../src/sections";

/** The grace an iframe already in the mount at the first look gets, internal to the frame. */
const GRACE_MS = 2_000;

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

/**
 * Puts an iframe in the mount before the frame's own effects first look, as
 * a vendor that mounted early would: a layout effect runs before them.
 */
function EarlyVendor() {
	useLayoutEffect(() => {
		document.getElementById("vendor-mount")?.appendChild(document.createElement("iframe"));
	}, []);
	return null;
}

afterEach(() => {
	vi.restoreAllMocks();
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

	it("keeps focus out of the mount while the cover is up, and lets it in once ready", async () => {
		render(frame(nextSrc()));
		const element = mountElement();
		expect(element).toHaveAttribute("inert");
		const iframe = await vendorArrives();
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(mountElement()).toBe(element);
		expect(element).not.toHaveAttribute("inert");
	});

	it("lets focus into the mount once the fallback shows", () => {
		vi.useFakeTimers();
		render(frame(nextSrc()));
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS);
		});
		expect(mountElement()).not.toHaveAttribute("inert");
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

	it("ends the wait as ready when the timeout finds an iframe whose load was never heard", async () => {
		vi.useFakeTimers();
		render(frame(nextSrc()));
		await vendorArrives();
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS);
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByText(/Call us instead/)).not.toBeInTheDocument();
	});

	it("ends the wait as ready when the script fails late with an iframe already mounted", async () => {
		const src = nextSrc();
		render(frame(src));
		await vendorArrives();
		act(() => {
			scripts(src)[0]?.dispatchEvent(new Event("error"));
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByText(/Call us instead/)).not.toBeInTheDocument();
	});

	it("gives an iframe already in the mount at the first look a short grace, then ends the wait", () => {
		vi.useFakeTimers();
		render(
			<>
				{frame(nextSrc())}
				<EarlyVendor />
			</>,
		);
		expect(mountElement().querySelector("iframe")).not.toBeNull();
		act(() => {
			vi.advanceTimersByTime(GRACE_MS - 1);
		});
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("stops watching the mount once the tool is ready", async () => {
		const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
		render(frame(nextSrc()));
		const iframe = await vendorArrives();
		const before = disconnect.mock.calls.length;
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		// Still mounted: the watch ended because the tool is ready, not because the frame left.
		expect(disconnect.mock.calls.length).toBeGreaterThan(before);
	});
});

describe("EmbeddedScriptFrame with a ready message", () => {
	const origin = "https://widget.example.com";
	const readyMessage = { origin, type: "tool-drawn" };

	/** The vendor's iframe posting to the page, as a browser would deliver it. */
	function post(
		iframe: HTMLIFrameElement,
		init: { origin?: string; type?: string; source?: Window | null } = {},
	) {
		act(() => {
			window.dispatchEvent(
				new MessageEvent("message", {
					origin: init.origin ?? origin,
					data: { type: init.type ?? "tool-drawn" },
					source: init.source === undefined ? iframe.contentWindow : init.source,
				}),
			);
		});
	}

	it("keeps the wait over a loaded iframe until the message comes", async () => {
		render(frame(nextSrc(), { readyMessage }));
		const iframe = await vendorArrives();
		act(() => {
			iframe.dispatchEvent(new Event("load"));
		});
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
		post(iframe);
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("ignores a message from the wrong origin, the wrong window, or of the wrong type", async () => {
		render(frame(nextSrc(), { readyMessage }));
		const iframe = await vendorArrives();
		post(iframe, { origin: "https://other.example.com" });
		post(iframe, { type: "tool-height" });
		post(iframe, { source: window });
		post(iframe, { source: null });
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
	});

	it("ignores the message from an iframe outside the mount", async () => {
		render(frame(nextSrc(), { readyMessage }));
		await vendorArrives();
		const stranger = document.createElement("iframe");
		document.body.appendChild(stranger);
		post(stranger);
		expect(screen.getByRole("status")).toHaveTextContent("Loading");
		stranger.remove();
	});

	it("reveals an iframe in the mount when the wait runs out without the message", async () => {
		vi.useFakeTimers();
		render(frame(nextSrc(), { readyMessage }));
		await vendorArrives();
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS);
		});
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByText(/Call us instead/)).not.toBeInTheDocument();
	});

	it("shows the fallback when the wait runs out with no iframe", () => {
		vi.useFakeTimers();
		render(frame(nextSrc(), { readyMessage }));
		act(() => {
			vi.advanceTimersByTime(EMBED_WAIT_MS);
		});
		expect(screen.getByRole("status")).toHaveTextContent("Call us instead");
	});
});

describe("EmbeddedScriptFrame with host chrome", () => {
	const rules = () => Array.from(document.head.querySelectorAll("style[data-embed-host-chrome]"));

	it("hides the vendor's host page loader by a rule added before the script", () => {
		const src = nextSrc();
		render(frame(src, { hostChrome: "#vendor-page-spinner" }));
		const [rule] = rules();
		expect(rule?.textContent).toBe("#vendor-page-spinner { display: none !important; }");
		const script = scripts(src)[0];
		expect(script).toBeDefined();
		const children = Array.from(document.head.children);
		expect(children.indexOf(rule as Element)).toBeLessThan(children.indexOf(script as Element));
	});

	it("keeps it hidden while mounted, and takes the rule out with the frame", () => {
		const { unmount } = render(
			<StrictMode>{frame(nextSrc(), { hostChrome: "#vendor-page-spinner" })}</StrictMode>,
		);
		expect(rules()).toHaveLength(1);
		unmount();
		expect(rules()).toHaveLength(0);
	});

	it("adds no rule without host chrome", () => {
		render(frame(nextSrc()));
		expect(rules()).toHaveLength(0);
	});
});
