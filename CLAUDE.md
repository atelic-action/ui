# CLAUDE.md

Conventions for `@atelic-action/ui`, the shared chrome and base styles the Atelic templates install. Installing, importing, and releasing live in [README.md](README.md).

- **Relative imports only.** No `@/` aliases: consumers compile this source with their own Vite, which resolves none of ours.
- **No router imports.** The package runs under TanStack Start prerender and later in a client SPA, so take the current path as a prop. `src/routing/` builds plain option objects for a site to pass its router and imports no router itself.
- **SSR safe.** Never touch `window` or `document` during render, only inside effects and handlers.
- **Acronyms stay fully capitalized** in the code names the package mints: components, props, types, and variables (`StickyCTABar`, `primaryCTA`). CSS classes and file names stay kebab lowercase (`.nav-cta`, `sticky-cta-bar.test.tsx`). A name mirroring a DOM attribute keeps the web's spelling (`id`, `ariaLabel`).
- **CSS lives inside `@layer atelic-ui`**, reads the theme tokens, and defines no theme values; `theme.css` stays in each site.
- **Layout by kind:** `src/chrome/`, `src/components/` for page scale components, `src/routing/` for router options, `src/email/`, `src/tokens/`, `src/hooks/`, `src/styles/`, `src/lib/` for internal helpers, `src/types.ts`. Tests live in `tst/`.
- **Email components are born inline:** tables for layout, inline style objects, literal palette values off the theme context, no CSS and no `className`. That is what lets them render in a mail client and mount on a web page alike. React Email is deliberately deferred until the first client facing email, since nothing here needs it and adding it later is additive (decided 2026-09-21).
- **No emoji in `src/`.** Write a pictograph the copy needs as an escape (`\u{1F49A}`); `tst/no-emoji.test.ts` enforces it.
- **Semver:** patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
- **Gates:** `bun run lint`, `bun run typecheck`, and `bun run test:run`, all green before a merge.
