# Findings: Email and App

The bugs the stories of the email kit and the app shell exposed (`stories/email/`, `stories/app/`), each fixed in `src/` by a later pass. Written only by that group's writer; the format is in `stories/README.md`. App ratios are on the shell's light theme in `styles/app.css`; email ratios are on the atelic palette (`src/tokens/palettes.ts`).

## Accessibility

- Email faint ink: `Masthead` (every story, marked `a11y: { test: "todo" }` because an inline styled row carries no class to scope a rule by). Rule `color-contrast`. The atelic palette's `faint` (`#8a8272`) on its `ground` (`#f6f1e7`), 3.38:1 at 11px, on the masthead's title and meta.
- `app-destructive-contrast`: `ActionButton` (`Destructive`), `PageError` (every story), `AppLayout` (`UserMenuOpen`, `MobileMenuOpen`). Rule `color-contrast`. The kit's `--destructive` (`0 84.2% 60.2%`, `#ef4444`) fails both ways it is used: the destructive button's `--destructive-foreground` (`#fafafa`) on it at 3.6:1 (14px), and `text-destructive` words on the card and the ground at 3.76:1 and 3.6:1 (`PageError`'s title, the Log out row in the user menu and the menu sheet). A darker destructive token (red 600, `#dc2626`, is 4.83:1 under white) fixes every use.
- `app-muted-well-contrast`: `ErrorFallback` (`WithDetails`, `NotAnError`, `LongDetailsPhone`). Rule `color-contrast`. The details box sets `text-muted-foreground` (`#71717a`) on `bg-muted` (`#f4f4f5`): 4.39:1 at 12px.
- `error-details-not-focusable`: `ErrorFallback` (`LongDetailsPhone`). Rule `scrollable-region-focusable`. The details `pre` scrolls (`max-h-40 overflow-auto`) but takes no focus, so a keyboard user cannot scroll a long stack. `tabIndex={0}` with a label fixes it.
- `user-menu-name-mismatch`: `AppLayout` (every desktop story: `DesktopRail`, `CollapseTheRail`, `CollapsedRail`, `UserMenuByClick`, `UserMenuOpen`, `LongUserName`). Rule `label-content-name-mismatch`. The rail's user menu trigger shows the user's name (expanded) or initials (collapsed) and is named "User menu" by `aria-label`, which replaces what is seen: a voice user saying "Wren Okafor" reaches nothing. Drop the `aria-label` when the name shows, or make it "Wren Okafor, user menu".
- `collapsed-rail-links-unnamed`: `AppLayout` (`CollapsedRail`, and `CollapseTheRail` as a behavior check). Rule `link-name`. Collapsed, `DesktopRail`'s `RailLink` drops the label span and the link carries no name; the tooltip only describes it, and only while open. Every section link in a collapsed rail is an unnamed link. An `aria-label={item.label}` on the collapsed link fixes it.
- `toolbar-action-time-name`: `AppPageToolbar` (`ActionWithTime`). Rule `label-content-name-mismatch`. A toolbar action is always given `aria-label={ariaLabel ?? label}`, so its visible trailing time (`ago`, "06:02") is cut from its name. The label alone needs no `aria-label`; set one only for an icon only action.

## Behavior

- `toolbar-clear-drops-focus`: `AppPageToolbar` (`ClearByKeyboard`). Tab to the search's clear button and press Enter: the box empties and the button removes itself, so focus falls to the page instead of returning to the search box. Reproduce: a toolbar with a search value, focus the clear button, Enter; `document.activeElement` is the body. The clear handler should focus the input.
- `toolbar-notice-beside-row`: `AppPageToolbar` (`WithNotice`). The `notice` is documented as "a status line below the toolbar row", and on a phone it is; on a desktop `.ap-tools` is one wrapping flex row, so the notice sits beside the search, between it and the filter. Reproduce: a toolbar with a search, a filter, and a notice at 1280; the notice's top is above the search's bottom. Probably an omission (the notice wants `flex-basis: 100%` or an order after the selects); confirm the intent before fixing.
- `error-details-widen-page`: `ErrorFallback` (`LongDetailsPhone`). With `showDetails`, a stack whose longest line is longer than a phone (a request path) widens the centred column to 419px at 390, so the page scrolls sideways: the column is a flex item at `min-width: auto` and the `pre`'s line sets it (component rule 5). `min-w-0` on the column, or `w-full` on it, lets the `pre` scroll inside itself.
- `skeleton-says-nothing`: `PageSkeleton` (`AnnouncesLoading`). The skeleton is bare blocks with no `aria-busy`, no status, and no words, so a screen reader hears nothing while a page loads. An `aria-busy="true"` with a visually hidden "Loading" fixes it.

## Observed, Not Yet Marked

- `PageError` is not an alert or a status (`NotAnnounced` asserts it is neither), so a reader who triggered the load hears nothing when it fails. Whether a page error should be announced is a design call; it is not marked as a bug.
- `PageSkeleton` pulses with `animate-pulse` whatever `prefers-reduced-motion` says (component rule 13). The test run does not emulate the media query, so no story shows it.
- `ActionButton` sets `aria-label={label}` at every width, though the label is visible from `sm` up. Harmless while the two agree (`OwnAccessibleName` shows an `aria-label` must keep the label's words, or axe flags the mismatch).

## Checker Limits (Not Bugs)

- `checker-radix-hides-page`: `AppLayout` (`UserMenuOpen`). An open modal Radix menu hides the rest of the page with `aria-hidden` (each element marked `data-aria-hidden`) and holds focus inside itself, so nothing hidden can be reached; axe still counts the hidden page's links as focusable content inside an `aria-hidden` region (`aria-hidden-focus`).
- A story that fails part way while a Radix layer is open leaves the next stories in the same file unable to close theirs: the exit animation never ends and the closed layer stays mounted. Seen only while a file had failures; with every story green each closes as it should.
