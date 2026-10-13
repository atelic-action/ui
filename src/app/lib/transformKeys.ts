/**
 * Utility functions for transforming API keys.
 * Used to convert between snake_case (Rails API) and camelCase (TypeScript).
 */

/**
 * Convert a snake_case string to camelCase.
 */
function snakeToCamel(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case.
 */
function camelToSnake(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase.
 * Works with nested objects and arrays.
 * Use for API responses.
 *
 * @example
 * transformKeys({ user_name: "John", created_at: "2024-01-01" })
 * // Returns: { userName: "John", createdAt: "2024-01-01" }
 */
export function transformKeys<T>(obj: unknown): T {
	if (Array.isArray(obj)) {
		return obj.map((item) => transformKeys(item)) as T;
	}
	if (obj !== null && typeof obj === "object") {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [snakeToCamel(key), transformKeys(value)]),
		) as T;
	}
	return obj as T;
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case.
 * Works with nested objects and arrays.
 * Use for API request bodies.
 *
 * @example
 * toSnakeCase({ userName: "John", createdAt: "2024-01-01" })
 * // Returns: { user_name: "John", created_at: "2024-01-01" }
 */
export function toSnakeCase<T>(obj: unknown): T {
	if (Array.isArray(obj)) {
		return obj.map((item) => toSnakeCase(item)) as T;
	}
	if (obj !== null && typeof obj === "object") {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [camelToSnake(key), toSnakeCase(value)]),
		) as T;
	}
	return obj as T;
}
