# Findings: Sections

The bugs the sections' stories exposed (`stories/sections/`), each fixed in `src/` by a later pass. Written only by the sections' writer; the format is in `stories/README.md`. Ratios are on the stories' theme, the practice's palette in `.storybook/theme.css`: `--surface` `#f6f1e7`, `--surface-alt` `#efe8da`, `--card` `#fdfbf6`, `--surface-inset` `#e9e0cd`, and the quiet gray `--neutral-500` `#6e6757`. Every finding this file listed through the first browser pass was fixed in `src/` (ATE-772) and its marker removed, the story keeping the check as a plain assertion.

## Accessibility

None open.

## Behavior

None open.

## Observed, Not Yet Marked

- `ComparisonTable`'s scrolling box (`.cmp-scroll`) is not focusable, so on a phone, where it scrolls, a keyboard cannot scroll it; axe's `scrollable-region-focusable` flags it in the gallery at 390. No story here shows it, since the stories' tables fit. `DataTable`'s box solves the same thing by taking a tab stop and a name only while it scrolls.
- The prime directive (no site copy in a component): many sections carry fixed English the page cannot change, visible and accessible alike. `FAQBrowser` (Search questions, Clear search, Expand all, Collapse all, Back to top, Copy link to this question, Link copied, the no match sentence), `ContactForm` (every label, every error, Send Message, Sending), `MapEmbed` (Get Directions, Tap to load the map), `LocationSection` (Proudly serving, Hours), `Locations` (Directions), `ContactInfoCard` (Call / Text, Email, Visit, Portal), `ReviewCarousel` (Previous review, Go to review N, Review N of M), `ReviewWall` (Read more, Show less, both control labels, Newest, Oldest), `LegalPage` (Last updated), `BlogIndex` (min read), `BlogPost` (Updated).
- `ContactInfoCard` finds its Portal row by searching `footerLinks` for a label containing "portal": any footer link so named is promoted into the card, and a portal named otherwise never shows.
- `ReviewCarousel`'s dots are 8 by 8 px targets; axe's target size rule passed them (their spacing may carry them), unverified by hand.
- `FullBleedVideo`'s `PlaysOnScreen` failed in about a third of the whole group and whole suite runs on a loaded machine, on its wait for the clip's opacity to reach 1, and passed alone; it now waits for the fade to begin and then for it to settle (`stories/support/settle.ts`). `chrome/BrandLockup` (`WideWordmarkImage`) and `chrome/SiteShell` (`FullPagePhone`) did the same in the whole suite runs.

## Checker Limits (Not Bugs)

- `FullBleedVideo`'s fetch margin: a story runs in an iframe, which clips what lies past its own edge, so an observer's `rootMargin` never reaches beyond it. The clip's arrival within a screen of the viewport cannot be shown in a story; its arrival on screen is (`PosterFirst`).
- Reduced motion in a stylesheet: answering `matchMedia` in script never reaches a sheet's `@media (prefers-reduced-motion)`, and setting the reader's preference through the test browser reaches every frame of the test page, so stories in other files running beside it would lose their motion too. The stories copy the loaded sheets' reduced motion rules into the story's own document, in their own layers, and answer `matchMedia` there (`stories/support/motion.ts`).
- `userEvent.tab()` ignores `inert`: it moves focus to a link inside a closed `ExpandList` or `FAQBrowser` body, which the browser refuses, so focus stays put. A closed body is checked by asking its link for focus and watching it refuse; Tab is walked only through open bodies.
- A fragment navigation inside the test frame (following a `#` link) closes the test run's browser connection. `FAQBrowser`'s `CategoryJump` and `BrowseAll` hold the click and scroll the target into view the way the browser does, its scroll margin honored (`stories/support/fragments.ts`).
- A frame's own navigation is not listed in the parent page's resource timing, so `MapEmbed` proves the embed was not loaded before the press by counting the page's frames as well as its fetches. The embed is a local stand in (`/images/sections/map-embed.html`), so the press never reaches a map service. The timings are shared by every story the file runs, so each story counts only those since it began.
- `ContactForm`'s mail handoff assigns `window.location`, which a story cannot follow or intercept, so `MailHandoff` shows the form only.
- A dialog's `close` event lands a task after the dialog shuts. `BlogPost`'s figure story waits for the large picture to unmount before pressing the tile again. The lightbox now ignores a late close once it is open again, so a press in between no longer undoes the reopen.
