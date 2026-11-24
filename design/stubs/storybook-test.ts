/**
 * `storybook/test` as a preview card sees it: every name a story imports,
 * doing nothing. A card renders a story's args and render function and never
 * runs its `play`, so an assertion or a simulated event has nothing to
 * check; they only have to exist, and `fn()` has to be callable wherever
 * a story passes one as a handler.
 */

type Anything = (...args: unknown[]) => unknown;

/** A proxy every property of which is a function returning the proxy: `expect(x).not.toBe(y)`. */
function chain(): Anything {
	const target = (() => proxy) as Anything;
	const proxy: Anything = new Proxy(target, {
		get: (_, key) => (typeof key === "symbol" || key === "then" ? undefined : proxy),
		apply: () => proxy,
	});
	return proxy;
}

export const expect = chain();

interface MockState {
	calls: unknown[][];
	results: unknown[];
	instances: unknown[];
	lastCall: unknown[] | undefined;
}

/** A callable mock: records its calls, runs the implementation it was given, chains every setter. */
export function fn(implementation?: Anything): Anything {
	let impl = implementation;
	const mock: MockState = { calls: [], results: [], instances: [], lastCall: undefined };
	const target = ((...args: unknown[]) => {
		mock.calls.push(args);
		mock.lastCall = args;
		const result = impl?.(...args);
		mock.results.push(result);
		return result;
	}) as Anything;
	const proxy: Anything = new Proxy(target, {
		get: (fnTarget, key) => {
			if (key === "mock") return mock;
			if (key === "mockImplementation" || key === "mockImplementationOnce") {
				return (next: Anything) => {
					impl = next;
					return proxy;
				};
			}
			if (key === "mockReturnValue" || key === "mockResolvedValue") {
				return (value: unknown) => {
					impl = () => (key === "mockResolvedValue" ? Promise.resolve(value) : value);
					return proxy;
				};
			}
			if (key === "then") return undefined;
			if (key in fnTarget) return Reflect.get(fnTarget, key);
			return () => proxy;
		},
	});
	return proxy;
}

/**
 * A spy: the method is replaced by a mock that calls through until a story
 * gives it an implementation, so a card's `window.fetch` answers as the
 * story's relay does and makes no real request.
 */
export function spyOn(object: unknown, method: string): Anything {
	const host = object as Record<string, Anything>;
	const original = host[method];
	const mock = fn((...args: unknown[]) => original?.apply(object, args));
	host[method] = mock;
	const spy: Anything = new Proxy(mock, {
		get: (target, key) =>
			key === "mockRestore"
				? () => {
						host[method] = original as Anything;
						return spy;
					}
				: (target as unknown as Record<PropertyKey, unknown>)[key],
	});
	return spy;
}

const nothing = chain();

export const within = () => nothing;
export const screen = nothing;
export const userEvent = nothing;
export const fireEvent = nothing;
export const waitFor = async <T>(callback?: () => T) => {
	try {
		return callback?.();
	} catch {
		return undefined;
	}
};
export type Mock = Anything;
export type MockInstance = Anything;
