/**
 * How a figure, a mark, or a bar reads: good, a warning, broken, plain
 * information, or quiet. A component sets it as `data-tone`, and
 * `styles/components.css` turns it into `--tone`, `--tone-fill`, and
 * `--tone-bg` for whatever sits inside.
 */
export type Tone = "good" | "warn" | "bad" | "info" | "muted";
