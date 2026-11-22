# Findings: Email and App

The bugs the stories of the email kit and the app shell exposed (`stories/email/`, `stories/app/`), each fixed in `src/` by a later pass. Written only by that group's writer; the format is in `stories/README.md`. App ratios are on the shell's light theme in `styles/app.css`; email ratios are on the atelic palette (`src/tokens/palettes.ts`).

## Accessibility

None open. Every finding the first pass logged here is fixed in 8.0.0, and its story now asserts the fix.

## Behavior

None open.

## Observed, Not Yet Marked

- `UI/Card`'s `CardTitle` is a `div`, not a heading (`Composed` asserts the card holds none), so a page of cards gives a screen reader nothing to move between.
- `UI/BadgeList` truncates a long tag at `max-w-24` with no title or tooltip (`LongTag`), so a sighted reader sees "Seventy tw…" and cannot read the rest.
- `ActionButton` sets `aria-label={label}` at every width, though the label is visible from `sm` up. Harmless while the two agree (`OwnAccessibleName` shows an `aria-label` must keep the label's words, or axe flags the mismatch).
- The shell's dark theme (`.dark` in `styles/app.css`) carries shadcn's stock values, checked only for destructive words on a card (8.1.0: `--destructive-ink`, held by `PageError`'s `DarkTheme`). Seen and not yet marked: the phone menu's sign out row presses to `--color-destructive-hover`, the deep fill darkened further, as words on the dark ground.
- `PageSkeleton` stops its pulse under `prefers-reduced-motion` (`motion-reduce:animate-none`), and no story shows it: the run does not emulate the media query.

## Checker Limits (Not Bugs)

- `checker-radix-hides-page`: `AppLayout` (`UserMenuOpen`), `UI/DropdownMenu` (`Open`), `UI/Select` (`Open`), `UI/OptionSelect` (`Phone`, `MatchesItsTrigger`). An open modal Radix menu or select hides the rest of the page with `aria-hidden` (each element marked `data-aria-hidden`) and holds focus inside itself, so nothing hidden can be reached; axe still counts the hidden page's links as focusable content inside an `aria-hidden` region (`aria-hidden-focus`).
- A story that fails part way while a Radix layer is open leaves the next stories in the same file unable to close theirs: the exit animation never ends and the closed layer stays mounted. Seen only while a file had failures; with every story green each closes as it should.
- The sent document (`WeeklyReport`'s `SentDocument` and `SentDocumentPhone`) renders in an iframe from `renderEmail`, and the check does not reach into the frame. The stories assert its layout (no sideways scroll at 760 and 366), and the composed stories outside a frame carry the contrast.
