import { staticNotFoundRouting } from "../../src/routing";

describe("staticNotFoundRouting", () => {
	it("renders the page for both a miss and the pending state a miss hydrates through", () => {
		const Page = () => null;
		expect(staticNotFoundRouting(Page)).toEqual({
			defaultNotFoundComponent: Page,
			defaultPendingComponent: Page,
		});
	});
});
