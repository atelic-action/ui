/**
 * Utilities for unwrapping API response envelopes.
 * The Rails API wraps collections in { data: { collection: T[] }, meta }
 * and entities in { data: { entity: T }, meta }.
 */

/**
 * API response envelope for collection (index) endpoints.
 */
export interface APICollectionEnvelope<T> {
	data: { collection: T[] };
	meta: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		perPage: number;
	};
}

/**
 * API response envelope for entity (show/create/update) endpoints.
 */
export interface APIEntityEnvelope<T> {
	data: { entity: T };
	meta: Record<string, unknown>;
}

/**
 * Extract a collection from the API envelope.
 * Generic over both item type T and meta type M so envelopes
 * with extended meta fields (e.g., inSeason) work without manual unwrapping.
 */
export function unwrapCollection<T, M>(envelope: {
	data: { collection: T[] };
	meta: M;
}): { data: T[]; meta: M } {
	return {
		data: envelope.data.collection,
		meta: envelope.meta,
	};
}

/**
 * Extract a single entity from the API envelope.
 */
export function unwrapEntity<T>(envelope: APIEntityEnvelope<T>): T {
	return envelope.data.entity;
}
