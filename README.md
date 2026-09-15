# @atelic-action/ui

Shared UI for the Atelic templates: the site chrome (header, menu, footer, sticky CTA bar, and credit band), the scroll spy hook, and the one base stylesheet. The marketing and artifact templates install it instead of carrying their own copies, so a chrome fix lands once and every site picks it up with `bun update`.

The package ships source, not a build. Its TSX and CSS arrive as written and compile inside each site's own Vite.

## Install

```bash
bun add @atelic-action/ui
```

Peer dependencies: `react` and `react-dom` at `^19.0.0`, and `lucide-react` at `^1.23.0`.

## Vite Config

Prerendering and server rendering have to compile the package too, so keep it out of Vite's SSR externals. That is the one line a consumer adds:

```ts
// vite.config.ts
export default defineConfig({
	ssr: { noExternal: ["@atelic-action/ui"] },
});
```

## CSS Import Order

Import the stylesheets in this order, from the root route or the site's base sheet:

1. The site's fonts (`fonts.css`)
2. `@atelic-action/ui/styles/base.css`
3. `@atelic-action/ui/styles/chrome.css`
4. The site's own CSS
5. The site's `theme.css`, last

Both package sheets sit inside `@layer atelic-ui`, so any rule a site writes outside a layer wins over them whatever its specificity. The package reads the theme tokens (`--ink`, `--surface`, `--primary`, `--nav-height`, and the rest) and defines none, so `theme.css` stays the one file a site edits to rebrand. The chrome's buttons wear the site's own `.btn` classes.

## What Is Inside

| Import | Exports |
|---|---|
| `@atelic-action/ui/chrome` | `SiteHeader`, `SiteMenu`, `Footer`, `CreditBar`, `StickyCTABar`, `BrandLockup`, `SkipLink`, and their prop types |
| `@atelic-action/ui/hooks` | `useScrollSpy` and its `PageStop` type |
| `@atelic-action/ui/styles/base.css` | Resets, the `.mkt` canvas, typography, and layout helpers |
| `@atelic-action/ui/styles/chrome.css` | Styles for everything under `chrome` |

Every component renders from props alone. None reads a config file or a router, so a site maps its own config onto the props in its shell:

```tsx
import { Footer, SiteHeader, SkipLink, StickyCTABar } from "@atelic-action/ui/chrome";

<div className="mkt">
	<SkipLink />
	<SiteHeader
		brand={{ name: site.name, logo: site.logo }}
		links={site.nav.map((item) => ({ label: item.label, href: item.to }))}
		primaryCTA={site.cta}
		variant="transparent"
		currentPath={pathname}
	/>
	<main id="main">{children}</main>
	<StickyCTABar primaryCTA={site.cta} phone={site.phone} />
	<Footer brand={{ name: site.name, logo: site.logo }} email={site.email} />
</div>;
```

The menu is a native `<dialog>` opened with `showModal()`, so Escape, focus containment, and focus return come from the browser.

## Releasing

1. Bump `version` in `package.json` and merge it to `main`: patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
2. Tag the merged commit `vX.Y.Z` with the same version and push the tag:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. The Publish workflow checks that the tag matches the version, runs the gates, and publishes to npm with provenance. It needs the `NPM_TOKEN` repository secret and the `@atelic` npm organization.
