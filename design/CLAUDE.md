# design/

The Design System producer: `design/build.ts` turns this package into the files of the Claude Design System artifact, under `design/out/project/` (gitignored), with `publish-plan.json` and `index.proposed.json` beside them. The session publishes; nothing here does, and the live index (`design-system.json`) is never written here.

- **Previews derive from stories and are never authored here.** Each card mounts its component's primary story (the first export of its story file) through `preview.tsx`, with `storybook/test` stubbed (`stubs/`). A card that needs another story, args laid over the story's, or a fixed height gets an entry in `cards.json`, whose schema is the Producer section of `README.md`; fix a poor card there or in the story, never by writing markup.
- **`README.md` is the brand book**, copied to `project/README.md` with a generated Not Synced section appended. It is prose for designers: no dashes in it, and every rule it states must hold in the code.
- **Tokens come from the sheets**: `src/styles/theme.css`, the default density in `base.css`, and `defaults.css`, with each usage from the package README's token tables, else the sheet's comment. A value the format cannot hold is skipped and listed, never approximated.
- **Run** `bun run design:build`, then `bun run design:check` (headless Chromium: fails on a console error, a failed request, or an empty card; writes each card's height; `--shots` saves pictures to `design/out/shots/`).
