/** One known accessibility issue: an axe rule lifted off the elements that fail it. */
export interface Issue {
	/** The axe rule id the stories fail. */
	rule: string;
	/** The failing elements, as a selector list; the rule skips them and everything inside. */
	elements: string;
	/**
	 * The rule's own selector, when axe gives it one other than `*` (read it in
	 * axe-core's rule definition). It is replaced, so the scoped one starts from it.
	 */
	base?: string;
}
