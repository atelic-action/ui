import { describe, expect, it } from "vitest";
import {
	type APICollectionEnvelope,
	type APIEntityEnvelope,
	unwrapCollection,
	unwrapEntity,
} from "../../src/app/lib/unwrap";

interface TestItem {
	id: string;
	name: string;
}

describe("unwrapCollection", () => {
	it("extracts collection array into data", () => {
		const envelope: APICollectionEnvelope<TestItem> = {
			data: {
				collection: [
					{ id: "1", name: "First" },
					{ id: "2", name: "Second" },
				],
			},
			meta: {
				currentPage: 1,
				totalPages: 3,
				totalCount: 25,
				perPage: 10,
			},
		};

		const result = unwrapCollection(envelope);

		expect(result.data).toEqual([
			{ id: "1", name: "First" },
			{ id: "2", name: "Second" },
		]);
		expect(result.meta).toEqual({
			currentPage: 1,
			totalPages: 3,
			totalCount: 25,
			perPage: 10,
		});
	});

	it("preserves extended meta fields", () => {
		const envelope = {
			data: {
				collection: [{ id: "1", name: "First" }],
			},
			meta: {
				currentPage: 1,
				totalPages: 1,
				totalCount: 1,
				perPage: 10,
				scoring: { active: true, count: 5 },
			},
		};

		const result = unwrapCollection(envelope);

		expect(result.data).toHaveLength(1);
		expect(result.meta.scoring).toEqual({ active: true, count: 5 });
		expect(result.meta.currentPage).toBe(1);
	});

	it("handles empty collection", () => {
		const envelope: APICollectionEnvelope<TestItem> = {
			data: { collection: [] },
			meta: {
				currentPage: 1,
				totalPages: 0,
				totalCount: 0,
				perPage: 10,
			},
		};

		const result = unwrapCollection(envelope);

		expect(result.data).toEqual([]);
		expect(result.meta.totalCount).toBe(0);
	});
});

describe("unwrapEntity", () => {
	it("extracts entity from envelope", () => {
		const envelope: APIEntityEnvelope<TestItem> = {
			data: { entity: { id: "1", name: "Test" } },
			meta: {},
		};

		const result = unwrapEntity(envelope);

		expect(result).toEqual({ id: "1", name: "Test" });
	});

	it("preserves all entity fields", () => {
		interface DetailedItem {
			id: string;
			name: string;
			nested: { value: number };
		}

		const envelope: APIEntityEnvelope<DetailedItem> = {
			data: { entity: { id: "1", name: "Test", nested: { value: 42 } } },
			meta: { updatedAt: "2025-01-01" },
		};

		const result = unwrapEntity(envelope);

		expect(result).toEqual({ id: "1", name: "Test", nested: { value: 42 } });
	});
});
