# CLAUDE.md

Conventions for `@atelic/ui`, the shared chrome and base styles the Atelic templates install. Installing, importing, and releasing live in [README.md](README.md).

- **Relative imports only.** No `@/` aliases: consumers compile this source with their own Vite, which resolves none of ours.
- **No router imports.** The package runs under TanStack Start prerender and later in a client SPA, so take the current path as a prop.
- **SSR safe.** Never touch `window` or `document` during render, only inside effects and handlers.
- **Acronyms stay fully capitalized** in the code names the package mints: components, props, types, and variables (`StickyCTABar`, `primaryCTA`). CSS classes and file names stay kebab lowercase (`.nav-cta`, `sticky-cta-bar.test.tsx`). A name mirroring a DOM attribute keeps the web's spelling (`id`, `ariaLabel`).
- **CSS lives inside `@layer atelic-ui`**, reads the theme tokens, and defines no theme values; `theme.css` stays in each site.
- **Layout by kind:** `src/chrome/`, `src/hooks/`, `src/styles/`, `src/lib/` for internal helpers, `src/types.ts`, with `src/components/` to come. Tests live in `tst/`.
- **No emoji in `src/`.** Write a pictograph the copy needs as an escape (`\u{1F49A}`); `tst/no-emoji.test.ts` enforces it.
- **Semver:** patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
- **Gates:** `bun run lint`, `bun run typecheck`, and `bun run test:run`, all green before a merge.
