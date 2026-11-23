# @atelic-action/ui

Shared UI for the Atelic templates: the site chrome (header, menu, footer, sticky CTA bar, and closing bar), the not found page and the routing that keeps it alive, the scroll spy hook, and the one base stylesheet. The marketing and artifact templates install it instead of carrying their own copies, so a chrome fix lands once and every site picks it up with `bun update @atelic-action/ui --latest`.

The package ships source, not a build. Its TSX and CSS arrive as written and compile inside each site's own Vite. The one exception is the access gate's server side, which ships compiled (see [The Access Gate](#the-access-gate)).

## Component Index

Every export, grouped by the entry it is imported from. The Storybook column links the docs page on [ui.atelic.me](https://ui.atelic.me), the package's Storybook, that shows it; none marks an export that draws nothing. The composed documents (the writeup, the read, the monthly page, the note, and the sealed document) are not here: since 2.0.0 they live in [`@atelic-action/artifact`](https://github.com/atelic-action/artifact), which builds them from the pieces this package exports.

| Export | Entry | What it is | Storybook |
|---|---|---|---|
| `SiteHeader` | `@atelic-action/ui/chrome` | The fixed bar: the lockup, the nav or a page's own stops, the call to action, the burger; transparent, solid, or dark. A nav entry with `columns` is a group that opens a mega menu panel of link columns (nested links, badges), a picture, icon rows, and cards beside a ticked feature card, and `phones` puts up to two tel links in the bar (8.0.0) | [Chrome/SiteHeader](https://ui.atelic.me/?path=/docs/chrome-siteheader--docs) |
| `SiteMenu` | `@atelic-action/ui/chrome` | The phone's full screen menu, on a native modal dialog; a group is an accordion that opens one at a time, every group closed when the menu opens (8.0.0); a dark sheet or a light one (`surface`, with `brand` for its top row), the current page underlined on both (8.2.0) | [Chrome/SiteMenu](https://ui.atelic.me/?path=/docs/chrome-sitemenu--docs) |
| `ContactDock` | `@atelic-action/ui/chrome` | The floating Get in Touch launcher and its panel of ways to reach the business, inset alike from the right and the bottom, lifting over the phone's sticky bar and riding above the footer; `SiteShell` mounts it from `site.contactDock` (8.0.0) | [Chrome/ContactDock](https://ui.atelic.me/?path=/docs/chrome-contactdock--docs) |
| `Footer` | `@atelic-action/ui/chrome` | The default footer: the brand column (the header's lockup, the Google rating linked to the profile, linked address, phone, email), the hours, the link columns, and the closing bar | [Chrome/Footer](https://ui.atelic.me/?path=/docs/chrome-footer--docs) |
| `ClosingBar`, `Copyright`, `Credit` | `@atelic-action/ui/chrome` | The line that closes every page, in two sides that each take anything: by default `Copyright` with the business's name on the left and `Credit`, the practice's made with line, on the right | [Chrome/ClosingBar](https://ui.atelic.me/?path=/docs/chrome-closingbar--docs) |
| `StickyCTABar` | `@atelic-action/ui/chrome` | The phone's bottom bar: the call to action and a call shortcut, there from the top on an interior page (`fromTop`) and sliding in after a scroll on a hero page | [Chrome/StickyCTABar](https://ui.atelic.me/?path=/docs/chrome-stickyctabar--docs) |
| `BrandLockup` | `@atelic-action/ui/chrome` | The header's identity as one link, with the recipient's mark on a sent document; the brand's own mark per surface (`onLight`, `onDark`), never recolored, at `--brand-mark-height` (8.0.0); `surface` draws one ground's mark alone, and `onClick` hears the link followed (8.2.0) | [Chrome/BrandLockup](https://ui.atelic.me/?path=/docs/chrome-brandlockup--docs) |
| `SkipLink` | `@atelic-action/ui/chrome` | The keyboard user's jump past the chrome | [Chrome/SkipLink](https://ui.atelic.me/?path=/docs/chrome-skiplink--docs) |
| `Brand`, `BrandLogo`, `CallToAction`, `HoursRow`, `MenuContact`, `NavLink`, `NavPanelSection`, `NavGroupColumn`, `NavGroupLink`, `NavGroupChildLink`, `NavPictureSection`, `NavIconRowsSection`, `NavIconRow`, `NavIcon`, `NavCardsSection`, `NavCard`, `NavFeature`, `HeaderPhone`, `SiteMenuSurface`, `MenuBurgerStyle`, `FooterHoursPlacement`, `ContactDockConfig`, `ContactDockItem`, `ContactDockIcon`, `Phone`, `PostalAddress`, `SiteLink`, `SocialLink`, `PageStop`, `FooterColumn`, `FooterColumnLink`, `FooterIcon` | `@atelic-action/ui/chrome` | The shapes the chrome renders from (types) | none |
| `NotFound` | `@atelic-action/ui/components` | The body of the page an unknown path renders | [Components/NotFound](https://ui.atelic.me/?path=/docs/components-notfound--docs) |
| `Checklist` | `@atelic-action/ui/components` | A short list of checks, each passed or failed | [Components/Checklist](https://ui.atelic.me/?path=/docs/components-checklist--docs) |
| `IconList` | `@atelic-action/ui/components` | A list whose bullets are icons, one for the list or one per item, each in a tone | [Components/IconList](https://ui.atelic.me/?path=/docs/components-iconlist--docs) |
| `DataTable` | `@atelic-action/ui/components` | A table whose first column names each row, sortable, stacking on a phone | [Components/DataTable](https://ui.atelic.me/?path=/docs/components-datatable--docs) |
| `Hint` | `@atelic-action/ui/components` | An info icon that opens a short explainer beside a word, or beside a table heading | [Components/Hint](https://ui.atelic.me/?path=/docs/components-hint--docs) |
| `ReportCard` | `@atelic-action/ui/components` | A name, a grade, and a line per row, in labeled groups, each row a link to its section | [Components/ReportCard](https://ui.atelic.me/?path=/docs/components-reportcard--docs) |
| `reportCardLabels`, `ReportCardLabels` | `@atelic-action/ui/components` | The words a screen reader hears around a report card's letters by default, and their type | none |
| `Rank` | `@atelic-action/ui/components` | A figure with its badge in a tone, for a table cell: a rank, a place in an answer, or a dash | [Components/Rank](https://ui.atelic.me/?path=/docs/components-rank--docs) |
| `StatRow` | `@atelic-action/ui/components` | A row of large figures with periods, deltas, and trends; a share's denominator set small after the figure (`outOf`) and a change set small beside it with a triangle (`change`), 3.14.0 | [Components/StatRow](https://ui.atelic.me/?path=/docs/components-statrow--docs) |
| `Callout` | `@atelic-action/ui/components` | One finding: an icon in its tone, the title, the explainer (not `CalloutPanel`, the business's headline claims) | [Components/Callout](https://ui.atelic.me/?path=/docs/components-callout--docs) |
| `Disclosure` | `@atelic-action/ui/components` | A section that folds: controlled, an app's card; uncontrolled, a native details fold that prints open | [Components/Disclosure](https://ui.atelic.me/?path=/docs/components-disclosure--docs) |
| `MultiSelect`, `MultiSelectOption`, `MultiSelectProps` | `@atelic-action/ui/components` | A button naming what is chosen over a Radix popover of Radix checkboxes, any number ticked, each chosen value submitted under `name`; styled in `components.css`, so an app draws it too (8.5.0) | [Components/MultiSelect](https://ui.atelic.me/?path=/docs/components-multiselect--docs) |
| `Tabs`, `TabsItem` | `@atelic-action/ui/components` | Panels behind a row of tabs, every panel kept in the page: a hash opens the tab or the panel holding what it names, and it prints every panel under its label | [Components/Tabs](https://ui.atelic.me/?path=/docs/components-tabs--docs) |
| `StackedBar` | `@atelic-action/ui/components` | One bar split into the parts of a whole, with a key | [Components/StackedBar](https://ui.atelic.me/?path=/docs/components-stackedbar--docs) |
| `ColumnChart` | `@atelic-action/ui/components` | A bar a period, the periods in labeled groups | [Components/ColumnChart](https://ui.atelic.me/?path=/docs/components-columnchart--docs) |
| `ThresholdScale` | `@atelic-action/ui/components` | Zones on a scale and a pin for each reading | [Components/ThresholdScale](https://ui.atelic.me/?path=/docs/components-thresholdscale--docs) |
| `StarRating`, `describeStarRating` | `@atelic-action/ui/components` | A row of stars in half steps, read only or editable, and its spoken name | [Components/StarRating](https://ui.atelic.me/?path=/docs/components-starrating--docs) |
| `GateLogin` | `@atelic-action/ui/components` | The access gate's sign in screen | [Components/GateLogin](https://ui.atelic.me/?path=/docs/components-gatelogin--docs) |
| `Watermark` | `@atelic-action/ui/components` | The signed in reader's confidential stamp, pill or tiled | [Components/Watermark](https://ui.atelic.me/?path=/docs/components-watermark--docs) |
| `readCookie`, `Tone` | `@atelic-action/ui/components` | The cookie reader the watermark uses, and the tone type | none |
| `Button`, `PrimaryButton`, `SecondaryButton`, `Chip`, `Eyebrow`, `Lead`, `SectionHeading` | `@atelic-action/ui/primitives` | The small pieces a page is set in; the two named buttons are the only call to action shapes a page uses | [Primitives/Button](https://ui.atelic.me/?path=/docs/primitives-button--docs) |
| `AddressSearch`, `AddressProvider`, `AddressSuggestion`, `AddressParts`, `AddressSearchProps` | `@atelic-action/ui/primitives` | A field that offers addresses as they are typed from the provider a site passes, and hands back the street, city, state, and ZIP on a pick; renders nothing without a provider (8.5.0) | [Primitives/AddressSearch](https://ui.atelic.me/?path=/docs/primitives-addresssearch--docs) |
| `ExpandableText`, `ExpandableTextProps` | `@atelic-action/ui/primitives` | Long text clamped to a few lines behind Show more, every word kept in the page, a checkbox's whole label when `labelFor` is set (8.5.0) | [Primitives/ExpandableText](https://ui.atelic.me/?path=/docs/primitives-expandabletext--docs) |
| `GradeChip`, `gradeLabel`, `WriteupGrade` | `@atelic-action/ui/artifact` | A section's grade, A to D, as a chip in its color, the letter alone, and the grade type | [Artifact/GradeChip](https://ui.atelic.me/?path=/docs/artifact-gradechip--docs) |
| `SignOff`, `WriteupPerson` | `@atelic-action/ui/artifact` | The close a document ends on, and the person it names | [Artifact/SignOff](https://ui.atelic.me/?path=/docs/artifact-signoff--docs) |
| `Shot`, `WriteupShot` | `@atelic-action/ui/artifact` | The owner's own screen, opening the full picture, over its caption; a portrait crop is marked `data-portrait` and held to 200px (1.8in in print) | [Artifact/Shot](https://ui.atelic.me/?path=/docs/artifact-shot--docs) |
| `Paragraph`, `Runs`, `ArtifactAnchor`, `isEmpty`, `isQuery`, `ArtifactLink`, `ArtifactQuery`, `ArtifactRun`, `ArtifactParagraph` | `@atelic-action/ui/artifact` | Plain data text a routine can write as JSON: a paragraph, its runs alone, one link, the empty test, the query test, and the four types | [Artifact/Paragraph](https://ui.atelic.me/?path=/docs/artifact-paragraph--docs) |
| `ArtifactShell` | `@atelic-action/ui/artifact` | The chrome around a document page: skip link, dark header, the closing bar with the sender's copyright and the credit, watermark | [Artifact/ArtifactShell](https://ui.atelic.me/?path=/docs/artifact-artifactshell--docs) |
| `AppErrorBoundary`, `ErrorFallback` | `@atelic-action/ui/artifact` | The error boundary and the page it falls back to | [Artifact/AppErrorBoundary](https://ui.atelic.me/?path=/docs/artifact-apperrorboundary--docs) |
| `buildPageHead`, `canonicalURL`, `newTabProps`, the `ArtifactConfig` types | `@atelic-action/ui/artifact` | A page's head, a link's new tab props, and a site's contract | none |
| `whoIsReading` | `@atelic-action/ui/artifact` and `@atelic-action/ui/artifact/readers` | Who opened a document, by the email they signed in with; the second entry is the same function, built, for what Node runs | none |
| `Masthead`, `TitleCard`, `Footer`, `FailurePage` | `@atelic-action/ui/email` | An email's frame: the wordmark row, the title card, the foot, the failure page (plain, or structured by a step and a fix) | [Email/Masthead](https://ui.atelic.me/?path=/docs/email-masthead--docs) |
| `Card`, `Row`, `FoldRow`, `Eyebrow`, `SubEyebrow`, `Fold`, `BigFold` | `@atelic-action/ui/email` | The containers and labels an email's sections sit in | [Email/Card](https://ui.atelic.me/?path=/docs/email-card--docs) |
| `Item`, `TitleLine`, `Note`, `EmptyRow`, `Stat`, `StatsRow`, `List`, `ListRow`, `LeadRow`, `ReadBlock`, `Badge` | `@atelic-action/ui/email` | The rows inside a card | [Email/Item](https://ui.atelic.me/?path=/docs/email-item--docs) |
| `Scoreboard`, `GroupRow`, `TargetRow`, `Bar`, `DayStrip` | `@atelic-action/ui/email` | Targets against what was logged, and the week by day | [Email/Scoreboard](https://ui.atelic.me/?path=/docs/email-scoreboard--docs) |
| `RecordStack`, `RecordTimelineStrip`, `Records` | `@atelic-action/ui/email` | Records stacked for a phone, their timeline, and the fixed column table | [Email/RecordStack](https://ui.atelic.me/?path=/docs/email-recordstack--docs) |
| `EmailThemeProvider`, `useEmailTheme`, `eyebrowStyle`, `accentInk`, `contrastRatio`, `wrapLong`, the plain text helpers (`recordStackText`, `recordTimelineSummary`, `wrap`, `textTable`, and the rest) | `@atelic-action/ui/email` | The palette context, the accent's ink and the contrast check behind it, the long token wrap, and the plain text twin (see [Email](#email)) | [Email/WeeklyReport](https://ui.atelic.me/?path=/docs/email-weeklyreport--docs) (the text twin) |
| `renderEmail`, `renderFailureEmail` | `@atelic-action/ui/email/render` | The whole email document, and the failure page's | [Email/WeeklyReport](https://ui.atelic.me/?path=/docs/email-weeklyreport--docs) |
| `atelicPalette`, `atelicFonts`, `toThemeCSS`, `themeTokenMap`, `Palette`, `Fonts` | `@atelic-action/ui/tokens` | The palette and font stacks, with no React | none |
| `useScrollSpy` | `@atelic-action/ui/hooks` | Which section is in the reading band; the header's stops use it | [Chrome/SiteHeader](https://ui.atelic.me/?path=/docs/chrome-siteheader--docs) (the dark bar's stops) |
| `staticNotFoundRouting`, `StaticNotFoundOptions` | `@atelic-action/ui/routing` | The router options that keep a prerendered not found page alive; given the router's `useMatches`, its pending view draws the page on a miss alone (8.2.0) | none |
| `signToken`, `verifyToken`, `safeNext`, `needsSession` | `@atelic-action/ui/gate` | The access gate's tokens, the safe post sign in path, and the wall's test | none |
| `POST`, `createRequestLink` | `@atelic-action/ui/gate/request-link` | The function that emails a sign in link | none |
| `GET` | `@atelic-action/ui/gate/verify` | The function that turns a link into a session | none |
| default, `createMiddleware` | `@atelic-action/ui/gate/middleware` | The middleware that holds a host behind the gate | none |
| `artifactConfig`, `artifactPages` | `@atelic-action/ui/vite` | An artifact site's whole Vite configuration, and its page list | none |
| `privateChunks`, `isPrivateContent`, `DOC_DIR` | `@atelic-action/ui/vite` and `@atelic-action/ui/vite/private-chunks` | The plugin that keeps private content behind the wall; the second entry loads neither optional peer | none |
| `base.css`, `chrome.css`, `components.css`, `primitives.css`, `gate.css`, `artifact.css`, `star-rating.css` | `@atelic-action/ui/styles/*` | The stylesheets, in the order under [CSS Import Order](#css-import-order) | every section |
| `BlogIndex` | `@atelic-action/ui/sections` | The post listing as a readable stack | [Sections/BlogIndex](https://ui.atelic.me/?path=/docs/sections-blogindex--docs) |
| `BlogPost` | `@atelic-action/ui/sections` | One article: back link, title, byline and dateline, body | [Sections/BlogPost](https://ui.atelic.me/?path=/docs/sections-blogpost--docs) |
| `CalloutPanel` | `@atelic-action/ui/sections` | Short callouts on the primary field, a heavy title over a subtitle each, four across and two by two below, titles and subtitles each on a shared line (8.0.0) | [Sections/CalloutPanel](https://ui.atelic.me/?path=/docs/sections-calloutpanel--docs) |
| `CTASection` | `@atelic-action/ui/sections` | The standard closer: the site's own primary action and an optional ghost second | [Sections/CTASection](https://ui.atelic.me/?path=/docs/sections-ctasection--docs) |
| `ComparisonTable` | `@atelic-action/ui/sections` | A graded before and after that scrolls sideways on a phone rather than reflowing; a row's label can link to what explains it (`stageHref`, 3.14.0) | [Sections/ComparisonTable](https://ui.atelic.me/?path=/docs/sections-comparisontable--docs) |
| `ContactForm` | `@atelic-action/ui/sections` | Validated form with a honeypot that posts to `endpoint` (or hands off to mail); `onLead` replaces the default GA4 `generate_lead` event; opt in props add a split name, a phone, the address with its search, a services picker, a consent line, a count of fields to fix, and a thanks that replaces the form (8.5.0) | [Sections/ContactForm](https://ui.atelic.me/?path=/docs/sections-contactform--docs) |
| `ContactFormAddress`, `ContactFormConsent`, `ContactFormLabels`, `ContactFormPlaceholders`, `ContactFormThanks`, `ContactFormValues`, `ContactFormField`, `isPhoneNumber`, `isZIP` | `@atelic-action/ui/sections` | The shapes the form's opt in props take, what a visitor wrote, and the form's default phone and ZIP checks (8.5.0) | none |
| `ContactInfoCard` | `@atelic-action/ui/sections` | A dark card of direct contact rows: call, email, visit, portal; `layout="stacked"` sets each label over its number (8.5.0) | [Sections/ContactInfoCard](https://ui.atelic.me/?path=/docs/sections-contactinfocard--docs) |
| `InfoRows`, `InfoRow`, `InfoRowAction`, `InfoRowIcon`, `InfoRowsProps` | `@atelic-action/ui/sections` | Rows of a title over a few lines with one icon action on the right, the way a map pack lists a place with its directions (8.5.0) | [Sections/InfoRows](https://ui.atelic.me/?path=/docs/sections-inforows--docs) |
| `CredentialList` | `@atelic-action/ui/sections` | Credential cards with a mono code before each | [Sections/CredentialList](https://ui.atelic.me/?path=/docs/sections-credentiallist--docs) |
| `ExpandList` | `@atelic-action/ui/sections` | A light accordion of numbered rows whose bodies stay in the HTML while closed | [Sections/ExpandList](https://ui.atelic.me/?path=/docs/sections-expandlist--docs) |
| `FAQBrowser` | `@atelic-action/ui/sections` | The help page: live search, a sticky `JumpRail` of categories with scroll spy, expand all, deep links; `contactHref` sets where the no match line points | [Sections/FAQBrowser](https://ui.atelic.me/?path=/docs/sections-faqbrowser--docs) |
| `FeatureDetail` | `@atelic-action/ui/sections` | Alternating copy and media rows with tags and a tick list | [Sections/FeatureDetail](https://ui.atelic.me/?path=/docs/sections-featuredetail--docs) |
| `FeatureGrid` | `@atelic-action/ui/sections` | Numbered cards with a hover lift under a heading and an optional `lead`; a card is a link or holds one, never both | [Sections/FeatureGrid](https://ui.atelic.me/?path=/docs/sections-featuregrid--docs) |
| `FullBleedVideo` | `@atelic-action/ui/sections` | A silent looping clip edge to edge: the poster at once, the clip once it is on screen and only while on screen, the poster alone under reduced motion (8.0.0) | [Sections/FullBleedVideo](https://ui.atelic.me/?path=/docs/sections-fullbleedvideo--docs) |
| `Gallery` | `@atelic-action/ui/sections` | A captioned wall of the business's own work, a shot brief where a photo is missing | [Sections/Gallery](https://ui.atelic.me/?path=/docs/sections-gallery--docs) |
| `Hero` | `@atelic-action/ui/sections` | The home page opener: a full bleed image (or the token gradient), a headline with a serif accent, a pair of actions, trust figures, and a scroll cue; `layout="split"` sets the copy on the primary field beside the photo (8.0.0) | [Sections/Hero](https://ui.atelic.me/?path=/docs/sections-hero--docs) |
| `HoursTable` | `@atelic-action/ui/sections` | Day rows with dashed rules and mono times | [Sections/HoursTable](https://ui.atelic.me/?path=/docs/sections-hourstable--docs) |
| `JumpRail` | `@atelic-action/ui/sections` | Sticky in page pill tabs with scroll spy, used by `FAQBrowser` and on its own | [Sections/JumpRail](https://ui.atelic.me/?path=/docs/sections-jumprail--docs) |
| `LegalPage` | `@atelic-action/ui/sections` | A legal document from data, its last revised date first | [Sections/LegalPage](https://ui.atelic.me/?path=/docs/sections-legalpage--docs) |
| `LinkColumns` | `@atelic-action/ui/sections` | Columns of links under a section heading, each a heading over its links, a link's figure (`count`) set right aligned in tabular numerals (8.0.0) | [Sections/LinkColumns](https://ui.atelic.me/?path=/docs/sections-linkcolumns--docs) |
| `LocationSection` | `@atelic-action/ui/sections` | The local search section: service areas as prose, hours, directions, and the map | [Sections/LocationSection](https://ui.atelic.me/?path=/docs/sections-locationsection--docs) |
| `Locations` | `@atelic-action/ui/sections` | More than one address: the flagship's map beside a card for each location | [Sections/Locations](https://ui.atelic.me/?path=/docs/sections-locations--docs) |
| `LogoMarquee` | `@atelic-action/ui/sections` | A dark band of chips scrolling without end: credentials, clients, or press | [Sections/LogoMarquee](https://ui.atelic.me/?path=/docs/sections-logomarquee--docs) |
| `MapEmbed` | `@atelic-action/ui/sections` | The map: a screenshot linking to directions, or a click to load facade over the live embed | [Sections/MapEmbed](https://ui.atelic.me/?path=/docs/sections-mapembed--docs) |
| `PageHero` | `@atelic-action/ui/sections` | The interior page opener on the alternate band; children sit under the lead | [Sections/PageHero](https://ui.atelic.me/?path=/docs/sections-pagehero--docs) |
| `ProofStrip` | `@atelic-action/ui/sections` | One row of short proof facts under a hero, a figure over its label each, wrapping to a grid on a phone (8.0.0) | [Sections/ProofStrip](https://ui.atelic.me/?path=/docs/sections-proofstrip--docs) |
| `PricingBand` | `@atelic-action/ui/sections` | A brand colored band with the price in a card beside it, informational by design | [Sections/PricingBand](https://ui.atelic.me/?path=/docs/sections-pricingband--docs) |
| `PricingCard` | `@atelic-action/ui/sections` | A standalone price card with a tick list and its booking action | [Sections/PricingCard](https://ui.atelic.me/?path=/docs/sections-pricingcard--docs) |
| `ProcessSteps` | `@atelic-action/ui/sections` | A dark band of numbered steps beside a frame, landing on its `id` | [Sections/ProcessSteps](https://ui.atelic.me/?path=/docs/sections-processsteps--docs) |
| `ProfileCards` | `@atelic-action/ui/sections` | Equal weight cards of media beside a short bio | [Sections/ProfileCards](https://ui.atelic.me/?path=/docs/sections-profilecards--docs) |
| `RevealSlider` | `@atelic-action/ui/sections` | Drag or arrow keys to compare two frames, each with its own toned shot brief before photography | [Sections/RevealSlider](https://ui.atelic.me/?path=/docs/sections-revealslider--docs) |
| `ReviewCarousel` | `@atelic-action/ui/sections` | The aggregate beside one large review at a time, stepped by dots and arrows, each review linking to its source | [Sections/ReviewCarousel](https://ui.atelic.me/?path=/docs/sections-reviewcarousel--docs) |
| `ReviewWall` | `@atelic-action/ui/sections` | The reviews page: tag filter and sort when the data carries them, clamped quotes behind Read more | [Sections/ReviewWall](https://ui.atelic.me/?path=/docs/sections-reviewwall--docs) |
| `SplitSection` | `@atelic-action/ui/sections` | The two column band: copy beside copy, or media beside copy | [Sections/SplitSection](https://ui.atelic.me/?path=/docs/sections-splitsection--docs) |
| `SiteConfig` and its member types (`Density` among them), `Surface` (the band every section's `surface` takes, 8.0.0), `formatClock`, `formatHoursRange`, `isClosed`, `isHoneypotFilled`, `trackEvent` | `@atelic-action/ui/sections` | The site contract the sections read, and the hours, honeypot, and lead event helpers | none |
| `Bubble`, `ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, `TickList` | `@atelic-action/ui/primitives` | The marketing primitives: a round tile holding an icon or a step number, a framed image, prose blocks (headings at two levels, paragraphs, lists, and figures: small captioned tiles in rows, an image or a silent looping clip played only while on screen, each opening large in a dialog), a quote card, a row of filled stars, a tick list | [Primitives/Bubble](https://ui.atelic.me/?path=/docs/primitives-bubble--docs) |
| `SiteShell` | `@atelic-action/ui/chrome` | A marketing page's whole chrome: skip link, header, main, footer, sticky bar, the contact dock when configured, mounting the base path provider and setting the section density | [Chrome/SiteShell](https://ui.atelic.me/?path=/docs/chrome-siteshell--docs) |
| `BasePathProvider`, `useBasePath`, `useWithBase`, `joinBase`, `stripBase`, `hasBase`, `normalizeBasePath` | `@atelic-action/ui/routing` | The base path a site is served under, read by Button, Chip, and every section that builds a link | none |
| `joinBase`, `stripBase`, `hasBase`, `normalizeBasePath` | `@atelic-action/ui/routing/base-path` | The same four pure helpers, built, for what Node runs (a Playwright spec, a script) | none |
| `marketingConfig` | `@atelic-action/ui/vite` | A marketing site's whole Vite configuration as one call; with the three Sentry variables it uploads hidden source maps under the commit (8.1.0) | none |
| `buildRelease`, `sentryUpload`, `SentryUpload`, `environmentPlugin` | `@atelic-action/ui/vite` | The commit a build is filed under, the source map upload's settings (on only with its three variables), and the plugin that names the build's environment for the browser (8.1.0) | none |
| `isMiss`, `MissMatch`, `CATCH_ALL_ROUTE_ID` | `@atelic-action/ui/routing` | Whether a router's matches are a miss (the catch all route, or a route whose params name no page), router free, for a site's root route (8.1.0) | none |
| `routerErrorOptions`, `RouteErrorFallback`, `RouteErrorProps`, `reportRouteError` | `@atelic-action/ui/routing` | The router options that report a route's render crash and draw the package's error page in its place, router free (8.2.0; see [Error Reporting](#error-reporting)) | [Routing/RouteErrorFallback](https://ui.atelic.me/?path=/docs/routing-routeerrorfallback--docs) |
| `startErrorReporting`, `ErrorCatcherScript` (`enabled`, 8.2.0), `ErrorCatcherScriptProps`, `errorCatcherScript`, `reportError`, `installCatcher`, `readCatcher`, `afterFirstPaint`, `throwLaunchCheck`, `LAUNCH_CHECK_MESSAGE` | `@atelic-action/ui/monitoring` | Error reporting in the browser: the inline early catcher, and the start function that loads the Sentry SDK after first paint, errors only (8.1.0; see [Error Reporting](#error-reporting)) | none |
| `reportServerError`, `reportServerErrorLater`, `WaitUntilContext`, `refusalError`, `reportRefusedResponse`, `withErrorReporting`, `parseDSN`, `parseStack`, `buildEnvelope` | `@atelic-action/ui/monitoring/server` | Error reporting from a function or the middleware, dependency free and built, for what Vercel runs uncompiled (8.1.0); the later one sends without holding the answer, on the platform's `waitUntil` (8.2.0) | none |
| `sections.css` | `@atelic-action/ui/styles/sections.css` | Styles for everything under `sections`, imported after `primitives.css` | none |
| `AppProvider`, `AppConfigProvider`, `useAppConfig`, `useNav`, `useUser`, `configureApp`, `getAppConfig`, `AppConfig`, `NavItem`, `AppUser`, `Register` | `@atelic-action/ui/app` | The app shell's seam: the app hands in its config and nav, registers its user type, and reads them back | [App/AppProvider](https://ui.atelic.me/?path=/docs/app-appprovider--docs) |
| `AppLayout`, `AppPage`, `AppPageToolbar`, `Breadcrumbs`, `SectionCards`, `DesktopRail`, `MobileTabBar`, `MobileMenu`, `UserMenu`, `PageSkeleton`, `PageError`, `ActionButton`, `FormActionButtons`, `activeSection` | `@atelic-action/ui/app` | The app frame: the rails, the tab bar, the page scaffold with its toolbar and right rail | [App/AppLayout](https://ui.atelic.me/?path=/docs/app-applayout--docs) |
| `AuthGuard`, `ErrorFallback`, `GoogleGlyph`, `useAuthStore`, `useUnitsStore`, `apiFetch`, `publicFetch`, `session`, the hooks and the wire types | `@atelic-action/ui/app` | Auth, transport, the two shell stores, and the helpers the shell runs on | [App/AuthGuard](https://ui.atelic.me/?path=/docs/app-authguard--docs) |
| The shadcn kit (`Button`, `Dialog`, `Select`, `OptionSelect`, `SearchInput`, `BadgeList`, `Callout`, and the rest) | `@atelic-action/ui/app/ui` | The kit the shell is set in; a new kit component lands here, never in an app | [App/UI/Button](https://ui.atelic.me/?path=/docs/app-ui-button--docs) |
| `app.css` | `@atelic-action/ui/styles/app.css` | The shell's Tailwind sheet: the token mapping, the default tokens, the base layer, the `ap-*` scaffold, and the `@source` that points Tailwind at the shell | none |
| The `atelic-*` commands | the `bin` map | The build guard, health stamp, link and wall checks, reader link, static server, print, sealing, and the marketing site's sitemap clean, base path check, contact canary, and Sentry check (8.1.0) | none |


## Install

```bash
bun add @atelic-action/ui
```

From 1.0.0 a caret range admits every minor and patch, so a plain `bun update @atelic-action/ui` takes them; a new major still needs `--latest`. A site still on a `^0.x` range takes 1.0 with `--latest` once.

Peer dependencies: `react` and `react-dom` at `^19.0.0`, and `lucide-react` at `^1.23.0`. Three more are optional, needed only by a site whose `vite.config.ts` imports `@atelic-action/ui/vite`: `vite`, `@tanstack/react-start`, and `@vitejs/plugin-react`. The commands the package installs run under `bun`, with `node` for the sealing command.

## Vite Config

Prerendering and server rendering have to compile the package too, so keep it out of Vite's SSR externals. That is the one line a consumer adds:

```ts
// vite.config.ts
export default defineConfig({
	ssr: { noExternal: ["@atelic-action/ui", "@atelic-action/artifact"] },
});
```

A site that renders a document needs `@atelic-action/artifact` kept internal the same way, since it too ships TSX and CSS as written; a site that renders none lists `@atelic-action/ui` alone.

## CSS Import Order

Import the stylesheets in this order, from the root route or the site's base sheet:

1. The site's fonts (`fonts.css`)
2. `@atelic-action/ui/styles/base.css`
3. `@atelic-action/ui/styles/chrome.css`
4. `@atelic-action/ui/styles/components.css`
5. `@atelic-action/ui/styles/primitives.css`
6. `@atelic-action/ui/styles/gate.css`, on a site that mounts the access gate
7. `@atelic-action/ui/styles/artifact.css`, on a site that hosts the artifact documents
8. `@atelic-action/artifact/styles/documents.css`, on the same site, for the documents themselves
9. The site's own CSS
10. The site's `theme.css`, last

Every rule in the package sheets is scoped under `.atelic-ui`, the one root class a consumer wears: a site puts it on its outermost wrapper, an app on the region that holds a package component. Which sheets it imports decides what it gets, so a site importing `base.css` gets the resets and typography under that class and an app importing `components.css` alone gets none of them.

The package sheets sit inside `@layer atelic-ui`, so any rule a site writes outside a layer wins over them whatever its specificity. The package reads the theme tokens (`--ink`, `--surface`, `--primary`, `--nav-height`, and the rest) and defines none of them, so `theme.css` stays the one file a site edits to rebrand; the only values it declares are the defaults of its own optional tokens, on a selector that weighs nothing (see [Tokens](#tokens)). The chrome's buttons wear the `.btn` classes, which `primitives.css` defines and a site may restyle.

## Rendering From Props

Every component renders from props alone. None reads a config file or a router, so a site maps its own config onto the props in its shell:

```tsx
import { Footer, SiteHeader, SkipLink, StickyCTABar } from "@atelic-action/ui/chrome";

<div className="atelic-ui">
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

A sent artifact's header names who the document is for as well as who it is
from: pass `recipient: { src, alt }` on the `brand` (added 0.6.0) and the
lockup reads "atelic × <their mark>", the sender's wordmark and run first, a
quiet times sign, then the recipient's mark at wordmark height. Cut the mark
for the surface the header wears (a light mark for the dark bar) and keep it
an image; the chrome draws no second wordmark. A marketing site's lockup
passes no recipient. The run after the wordmark reads `--brand-accent` when
the theme sets it (a client branded host pins the sender's orange there) and
falls back to `--primary` (0.6.1), and the recipient's mark sits at the same
height as the sender's, `--brand-mark-height`.

The mark is the brand's own artwork. A site whose logo is cut once per
surface passes `logo.onLight` (drawn on the light bar) and `logo.onDark`
(drawn on the dark bar, over a hero, and in the footer), and the chrome
never recolors a cut on its own surface. A site that passes `logo.src`
alone keeps what it had: a light mark that the header tints to ink on the
light bar. Every header mark stands at `--brand-mark-height` (30px unless
the theme sets it) and runs as wide as its own ratio, so a wide wordmark
reads at a height the theme picks, and `logo.wordmark: false` drops the
live name beside artwork that already spells it; with no mark at all the
name stays, so the home link is never empty.

The header and the footer resolve the mark by one order (8.0.0): a
surface draws its own cut as given; failing that, `src`, as given on a dark
surface and tinted to ink on the light bar; failing that, the other
surface's cut flattened to a silhouette of the surface's words color (ink
on the light bar, white on a dark one), since drawn as given it would
vanish. "Dark" is the dark bar, the transparent bar over a hero, and the
footer band.

| `onLight` | `onDark` | `src` | The light bar draws | The dark bars and the footer draw |
|---|---|---|---|---|
| set | set | either | `onLight` | `onDark` |
| set | | set | `onLight` | `src` |
| set | | | `onLight` | `onLight` as a white silhouette |
| | set | set | `src` tinted to ink | `onDark` |
| | set | | `onDark` tinted to ink | `onDark` |
| | | set | `src` tinted to ink | `src` |
| | | | the name alone | the name alone |

A glyph tile (`logo.tile`) wins over all three; its letter is drawn by the
stylesheet, so it is never text in the home link, and the link's name is
always the words it shows (the brand's name, or the wordmark when it names
something else), then "home".

The menu is a native `<dialog>` opened with `showModal()`, so Escape, focus containment, and focus return come from the browser.

## The Not Found Page

`NotFound` is the page an unknown path renders: a headline, a row of popular pages, and the closing call to action. It renders the body only, so a site wraps it in its own shell, and it wears the site's own classes (`.page-hero`, `.eyebrow`, `.lead`, `.final-cta`, `.btn`).

On a statically prerendered TanStack Start site the markup is the easy part. The host serves the `/404` prerender for every miss, and the page survives hydration only with three pieces in the site:

1. **A catch all route**, `src/routes/$.tsx`, rendering the site's page (noindexed). Never a dedicated `/404` route: an unknown path then matches only the root, TanStack's hydrate throws, and the page goes blank.
2. **The router options:** `createRouter({ routeTree, ...staticNotFoundRouting(NotFoundPage, { useMatches }) })`, with `useMatches` imported from `@tanstack/react-router` and handed in, so the package imports no router. A miss hydrates through its pending state first, so pending has to render the same page or React reports a mismatch (a pending view of plain `null` is React error 418 and a blank body on every miss). Given `useMatches` (8.2.0), the pending view draws the page on a miss alone (`isMiss`) and nothing on any other route's pending state, so a slow client navigation never shows a bare 404 body with no header; without it, the pending view is the page itself, as before. `catchAllId` names a catch all route other than `/$`. The pending view counts as a miss the catch all route's match, a route whose `staticData.missing(params)` says its params name no page, and a match the router already reports as not found (8.3.0). **A route with params that can claim a path with no page behind it (a blog slug nobody wrote) sets `staticData.missing`**: the host serves that path the 404 prerender, which hydrates through the pending state before the route's loader runs, so a loader's `notFound()` arrives too late for that first render and the page would hydrate blank.
3. **The build:** a `{ path: "/404", prerender: { enabled: true }, sitemap: { exclude: true } }` entry in the Vite `pages` list, and a copy of `dist/client/404/index.html` to `dist/client/404.html`.

```tsx
// src/shared/components/NotFoundPage.tsx
import { NotFound } from "@atelic-action/ui/components";

export function NotFoundPage() {
	return (
		<SiteShell site={site}>
			<NotFound
				title="This page wandered off."
				lead="The link may be old, or the page may have moved."
				links={site.nav.filter((item) => item.to !== "/").map(({ label, to }) => ({ label, href: to }))}
				closing={{ eyebrow: "Back on Track", title: "Let's get you where you were headed." }}
				primaryCTA={site.cta}
			/>
		</SiteShell>
	);
}
```

A site's root route asks whether the matches are a miss twice: to emit the 404's head tags from the root (tags on the still pending catch all route would land twice), and to draw a miss inside the site's shell from the root layout, so the shell stays mounted while the not found body swaps from its pending render to its own and a menu opened in the first moments stays open. `isMiss(matches)` from `@atelic-action/ui/routing` answers it with no router import: the catch all route (`/$`) took the path, or a route's `staticData.missing(params)` says its params name no page.

```tsx
// src/routes/__root.tsx
import { isMiss } from "@atelic-action/ui/routing";

head: ({ matches }) => ({ ...(isMiss(matches) ? buildPageHead(site, notFound.meta) : {}) }),
// RootLayout
const miss = useMatches({ select: isMiss });
return miss ? <SiteShell site={site}><Outlet /></SiteShell> : <Outlet />;
```

`staticNotFoundRouting` is for prerendered sites only. On a live app the pending state is a real loading moment and the page would flash through every slow load, so an app sets `defaultNotFoundComponent` alone. A browser test is the only proof any of this works; template-marketing's `e2e/not-found.spec.ts` is the one to copy.

## Primitives

`Button`, `Chip`, `Eyebrow`, `Lead`, and `SectionHeading` are the small pieces a page is set in, the same in every template. Each renders from props and wears a class of the same name (`.btn`, `.chip`, `.eyebrow`, `.lead`, `.section-head`), styled by `primitives.css` from the theme tokens.

```tsx
import { Button, SectionHeading } from "@atelic-action/ui/primitives";

<SectionHeading eyebrow="Pricing" title="One number" lead="Flat and posted." />;
<Button href="/contact" size="lg" arrow>
	Book a visit
</Button>;
```

`PrimaryButton` and `SecondaryButton` (3.13.0) are the two buttons a marketing page uses, by name: the primary is the large primary button with the arrow, the shape `CTASection` closes every page with, and the secondary is the large ghost beside it, always second. A page reaches for those and never picks a variant and a size by hand, so no two pages drift; the header's compact button is the header's own. `Button` stays underneath for the few other shapes (a form's submit, a dark surface).

`Button` is an anchor when it has an `href` and a real button otherwise. It puts the base path from `BasePathProvider` on a root path `href` (0.19.0), so a site served under a prefix needs no wrapper; with no provider above it the `href` renders as given. Its arrow is hidden from the name a screen reader hears.

`AddressSearch` and `ExpandableText` (8.5.0) are the two form primitives. `AddressSearch` is the ARIA combobox: it asks the `provider` a site passes (`suggest` from the typed text to suggestions, `resolve` from a pick to `{ street, city, state, zip }`, each handed an `AbortSignal`) after a pause in the typing, drops an answer that comes back after a newer question, and hands the parts to `onPick`; it knows no service, so a site wraps Google's address autocomplete, or any other, in those two functions and passes the credit its terms ask for as `attribution`. Without a provider it renders nothing. `ExpandableText` clamps prose to `lines` with a Show more under it (`aria-expanded`, its words by prop); the cut is a line clamp, so every word stays in the page and a checkbox it labels (`labelFor`) is named by the whole text, and anything a reader acts on goes in `more`, hidden and `inert` while closed. The multi select beside them is a component, `MultiSelect` in `@atelic-action/ui/components`, since an app draws it too.

`Bubble` (3.11.0) is the round tile set beside a heading or a numbered step, holding either a lucide icon the caller sizes (`icon`) or a short mono index (`num`, such as "01"); given both, the icon sits inside and the number rides a small badge on the lower right rim, the way an unread count sits on an app icon. It comes in three sizes (`sm`, `md`, `lg`: 36, 48, and 60 pixels across, `md` by default) and lifts its fill for a dark band with `onDark`, the way `Chip` does. It is decoration and wears `aria-hidden`, so the heading beside it carries the meaning, the step's number included.

## The Access Gate

The gate puts a whole host behind an email sign in with no database: a reader on the allowlist asks for a link, the link starts a signed session cookie, and the middleware holds every page and file back from anyone without one. It is opt in and fails open, so a host with no `GATE_SESSION_SECRET` is fully public.

Vercel finds these three files by path, so a site keeps them, each a re export:

```ts
// api/auth/request-link.ts
export { POST } from "@atelic-action/ui/gate/request-link";

// api/auth/verify.ts
export { GET } from "@atelic-action/ui/gate/verify";

// middleware.ts
export { default } from "@atelic-action/ui/gate/middleware";

// The platform reads the matcher from this file and nowhere else. Only the
// two sign in functions skip the middleware; any other function is held.
export const config = { matcher: ["/((?!api/auth/).*)"] };
```

The default middleware holds back everything `needsSession` does: all of a host but the login page, what that page loads (`/assets/` apart from `/assets/doc/`, `/fonts/`, `/brand/`, the favicon and logo), everything under `/api/auth/` (the two sign in functions, and the one place under `/api/` where a host must add nothing private), `robots.txt`, `health.json`, and a website build proxied under `/proto`. A site whose matcher already leaves its open paths out passes its own test, and one whose link opens something other than a document names it:

```ts
import { createMiddleware } from "@atelic-action/ui/gate/middleware";
export default createMiddleware({ needsSession: () => true });

import { createRequestLink } from "@atelic-action/ui/gate/request-link";
export const POST = createRequestLink({ noun: "preview" });
```

| Env | Read by | What it does |
|---|---|---|
| `GATE_SESSION_SECRET` | all three | The signing secret, and the switch: unset, the gate is off. Use 32 random bytes or more |
| `GATE_ALLOWLIST` | all three | Comma separated entries that may receive a link. An address matches itself exactly; the business's domain, written `example.com` or `@example.com`, admits every address on it but none on its subdomains. Case never matters, and an empty entry or a word with no dot matches nothing. Taking an entry off, then redeploying, refuses its outstanding links and ends their sessions |
| `RESEND_API_KEY` | request link | The sending only key the link goes out on |
| `GATE_BASE_URL` | request link | The host the link points at; a bare host is read as https, and plain http is refused unless it is local. Unset, production uses the project's own domain and a preview uses the deployment it was asked on |
| `GATE_FROM`, `GATE_SUBJECT`, `GATE_LINK_TTL_MIN` | request link | Sender, subject, and link lifetime in minutes (15, a day at most) |
| `GATE_SESSION_DAYS`, `GATE_WATERMARK_MODE` | verify | Session lifetime in days (7, a year at most), and `pill` or `tiled` |

What it holds to, each with a test in `tst/gate/`:

- Give each host its own secret. A token carries no host, so two hosts sharing a secret would accept each other's sessions.
- Tokens are compact JWTs under HS256, signed and verified by [jose](https://github.com/panva/jose). The algorithm is pinned, and a link token is never accepted as a session or a session as a link.
- The emailed link is never built from a forwarded header, since a caller can name any host there.
- A link request answers the same way after the same two second wait whether or not the address was on the allowlist, and a send still running shortly before then is given up. A send that fails says so in the function's log and nowhere else.
- The post sign in destination is held to a path on the same host, 512 characters at most (`safeNext`).
- An open path opens only as written; the held corner is held in any case. Under `/api/`, only `/api/auth/` is open.

What it does not do, by having no store: a link can be used more than once until it expires, and the code does not rate limit link requests. That is handled outside the code, by a Vercel firewall rule on `/api/auth/request-link`. Rotating the secret ends every session at once. The `gate_email` and `gate_wm` cookies that feed the watermark are readable and unsigned on purpose: the watermark is drawn in the reader's own browser, so it deters and attributes nothing a reader set on removing it could not already remove.

This is one of the two corners of the package that ship compiled (the other is the Vite entry, under [The Artifact Vite Config](#the-artifact-vite-config)). Vercel runs a function's and a middleware's package imports as shipped and compiles nothing inside `node_modules`, so `bun run build` emits `src/gate/` to `dist/gate/`, and `prepack` runs it before every publish.

### A Marketing Site's Matcher

A website's other functions (the contact relay) are public by design, so a marketing site keeps all of `api/` and the login page away from the middleware and leaves the rest of the deciding to it (0.19.0):

```ts
// middleware.ts
export { default } from "@atelic-action/ui/gate/middleware";

// Everything but api/ and the login page reaches the middleware, which lets a
// request through with no session only when the wall's open paths name it.
export const config = { matcher: ["/((?!api/|login$|login/).*)"] };
```

The default middleware holds by allowlist: with the wall armed, a request passes with no session only when the wall's open exact paths and open prefixes name it (`OPEN_PATHS` in `@atelic-action/ui/gate`), which covers what a login page loads (its hashed assets, fonts, and favicon). Anything else is held, so a page whose last path segment carries a dot (`/blog/release-2.0`) or one asked for by its file name (`/about/index.html`) stays behind the wall, where the old matcher let any path with a file extension through. A site with an open file of its own adds it, and never opens the held corner by doing so:

```ts
import { createMiddleware } from "@atelic-action/ui/gate/middleware";
export default createMiddleware({ open: { exact: ["/apple-touch-icon.png"], prefixes: ["/icons/"] } });
```

`createNeedsSession` in `@atelic-action/ui/gate` is the same test on its own. A `needsSession` a site passes still wins over both, for a matcher that already leaves its open paths out.

### The Screen and the Watermark

The two pieces a reader sees are ordinary components, in `@atelic-action/ui/components`, styled by `@atelic-action/ui/styles/gate.css` (import it after `components.css`):

```tsx
// src/routes/login.tsx: the screen alone inside the site's scope, no header
<div className="atelic-ui">
	<GateLogin
		brandName={site.recipient.name}
		eyebrow={site.gate?.eyebrow}
		headline={site.gate?.headline}
		lead={site.gate?.lead}
		builtBy={site.sender.name}
		contactEmail={site.sender.email}
	/>
</div>;

// the site's shell, once, inside its `.atelic-ui` wrapper, so every page behind
// the gate wears it (the styles are scoped there, like every sheet's)
<Watermark />;
```

`GateLogin` posts to `/api/auth/request-link`; a site served under a base path passes its own `endpoint`. Its button wears the site's `.btn` classes, as the chrome's do. `Watermark` reads the `gate_email` cookie and draws nothing without one. `readCookie`, exported beside them, is the reader `Watermark` uses and a site's own code can: empty during prerender, for a missing cookie, and for one that will not decode. `GateLogin` says so when an address is not an email, holds a second submit while the first is in flight, and announces each outcome to a screen reader.

## Error Reporting

Every site reports its errors to Sentry, errors only and never performance tracing, through three pieces the package owns (8.1.0). A site cannot launch without it: `atelic-check-sentry` stops a production build with no DSN.

1. **The early catcher.** `ErrorCatcherScript`, placed first among the root route's `<head>` scripts, is a 443 byte inline script (281 gzipped, ES5, no dependencies) that listens for `error` and `unhandledrejection` from the first moment and holds up to twenty (`CATCHER_CAP`) in a buffer on `window.__atelicErrors` (`CATCHER_GLOBAL`), counting the rest as dropped; the count rides on each replayed error as `earlyDropped`. It is the page's first script and runs before any other script on the page; it is not the first element in `<head>`, since React 19 hoists the title, the meta tags, the preloads, and the stylesheets ahead of it, and nothing it does depends on that. An error thrown before the app's own JavaScript runs is held, not lost.
2. **The start function.** `startErrorReporting({ dsn, release, environment })` from `@atelic-action/ui/monitoring` (with `environment` defaulting to the build's `import.meta.env.VITE_ENVIRONMENT`) makes sure the catcher is listening (installing it when the page has none), then after first paint (falling back to the load event where the browser cannot report paints, and to ten seconds whatever happens) loads the Sentry browser SDK, replays what the catcher held, each tagged `early`, and takes the catcher's listeners off so nothing is reported twice. With no `dsn` it does nothing and loads nothing. The SDK chunk is the client set up by hand with six integrations (event filters, function to string, the global handlers, linked errors, dedupe, the page's URL and user agent): no tracing, no replay, no breadcrumbs. Measured alone with esbuild, the chunk weighs 69.9 KB raw, 24.6 KB gzipped, and 22.3 KB in brotli, where the old `@sentry/react` chunk with browser tracing, measured the same way, weighed 136.2 KB, 47.0 KB, and 41.5 KB; a site's own build bundles them with what it shares, so its figures differ (a real site's new chunk measured 81 KB raw and 28 KB gzipped, replacing one of 425 KB raw and 141 KB gzipped). `AppErrorBoundary` hands a render crash to the same buffer (`reportError`), since React keeps a caught crash from the window's handlers; on a page where reporting never started and no inline catcher runs, the crash is let go quietly rather than held by a catcher nobody reads. A route's render crash reaches that boundary too on TanStack Router 1.170, where a route has a catch boundary of its own only when an `errorComponent` applies to it, so on a site that sets none the crash rises to `AppErrorBoundary` and is reported once. A route or a site that sets its own `errorComponent` with no `onCatch` puts a boundary in the way that catches the crash and reports it to nobody. `routerErrorOptions()` (8.2.0, below) closes that: spread into `createRouter`, it gives every route the boundary, its `defaultOnCatch` hands what any of them catches to `reportError` once, and its `defaultErrorComponent` draws the same `ErrorFallback` page, so the report no longer depends on which boundary is nearest. The package carries `@sentry/browser`, so a site needs no Sentry dependency of its own.
3. **The server reporter.** `@atelic-action/ui/monitoring/server`, built like the gate so a Vercel function imports it uncompiled: `reportServerError(error, { dsn?, request?, tags?, release?, environment? })` posts a Sentry envelope to the ingest the DSN names (`SENTRY_DSN`, then `VITE_SENTRY_DSN`), with the stack's frames, the runtime as a tag, and the release from `VERCEL_GIT_COMMIT_SHA`. It waits two seconds at most, never throws, and resolves whether or not the send worked. `withErrorReporting(handler)` reports a handler's throw and throws it again. `reportServerErrorLater(error, { context?, ...options })` (8.2.0) starts the same send and returns at once: it hands the send to the platform's `waitUntil`, the `context` a handler was given (an edge middleware's or a function's second argument) or else the request context Vercel keeps for a function, so the function stays alive until the send finishes after the answer has gone; with neither, the send runs without blocking the answer and may be cut short when the runtime freezes. Await `reportServerError` where the report must land before the handler goes on (before a throw, or in a handler that waits anyway); call `reportServerErrorLater` where the person is waiting on the answer (a refused send the form should say at once). The gate's middleware reports anything it throws, and passes and blocks exactly as before. `refusalError(response, service?)` (8.2.0) turns a refused upstream answer (a send the mail service would not take) into an error a report may carry: the service's name, the status, and the error body's `name` and `message` alone, each with anything shaped like an email address replaced by `[address]` (a sentence's closing period kept outside it) and anything shaped like a phone number (grouped as one is written, or a plus sign and its digits run together) by `[number]` (8.3.0), then cut to 300 characters, nothing else of the body read. The fields are still the upstream's free text: a name or a street quoted in words passes through, so report the refusals of a service whose errors are about the request, never one that echoes what a person wrote; `reportRefusedResponse(response, { service, request, tags, context })` builds it and sends it with `reportServerErrorLater`, resolving once the body is read and never waiting on the send.

**The launch check.** Once reporting has started, `window.__atelicErrors.test()` in the browser's console throws an error from the package's own code on the next turn, uncaught, named "Atelic error reporting launch check: thrown on purpose from @atelic-action/ui" (`LAUNCH_CHECK_MESSAGE`). Run it on a site's first production deploy: the error should reach Sentry under the deploy's release and environment with a readable, source mapped stack. A stack of minified names means the upload did not run.

Two noises are left out, the list kept short: an error whose top frame is a browser extension's (`chrome-extension://`, `moz-extension://`, `safari-extension://`, `safari-web-extension://`), and the in app webview bridges failing ("Java object is gone", "Error invoking postMessage").

**What is captured:** uncaught errors and unhandled rejections in the browser, from before first paint on; render crashes `AppErrorBoundary` catches, and with `routerErrorOptions()` any a route's own boundary catches; a function's or the middleware's throw, and whatever a function reports by hand. **What is not:** performance, sessions, replays, breadcrumbs, console output, and the expected misses (a contact form's validation answer, a malformed or expired gate cookie). **Privacy:** a server report carries the request's method, its path with no query string, and its user agent, and nothing else from the request: never a body, never another header. A browser report is cut the same way before it leaves the page: the page's URL and each stack frame's file lose their query string and fragment, the referrer goes, and the user agent is the one header kept. A contact form's request holds a person's name, address, and message.

| Variable | Where | What it does |
|---|---|---|
| `VITE_SENTRY_DSN` | the Vercel project, every environment | The browser's DSN, read by the start function; the server reporter falls back to it. Required for a production build |
| `SENTRY_DSN` | the Vercel project, optional | The server's DSN when it should differ from the browser's |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | the Vercel project, production | With all three, `marketingConfig` adds the Sentry Vite plugin: it creates a release named by the commit, uploads hidden source maps (`build.sourcemap: "hidden"`, only then), and deletes every map from `dist/` once uploaded. With any missing, the build is unchanged |

`marketingConfig` hands the browser the commit (`VERCEL_GIT_COMMIT_SHA`, else `GITHUB_SHA`) as `import.meta.env.VITE_RELEASE`, the same name the upload's release takes, so a stack trace meets its source maps, and the environment as `import.meta.env.VITE_ENVIRONMENT`: `VERCEL_ENV` (production, preview, development) on Vercel, else the build's mode, since a production build's mode is production on every deploy, a preview's included. `atelic-check-sentry` also fails any build whose DSN is set but is not one, and any whose DSN carries a space or a line break around it, since the build ships the value as it is set (8.2.0).

What a site changes. `src/router.tsx` drops its own Sentry import and its `afterFirstPaint`, and starts reporting where the lazy init was:

```ts
import { startErrorReporting } from "@atelic-action/ui/monitoring";

if (typeof window !== "undefined") {
	startErrorReporting({
		dsn: env.VITE_SENTRY_DSN,
		release: import.meta.env.VITE_RELEASE,
		environment: import.meta.env.VITE_ENVIRONMENT,
	});
}
```

The same file hands the router's boundaries to error reporting, two lines (8.2.0). Without them a route crash is still reported by `AppErrorBoundary` unless a route or the site sets its own `errorComponent` with no `onCatch`; with them every route's crash is reported once by its own boundary, whatever error page a route sets:

```ts
import { routerErrorOptions } from "@atelic-action/ui/routing";

const router = createRouter({ routeTree, ...routerErrorOptions() });
```

`src/routes/__root.tsx` puts the catcher first among the scripts in `<head>`, and imports the boundary from the package in place of its own copy, so a render crash outside a route is reported too (the site deletes its `src/shared/components/AppErrorBoundary.tsx` and `ErrorFallback.tsx`, whose package twins are the same page with a long message that wraps). The catcher renders only when the build has a DSN (`enabled`, 8.2.0, default true), so a build with none ships no catcher holding errors nobody reads:

```tsx
import { AppErrorBoundary } from "@atelic-action/ui/artifact";
import { ErrorCatcherScript } from "@atelic-action/ui/monitoring";

<head>
	<ErrorCatcherScript enabled={Boolean(env.VITE_SENTRY_DSN)} />
	<HeadContent />
</head>
```

`api/contact.ts` wraps its handler, and reports a refused send by hand, since that path answers rather than throws:

```ts
import { reportRefusedResponse, withErrorReporting } from "@atelic-action/ui/monitoring/server";

export const POST = withErrorReporting(
	async (request: Request): Promise<Response> => {
		// ...the handler as it was, and where Resend refuses:
		if (!response.ok) {
			await reportRefusedResponse(response, { service: "Resend", request, tags: { route: "contact" } });
			return json(502, { ok: false, error: "Sending failed. Please try again in a moment." });
		}
	},
	{ tags: { route: "contact" } },
);
```

`package.json` runs the check first in `build` and drops its own `@sentry/react` dependency:

```json
"build": "atelic-check-sentry && atelic-check-images && tsc -b && vite build && ..."
```

A site with a real reason to launch without Sentry runs `atelic-check-sentry --allow-missing`, which lets the build through under a loud warning. `middleware.ts` changes nothing: the gate's middleware reports on its own.

## The Artifact Documents

`@atelic-action/ui/artifact` is the pieces an artifact document is built from and the site around it, so a fix to a piece reaches every business's documents with one version bump. The composed documents themselves (`Writeup`, `Read`, `Report`, `Note`, and the sealed `Gate`, with their content types and their stylesheet) live in [`@atelic-action/artifact`](https://github.com/atelic-action/artifact) since 2.0.0, which depends on this package for everything below:

- **The pieces:** `GradeChip` and `gradeLabel` with the `WriteupGrade` type, `SignOff` with the `WriteupPerson` type, `Shot` with the `WriteupShot` type (a crop taller than it is wide is measured in the browser, marked `data-portrait`, and held to 200px wide on screen and 1.8in in print; a layout that sizes its shots itself sets `--op-shot-portrait-max: none` to opt out, on screen and in print alike), and the plain data text (`Paragraph`, `Runs`, `ArtifactAnchor`, `isEmpty`, and `isQuery`, with the `ArtifactLink`, `ArtifactQuery`, `ArtifactRun`, and `ArtifactParagraph` types: a paragraph is a string or runs of text, `{ text, href }` links, and `{ query, href? }` search queries, so a routine can write a document as JSON). A query renders as `<em class="query">` around the words in curly quotes, which the component adds, so content passes the bare words; with an `href`, the link sits inside the `em` around the quoted words.
- **The shell:** `ArtifactShell`, the `.atelic-ui` scope with the skip link, the dark header, the closing bar, and the watermark around a page. The closing bar is the one line after a document's sign off, and it closes the way a site does: `Copyright` with the sender's name on the left and `Credit` on the right (7.2.0; before it the credit stood alone, centered). Print drops it with the header and the skip link.
- **The contract and the head:** the `ArtifactConfig` types, and `buildPageHead` and `canonicalURL` with their `PageMeta` type.
- **Who opened it:** `whoIsReading`, the email a reader signed in with at the wall, by the form or by the sign in a send carried, and nobody on the sender's own domain. It is also built and exported alone as `@atelic-action/ui/artifact/readers`, because a Playwright spec runs under Node, which compiles nothing inside `node_modules`.
- **The error boundary:** `AppErrorBoundary` and its `ErrorFallback`.
- **`newTabProps`,** for the links a content module writes.

The package imports no router, so `ArtifactShell` takes the path being read as its `currentPath` prop. A site keeps a wrapper a few lines long that reads the path from its own router and passes it down:

```tsx
import { ArtifactShell as Shell, type ArtifactShellProps } from "@atelic-action/ui/artifact";
import { useLocation } from "@tanstack/react-router";

export function ArtifactShell(props: Omit<ArtifactShellProps, "currentPath">) {
	const currentPath = useLocation({ select: (location) => location.pathname });
	return <Shell {...props} currentPath={currentPath} />;
}
```

The pieces import no stylesheet of their own. A site imports `@atelic-action/ui/styles/artifact.css` in its base sheet after `gate.css`, then `@atelic-action/artifact/styles/documents.css`, and then its `theme.css`, so every page carries the rules whichever route it is. This sheet holds the pieces alone (the sign off, the shot, and the shell's logo rule; the grade chip's rules sit in `components.css`, since `ReportCard` wears it) and sets no `@page`; both `@page` rules, the monthly page's and then the writeup's, moved with the documents into their sheet, where their order stays load bearing.

### The Artifact Vite Config

`@atelic-action/ui/vite` holds the whole Vite configuration of an artifact site, so a site's `vite.config.ts` is one call that names its pages:

```ts
// vite.config.ts
import { artifactConfig } from "@atelic-action/ui/vite";

export default artifactConfig({ pages: ["/the-read", "/proposal", "/report"] });
```

`artifactConfig` returns the TanStack Start plugin with prerendering on, the crawler following links but kept out of `/images/` (where a prerendered page would overwrite a real file), one prerendered page for `/`, for each path the site names, and for `/404`, and no sitemap; the React plugin; `privateChunks()`; the `@` alias to the site's `src`, resolved from the directory Vite is run in; and `ssr.noExternal: ["@atelic-action/ui", "@atelic-action/artifact"]`, so the documents compile too. Nothing links to an artifact page, so a page a site leaves out of `pages` ships with no HTML in it. `artifactPages` is the list alone.

A site with a real need of its own passes `extend`, which is merged over the result with Vite's `mergeConfig`:

```ts
export default artifactConfig({
	pages: ["/the-read"],
	extend: { server: { port: 5180 } },
});
```

`privateChunks` is the plugin inside it, exported for a site that writes its own configuration: it writes every chunk carrying private content to `/assets/doc/`, where the access wall holds it, and fails the build when one lands anywhere else.

A `vite.config.ts` is run by Node as shipped, so `src/vite/` is built to `dist/vite/` like the gate. `@atelic-action/ui/vite` imports `@tanstack/react-start` and `@vitejs/plugin-react` when it loads, so a site that imports anything from it has both installed. A site that writes its own configuration and wants only the plugin imports it from `@atelic-action/ui/vite/private-chunks` (0.18.0), which loads nothing from Vite but its types and needs neither peer:

```ts
import { privateChunks } from "@atelic-action/ui/vite/private-chunks";
```

### The Commands

The package installs the scripts every artifact site used to carry as files, so a site's `package.json` calls a command by name and holds no script of its own. Each reads the site it is run in from the working directory: `src/site.config.ts`, `public/`, and `dist/client` are the site's, found from where the command is run, which is the site's root.

| Command | What It Does | Where a Site Calls It |
|---|---|---|
| `atelic-check-access` | Fails the build when `src/site.config.ts` says `access: "private"`, the build is on Vercel, and the wall's three variables are not set; warns on a local build of a private site | First step of `build` |
| `atelic-stamp-health` | Writes `dist/client/health.json` with the status, the commit, and the build time | Last step of `build` |
| `atelic-check-links` | Asks for every external link in the prerendered pages and exits 1 when one is dead | `check:links`, after a build |
| `atelic-check-wall <host> [path ...]` | Asks a deployed host for each document and held file with no cookie, and passes only when the wall answers every one and the sign in functions respond | `check:wall`, before any private link goes out |
| `atelic-reader-link <email> [path] [--days <n>]` | Mints the sign in a send carries: a link that signs the reader in at the wall and lands them on the page (query kept), good on every open for 14 days by default and 30 at most. Signs with `GATE_SESSION_SECRET` and refuses an address `GATE_ALLOWLIST` would not admit, both read from the environment | `reader` |
| `atelic-serve-static` | Serves `dist/client` on `127.0.0.1` the way Vercel does, on `PORT` or 4173 | The `webServer` command in `playwright.config.ts` |
| `atelic-print-sheets <url or dist/client> <out.pdf> [sheets] [page] [port]` | Prints a page to PDF with headless Chrome, reports the sheet count, and fails when a count is given and missed | `print` |
| `atelic-seal-document <config.json> [out.json]` | Seals a document into the payload that `@atelic-action/artifact`'s `Gate` reads, one wrapped key for each reader. The payload names no one: no address, and readers numbered `r1`, `r2` whatever the config calls them | `seal` |
| `atelic-clean-sitemap` | Strips fragment and trailing slash duplicates out of `dist/client/sitemap.xml`; says so and passes when a based build wrote none | A marketing site's `build`, after vite |
| `atelic-check-base-path` | Fails the build when a root path in `dist/client` lacks the base path, or `vercel.json` lacks (or strays from) the two rewrites a based cut needs; a `VITE_BASE_PATH` rehearsal only warns about `vercel.json` off Vercel | Last step of a marketing site's `build` |
| `atelic-check-images` | Fails the build when `public/images` holds an image over 250 KB, a PNG over 64 KB, or a JPEG that is not a sharing card (`og.jpg` or `<name>-og.jpg`): every photo ships as WebP at about 2x its rendered width (template-marketing's CLAUDE.md, Image budget) | First step of a marketing site's `build` |
| `atelic-contact-canary` | Posts a token bearing test message to `$SITE_URL/api/contact` and passes only on a Resend id and the expected destination (`CONTACT_EXPECTED_TO`, `CONTACT_CANARY_TOKEN`); a `.invalid` `SITE_URL` is the off switch | `check:contact`, run daily by the canary workflow |

A site's scripts, whole:

```json
{
	"build": "atelic-check-access && tsc -b && vite build && cp dist/client/404/index.html dist/client/404.html && atelic-stamp-health",
	"check:links": "atelic-check-links",
	"check:wall": "atelic-check-wall",
	"reader": "atelic-reader-link",
	"print": "atelic-print-sheets",
	"seal": "atelic-seal-document"
}
```

The logic lives in `src/scripts/` as modules with their functions exported, which is what the tests import, and each file in `bin/` only reads the command line and calls one. The TypeScript commands open on `#!/usr/bin/env bun` and run as source, since `bun` runs TypeScript inside `node_modules`. The sealing command is plain `.mjs` under `#!/usr/bin/env node`, its logic in `src/scripts/seal-document.mjs` (named `build-gate-payload.mjs` before 0.18.0), and the print command is `bash`; it needs Chrome (the `CHROME` variable names another binary), `python3`, and `curl`.

## Sections

`@atelic-action/ui/sections` is the marketing template's page library, moved here in 0.19.0 (ATE-643) so a fix reaches every website with one version bump. A section renders from props alone: the copy, the images, and the links come in as data, and the business's facts come in through a `site` prop typed from the `SiteConfig` contract, which the entry exports. A section that reads the config takes only the keys it uses (`MapEmbedSite`, `LocationSectionSite`, `ContactInfoCardSite`, `Pick<SiteConfig, "cta">` for `CTASection`), so a whole `SiteConfig` passes as it is and an app can pass less. No section imports a router, a site file, or a stylesheet.

```tsx
import { SiteShell } from "@atelic-action/ui/chrome";
import { CTASection, Hero } from "@atelic-action/ui/sections";

<SiteShell site={site} currentPath={pathname} heroNav>
	<Hero title="Bread worth the early line." primaryCTA={site.cta} />
	<CTASection site={site} title="Skip the line, keep the bread." />
</SiteShell>;
```

### The Stylesheet

Every rule sits in `@layer atelic-ui` and answers to `.atelic-ui`. A site imports `@atelic-action/ui/styles/sections.css` in its base sheet right after `primitives.css` and before its own sheets, so the order runs fonts, `base.css`, `chrome.css`, `components.css`, `primitives.css`, `sections.css`, `gate.css`, the site's own CSS, then `theme.css`. The five marketing primitives' styles joined `primitives.css`. A section that composes another sits after it in the sheet, the order the template's bundle gave them. One change against the template: a contact card's value column may break a long email address rather than push the page wider than a phone.

Moving into the layer changes one thing for a site: a rule in its own unlayered CSS now wins over a section's rule whatever the specificity, where before the section's rule could win by being more specific or later. Polish a site made to a section moves to `patterns.css` and keeps working; a site rule that only ever lost to a section's should be checked against the page.

### The Base Path

A site served under a prefix (`/proto`) says so once. `BasePathProvider` (from `@atelic-action/ui/routing`, a React context whose default base is "") hands the base to everything below it, and `Button`, `Chip`, `ImageFrame`, and every section that builds a link or an image source read it through `useBasePath` and `useWithBase`. A root absolute path gets the prefix; an external URL, a protocol link, a fragment, and a path that already carries the base pass through. `SiteShell` mounts the provider from its `basePath` prop, which defaults to `site.basePath`, so a page rendered inside the shell needs nothing more. The pure helpers (`normalizeBasePath`, `joinBase`, `stripBase`, `hasBase`) are exported beside it for a site's own code.

`@atelic-action/ui/routing` is TypeScript source like the rest, so Node cannot load it, and a Playwright spec runs under Node. The four helpers are therefore also built and exported alone as `@atelic-action/ui/routing/base-path` (1.0.0), the way the readers are, and a site's `e2e/` imports them from there:

```ts
// e2e/base.ts
import { marketingBasePath } from "@atelic-action/ui/vite";
export { hasBase } from "@atelic-action/ui/routing/base-path";
```

The provider stays in the source entry on purpose. A built copy of it would be a second React context, and a site mounting that copy would hand its base to none of the sections, which read the source one.

### SiteShell

`SiteShell` (in `@atelic-action/ui/chrome`) is the page wrapper: the `.atelic-ui` scope around the skip link, the header, `<main>`, the sticky CTA bar, the footer with its closing bar, and the watermark, all mapped from the `SiteConfig`. It takes `site`, `currentPath` (the package imports no router), `basePath`, and `nav` (defaults to `site.nav`), plus `heroNav`, `stickyCTA`, `footer`, `pageNav`, `navOnDark`, `hideNavCTA`, `density` (defaults to `site.density`; see [Density](#density)), `contactDock` (on by default; mounts the dock when `site.contactDock` is set), and `credit` (the practice's credit on the closing bar's right side; the copyright prints either way). 5.0.0 renames `CreditBar` to `ClosingBar` with no alias, replaces `.credit-bar` and `.footer-bottom` with `.closing-bar`, and `footer.note` prints at the far right of the closing bar. Since 6.0.0 the closing bar is two sides, `left` and `right`, that each take anything: left out, they are `Copyright` with the business's name and `Credit`, the practice's made with line; `null` empties a side. `credit` off empties the right side and keeps the copyright, and a `footer.note` stands in place of the credit whether `credit` is on or off. A site keeps a wrapper a few lines long:

```tsx
import { SiteShell as Shell, type SiteShellProps } from "@atelic-action/ui/chrome";
import { useLocation } from "@tanstack/react-router";

export function SiteShell(props: Omit<SiteShellProps, "currentPath" | "basePath">) {
	const currentPath = useLocation({ select: (location) => location.pathname });
	return <Shell {...props} currentPath={currentPath} basePath={import.meta.env.BASE_URL} />;
}
```

### The Default Footer

Every site's footer has one shape, and `Footer` draws it (7.0.0):

- **The brand column:** the header's lockup (the mark with the wordmark beside it, or the mark alone when `logo.wordmark` is false), then the Google rating beside five stars, the whole line one link to the business's Google profile when it has one, then the one address, the headquarters, linked to the same profile, then the phone and the email, each a link.
- **The hours,** when the site gives them: a column of their own headed Hours (`hoursHeading`), each row's days beside or over its range, as the column's width allows (8.1.0). On a phone, where the footer is two across, the cells under the brand column pair up with none left alone (8.3.0): beside an even count of link columns the hours take the row's whole width with their rows two across and the link columns pair up under them, and beside an odd count the hours stay a column of their own, rows stacked, paired with the first link column, as in 8.1.0. `Footer` counts the link columns it draws (a column with no links is left out first). `footer.hoursPlacement: "brand"` (`Footer`'s `hoursPlacement`, 8.3.0) sets them inside the brand column instead, under the address, the phone, and the email, as a compact list (days, then ranges) under a small Hours label, so the four link columns keep the row's room. In that placement each link column is at least ten times its link text's size wide (so `--footer-link-size` scales it) and never narrower than its longest label, and the brand column is as wide as its content needs, its longest line set whole (the lockup, the rating, an address line, the email, a row of the hours), so a short brand block is as narrow as it reads and `--footer-brand-width` shares out the rest (8.4.0); while the row holds every floor, the brand column and the link columns share it, and when it cannot, the brand column takes a row of its own with the link columns under it, all across while their floors fit and two by two below that (8.3.0). The floors are measured for the link columns `Footer` draws, so two or three columns keep the brand column beside them as long as theirs fit. The link columns share one box beside the brand column, so the brand column sits beside all of them or above all of them, never beside some; inside it one measure, the floors against the box's own width, drives the four across or two by two step, so no breakpoint disagrees with it, and a font a few percent wider than a site was drawn in still holds a three word label on one line.
- **Four link columns:** Company, Resources, Social, and Legal, in that order. From 760px the columns share one row at their shares but never narrower than their longest word, wrapping a column to a second row before a label breaks inside itself (8.1.0). A Social link carries its icon in front of its words. A column with no links is left out, and the grid sizes itself to the columns shown.
- **The closing bar:** `ClosingBar` under it all, `Copyright` with the business's name on the left and `Credit` on the right while the two share a line; when they do not (a phone, a long attribution), the credit wraps under the copyright and both start at the same edge, and a copyright longer than the line wraps inside itself (8.3.0).

The rating's stars are hidden from assistive technology, so the line, linked or not, is named by its words ("4.8 on Google"); `ratingLabel` gives the link a fuller name when a site wants one ("4.8 on Google, opens the Google profile"). Linked, it opens in a new tab as the address does. With the hours the footer holds six columns, so from 760px to 1100px the brand column keeps a row of its own above the other five, and from 1100px all six share one row with the brand column a little wider; a phone sets the brand column over two across, as without them. The rating's five stars read `--star-fill`, the same token `StarRating`'s filled star reads, and fall back to `--review-gold` (`#f5b301`) when a theme sets none, so one line in `theme.css` recolors every star on a site (8.0.0). The logo is the header's lockup drawn on the dark band (8.1.0): the mark the dark surface resolves to, by the header's own order (see the table under [Rendering From Props](#rendering-from-props)), with the wordmark beside it, composed by the same parts the header's `BrandLockup` draws. Its picture is silent there, since the words name it. `logo.wordmark: false` draws the mark alone, named by `logo.alt`; a glyph tile keeps the name beside it, and a logo with no picture is the words alone. The column headings are level 2 by default (`headingLevel` takes 2 to 6): the footer is a landmark beside the page's main content, so its sections sit one level under the page's `h1` whatever the page's own outline ends on, which satisfies axe's `heading-order` on every page and keeps the columns in a screen reader's heading list. Each is a `div` with `role="heading"` and `aria-level`, wearing `.footer-heading`, rather than an `h2`: a site's own bare `h2` rule is unlayered, so it beats every rule in the package's layer whatever its weight, and it is written for a page's section titles, not these small labels. A heading by role keeps the outline and matches no element rule, with no `!important` and no specificity raised.

The header carries the services and the service areas, so the footer does not repeat them. It holds no blurb, no call to action, and no credential badges; a site that needs one of those puts it on a page.

`SiteShell` fills the footer from the `SiteConfig`, so a site names nothing twice:

| The footer shows | From the config |
|---|---|
| The rating | `footer.rating`, as printed (`"4.8 on Google"`) |
| The rating's link | `footer.ratingHref`, else `mapLinkURL`, the Google profile, whenever a rating is set; `footer.ratingLabel` names it |
| The address and its link | `address` and `mapLinkURL`; `footer.showAddress: false` drops the address |
| The hours | `hours`, each row's `labelShort` and its range on `clock` and `meridiem`, short ("8a to 5p") unless `footer.hoursShort` is false ("8:00a to 5:00p", or "8:00 am to 5:00 pm" with `meridiem: "word"`); `footer.hoursPlacement` sets them as a column (the default) or inside the brand column; `footer.showHours: false` keeps them out of the footer and in the structured data |
| The phone and the email | `phone`, `email` |
| Company | `nav` |
| Resources | `footerLinks` |
| Social | `socialLinks`, each with its `icon` (`facebook`, `github`, `instagram`, `linkedin`, `mail`, `star`, `user`, `youtube`) |
| Legal | `legalLinks` |
| The closing bar's right side | the practice's credit, or `footer.note` in its place |

A site whose footer genuinely needs other columns names them outright in `footer.columns`, which replaces the derived four. Rendering `Footer` directly, a site passes `columns` itself.

Moving to 7.0.0: `footerBlurb` and `footer.contactHeading` are gone from the config, and `Footer` no longer takes `blurb`, `socialLinks`, `links`, `extraLinks`, `contactHeading`, `hours`, or `legalLinks`. Delete `footerBlurb` from the site config; the rest carries over through the mapping above. The hours stay in the config for the structured data and the page sections that print them, and since 8.1.0 the footer draws them again (see [Moving to 8.1.0](#moving-to-810)).

### The Mega Menu

A nav entry in the config is a page or a group. A group is an entry with `columns`, its panel's sections from left to right; its `to` is the group's own page. On a desktop the label is a control that opens a panel under the bar, as wide as the page's wrap whatever it holds, and every panel opens to the same height (440px), the feature card's, so moving along the bar never makes it jump. A mouse hover or a keyboard focus opens a group, a click pins it open, and Escape, a click outside, or focus leaving it closes it; left and right walk the bar, the down arrow steps into the panel, and up and down walk every link in it, whatever section holds it. A closed panel stays in the HTML, `inert`.

A section is one of four kinds, named by `kind`; a section without one is a link column, and a section naming a kind this version does not know is left out of the panel, the menu, and the base path mapping alike, never drawn as another kind (a group left with no section is a plain link):

| Kind | What it draws | Its data |
|---|---|---|
| link column (`kind` left out, or `"links"`) | A mono heading over its links. The heading is itself a link when it has an `href`. A link may carry a `description` under it, a `badge` ("Popular") in a pill after its label, and `children`, drawn indented under it with an elbow, each with its own `badge`; `quiet` sets a link in the softer words and the regular weight, for a long list such as the towns under a region (8.1.0) | `{ heading, href?, links: [{ label, href, description?, badge?, external?, quiet?, children? }] }` |
| `"picture"` | One photo filling the section, its caption over a wash at the foot, the whole of it a link named by the caption | `{ kind: "picture", image: { src, alt? }, caption, href }` |
| `"rows"` | Icon rows two across under an optional heading: a lucide icon by name, a label, and a short line, one row (`highlight`) set on the primary | `{ kind: "rows", heading?, rows: [{ label, description?, icon, href, highlight? }] }` |
| `"cards"` | Small cards under an optional heading, set off by a rule: a kicker, a title, and a meta line beside a square picture, or a quiet tile without one | `{ kind: "cards", heading?, cards: [{ kicker?, title, meta?, image?, href }] }` |

A row's `icon` is one of `calculator`, `calendar`, `card`, `chat`, `document`, `help`, `home`, `mail`, `map`, `phone`, `pin`, `play`, `shield`, `star`, `tool`, `truck`, and `users` (the `NavIcon` type), each a lucide icon. `feature` is the card at the panel's right, 340px wide on `--primary-deep`: a picture taking the height the words leave, an eyebrow, a headline, a line (`text`), ticked `points` (`TickList`), and its action as a `Button` with the arrow, which turns light on the card (`.on-primary`). `allLabel` is off unless given; given, it links the group's own page first in the panel at a column link's weight.

Every link in a panel that leads to the page being read carries `aria-current="page"`, the picture, the cards, a column heading, and the group's own link included, and a flat bar link on the current page is marked as a group holding it is. On the solid bar the current entry reads `--primary-ink`; over a hero the transparent bar keeps it in `--on-dark` with its siblings and marks it with an underline, so it reads on a dark photograph whatever the theme's primary (8.1.0). The sections share one row and wrap to a second when their least widths outrun it (a picture, icon rows, and cards beside the feature card at a narrow desktop, or two link columns, icon rows, and cards on a wide wrap), so none is squeezed past reading or pushed out of the card. A section's least width is the larger of its floor (a link column's list 120px, the icon rows 320px, the cards 240px, the picture 220px) and its longest word, and words in a panel break only as a last resort, so no label breaks inside a word to make a row fit (8.1.0).

On a phone and a tablet the menu opens each group as an accordion, one at a time, and every group starts closed whenever the menu opens, the one holding the current page included. It draws the same data: each section's heading, a link's children indented under it with the same elbow, the badges kept, icon rows and cards as plain links of their labels and titles, and a picture as a plain link of its caption. A plain entry wears a number, and the numbers count plain entries alone, so a group between them leaves no gap. The link to the page being read carries `aria-current="page"` and, for the eye, the 2px underline the bar marks its current entry with, under its words alone (8.2.0).

The menu has two sheets, chosen by `menu.surface` in the config (`SiteHeader`'s `menuSurface`, `SiteMenu`'s `surface`), with one behavior: the native modal dialog traps focus, Escape closes it, focus returns to the burger, and the page behind holds still. `dark`, the default, is the sheet every site had: the dark surface, large light entries with their numbers, the call to action mid sheet, and the contact block at the foot. `light` (8.2.0) sets the page's ground and ink: a top row with the header's lockup, drawn for the light ground and linking home, and a round outlined close button, where focus starts; the entries as rows under hairlines, a group's label bold in ink at a moderate size with a chevron at the right, turning the primary's words while it is open, its sections' headings small quiet caps labels, a link's children, badges, and `quiet` honored; and a foot on `--surface-alt` under a hairline, pushed to the bottom of the screen while the list is short, holding the call to action across its width (with the arrow when `cta.arrow` is set) and a card per header number, an outlined card with the number's words in small caps over the number, the whole card a `tel:` link (the contact block's one phone when the header has none). The light sheet sets no numbers on its entries, and it shows no email and no address: the dark sheet's contact block has them, the light sheet's design does not, so a site that needs them on a phone keeps the dark sheet or puts them on a page. Its top row is the bar's height and is inset as the bar's content is (`--header-max`, `--header-gutter`), so opening the sheet moves neither the lockup nor the button under the reader's thumb, and its row dividers read `--menu-rule` (default `--hairline`). On either sheet the contact dock's launcher steps aside while the menu is open.

The burger takes `menu.burger` (`SiteHeader`'s `burger`): `labelAfter` sets the three lines before the words `menuLabel` puts beside it, and `outlined` draws it in an outlined pill; both are off by default (8.2.0). While the menu is open only the lines fold to an X. The phone's round call button beside the burger is named by its number's `label` and the number, or "Call" and the number when it has no label (8.2.0).

The menu's words come from the config: the call to action reads `cta.menuLabel` when set, else `cta.label` ("Order ahead for Saturday" in the menu where the bar says "Order ahead"), and each header number reads its `menuLabel`, else its `label`, else "Call" (8.2.0). A number's `label` keeps its place in the desktop bar's phone pill. With no header numbers the menu lists the contact block's one phone, which reads `phone.menuLabel`, else "Call", on either sheet (8.4.0); only the menu reads it, and `ContactInfoCard`'s row takes its own `phoneLabel`.

```ts
// src/site.config.ts
nav: [
	{
		label: "Menu",
		to: "/menu",
		columns: [
			{
				heading: "Bread",
				href: "/menu/bread",
				links: [
					{
						label: "Country sourdough",
						href: "/menu/sourdough",
						children: [{ label: "Seeded", href: "/menu/seeded" }],
					},
					{ label: "Morning buns", href: "/menu/buns", badge: "Popular" },
				],
			},
		],
		feature: {
			eyebrow: "Order ahead",
			title: "Skip the Saturday line.",
			points: ["Order by Friday noon", "Pick a pickup time", "Pay at the counter"],
			cta: { label: "Order ahead", href: "/order" },
			image: { src: "/images/menu-feature.jpg", alt: "The ovens at dawn" },
		},
	},
	{
		label: "Visit",
		to: "/visit",
		columns: [
			{ kind: "picture", image: { src: "/images/menu-shop.jpg" }, caption: "Bread from the back of the shop.", href: "/visit" },
			{
				kind: "rows",
				heading: "Plan a visit",
				rows: [
					{ label: "Order ahead", description: "Pick a loaf and a time", icon: "calendar", href: "/order", highlight: true },
					{ label: "Questions", description: "Plain answers", icon: "help", href: "/faq" },
				],
			},
			{ kind: "cards", heading: "Latest", cards: [{ kicker: "From the blog", title: "Why the rye takes three days", meta: "4 min", href: "/blog/rye" }] },
		],
	},
	{ label: "About", to: "/about" },
],
header: { phones: [{ e164: "+15555550100", display: "(555) 555-0100", label: "The shop", menuLabel: "Call the shop" }] },
menu: { surface: "light" },
cta: { label: "Order ahead", href: "/order", menuLabel: "Order ahead for Saturday", arrow: true },
```

`SiteShell` puts the base path on every link and picture a section holds. The footer's Company column lists the entries themselves and never a group's links. A bar holding a group or a number keeps the burger up to 1180px instead of 900px, since it needs the room; the second of two numbers shows from 1360px, and the menu lists both. `header.phones` takes up to two, each a tel link; the first is also the round call button beside the burger on a phone.

`contactDock` in the config turns on the floating launcher: `label` is the launcher's words, `title` and `subtitle` the panel's head, `footnote` its foot, and `items` the ways to reach the business, each `{ label, description, icon, href }` or, for something already on the page such as a chat vendor's window, `{ label, description, icon, onSelect }`: the type takes one or the other and never neither. A dock item always points at the business's own flow. The dock lifts over the phone's sticky bar while it shows and rides above the footer as it scrolls in. It finds the bar by the `data-dock-lift` attribute `StickyCTABar` wears, which keeps `data-showing` current, or failing that a site's own `.sticky-cta`, read as showing by its `show` class when it keeps no `data-showing` (`lift` names another selector), and the footer by `avoid`, a ref or a selector, which `SiteShell` fills with a ref to its own footer. When the page's elements change it asks the two selectors again once a frame, and binds and measures anew only when the bar or the footer it finds is not the one it holds (a route change, a bar that mounts late), never for the dock's own changes and never on a scroll frame; it measures again when either, or the page, changes size. While open, the launcher reads `closeLabel` ("Close") and the panel's own close button `panelCloseLabel` ("Close panel"), so the two never share a name. Rendered with `track={false}` it sets no inset of its own and sits in the stylesheet's corner, 24px in from the right and the bottom, 16px on a phone.

### Density

The space a section leaves above and below itself is one token, `--section-space`, with three settings chosen by `data-density` on the `.atelic-ui` root. `SiteShell` sets it from its `density` prop, which defaults to `site.density`:

| Setting | `--section-space` | `--block-gap` | `--card-min` |
|---|---|---|---|
| `default` | `clamp(36px, 4.6vw, 64px)` | 28px | 0 |
| `comfortable` | `clamp(56px, 9vw, 120px)` | 44px | 240px |
| `compact` | `clamp(24px, 3.2vw, 44px)` | 20px | 0 |

`.section` pads with it, and the steps derived from it keep their old proportion to it: `.section-md` 0.7, `.section-sm` 0.6, `tight-top` and `tight-bottom` a third, the `PricingBand` 0.84, `PageHero` and the not found opener 0.72 on top and 0.5 below, and the `FeatureDetail` rows 0.6, whose first and last rows now sit flush with the section around them. `--block-gap` is the space between a section's heading and the grid under it (`FeatureGrid`, `ProfileCards`, `LinkColumns`, `CalloutPanel`, and `Gallery` at 0.77 of it), and `--card-min` the least a `FeatureGrid` card stands. A site that wants its own value sets the property on `.atelic-ui` in its own sheet, outside the layer. `ArtifactShell` pins `comfortable`, so a document reads as it did; the app shell reads none of these.

### Moving to 8.5.0

No API breaks, and nothing moves on a site that changes nothing: every addition is an optional prop, an export, or a token whose default is the look it had. `@radix-ui/react-popover` and `@radix-ui/react-checkbox` move from optional peers to dependencies, as `@radix-ui/react-tabs` is, so a marketing site installs nothing for `MultiSelect`; an app that already had them keeps one copy where the ranges meet.

**The contact form's opt in fields.** `ContactForm` takes `splitName`, `phone` (`"optional"` or `"required"`), `address` (`required`, a `provider` and its `attribution` for the search, `states` for a state select, `defaultState`), `services` (a `MultiSelect` in place of the topic select), `consent` (its wording, its `links`, its `lines`), `labels`, `placeholders`, `errorText`, `errorSummary` (a count of the fields to fix over the form), `thanks` (a heading, a lead, the read back, the next steps, and Send another message, replacing the form once sent), and `validatePhone`. `topics` is optional now; with none and no `services`, no select is drawn. The body keeps `name`, `email`, `topic`, `message`, and `company` whatever is drawn, so a relay that reads only those works unchanged: with the split name `name` is the two joined, with services `topic` is the chosen ones joined by commas. Each opt in field adds its own keys (`firstName`, `lastName`, `phone`, `address`, `services`, `consent`), which a relay has to read to pass them on.

**The field label's tokens.** `.field label` reads `--field-label-font`, `--field-label-size`, `--field-label-weight`, `--field-label-case`, `--field-label-tracking`, and `--field-label-color`, as do the pickers' labels, and every field's border reads `--field-border`; a theme restyles every label in one place. A quiet note beside a label (`(optional)`) is `.field-hint`, in the body face.

**Also new:** `InfoRows` in the sections, `ContactInfoCard`'s `layout="stacked"`, and `.field.invalid` reaches a `select`.

### Moving to 8.4.0

No API breaks. One optional config key is new, `phone.menuLabel`, which makes this a minor; everything else is a fix.

**The phone menu's words for a line that answers texts.** A site with no header numbers that wants "Call / Text" in its phone menu sets `phone.menuLabel` on the contact phone in its config; a site with header numbers sets `phones[].menuLabel` on each (`header.phones`), which still wins for those numbers; and `ContactInfoCard`'s row takes its own `phoneLabel`. Unset, each says "Call", as in 8.3.0.

**Changes on a site that changes nothing:**

1. **The footer with the hours in the brand column** (`footer.hoursPlacement: "brand"`). The brand column's floor is its content, the width its longest line takes whole (the lockup, the rating, an address line, the email, a row of the hours), where it was a fixed 17em, so a short brand block narrows and `--footer-brand-width` shares out the room; on a row that holds every column the brand column comes in by the difference and the link columns widen by their share (the stories' bakery: the brand column 295 to 281px on a 1200 wrap, each link column 4px wider). Each link column's floor is ten of its link text's size, so a site that sets `--footer-link-size` moves the floors with it; at the default nothing there moves. Where the brand column already took its own row, nothing moves.
2. **On a phone page whose sticky bar slides in after a scroll**, the closing bar is padded by the bar's height from the first measure rather than once the bar shows, so one jump straight to the end lands with the closing bar's last line above the bar; the page's end is that much longer from the start. A desktop reserves nothing, as before.
3. **`ContactInfoCard`'s email** breaks after the @ and before each dot on a narrow card, as the footer's does, where a long address broke inside a word. An address that fits reads as before.

The rest, in detail:

- **`StickyCTABar`'s `onSpaceChange`** hears the bar's height from the first measure wherever it can show, slid in or not, and 0 on a desktop; it no longer hears 0 and the height again as the bar slides out and in. Past the swap cap (three swaps in a row with nothing measured) the outgoing listener is still told 0 when it holds a height, and the arrival waits for the next measure; a listener that stores an object, made anew each render, now ends cut off at 0, where it ended holding the height by accident. Store a plain number, or memoize the listener.
- **Server reports follow an error's `cause`**, up to five deep, into Sentry's chained exceptions: innermost first, each cause under the `chained` mechanism linked to its parent, the thrown value `exception_id` 0 under the `generic` mechanism, handled. A cause's `code` (ENOTFOUND, ECONNRESET) leads its message when the message does not say it, a cause's words take the refusal's address and number scrub, every message is cut to 300 characters (the thrown value's too, which was not cut before), and a cycle ends the chain. An error with no cause is sent as before.
- **`refusalError`'s scrub** also takes a country code written with no plus sign (`1-555-555-0142`) and a trailing extension (`x12`, `ext. 12`), where an extension left the whole number in place, and no longer takes a dotted IPv4 address for a number. Dates, bare ids, a count beside a year, and status codes still stay.
- **`--hero-kicker-display`'s default** (`inline-block`) is declared in `defaults.css`, where it was written inline; nothing moves.
- `HoursRow` and `isMiss` have their doc comments back on them, and the routing tests check the 404 head and the pending view against an answer table written by hand.

### Moving to 8.3.0

No API breaks: every prop, config key, token, class, and export a site uses still works, and every addition is optional (a minor release for that reason). Three things change on screen all the same.

**Changes on a site that changes nothing:**

1. **The closing bar on a phone stacks.** Where its two sides do not share a line, the credit wraps under the copyright at the same left edge, where it sat at the right of its own line.
2. **The footer's hours on a phone, beside an even count of link columns** (the default four, or two), span the row with their rows two across and the link columns pair under them; beside an odd count nothing changes from 8.1.0.
3. **`ContactInfoCard`'s single phone row reads "Call"** where it read "Call / Text", which told a reader the business answers texts. `phoneLabel="Call / Text"` restores it. 8.2.0 made the same change in the phone menu, where `phones[].menuLabel` restores it, so **a site whose business does answer texts sets both.**

The rest of what an unchanged site sees, in detail:

- **The closing bar on a phone.** Where its two sides do not share a line, the credit (or a site's note) wraps under the copyright and both start at the same edge, where the credit sat at the right of its own line and the two lines zigzagged. On one line they stay as before. No breakpoint decides it, so a long attribution on a tablet stacks the same way, and a copyright longer than the line wraps inside itself.
- **The footer's hours on a phone, beside an even count of link columns** (the default footer's four, or two). Two across, the hours take the row's whole width under the brand column, their rows two across, and the link columns pair up under them, where the hours sat beside the first link column and left a hole under themselves when that column ran longer. **Beside an odd count** (three, say) nothing changes from 8.1.0: the hours stay a column of their own beside the first link column, so the cells pair and none hangs alone. From 760px nothing moves.
- **`ContactInfoCard`'s single phone row** reads "Call" where it read "Call / Text", which told a reader the business answers texts; `phoneLabel` gives it other words.
- **An `h4` under a theme that sets `--subheading-tracking: normal`** is flat, where it took its parent's tracking. At the default nothing moves.
- **The sticky bar's `onSpaceChange`.** A listener swapped in is told the current height at once and the one it replaced gets 0, without waiting for a resize, and no listener hears one value twice. A listener made anew on every render (an inline function, which looped in 8.2.0) hears the height once a function until the caller's state settles; one that stores an object is cut off after three such arrivals with nothing measured between, so it cannot loop. Store a plain number, or memoize the listener.
- **`isMiss`** also counts a match the router reports as not found, and the not found pending view (given `useMatches`) asks `isMiss` alone, so the root's 404 head and the pending view agree. A route with params that can claim a path with no page sets `staticData.missing` (see [The Not Found Page](#the-not-found-page)).
- **`refusalError` and `reportRefusedResponse`** also replace a phone number, grouped as one is written, with `[number]`, catch an address on an internationalized domain or with an underscore in a label, and keep a sentence's closing period outside a scrubbed address; a date, a bare id, and a count beside a year stay.
- **`SiteMenu`** takes an empty `phones` list as none, so the contact block's one phone stands in on either sheet.
- **One visually hidden class**, `.visually-hidden`, in `defaults.css`, worn by `ReportCard`'s spoken words, `DataTable`'s empty label, `ReviewWall`'s control labels, and `FeatureGrid`'s new tab note, in place of four copies of the rule. The old class names stay on their elements beside it as aliases (`.rc-sr`, `.data-table-empty-label`, `.rw-select-label`), so a site rule written against one still reaches it; they go in the next major, and a site moves its rules to `.visually-hidden` before then.
- **The rule above the closing bar** is drawn in its top border's place rather than as the border; at the default it looks and measures as before.

New, each at today's look unless set (the table under [Tokens](#tokens)):

- **The hero:** `--hero-gap-kicker`, `--hero-gap-lead`, and `--hero-gap-actions`, each one gap of the stack, falling back to `--hero-stack-gap` and then to the gap's own value; `--hero-lead-leading` (`1.55`); `--hero-split-pad-block` (`--section-space`); `--hero-kicker-display` and `--hero-kicker-leading` (`inline-block`, inherited), which as `block` and a leading lay the kicker out at its drawn height; `--hero-actions-gap` (`14px`).
- **The footer:** `footer.hoursPlacement` (`"column"`, or `"brand"` for the hours inside the brand column, the brand column taking its own row when the link columns' floors outrun the row; an unknown value is a column); `--footer-link-size` (`1em`); `--footer-brand-width` (unset, the brand column's 1.4 share, or 2 beside the hours); `--closing-rule-inset` (`0px`).
- **Hours:** `meridiem` (`"letter"`, or `"word"` for "8 am") and `footer.hoursShort` (`true`), so "8:00 am to 5:00 pm" in the footer is `meridiem: "word"` with `hoursShort: false`, no site code; `HoursTable` takes `meridiem`.
- **Sections:** `FeatureGrid`'s `external` on a linked card, opening it in a new tab and saying so (`newTabLabel`, "opens in a new tab"); `ContactInfoCard`'s `phoneLabel` (`"Call"`).
- `RouteErrorFallback` has its stories, and the story widths gain `smallPhone` 320, `smallTablet` 768, `laptop` 1024, and `wideTablet` 1099.

### Moving to 8.2.0

Nothing breaks: every addition is an optional prop, config key, token, or export. On a site that changes nothing, these change, all in or beside the phone menu: a header number with no label, or the contact block's one phone, reads "CALL" in the menu where it read "CALL / TEXT", which told a reader the business answers texts; the phone's round call button for a number with no label is named "Call" and the number where it was named by the number alone; the link to the page being read is underlined in the menu, as the bar marks its current entry; the contact dock's launcher is hidden while the menu is open, where the sheet already covered it; and a labeled burger, while the menu is open, folds only its lines to an X, where its words and its column of lines were caught by the X's rules too, a fault the open sheet covered. The group's own link in an open group now carries `aria-current` when it is the page being read, as the desktop panel's does. The light sheet, which no site has yet, shows no email and no address.

- **A light phone menu.** `menu: { surface: "light" }` in the site config (`SiteHeader`'s `menuSurface`, `SiteMenu`'s `surface` and `brand`) draws the menu on the page's ground: the lockup and a round close button across the top, the entries as rows, and the call to action and a card per number in a foot on the alternate ground (see [The Mega Menu](#the-mega-menu)). `dark` stays the default and draws as before. One component and one behavior: focus is trapped, Escape closes it, focus returns to the burger, the page holds still. `BrandLockup` takes `surface`, to draw one ground's mark alone, and `onClick`.
- **The menu's own words.** `cta.menuLabel` gives the menu's call to action its words where the bar keeps `label`. A header number's new `menuLabel` names it in the menu, falling back to `label`, then to "Call"; `label` keeps its place in the desktop bar's pill.
- **The light sheet** shows no email and no address, which the dark sheet's contact block does; its top row sits exactly where the bar's lockup and burger sit, and `--menu-rule` sets its dividers.
- **The burger** takes `menu.burger: { labelAfter, outlined }` (both off): the lines before the words, in an outlined pill.
- **The sticky bar on a hero page under a solid bar.** `cta.stickyFromTop` says whether the phone's sticky bar shows from the first paint; unset it does on a page without `heroNav`, as before, and a page with a hero under a solid bar sets it false so the bar slides in once the hero scrolls away.
- **The not found page's pending view.** `staticNotFoundRouting(NotFoundPage, { useMatches })` draws the page on a miss alone, so a slow client navigation shows no bare 404 body; a site drops its own pending component (see [The Not Found Page](#the-not-found-page)).
- **A refused send as a report.** `reportRefusedResponse(response, { service, request, tags })` from `@atelic-action/ui/monitoring/server` reports an upstream refusal with the status and the body's `name` and `message` alone, every address in them replaced by `[address]`; `refusalError` builds the error alone.
- **Every route's render crash reaches Sentry, whichever boundary catches it.** On TanStack Router 1.170 a route with no `errorComponent` already rises to `AppErrorBoundary` and is reported once; a route or a site that sets its own `errorComponent` with no `onCatch` caught the crash and reported it to nobody. A site adds the two lines under [Error Reporting](#error-reporting), `createRouter({ routeTree, ...routerErrorOptions() })` from `@atelic-action/ui/routing`, and every route's crash is reported once by its own boundary. The package's error page's Try Again reloads the page, since a loader's error stays on the router's match. `ErrorCatcherScript` takes `enabled` (default true), so the root route renders it only with a DSN. `reportServerErrorLater` from `@atelic-action/ui/monitoring/server` sends without holding the answer, on the platform's `waitUntil`. `atelic-check-sentry` now fails a DSN with a space or a line break around it, which the build would ship as set.
- **New tokens, each at today's look** (the table under [Tokens](#tokens)): `--hero-kicker-weight`, `--hero-kicker-tracking`, `--hero-kicker-size`, `--hero-lead-size`, `--hero-lead-measure`, `--hero-stack-gap`, `--menu-card-bg`, `--menu-card-ink`, `--menu-rule`, `--callout-sub-transform`, `--callout-sub-tracking`, `--subheading-tracking`, `--footer-link`, `--footer-link-hover`, `--footer-link-hover-decoration`, `--closing-link`, and `--closing-link-hover`. The 8.1.0 tokens whose default is a literal or a keyword default in `defaults.css` now; every default that names another token stays at its read, so a band that restates the named token still reaches it, exactly as in 8.1.0.
- **A dark ground says so with `data-ground`.** The sections the package draws on a dark or filled ground (the heroes, the credentials band, the callout panel, the price band, the process band, the contact card) wear `data-ground="dark"` or `"primary"`, and `--heading-color` steps aside on `[data-ground="dark"]`, `[data-ground="primary"]`, `.on-primary`, and `.on-dark`, beside the old list of those sections' classes, kept so markup carrying a class without the attribute behaves as before. A new dark section, the package's or a site's, needs only the attribute.
- **Fixes:** `atelic-check-sentry` fails a `VITE_SENTRY_DSN` of whitespace alone as malformed on every build, since a site's `Boolean(dsn)` treats it as set; `reportServerErrorLater` falls through to the platform's `waitUntil` when the context it is given has none it can call; the dark sheet's call to action is the `Button` primitive (the same markup, now with the base path and the number held whole); the contact dock measures again only on the header's own transition, never one inside it; a `tel:` link of an icon and its words holds its number whole, and the header's phone pill marks its number; `StickyCTABar` tells a swapped in `onSpaceChange` the height at once, where it waited for a resize; the contact dock measures its ceiling again when the header changes size or ends a transition; the header's call to action is the `Button` primitive (the same markup); `Footer` no longer sets `--footer-columns`, which nothing read.

### Moving to 8.1.0

Nothing breaks: every addition is an optional prop, config key, token, or entry. On a site that changes nothing, these change: the footer's hours, linked rating, and lockup; the fixes below; the current nav entry's underline on the solid bar; the credit link's underline; the footer's row wrapping a column before it squeezes a word; an email address breaking only at its @ or a dot; the contact dock never rising into the header; and the eyebrow's rule following its last line. Error reporting arrives for a site to wire.

- **The hours come back to the footer, on by default.** A site whose config holds `hours` (every site does, for the structured data) shows them in its footer as a column headed Hours, beside the link columns. To keep them out of the footer, and in the structured data and the sections that print them, set `footer: { showHours: false }` in the site config. Rendering `Footer` directly, a site passes `hours` (`HoursRow[]`, already formatted) and, if it wants other words, `hoursHeading`.
- **The rating links to the Google profile.** With `footer.rating` set, the whole rating line (the stars and the words) is one link, opening in a new tab, to `footer.ratingHref`, else `mapLinkURL`. A site with no `mapLinkURL` and no `ratingHref` keeps the plain line. `footer.ratingLabel` (and `Footer`'s `ratingLabel`) gives the link a fuller accessible name; `Footer` takes `ratingHref` directly.
- **The footer draws the header's lockup.** A brand with a mark image gets the mark with its wordmark beside it in the footer, as in the header, where 8.0.0 drew the image alone. `logo.wordmark: false` keeps the image alone, named by `logo.alt`. The header and the footer draw it from one composition (`LockupParts`, internal to `BrandLockup.tsx`), so the two never drift.
- **Fixed: a crowded mega panel no longer breaks words.** A panel's sections wrap to a second row before any is squeezed below its longest word or its floor; no label in a panel breaks inside a word. A panel that already fit lays out as before.
- **Fixed: the current entry over a hero.** On the transparent bar over a hero the current entry (a page, a group holding it, or a scroll spied stop) reads `--on-dark` with its siblings and is underlined, where it read `--primary` (a dark green primary read 1.64 to 1 over a dark hero). The solid bar's current entry keeps its `--primary-ink` and takes the same 2px underline, since a deep primary can sit within 2 to 1 of the bar's other words (1.67 on a real site), and color alone told the current page.
- **Error reporting, optional but expected** (see [Error Reporting](#error-reporting)): the early catcher, `startErrorReporting` from `@atelic-action/ui/monitoring`, the server reporter from `@atelic-action/ui/monitoring/server`, the middleware reporting its throws, the `atelic-check-sentry` command, and the source map upload in `marketingConfig`. Nothing changes for a site until it wires them, with two exceptions: `marketingConfig` now defines `import.meta.env.VITE_RELEASE` whenever the build knows its commit, and with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` all set it uploads hidden source maps and deletes them from `dist/`. The package now depends on `@sentry/browser` and `@sentry/vite-plugin`, so a site drops its own `@sentry/react`. `AppErrorBoundary` hands a caught render crash to error reporting, which holds it in a buffer on the window until the SDK loads; with no DSN it goes nowhere.
- **Fixed on a crowded page:** the header's lockup never shrinks (a wide mark in a bar with five groups, a number, and the call to action drew at 100 by 39 where it is 141 by 55 at its height); a phone number's no wrap holds the number alone, not a whole call row (a tel link of words alone, or the `.tel-number` the dock, the menu, the panel, `Button`, and `Locations` now put around the number), so a dock row's line wraps inside the panel; links sharing an href are keyed by place everywhere (the bar, the menu, the panels, the footer, the not found page, the dock, the app's nav), so a one page site renders every link and React warns of nothing; a theme whose phone menu sheet's ground equals its primary sets `--menu-badge-bg`, `--menu-badge-ink`, `--menu-cta-bg`, and `--menu-cta-ink` to `--on-primary` and `--primary-ink`, so the badge and the call to action show there rather than vanish; left unset they draw as in 8.0.0. The number's wrapper sits inside one plain span, so a button reading "Call (555) 555-0142" measures exactly what the bare words measure. The contact dock's title is a heading by role, so the brand's heading tokens and a site's heading rules never reach it, and a `BlogIndex` card's title pins its own look against the tokens.
- **Fixed in the footer:** from 760px its columns are one row that wraps, each at its share as the grid gave it but never narrower than its longest word, so a crowded footer (the hours beside four link columns, or another machine's wider font) wraps a column to a second row rather than break "Instagram" inside itself; an icon stays on its label's line; an email address offers breaks after its @ and before each dot (`<wbr>`), so it never breaks inside a word.
- **Fixed in the dock:** the launcher never rises into the fixed header. Over a footer taller than the room left it holds 16px under the header (`ContactDock`'s new `header` selector, default `header.nav`), where it once rose over the phone's burger.
- **Fixed in the eyebrow:** the kicker is inline, so its trailing rule follows the last line of a kicker that wraps rather than standing apart beside the block; `Eyebrow rule={false}` and `Hero eyebrowRule={false}` set the kicker without it. The credit link in the closing bar is underlined, a link in a sentence never marked by color alone.
- **New options, each off or at today's look by default:** a `LinkColumns` row without `href` is words alone, and `--link-columns-min` (170px) sets a column's least width; a panel link takes `quiet` (the softer words, the regular weight); `site.cta.arrow` puts the hero's arrow on the header's button, `site.cta.stickyLabel` gives the phone's sticky bar its own words, and `site.menuLabel` sets words beside the burger on a phone, which then name it; and the tokens in the table under [Tokens](#tokens) marked 8.1.0.
- **Error reporting, as wired since:** `startErrorReporting` defaults its environment to `import.meta.env.VITE_ENVIRONMENT`, which `marketingConfig` now defines from `VERCEL_ENV` (else the mode); `window.__atelicErrors.test()` is the launch check; `isMiss` in `@atelic-action/ui/routing` is the miss check a site's root route asks; `atelic-check-sentry` fails a malformed DSN.
- **Smaller fixes:** `FullBleedVideo` given a `placeholder` and no `poster` never requests its `src`; `LinkColumns` holds two links to one page in a column; on a page wearing the contact dock the hero's scroll cue moves to the middle of the hero's foot, out from under the launcher; `StickyCTABar` hands the space back to the listener it told when a caller swaps `onSpaceChange`; and the app's dark theme sets destructive words in their own `--destructive-ink` (red 400, `0 90.6% 70.8%`, 6.48 to 1 on the dark card), where they read the fill's deep red at 1.79.

### Moving to 8.0.0

- **The spacing default tightened.** Every section pads by the table above, so a site's pages run shorter. A site that wants its old look sets `density: "comfortable"` in its config. Check any section a site padded by hand in its own sheet against the new rhythm.
- **`.nav-links a` became `.nav-links > a`** so a panel's links keep their own styling. A site rule written against the old selector should be checked against the bar.
- **Surfaces:** `BlogIndex`, `BlogPost`, `LegalPage`, `LocationSection`, `Locations`, `ProfileCards`, and `ReviewCarousel` take `surface` like the sections that had it, and `PageHero` takes it defaulting to `alt`. Nothing alternates on its own except the `FAQBrowser`'s subject bands, every second one now on the alternate surface.
- **Eleven components are gone**, none of them used by any site, app, or runner: the sections `DeviceShowcase`, `MediaBand`, `CTABanner`, `PressQuotes` (with `sortPress` and the `PressItem` type), `SocialStrip`, and `MenuList`; the app shell's `CardErrorBoundary`; and the email pieces `MonoTable`, `StatStrip`, `WhatMoved`, and `RecordTimelineLegend`. Their props types and their styles (`.cta-banner`, `.device-*`, `.media-band`, `.menu-list`, `.press-quotes`, `.social-strip`) went with them. A page that still imports one fails to build: a banner moves to `CTASection` or a site's own `SplitSection`, a press row to `ReviewCarousel` or `LogoMarquee`, a photo strip to `Gallery`. The template's example pages that use `CTABanner`, `PressQuotes`, and `SocialStrip` are repointed in the template.
- **The mega menu takes more than link columns.** `columns` is now the panel's sections (`NavPanelSection`): a link column as before, or a `picture`, `rows`, or `cards` section; a link takes `badge` and `children`, and the feature card takes `points`. The panel is the wrap's width and 440px tall whatever it holds, the feature card is 340px on `--primary-deep`, and its action is the `Button` primitive. `allLabel` stays off unless given and now reads as a plain link at a column link's weight, where it was a bold primary line with an arrow. Existing groups render with the new spacing (a link at 17px, the panel's padding 36 by 40) and nothing to change in the config.
- **The brand mark.** `logo.onLight` and `logo.onDark` take the brand's own artwork per surface, never recolored, and `logo.wordmark: false` drops the live name. A site passing `logo.src` alone changes in one way: its mark is as tall as `--brand-mark-height` (30px) and as wide as its own ratio, where the header squeezed every mark into a 30 by 30 box, so a square mark looks exactly as it did and a wider one stops being squashed. The light bar still tints it to ink. The footer draws `logo.onDark` when it is given.
- **Every raw color and weight in the sheets is a token**, each defaulting to the value it replaced (see [Tokens](#tokens)), so a site that sets none looks the same, with one rounding exception: the reveal slider's before label and line read `--scrim` (`#140f0b`) where they had `rgb(20 16 12)`, one step lighter in green and blue. A theme sets `--on-primary` for a primary light enough to want dark words, and the weight tokens for a font kit that lacks 500, 600, or 800. A site that styled against `#fff` in its own sheet is unaffected.
- **`ContactDockItem` is a union:** an item has an `href` or an `onSelect`, and a config with neither no longer compiles. `ContactDock`'s `avoid` takes a ref as well as a selector, `lift` names the bar it rides over (default `[data-dock-lift]`, which `StickyCTABar` now wears), and with `track={false}` it sets no inset of its own. `SiteShell` hands the dock a ref to its footer, so a page's own `footer` element can no longer be mistaken for it. `Footer` and `ClosingBar` take a `ref`.
- **Smaller changes:** the sections' `surface` props share one exported type, `Surface`; `ProcessSteps` takes `id`; `FeatureGrid` takes `lead`; `Button` calls `onClick` on a link as well as a button; `SiteMenu` numbers plain entries alone, so a group no longer leaves a gap in the count; a `StatRow` figure given as words wraps instead of pushing the page sideways; `FullBleedVideo` mounts its video, and fetches the clip, only once the band is within a screen of the viewport; the split hero's copy starts where a `.wrap`'s content does at any width; and the FAQ's icon buttons hover with a wash of the text color, which shows on an alternate band.
- **Fixes the package now owns:** a primary button or an eyebrow inside `.on-primary` (the split hero, the callout panel, the menu's feature card, or a site band wearing the class) turns light, and the footer's stars read `--star-fill`.
- **The primary's three jobs are three tokens.** `--primary-fill` and `--primary-ink` (see [Tokens](#tokens)) each fall back to `--primary`, so a site that sets neither paints its rest states as before. Two things move at the defaults: a primary fill's hover and press darken the fill (`color-mix` toward `--shade`) where the hover read `--primary-deep`, and the words on a primary field read `--on-primary` whole where the subtitles, the dock's line, the feature card's line, and the price band's lead and figures read a softened mix of it, since no mix of white stays over 4.5 to 1 on a fill cut close to that line. The split hero's headline and its serif accent read `--on-primary` (the accent read `--primary-bright`, 1.38 to 1 on the practice's palette), the feature card's eyebrow and ticks read `--on-primary` (they read `--primary-bright`), and the price card sets itself off by a shade rather than a wash of white.
- **The current page and the foot of the page.** A flat nav link on the current page is now marked like a current group. While the phone's sticky bar shows, `SiteShell` pads the closing bar by the bar's measured height (`--sticky-cta-space`, from `StickyCTABar`'s new `onSpaceChange`), so the copyright and the credit are never under it; a site rendering `StickyCTABar` itself wires the same.
- **The footer's headings** are level 2 headings by role (`div` with `role="heading"`) wearing `.footer-heading`, where they were `h4`; a site rule against `.footer h4` moves to the class, a site's bare `h2` rule no longer reaches them, and `headingLevel` sets another level.
- **The lockup.** A logo with one cut no longer draws it untinted everywhere (the table under [Rendering From Props](#rendering-from-props)), the header and the footer resolve the same way, `wordmark: false` with no mark keeps the name, and a glyph tile's letter is drawn by the stylesheet from `data-glyph` (a site styling `.logo-tile`'s text keeps working; one reading its text content finds none).
- **The contact dock** names its panel's close button `panelCloseLabel` ("Close panel"), and still lifts over a site's own bar that wears only `.sticky-cta.show`.
- **A document's mark height** is the token: `ArtifactShell` wears `data-shell="artifact"`, where `artifact.css` sets `--brand-mark-height: 20px` in place of pinning the image's height, so a theme's own token now reaches a document's header and a site importing the sheet keeps its own header's size.
- **The email palette's `faint`** is the brand kit's Faint, `#6e6757`, darkened from the jq's `#8a8272` (3.38 to 1 on the ground at 11px) to 4.99 to 1 on the ground and 5.43 on paper. Every piece that sets it (the masthead's title and meta, the eyebrows, the folds' counts, the record meta, the scoreboard's quiet rows, the failure page's labels, the footer) reads it on the ground or on paper, never on a rule color.
- **Small orange words in email take the accent's ink.** The palette gains `accentInk` (`#B8300B`, the brand kit's Orange Ink, 5.86 to 1 on paper and 5.38 on the ground), and every piece that set small words in `accent` (`#FC4A1A`, 3.31 and 3.04) sets them in it: a title line's value and so an `Item`'s, a short `TargetRow` count, `GroupRow`, `ReadBlock`'s eyebrow, an accented `Note`'s eyebrow, `RecordStack`'s New pill (its border too) and callout eyebrow and a cold aside, a hot `Records` cell, the structured `FailurePage`'s fix label, and `Badge` (its box too). The accent stays for the marks with no words: the masthead's rule, a link's underline, a callout's edge, the timeline's open dots. A client palette that names only an accent gets an ink derived from it (see [Tokens](#tokens)). `warm` darkens from `#B7791F` (3.52 on paper) to `#966319` (4.96 on paper, 4.55 on the ground). A runner that renders its mail from this palette takes all three values with 8.0.0; the goldens record each departure.
- **Email holds a phone's width.** `Row`, `Item`, `Note`, `ListRow`, `ReadBlock`, a `DayStrip` day, a left aligned `Records` cell, and the plain `FailurePage`'s log break a long token (an address, a path) instead of widening the email (`wrapLong`, inline `overflow-wrap: anywhere` and `word-break: break-word`). A `Records` column's `width` is still given in pixels and is now drawn as its share of the 630 pixels a records table has on a desktop, so a desktop renders the same and a phone narrows the grid. `Records` is a data table: no `role="presentation"`, header cells `th scope="col"`, set in the same weight. `Badge` takes `label` (what its letter stands for), `DayStrip`'s entries `badgeLabel`, `Bar` and `RecordTimelineStrip` are images named by `label`, defaulting to "2 of 5" and to `recordTimelineSummary` ("Last 30 days: 2 sends, the latest 3 days ago; 1 open, today"); a `TargetRow`'s bar stays silent beside its count.
- **The app shell's light theme passes text contrast.** `--destructive` is red 600 (`#dc2626`, 4.83 to 1 as words on a card, 4.63 under its foreground) where shadcn's `#ef4444` read 3.6 to 3.76, and `--muted-foreground` is `#6b6b73` (4.81 on the grey highlight) where `#71717a` read 4.39 there. A destructive fill's hover and press read the new `--color-destructive-hover` (the fill mixed 85% with black), never a lighter tint of it, and the provider's rich toasts set each tone's words to pass on its own tint. An app that sets its own `--destructive` or `--muted-foreground` keeps them.
- **Country flags are gone.** `CountryDropdown` shows and lists each country by its name alone: no flag image, no emoji, no code in a circle, and nothing fetched. `getCountryFlag` and the `react-circle-flags` dependency are removed, and so are `AppConfig.flagsBaseURL` and the dropdown's `flagsBaseURL` prop. A consumer that called `getCountryFlag` drops the call and shows the country's name; one that set `flagsBaseURL` drops the key. The package exports no other helper from a country's code to its name, or back.
- **The app kit's names, values, and focus** (see [The Kit](#the-kit)). Visible changes: `Pagination`'s first button reads Previous where it read Prev; the dropdown's search sits above its list; an `AlertTitle` is a paragraph where it was an `h5` (give it `level` to keep a heading). Behavior that changed with a default: `Alert` is no longer `role="alert"` unless given `announce="assertive"` (or `"polite"` for a status), while `PageError` now is one, announced as it appears; a toolbar action and the rail's user menu are named by the words they show; a collapsed rail link is named by its label; clearing a search by keyboard keeps focus in the box; `CommandDialog` is named (`title`, "Commands" by default) and hands focus back to what opened it.
- **The token defaults moved to `styles/defaults.css`,** which every layered sheet imports first, so a consumer loading one sheet alone (`primitives.css` for the prose lightbox, say) has every default it reads. Nothing changes for a site importing them all.
- **A long word breaks instead of scrolling a phone sideways.** The root wears `overflow-wrap: anywhere`, which every text element under it inherits, declared once in `defaults.css` on `:where(.atelic-ui)`, so it weighs nothing and reaches a consumer loading any one sheet alone, and a table keeps `break-word`, so an auto table's columns never collapse below their longest ordinary word. Ordinary words still wrap at spaces; only a word longer than its line breaks. What must stay whole in a crowded row holds: the brand's name, a button's label (`break-word`, so a row of buttons wraps a button rather than squeezing it), a `PricingBand` price, and every `tel:` link, which never breaks (`stories/foundations/CrowdedRows.stories.tsx` checks the rows at 390, 900, and 1180). A `Chip` no longer sets `white-space: nowrap`: it still moves whole to the next line, and only a label longer than its column wraps inside the pill. The sign off's address wraps the same way.
- **`DataTable` scrolls inside its own box** (`.data-table-scroll`, the table's parent) when it is wider than the page, and the box is a focusable region named by the new `ariaLabel` (default "Table") only while it scrolls. `ComparisonTable`'s box, which scrolls on a phone, does the same, with its own `ariaLabel` (default "Comparison").
- **Said to a screen reader, and where focus goes.** `ContactForm` marks a refused field `aria-invalid`, describes it by its message, and focuses the first; its thanks and its failure sit in an `<output>` that is always drawn, so they are announced; its ids come from `useId`, so a label's target is no longer `contact-name` (a site's own CSS or test against those ids moves to the label). `FAQBrowser` returns focus to the search field when the search is cleared, and `JumpRail` marks its current stop `aria-current="location"` and draws nothing with no stops. `LogoMarquee` hides the loop's copy from assistive tech, draws it not at all under reduced motion, and has a quiet pause toggle (`pauseLabel`, default "Pause"). `RevealSlider` answers Home, End, Page Up and Page Down, and the up and down arrows, and says its value through `valueText` (default each side's share by its label). `MapEmbed`'s facade is named by its own words, and a screenshot with no `mapLinkURL` is a plain picture, not a link to `#`. `NotFound`'s closing arrow is hidden from the name. `ColumnChart` names a bar marked apart from its group by the legend's words, and with no bars says `emptyLabel` (default "No data to show"); `ThresholdScale`'s track names the zone with the figure ("Home page: 4.1 s, Poor"). An editable `StarRating` is one slider holding plain hit areas (`data-rating`), never buttons. `StarRow` says and draws a half rating ("4.5 out of 5 stars", four and a half stars) where it rounded up. `ProcessSteps` and `LocationSection` take `headingLevel` (default 2) and set the steps' titles and the hours heading one level below, at level 3 where they were `h4` elements, and as headings by role (a `div` with `role="heading"` and `aria-level`), as the footer's column labels already were, so a site's bare `h3` rule no longer restyles them; a site styling `.steps h3` or `.loc-block h3` moves to `.step-title` or `.loc-heading`. `NavMegaPanel` marks one link current, the first in reading order. The gate's fine print link is underlined.
- **Contrast at the defaults.** `--tone-good` is `#197538` (was `#1b7f3b`, 4.50 to 1 on the practice's surface and 4.16 on its alternate band; now 5.12 and 4.73) and `--grade-b` is `#8a5f00` (was `#9a6b00`, 4.30 on its own ground; now 5.18). The contact form's error words read `--primary-ink` where they read `--primary-deep`, the review carousel's denominator `--neutral-500` where it read `--neutral-300`, soft words on the inset well (a placeholder's brief, the map facade's hint, a profile placeholder, the reveal slider's before brief) the new `--ink-inset`, the reveal slider's after brief `--primary-ink`, and a dark `SectionHeading`'s lead `--on-dark-quiet` and its title `--on-dark`.
- **Tokens that were read but never defined** now resolve: `--shadow-md` and `--shadow-lg` default to plain neutral shadows and `--font-script` to a generic chain of system scripts, each a token a theme is expected to set, as the templates do (see [Tokens](#tokens)), and `--neutral-700`, which no theme sets, falls back to `--ink`, which prose already inherited. A theme that sets them is unaffected.
- **Column widths come from `.wrap`:** `PricingBand`'s lead, `Locations`' lead, and `Gallery`'s lead no longer cap themselves. `PricingCard` keeps its 520px: it is a card, not a column, and at the wrap's width its button ran across a nearly empty card.

### Every Section

| Section | What it is |
|---|---|
| `Hero` | The home page opener: a full bleed image (or the token gradient), a headline with a serif accent, a pair of actions, trust figures, and a scroll cue; `layout="split"` sets the copy on the primary field beside the photo, stacking photo first on a phone |
| `ProofStrip` | One row of short proof facts under a hero, a figure over its label each |
| `FullBleedVideo` | A silent looping clip edge to edge, the poster first and the clip only while on screen |
| `CalloutPanel` | Short callouts on the primary field, titles and subtitles each on a shared line |
| `LinkColumns` | Columns of links under a heading, a link's figure right aligned in tabular numerals |
| `PageHero` | The interior page opener on the alternate band; children sit under the lead |
| `LogoMarquee` | A dark band of chips scrolling without end: credentials, clients, or press |
| `SplitSection` | The two column band: copy beside copy, or media beside copy. `ratio` is `even`, `narrow-first`, or `media`, a fixed 420px shot column and the gap a card row uses, so a photo beside copy lines up with a case study entry above it; `even` and `narrow-first` stack below 920px, `media` below 761px |
| `PricingBand` | A brand colored band with the price in a card beside it, informational by design |
| `CTASection` | The standard closer: the site's own primary action and an optional ghost second |
| `FeatureGrid` | Numbered cards with a hover lift; a card is a link or holds one, never both; a linked card with `external` opens in a new tab and says so to a screen reader (`newTabLabel`, 8.3.0) |
| `FeatureDetail` | Alternating copy and media rows with tags and a tick list |
| `ProcessSteps` | A dark band of numbered steps beside a frame |
| `PricingCard` | A standalone price card with a tick list and its booking action |
| `ExpandList` | A light accordion of numbered rows whose bodies stay in the HTML while closed |
| `ComparisonTable` | A graded before and after that scrolls sideways on a phone rather than reflowing |
| `RevealSlider` | Drag or arrow keys to compare two frames, each with its own toned shot brief before photography |
| `ReviewCarousel` | The aggregate beside one large review at a time, stepped by dots and arrows, each review linking to its source |
| `ReviewWall` | The reviews page: tag filter and sort when the data carries them, clamped quotes behind Read more |
| `ProfileCards` | Equal weight cards of media beside a short bio |
| `Gallery` | A captioned wall of the business's own work, a shot brief where a photo is missing |
| `CredentialList` | Credential cards with a mono code before each |
| `LocationSection` | The local search section: service areas as prose, hours, directions, and the map |
| `Locations` | More than one address: the flagship's map beside a card for each location |
| `MapEmbed` | The map: a screenshot linking to directions, or a click to load facade over the live embed |
| `HoursTable` | Day rows with dashed rules and mono times |
| `ContactForm` | Validated form with a honeypot that posts to `endpoint` (or hands off to mail); `onLead` replaces the default GA4 `generate_lead` event; the service business's opt in fields (8.5.0), below |
| `ContactInfoCard` | A dark card of direct contact rows: call, email, visit, portal; the single phone row reads `phoneLabel`, default "Call" (8.3.0); `layout="stacked"` puts each label over its number, the numbers large (8.5.0) |
| `InfoRows` | Rows of a title over lines (an address) and an optional `detail` (an office's hours), with one action on the right as an icon over its words; the action is described by its row's title, and a directions link opens a new tab with `newTab` (8.5.0) |
| `FAQBrowser` | The help page: live search, a sticky `JumpRail` of categories with scroll spy, expand all, deep links; `contactHref` sets where the no match line points |
| `JumpRail` | Sticky in page pill tabs with scroll spy, used by `FAQBrowser` and on its own |
| `BlogIndex` | The post listing as a readable stack |
| `BlogPost` | One article: back link, title, byline and dateline, body |
| `LegalPage` | A legal document from data, its last revised date first |

The primitives that came with them, in `@atelic-action/ui/primitives`: `ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, and `TickList`, with `Bubble` (see Primitives) beside them. `StarRow` stays beside `StarRating` on purpose: it draws only the filled stars a review shows, to the nearest half star and in the brand color, named by the rating as given ("4.5 out of 5 stars"), where `StarRating` draws the whole scale with outlines in half steps and can take a rating.

The entry also exports the helpers the sections use, for a site's own code: `formatClock`, `formatHoursRange`, and `isClosed` for hours, `isHoneypotFilled`, and `trackEvent`.

Hours print on the 12 hour clock unless the site's config sets `clock: "24h"`, which turns "9a to 5p" into "09:00 to 17:00" everywhere hours appear: `LocationSection` and `HoursTable` (which takes `clock` as a prop when used on its own). `meridiem: "word"` (8.3.0) marks the 12 hour clock with a word, "9 am to 5 pm", wherever hours print (`HoursTable`'s `meridiem` when used on its own). The footer prints the short form, a whole hour's minutes dropped ("8a to 5p"), unless `footer.hoursShort` is false, so "8:00 am to 5:00 pm" in the footer is `meridiem: "word"` with `footer: { hoursShort: false }`, no site code. `formatClock` and `formatHoursRange` take the same `clock`, `meridiem`, and `short` options for a site's own code.

### The Marketing Vite Config and Commands

```ts
// vite.config.ts
import { marketingConfig } from "@atelic-action/ui/vite";
import { site } from "./src/site.config";

export default marketingConfig({ site, pages: [{ path: "/blog/first-post" }] });
```

`marketingConfig` carries what the template's `vite.config.ts` did: Vite's `base` and the router's `basepath` from `site.basePath` (or a `VITE_BASE_PATH` rehearsal), a refusal when a based `site.url` does not end with its base, TanStack Start prerendering with the crawler and the 404 page (copied to `404.html` by the build), the pages a site names, a sitemap on the origin of `site.url` (`sitemapHost` to change it) and none for a based cut, React, the `@` alias, and `ssr.noExternal`. `extend` merges a site's own needs over it. It leaves `build.cssCodeSplit` at Vite's default (1.0.0): every sheet rides in the site's one base sheet, so no component imports a stylesheet, and with the flag forced off TanStack Start fails the build looking for a `style.css` that is never written. A site that gives a component its own stylesheet again passes `extend: { build: { cssCodeSplit: false } }`. A site's scripts:

```json
{
	"build": "tsc -b && vite build && cp dist/client/404/index.html dist/client/404.html && atelic-clean-sitemap && atelic-stamp-health && atelic-check-base-path",
	"check:links": "atelic-check-links",
	"check:contact": "atelic-contact-canary"
}
```

`playwright.config.ts` serves the build with `atelic-serve-static`, which serves a based build both under its prefix and without it, as the template's copy did.

### Thinning a Marketing Site

A site that takes 0.19.0 deletes its copies and repoints its own files. The template's `src/components/sections/`, the five primitives and their sheets, the `Button` and `Chip` wrappers, `chrome/SiteShell.tsx`'s body, `siteConfig.ts`, and the scripts all go; a route or section the site added that imports one of them repoints:

| Old import | New import |
|---|---|
| `@/components/sections/<Name>` (all 35, their types included) | `@atelic-action/ui/sections` |
| `@/components/primitives/Button`, `Chip` | `@atelic-action/ui/primitives` (the wrappers die; the base comes from `BasePathProvider`) |
| `@/components/primitives/ImageFrame`, `ProseBlocks`, `QuoteCard`, `StarRow`, `TickList` | `@atelic-action/ui/primitives` |
| `@/components/chrome/SiteShell` | The site's few line wrapper above, around `SiteShell` from `@atelic-action/ui/chrome` |
| `@/components/siteConfig` | `@atelic-action/ui/sections` (`SiteConfig`, `NavItem`, `CTA`, `OpeningHours`, `Address`, `Founder`, `GateConfig`, `SiteLink`, `SocialLink`) |
| `@/components/newTabProps` | `@atelic-action/ui/artifact` (`newTabProps`) |
| `@/shared/lib/hours` | `@atelic-action/ui/sections` (`formatClock`, `formatHoursRange`, `isClosed`) |
| `@/shared/lib/honeypot` | `@atelic-action/ui/sections` in a component; `api/contact.ts` keeps its own copy, since Vercel runs a function's package imports uncompiled |
| `@/shared/lib/analytics` (`trackEvent` only) | `@atelic-action/ui/sections`; the rest of the module, the click listener, stays in the site |
| `@/shared/lib/basePath` (`normalizeBasePath`, `joinBase`, `stripBase`, `hasBase`) | `@atelic-action/ui/routing`; in a component, `useWithBase()` in place of `withBase`; in `e2e/`, `@atelic-action/ui/routing/base-path` |
| `@/shared/lib/basePathAudit`, `@/shared/lib/sitemap` | Gone, inside `atelic-check-base-path` and `atelic-clean-sitemap` |
| `scripts/clean-sitemap.ts`, `check-base-path.ts`, `contact-canary.ts`, `stamp-health.ts`, `check-links.ts`, `serve-static.ts` | `atelic-clean-sitemap`, `atelic-check-base-path`, `atelic-contact-canary`, `atelic-stamp-health`, `atelic-check-links`, `atelic-serve-static` |
| `vite.config.ts` | `marketingConfig`, above |
| The `import "./<name>.css"` in each component | `@atelic-action/ui/styles/sections.css` in the base sheet, after `primitives.css` |
| `middleware.ts` | The marketing matcher in [The Access Gate](#a-marketing-sites-matcher) |

The `.mkt` wrapper a site's own routes render becomes `.atelic-ui`, the scope every package sheet answers to.

## Email

`@atelic-action/ui/email` is the runner email design as React components, ported one to one from the jq library the runners compose their mail from (homebase `runners/lib/email.jq`). The components are born inline: every layout is a table, every style is an inline style object, and there is no CSS file and no `className`, because Gmail strips a style block and ignores media queries on some accounts. The same components therefore mount on a web page as happily as they render into a mail client.

Colors and fonts come from context, so a client branded email passes its own palette:

```tsx
import { Card, Eyebrow, Footer, Item, Masthead, TitleCard } from "@atelic-action/ui/email";
import { renderEmail } from "@atelic-action/ui/email/render";
import { atelicPalette } from "@atelic-action/ui/tokens";

const html = renderEmail({
	title: "Week 40 Recruiter",
	preheader: "Three roles cleared every filter.",
	palette: { ...atelicPalette, accent: "#0B6E4F" },
	children: (
		<>
			<Masthead title="Recruiter" />
			<TitleCard
				eyebrowText="Week 40"
				headlineLines={["Three cleared", "every filter."]}
				lede="Two of them are remote."
			/>
			<Eyebrow text="Shortlist" />
			<Card>
				<Item
					name="Pinewood Cabinetry"
					right="4.5"
					subparts={["Staff engineer", "Remote"]}
					body="They answered inside a day."
					linkText="Posting"
					url="https://example.test/posting"
					last
				/>
			</Card>
			<Footer meta="Run 2026-10-05" />
		</>
	),
});
```

### Mobile First

Runner emails are mobile first. A layout that squashes on a phone is fixed here, in the components every runner shares, never in a report page. A fixed column table is for numbers alone and never carries a name; names go in a `RecordStack`. One long token (an address, a path, a long word in a narrow day) breaks inside its cell rather than holding the email open past the phone: `Row`, `Item`, `Note`, `ListRow`, `ReadBlock`, a `DayStrip` day, a left aligned `Records` cell, and both failure pages' logs carry `wrapLong` (`overflow-wrap: anywhere` with `word-break: break-word`, which mail clients honor inline), exported for a runner's own blocks (8.0.0). A `Records` column `width` is pixels at the desktop column and is drawn as its share of the table (630 pixels inside a card's row, or the columns' sum when they ask for more), so the same widths keep sibling tables on one grid and narrow on a phone.

`RecordStack` takes `records`, each a `RecordStackItem` (`title`, `url`, `meta`, `note`, `badge`, `callout`), and renders one table row per record: the title on its own line at 15px, bold and wrapping freely, linked when `url` is set; a mono meta line beneath it with the items joined by middle dots (empty items drop); an optional note beneath that; a hairline between records and none after the last. No cell carries a width, so a name of any length wraps at 320 pixels instead of squashing. An optional `badge` (a stage word such as `"Contacted"`) sits on the title line in a small mono uppercase pill on a `line` hairline, in its own right aligned unbroken cell, so the title keeps wrapping beside it and the badge stays on the title's first line. An optional `callout` (`{ eyebrow, text }`) sets a short task under the meta and the note in the accented `Note` idiom: the eyebrow in the accent, the text at 13px, and a 2px accent rule down its left edge. A record with neither renders exactly as it did before. `recordStackText(records)` is its plain text twin: each title on its own line under a two space indent with any badge after it in square brackets (`Blue Heron Plumbing [Contacted]`), the meta and the note wrapped under a four space indent, any callout as its eyebrow in upper case over its text under that same indent, a blank line between records, and no line past `textWidth` (68 columns, indent included).

The Company Cards additions (0.7.0, from the `Company Cards IA` design, 2026-09-29) ride on the same item and change nothing for a record without them. `badges` is a list of further pills after `badge`, each with a `tone`: `faint` is the quiet stage word, `ink` a bold pill in ink on a 1.5px border (the next touch), `accent` the same in the accent (New). `timeline` (`{ days, touches, opens }`, each day count back from today) draws the record's recent days between the title and the meta line as one table cell per marked day and one per run of empty days between them (seven cells for three marks, never thirty, since Gmail clips a message past about 100 KB), an 8px ink square on each send day and a 5px accent dot on each known open day, the two stacked when they share a day, all standing on a `line` hairline with a 1.5px ink tick at today's edge and an axis row beneath (`30d` on the left, `today` on the right); nothing is positioned, so it survives Gmail. `RecordTimelineStrip` renders one on its own. `aside` (`{ text, strong, tone }`) sets a fact right on the meta line with its number in bold and colored by tone: `up` fresh, `warm` cooling, `accent` cold. In the text twin every pill follows the title in brackets, the timeline is one character per day (`10d [#······@·o|]`: `#` a send, `o` an open, `@` both, `·` nothing, `|` today), and the aside ends the meta line; `recordTimelineText` and `recordBadges` are the helpers it uses.

`Masthead` takes an optional `meta` (`"Week 39 · 09/21 to 09/27"`) set in the eyebrow style at the right end of the row, so the title card no longer carries the week. It is a right aligned, unbroken block floated after the wordmark and title: on the same line while the row has room, and dropped under the title on its own line, still right aligned, when it does not (checked at 320 pixels). `Eyebrow` takes `strong`, which sets the label at 15px and weight 700 in ink rather than faint, with a slightly tighter tracking, so a section such as `MQL · 15` reads as a heading on a phone.

```tsx
const records = [
	{
		title: "Pinewood Cabinetry",
		url: "https://example.test",
		meta: ["Lead", "Longmont", "fit 14"],
		note: "Answered the audit inside a day.",
		badge: "Contacted",
		callout: { eyebrow: "Next", text: "Walk the Business Profile findings Thursday." },
	},
];

<Masthead title="Pipeline" meta="Week 39 · 09/21 to 09/27" />;
<Eyebrow text="MQL · 15" strong />;

<Card>
	<Row last>
		<RecordStack records={records} />
	</Row>
</Card>;

const text = recordStackText(records);
```

`renderEmail` builds the document shell itself and puts only the rows through React, because React emits no doctype, React 19 hoists and reorders head tags, and it would escape the `>` in `details>summary`. `renderFailureEmail` is the same shell around `FailurePage`. Both live at `@atelic-action/ui/email/render`, apart from the components, so a site that mounts a component on a page never pulls React's server renderer into its browser bundle.

The failure page takes two optional strings (4.1.0): `step`, what failed as a short label (`"Claude model call"`), and `fix`, what to do in a sentence or two that may hold a command. Given either, the reason line under the headline becomes a labelled block, one row per fact on a hairline with a faint eyebrow over its value: What Failed (the step), Why (the reason), and What to Do (the fix, its label in the accent and its value in mono), then the log tail under its own Log eyebrow. A row whose value is empty or only whitespace is left out, so an empty reason leaves no bare Why. The preheader leads with the step when there is one (`Claude model call: OAuth token revoked`). Given neither, the page is byte for byte what it was before, held by a frozen copy in `tst/email/frozen/`.

```ts
renderFailureEmail({
	runnerTitle: "Brief",
	eyebrowText: "Week 47",
	step: "Claude model call",
	reason: "OAuth token revoked, status 401",
	fix: "Run claude setup-token, then push the new token to the vault.",
	logTail,
});
```

### The Mapping

Where the jq takes a pre rendered html string (`$rows`, `$body_html`, `$cells_html`, a records cell's `html`, a stat's caption), the React prop is `children` or a `ReactNode`. Where the jq escapes a string argument, the prop is a plain string and React does the escaping.

| jq Function | Component | Props |
|---|---|---|
| `eyebrow` | `Eyebrow` | `text`, `strong` (added 0.5.0, no jq counterpart) |
| `card` | `Card` | `children` |
| `fold` | `Fold` | `summary`, `children` |
| `big_fold` | `BigFold` | `summary`, `count` (a `ReactNode`, absent for the jq's `""`), `children` |
| `title_line` | `TitleLine` | `name`, `right` |
| `item` | `Item` | `name`, `right`, `subparts`, `body`, `foldLabel`, `foldBody`, `linkText`, `url`, `last` |
| `note` | `Note` | `eyebrowText`, `text`, `accented`, `last` |
| `empty_row` | `EmptyRow` | `text` |
| `stat` | `Stat` | `n`, `caption` (a `ReactNode`: the jq takes raw html here) |
| `stats_row` | `StatsRow` | `children`, the `Stat` cells |
| `list` | `List` | `fontSize`, `children` |
| `list_row` | `ListRow` | `children` |
| `lead_row` | `LeadRow` | `lead`, `rest` |
| `row` | `Row` | `last`, `children` |
| `fold_row` | `FoldRow` | `last`, `children` |
| `bar` | `Bar` | `logged`, `target`, and since 8.0.0 `label`, its text alternative ("2 of 5" by default, `false` for a bar beside a count that says it) |
| `group_row` | `GroupRow` | `text`, `first` |
| `target_row` | `TargetRow` | `text`, `logged`, `target` (null is a count with nothing to measure it against), `note`, `last` |
| `scoreboard` | `Scoreboard` | `children`, the `GroupRow` and `TargetRow` rows |
| `read_block` | `ReadBlock` | `text`, `divider` |
| `sub_eyebrow` | `SubEyebrow` | `text` |
| `badge` | `Badge` | `letter`, and since 8.0.0 `label`, what the letter stands for, read in its place |
| `day_strip` | `DayStrip` | `days` (an entry takes `badgeLabel` since 8.0.0), `last` |
| none | `RecordStack` | `records`, each with an optional `badge`, `callout`, and since 0.7.0 `badges`, `timeline` and `aside` (born here on 2026-09-24, with no jq counterpart); `RecordTimelineStrip` takes `label`, its text alternative, `recordTimelineSummary` of the timeline by default (8.0.0) |
| `records` | `Records` | `columns`, `rows`; a cell's `html` is a `ReactNode`. Since 8.0.0 a data table with `th scope="col"` headers, and a column's pixel `width` drawn as its share of the table |
| `masthead` | `Masthead` | `title`, `wordmark` (defaults to `atelic`), `meta` (added 0.5.0, no jq counterpart) |
| `title_card` | `TitleCard` | `eyebrowText`, `headlineLines`, `lede`, `stats` (the rows under the lede, in place of the jq's `$stats_html`) |
| `footer` | `Footer` | `meta` |
| `page` | `renderEmail` | `title`, `preheader`, `children`, `palette`, `fonts` |
| `failure_page` | `renderFailureEmail`, or `FailurePage` as body rows | `runnerTitle`, `eyebrowText`, `reason`, `logTail`, and since 4.1.0 the optional `step` and `fix` (no jq counterpart) |

The plain text alternative part ports as plain functions with no React anywhere in them: `spaces`, `rpad`, `lpad`, `wrap`, `textRule`, `textSection`, `textRead`, `textBar`, `textTarget`, `textTableGrid`, `textTable`, `recordStackText`, `textWidth`, plus `asciiUpcase` and `asciiDowncase`. Every width counts Unicode codepoints, the way jq's `length` does.

`tst/email/expected/` holds frozen goldens generated from the jq library, and the component tests compare the rendered DOM against them. See that folder's README before touching one.

### Tokens

The sheets read a set of tokens beyond the theme's palette, type, radii, and layout. Each has a default, declared once in `styles/defaults.css` on `:where(.atelic-ui)`, which weighs nothing, so a theme's own `.atelic-ui` rule wins and sets one only to change it; every default is the value the sheets used before it was a token, so a site that sets none looks as it did (8.0.0). Every layered sheet imports `defaults.css` first, so a sheet loaded alone still finds its defaults. Only a default that is a literal value or a system keyword is declared there; an inherited color is `currentColor`, which is the same thing. Every other default stays at the read, marked "read in place" below: a default that names another token (`--menu-cta-bg` falls back to `--primary-fill`, then `--primary`), since declared on the root it would resolve once there and a band that restates the named token below it would no longer reach it, as `--primary-fill` and `--primary-ink` never have; a chain read more than once is written once as a private property on the component's own root (`--_menu-cta-bg` on the menu's sheet, `--_header-gutter` on the bar), where it resolves below any band. Also read in place: one computed on the element itself (`--hero-split-pad`), an inherited one other than a color (`--callout-sub-font`, the plain address's `--footer-nap-weight`), since a custom property cannot hold `inherit`, and `--hero-stack-gap`, whose gaps each keep their own value unset. `defaults.css` lists them in one comment, and `Foundations/ThemeTokens`' `BandRestatingPrimary` and `Chrome/SiteMenu`'s `CTAInABandRestatingPrimary` prove a band reaches them (8.2.0). No layered sheet paints a raw color anywhere else: `tst/no-raw-colors.test.ts` sweeps every sheet in `src/styles/` but the ones it excludes by name with a reason (`app.css`, Tailwind source outside the layer), and fails on a hex, a color function, or a named color outside a token's declaration in the defaults sheet, with its few exceptions listed in the test, each with its reason.

**The primary does three jobs, and each has its own token.** `--primary` is the brand color as a mark: lines, rules, focus rings, icons, stars, dots, and accents that carry no words. `--primary-fill` is the primary as a field that carries words: the primary button, the dock's launcher and panel head, the split hero and the callout panel bands, the price band, the menu's badges and highlighted row, the reveal slider's after label, the map's directions chip, a step bubble's badge; the words on it read `--on-primary`, and its hover and press darken it, so they stay distinct even where a theme's fill is its old hover shade. `--primary-ink` is the primary as words on `--surface` and `--surface-alt`: the eyebrow, a serif accent in a heading, the current nav entry and panel link, inline accent links, a feature number, the info tone. Both new tokens fall back to `--primary` where they are read, so a site that sets neither looks as it did, and a band that restates `--primary` carries both with it. A bright brand color that cannot pass text contrast keeps `--primary` and sets the other two deeper; the Storybook theme (`.storybook/theme.css`) sets `--primary` `#fc4a1a`, `--primary-fill` `#d63a10` (white on it 4.70 to 1), and `--primary-ink` `#b8300b` (5.38 to 1 on `--surface`, 4.97 on `--surface-alt`, 4.80 under the bar's hover tint).

| Token | Default | What it colors or sets |
|---|---|---|
| `--primary-fill` | `--primary`, read in place | Every primary field that carries words: `.btn-primary`, the dock's launcher, panel head, and lead icon, the split hero and callout panel bands, the price band, a step bubble's badge, a menu badge, a highlighted menu row, the reveal slider's after label, the map's directions chip. Its hover is 84% of it mixed with `--shade`, its press 74% |
| `--primary-ink` | `--primary`, read in place | The primary's words on `--surface` and `--surface-alt`: the eyebrow, `em.serif` and a heading's `.serif`, the current nav entry and group on the solid bar, the current panel link, inline accent links and hovers, feature numbers and links, the FAQ's links, the gate's brand line and links, the info tone, the surface button inside `.on-primary` |
| `--on-primary` | `#fff` | Anything set on the primary fill: a primary button's words, the dock's head and lead icon, the split hero's copy and accent, the callout panel, the price band, a step bubble's badge, a menu badge, a highlighted menu row, the feature card. Read whole, never softened, since a fill cut to pass leaves no room for a mix |
| `--on-dark` | `#fff` | Anything on a dark band or over a photograph: the skip link, the transparent header and its current entry (8.1.0), the dark header's text (mixed with `--surface`), the phone menu's rules, the footer's headings and links, a hero's headline, the contact card, the process band, a ghost button and a chip on dark, the reveal slider's handle |
| `--on-dark-chip` | `#efe7da` | A chip's words on a dark band (the credentials chips, `Chip onDark`) |
| `--on-dark-quiet` | `rgb(248 244 237 / 0.74)` | Quiet text on the dark process band |
| `--on-dark-faint` | `rgb(248 244 237 / 0.52)` | The quietest text on a dark band: the closing bar's copyright and credit (5.23 to 1 on `#151515`), where a light ground's gray such as `--neutral-500` falls short |
| `--shade` | `#000` | Pure shadow: a lightbox backdrop, a caption's wash, a headline's text shadow, the dark button's press, a primary fill's hover and press, the price card's ground, and the fallbacks behind `--hairline` and `--shadow-md`. A `::backdrop` that inherits no custom property (before Safari 17.4 and Chrome 122) falls back to `--backdrop-shade`, which `defaults.css` sets on the backdrop itself |
| `--scrim` | `#140f0b` | The warm wash a hero lays over its photograph, and the reveal slider's before label |
| `--placeholder-ink` | `#8a7c68` | The hatching and ring of a placeholder before photography exists |
| `--ink-inset` | `--ink-soft`, read in place | Soft words on the inset well (`--surface-inset`): a placeholder's shot brief, the map facade's hint, a profile placeholder, the reveal slider's before brief. `--neutral-600` read 4.4 to 1 there on the practice's palette, `--ink-soft` reads 6.14 |
| `--shadow-md`, `--shadow-lg` | `0 4px 14px rgb(0 0 0 / 0.08), 0 12px 32px rgb(0 0 0 / 0.06)`, `0 10px 30px rgb(0 0 0 / 0.12), 0 30px 70px rgb(0 0 0 / 0.1)` | Theme tokens a theme is expected to set, as every template's does: the raised shadow (an image frame, the map's chip, a card) and the higher one (a lifted frame, a pricing card, a panel). The defaults are plain black at a low alpha, so a theme without them still draws a shadow and no site's tint leaks into another |
| `--font-script` | `"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive` | The sign off's script line, a token a theme is expected to set: the templates self host Yellowtail and name it there. The package bundles no font, so its default is a generic chain of the system scripts |
| `--hover-tint` | `rgb(33 28 23 / 0.06)` | The light bar's hover behind a nav entry |
| `--review-gold` | `#f5b301` | The footer rating's stars when the theme sets no `--star-fill` |
| `--grade-a` to `--grade-d`, each with `-line` and `-bg` | A `var(--tone-good)` (`#197538`) on its ground `var(--tone-good-bg)`, B `#8a5f00` on `#c99a1a`, ground `#fdf5dc`, C `var(--tone-warn)` (`#a84500`) on `#e8650a`, ground `#fff0e3`, D `var(--tone-bad)` (`#b3261e`) on its ground `var(--tone-bad-bg)` | The grade chip's words, rule, and ground, green to red whatever the brand is. A grade whose value is a tone's reads the tone, so a theme restating the tone moves both |
| `--weight-light`, `--weight-regular`, `--weight-medium`, `--weight-semibold`, `--weight-strong`, `--weight-bold`, `--weight-heavy` | 300, 400, 500, 600, 650, 700, 800 | Every font weight in every layered sheet. A font kit with only 400 and 700 maps each name to one of those (medium to 400, semibold, strong, and heavy to 700), so the browser synthesizes no weight |
| `--brand-mark-height` | `30px` (20px inside `ArtifactShell`) | The header mark's height, and a sent document's recipient mark; the width follows the image's own ratio |
| `--sticky-cta-space` | `0px`, read in place | The room the phone's sticky bar reserves wherever it can show, from the first measure and before it slides in, which the closing bar pads its foot by; `SiteShell` sets it on its root from `StickyCTABar`'s measurement, and a theme never does |
| `--header-max`, `--header-gutter` | `--max-width`, `--gutter`, read in place (on the bar, and on the light menu's top row, which sits where the bar's content does) | The bar's and the mega panel's width and side gutter, for a design that runs the bar wider than the content (8.1.0) |
| `--nav-open-bg`, `--nav-open-ink` | `--hover-tint` read in place, `currentColor` (the bar's words) | The open group's pill (8.1.0) |
| `--nav-phone-pad`, `--nav-phone-size` | `6px 16px 6px 12px`, `0.95rem` | The header phone pill's padding and its number's size (8.1.0) |
| `--heading-transform`, `--heading-weight`, `--heading-tracking`, `--heading-color` | `none`, `--weight-heavy`, `-0.02em`, `currentColor` (inherited) | Every `h1` and `h2` the package sets (section headings, the heroes', the page hero's). The color never reaches a heading on a ground that says it is dark or the primary fill, by `data-ground` (8.2.0: every such section the package draws wears it, the hero, the process band, the callout panel, the price band, the credentials band, the contact card, and a site's own dark band may) or by `.on-primary` or `.on-dark`, nor one a component colors itself (8.1.0) |
| `--subheading-tracking` | `-0.015em` | Every `h3`'s tracking, and two thirds of it every `h4`'s (`-0.01em` at the default), as `--heading-tracking` reaches `h1` and `h2`; a brand setting headings flat sets it to `0` (8.2.0). Set a length; a theme that sets `normal` gets `normal` on `h3` and a flat `h4` (8.3.0: the `h4` took its parent's tracking) |
| `--hero-kicker-weight`, `--hero-kicker-tracking`, `--hero-kicker-size` | the eyebrow primitive's own (`--weight-medium`, `0.18em`, `0.74rem`), read in place from its private properties | The hero's eyebrow line, both layouts (8.2.0) |
| `--hero-lead-measure` | `52ch` | The hero's lead paragraph's measure, both layouts (8.2.0) |
| `--hero-stack-gap` | none; unset, each gap keeps its own (18, 22, and 32px on the full hero, 12, 22, and 26px on the split hero), read in place | One gap between the hero's kicker and headline, headline and lead, and lead and actions, both layouts (8.2.0) |
| `--hero-gap-kicker`, `--hero-gap-lead`, `--hero-gap-actions` | `--hero-stack-gap` when set, else the gap's own (kicker to headline 18px, 12px on the split hero; headline to lead 22px; lead to actions 32px, 26px on the split hero), read in place | Each of the hero's three gaps on its own, both layouts (8.3.0) |
| `--hero-lead-leading` | `1.55` | The hero's lead paragraph's line height, both layouts (8.3.0) |
| `--hero-kicker-display`, `--hero-kicker-leading` | `inline-block`, declared in `defaults.css`; inherited, read in place | The hero's kicker as the inline block it has been, in a line box of the copy's leading that stands it taller than its type; `block` with a leading of its own lays it out as a block whose height is that leading, so a design's kicker takes its drawn height (8.3.0) |
| `--hero-actions-gap` | `14px` | The gap between the hero's actions, side by side or stacked (8.3.0) |
| `--hero-split-pad-block` | `--section-space`, read in place | The split hero's copy column's top and bottom padding; over a transparent bar from 900px the bar's height is added above it, as before (8.3.0) |
| `--hero-lead-size` | `clamp(1.05rem, 2.2vw, 1.35rem)` | The hero's lead paragraph (`subtitle`), both layouts; a split hero whose lead wraps too long sets it smaller (8.2.0) |
| `--card-title-color` | `currentColor` (inherited) | A `FeatureGrid` card's title (8.1.0) |
| `--callout-transform`, `--callout-sub-font` | `none`, inherited (read in place, since no custom property can hold `inherit`) | A `CalloutPanel` title's case and its line's face (8.1.0) |
| `--callout-sub-transform`, `--callout-sub-tracking` | `none`, `normal` | A `CalloutPanel` subtitle's case and tracking (8.2.0) |
| `--proof-star-fill` | `--primary`, read in place | A star row in a `ProofStrip` value (8.1.0) |
| `--hero-split-pad` | the wrap's edge, computed on the copy (read in place) | The split hero's copy sides (8.1.0) |
| `--footer-mark-height`, `--footer-nap-weight` | `38px`, `--weight-semibold` (the plain address: the column's own, read in place, since no custom property can hold `inherit`) | The footer lockup's mark and the address, phone, and email lines (8.1.0) |
| `--footer-link`, `--footer-link-hover` | `--neutral-200`, `--on-dark`, read in place | The footer's column links and every footer link's hover, apart from the neutrals that also draw outlines (8.2.0) |
| `--footer-link-hover-decoration` | `none` | The line a footer column link and a contact line take on hover (`underline`), for a theme whose links are already the hover's color, where a hover by color alone shows nothing (8.2.0) |
| `--footer-link-size` | `1em` (the footer's own size, as the links always inherited) | The footer's column links' size, to a design's proportion (8.3.0) |
| `--footer-brand-width` | none; unset, the brand column's share is 1.4, or 2 beside the hours from 1100px, read in place | The brand column's share of the footer's row from 760px, a link column's being 1 (8.3.0) |
| `--closing-rule-inset` | `0px` | How far in from each side the rule above the closing bar starts; `max(var(--gutter), calc((100% - var(--max-width)) / 2 + var(--gutter)))` sets it inside the content's width (8.3.0) |
| `--closing-link`, `--closing-link-hover` | `--neutral-300`, `--surface` mixed 96% with `--on-dark`, read in place | The closing bar's links, the credit's among them, and their hover. Their own pair, since the closing bar's links have always read a step quieter than the footer's (8.2.0) |
| `--menu-card-bg`, `--menu-card-ink` | `--primary-deep`, `--on-primary`, read in place | The mega panel's feature card: its ground, and its eyebrow, headline, line, and ticked points. The card is the primary field (`.on-primary`), so its button stays light; a theme that sets a light ground here checks the button against it (8.2.0) |
| `--menu-rule` | `--hairline`, read in place | The light phone menu's row dividers (8.2.0) |
| `--menu-badge-bg`, `--menu-badge-ink`, `--menu-cta-bg`, `--menu-cta-ink` | `--primary-fill`, `--on-primary` (as 8.0.0 drew them), read in place | The phone menu's badge and call to action. A theme whose sheet's ground equals its primary sets them to `--on-primary` and `--primary-ink`, or they vanish into the sheet (8.1.0) |
| `--link-columns-min` | `170px` | The least a `LinkColumns` column narrows to (8.1.0) |
| `--field-label-font`, `--field-label-size`, `--field-label-weight`, `--field-label-case`, `--field-label-tracking`, `--field-label-color` | `--font-mono` read in place, `0.74rem`, the inherited weight read in place, `uppercase`, `0.1em`, `--neutral-600` read in place | Every form field's label: `.field label`, and the labels of `AddressSearch` and `MultiSelect`; a design with labels in the body face sets `--field-label-font: var(--font-sans)`, `--field-label-case: none`, `--field-label-tracking: 0`, and its own size and weight (8.5.0) |
| `--field-border` | `--neutral-200`, read in place | Every form field's border, the pickers' and their lists' included (8.5.0) |
| `--section-space`, `--block-gap`, `--card-min` | `clamp(56px, 9vw, 120px)`, `44px`, `240px` | The section rhythm where no `base.css` sets it (an app importing `components.css` alone); with `base.css` the settings under [Density](#density) win |

The review carousel's dots and a ghost button's outline already read neutral tokens a theme sets, so they take none of their own: the dots `--neutral-200` (hover `--neutral-500`, current `--ink`), the outline `--neutral-300` (hover `--ink`). Three more read a fallback in place: `--star-fill` colors every filled star (`StarRating`'s, which falls back to the text color, and the footer's rating, which falls back to `--review-gold`), `--font-condensed` sets a `CalloutPanel` title's face, and `--neutral-700` colors prose bodies (`ProseBlocks`, the blog's index and post), falling back to `--ink`. The tone palette (`--tone-good` and its kin) is declared with the defaults and described under [Page Components](#page-components).

`@atelic-action/ui/tokens` carries the palette and the font stacks with no React import, so a build script or a plain text renderer can read them. `toThemeCSS(palette)` writes the palette out as the site token declarations (`--surface`, `--surface-dark`, `--card`, `--ink`, `--primary`), and `themeTokenMap` exposes which palette key each token takes.

Every color the palette sets words in reads 4.5 to 1 or better on both the paper and the ground, which `tst/tokens/tokens.test.ts` holds (8.0.0). `faint` departs from the jq's value on purpose: the brand kit's Faint, `#6e6757`, where the jq has `#8a8272`, which reads 3.38 to 1 on the ground at the 11px a masthead's title and meta are set in; the new value reads 4.99 on the ground and 5.43 on paper. `accent` (`#FC4A1A`) is the mark and never small words (3.31 on paper, 3.04 on the ground); words take `accentInk`, the brand kit's Orange Ink, `#B8300B` (5.86 and 5.38). `accentInk` is optional: for a palette that names only an accent, `accentInk(palette)` darkens the accent toward black one step at a time until it reads 4.5 on both grounds (`#FC4A1A` alone gives `#C73A15`), keeps an accent that already passes as it is, and falls back to the ink for a color that is not a hex. `contrastRatio(a, b)` is the WCAG ratio it measures by. No piece sets white words on the accent; a runner that does uses the brand's fill, `#D63A10`, not the accent. The palette carries three more optional keys beyond the jq's eight: `up` (`#2F7A4B`, a calm green, 5.07 on paper) and `down` (`#B23A2E`, a calm red kept well apart from the orange accent, 5.74), the colors a record's aside or a change wears by its direction, and `warm` (`#966319`, an amber between `up` and the accent, darkened from the jq's `#B7791F`, which read 3.52, to 4.96 on paper and 4.55 on the ground) for a record's aside that is cooling but not cold. They are optional so a client palette written before 0.5.0 still compiles, and a palette without them borrows the Atelic values. None maps to a site token.

## Page Components

The blocks a page composes, each styled in `styles/components.css` inside the `atelic-ui` layer, so a site's own unlayered rule resizes or recolors any of them. They were cut from a client's baseline writeup on 2026-10-02 (ATE-600), which is the worked example of them on one page.

| Component | What it is | Notes |
|---|---|---|
| `Checklist` | A short list of checks, each passed or failed | Two columns when there is room, one on a phone. `passLabel` and `failLabel` name the icons for a screen reader |
| `IconList` | A list whose bullets are icons | `icon` and `tone` on the list set every bullet; an item's own override them. The bullet is decoration, so a screen reader hears only the items. A dot when no icon is set; the text's color when no tone is |
| `ReportCard` | A name, a grade, and one line on it per row, in labeled groups, each row's parts centered on it | A row with `href` is a link from edge to edge with a chevron at its end; a link inside `line` still goes where it points. `before` sets the earlier grade faded beside the grade; no `grade` draws a dash read as not graded. `legend` explains the letters beside the `title`, or under the card with `legendAt="foot"`; `labels` sets the screen reader's words. The grade is `GradeChip` |
| `Rank` | A figure with its badge, for a table cell | `figure` is the rank, the place, or a dash for none; `tone` colors the badge and `meaning` names it for a screen reader; `href` links the figure, in a new tab with `newTab`. The figure's slot is a fixed width, so the badges line up down a column |
| `DataTable` | A table whose first column names each row, sortable by any column marked `sortable` | A click on a heading sorts on a wide screen, and a table wider than the page scrolls inside its own box, which takes a tab stop and the name `ariaLabel` (default "Table") only while it scrolls. On a phone each row stacks, every fact wearing its column's label, and a dropdown sorts. A cell is a node, or `{ display, sort }` when what it shows is not what it sorts by; a formatted number in a string (`"$12,047"`, `"0.24%"`) sorts as a number. It renders in `defaultSort` on the server. Every other row sits on a tinted ground; `striped={false}` turns that off. A column marked `fit` hugs its content, for a swatch or a mark beside a figure. A column with a `hint` draws a `Hint` beside its heading, before the label when the column is right aligned; on a phone the heading row is hidden, so the hint is too. A cell given as `null` or `undefined`, or left out of a short row, is empty: it draws a short gray rule, the `.data-table-empty` class, which a screen reader hears as "None" or as the column's `emptyLabel`, and it sorts last whichever way the column runs. The first cell names the row, so it is never drawn as empty; give every row a name. A typed string is always content, a dash included, so type nothing for an empty cell. A document may wear `.data-table-empty` for its own neutral mark, so every empty cell reads the same |
| `Hint` | An info icon that opens a short explainer beside a word | Opens on hover or focus, stays open on a click or a tap, closes on Escape or a tap elsewhere. The bubble opens from the icon's left edge and slides left when it would run off the screen. `side="before"` puts the icon before its word, for a right aligned heading. `label` is what a screen reader calls the button; the bubble is its description. Print hides it |
| `StatRow` | A row of large figures, each over what it counts and its `period`. `variant="quiet"` is the glance row for a working page: a light figure in the text color over a small capitalized label, hairlines between; `unit` sets a figure's unit small beside it | `trend` draws an arrow before a figure that is itself a change. `deltas` list comparisons beneath: an arrow, how far, against what (`basis`), and the earlier figure (`was`), each in its own tone, since a spend falling and a cost falling read differently |
| `Callout` | One finding: an icon in its tone beside the title, the explainer under it | `variant="box"` sets it apart on a tinted ground, for something missing or owed |
| `Disclosure` | A section the reader opens and closes, in two forms chosen by whether `open` is passed | Controlled (`open` and `onToggle`), it is an app's card: the caller remembers what was folded, a closed body is not rendered, the label is the toggle, `meta` (a count, a flag) sits beside it outside its name, and `headingLevel` makes the label a real heading. Uncontrolled, it is a document's fold: a native `details` with a `summary` line that carries the point and `defaultOpen`, so it works before any script loads, find in page opens it, and it prints open. `Collapsible`, the fold's old name, was folded in at 0.18.0 |
| `Tabs` | Panels behind a row of tabs, on Radix for the arrow keys and the roles | Each tab's `id` names it in the URL: the tab is `<id>-tab`, its panel `<id>-panel`. A hash of `#<id>` opens the tab and scrolls to the tab row, and a hash naming any element inside a panel opens that panel and scrolls to it, on load, on a hash change, and on a click of a link to the hash already in the address bar, so a link in one panel lands on a finding in another. Every panel stays in the page: the inactive ones carry `hidden="until-found"`, so find in page reveals one and the tab follows. `defaultId` picks the first tab open; `selectedId` and `onSelect` hold it in the caller; either one naming no tab opens the first. Radix Tabs is a dependency of the package, so a site installs nothing for it. `ariaLabel` names the list and has no default. On paper the list is hidden and every panel prints under its label, as a heading at `headingLevel` (2 by default) |
| `StackedBar` | One bar split into the parts of a whole, with a key | A part of zero is keyed and not drawn |
| `ColumnChart` | A bar a period, the periods in groups that carry a label and a total | Months in quarters is the case it was cut for: a quarter reads against the one before it and the same one a year earlier. A bar given its own tone, apart from its group's, is named with the legend's words for that tone, so the mark is never told by color alone; with no bars the chart shows and says `emptyLabel` ("No data to show") |
| `ThresholdScale` | Zones on a scale and a pin for each reading | For a number judged against lines, like a load time against good and poor. Each track is named by its reading, its figure, and the zone it falls in ("Home page: 4.1 s, Poor"); a reading on a line belongs to the zone the line closes |
| `StarRating` | A row of stars showing a rating in half star steps, and taking one when given `onChange` | Each star is two hit areas, plain elements marked `data-rating`; picking the current rating clears it. Editable, it is one slider to a pointer, a keyboard, and a screen reader, holding no control of its own; read only, a picture named by the rating. `fillColor` and `outlineColor` take any CSS color, `size` and `max` set the star and the scale |

**StarRating outside a site.** It is the one component that does not sit under `.atelic-ui` or read a theme token: its styles are in `styles/star-rating.css`, and its two colors are the `--star-fill` and `--star-outline` custom properties, falling back to the text color and a faint tint of it. An app that installs the package for this component alone imports that one sheet, not `components.css`.

**A part's own color.** `StackedBar` takes a `color` on a segment, any CSS color, for parts that are not good or bad (the protein, carbs, and fat of a meal), and it wins over `tone`. `showKey={false}` draws the bar alone for a page that keys the parts its own way; the bar keeps its spoken summary.

**Tones.** `good`, `warn`, `bad`, `info`, and `muted` are the one palette the package carries, because good, a warning, and broken read green, amber, and red whatever the brand is. A component sets `data-tone`, and `--tone`, `--tone-fill`, and `--tone-bg` follow for whatever sits inside. A site's theme may restate `--tone-good` and the rest on `.atelic-ui`; `info` and `muted` come from the theme's own primary and neutral tokens.

## In an App

The page components also work in an app that has its own base styles (Tailwind, shadcn) and wears none of the site chrome. Three things make that so (0.10.0):

1. **The same root class, without the site base.** Every rule in `styles/components.css` answers to `.atelic-ui`. An app imports no `base.css`, so the class brings no resets with it, and an app puts the class on the region that holds a package component and nothing else in it restyles. Prefer a region to `body`: the components use plain class names (`.stat .num`, `.callout`, `.note`), and an app with markup of its own under those names would have a page wide scope reach it. `body` is right only for an app that has checked it has none, and it is the one way to cover a component rendered in a portal.
2. **The app imports one sheet**, `@atelic-action/ui/styles/components.css`, and neither `base.css` nor `chrome.css`. An app's own unlayered CSS always wins over the package. With Tailwind the app **must declare the layer order before any stylesheet loads**, in a `<style>` in the `<head>` of its `index.html`: `@layer properties, theme, base, atelic-ui, components, utilities;`. A layer ranks by where it is first named, and a bundler is free to name the package's first, which ranks it below Tailwind's reset; the reset then strips the padding, margins, and borders off every component, while colors and type still look right, so it is easy to miss. Named there, the package ranks above the reset and below the app's utilities.
3. **The app maps its tokens** onto the ones the components read, in its own stylesheet on the same scope:

| Token | What it colors |
|---|---|
| `--ink`, `--ink-soft` | Text and quieter text |
| `--neutral-100`, `--neutral-200`, `--neutral-500` | Hairlines, tracks, and captions |
| `--surface-alt` | The quiet ground behind a muted tone |
| `--ui-primary` (falls back to `--primary`), `--primary-bright`, `--primary-tint` | The accent, its brighter fill, and its tint |
| `--ui-card` (falls back to `--card`) | A raised surface |
| `--font-sans`, `--font-mono`, `--radius-sm` | Type and the small radius |
| `--tone-good`, `--tone-warn`, `--tone-bad`, each with `-fill` and `-bg` | Optional: the package defines these, and a dark theme restates them |

`--ui-primary` and `--ui-card` exist because an app's own `--primary` and `--card` may hold something else: shadcn keeps bare HSL channels there, which are not a color on their own. A site sets neither and nothing changes.

```css
/* app.css */
.atelic-ui {
	--ink: hsl(var(--foreground));
	--ink-soft: hsl(var(--muted-foreground));
	--neutral-500: hsl(var(--muted-foreground));
	--neutral-200: hsl(var(--border));
	--neutral-100: hsl(var(--muted));
	--surface-alt: hsl(var(--muted));
	--ui-primary: hsl(var(--brand));
	--primary-bright: hsl(var(--brand));
	--primary-tint: color-mix(in srgb, hsl(var(--brand)) 12%, transparent);
	--ui-card: hsl(var(--card));
}
```

**Unit tests.** The package ships TSX source, and Vitest compiles it like any other module. A file under `node_modules` has no tsconfig of its own to name a JSX runtime, so a test that renders a package component fails with `React is not defined` until the test config says which to use: `esbuild: { jsx: "automatic" }` at the top level of `vitest.config.ts`. The app build needs nothing, since the React plugin sets it for Vite.

`StarRating` needs none of this: its sheet is unscoped and reads no token. The chrome (`SiteHeader`, `Footer`, and the rest) and `NotFound` remain site shaped and are not meant for a signed in app.

## The App Shell

`@atelic-action/ui/app` is the shell every signed in Atelic app is built on, moved here from `template-application`'s `src/shared` and its two stores in 1.0.0: the mobile first frame (the desktop rail, the tab bar, the menu sheet), the `AppPage` scaffold and its toolbar, the auth guard, Google sign in with a JWT and refresh session against a JSON api, the transport and query layers, the auth and units stores, and the helpers the template carried (dates, phrasing, units, search, envelopes). `@atelic-action/ui/app/ui` is the shadcn kit the shell is set in. Unlike the rest of the package the shell imports TanStack Router and is styled with Tailwind, since an app is built on both. [ui.atelic.me/app](https://ui.atelic.me/app) shows all of it running a made up bakery.

### The Provider

The shell reads nothing from the app's files. The app hands it its facts once, through `AppProvider`, rendered around the router so the stores are hydrated before the first route loads:

```tsx
// src/main.tsx
import { AppProvider, ErrorFallback } from "@atelic-action/ui/app";
import { appConfig } from "@/app/config";
import { navItems } from "@/app/nav";

createRoot(rootElement).render(
	<StrictMode>
		<Sentry.ErrorBoundary
			fallback={(props) => <ErrorFallback {...props} showDetails={import.meta.env.DEV} />}
		>
			<AppProvider config={appConfig} nav={navItems}>
				<RouterProvider router={router} />
			</AppProvider>
		</Sentry.ErrorBoundary>
	</StrictMode>,
);

// src/routes/__root.tsx
function RootLayout() {
	return (
		<AuthGuard>
			<AppLayout>
				<Outlet />
			</AppLayout>
		</AuthGuard>
	);
}
```

| Prop | What it is |
|---|---|
| `config` | An `AppConfig`: `name` (aria labels), `mark` (the wordmark), `storagePrefix` (every storage key and cookie), `publicRoutes` (exact paths a signed out visitor may load), `publicPages` (prefix patterns ending in `/*`, rendered in the public chrome), `apiBaseURL`, which the app resolves itself (`env.VITE_API_BASE_URL ?? "https://api.example.com"`), since the package never reads `import.meta.env`, and the optional `profileHref` |
| `nav` | The `NavItem[]` every nav surface reads, sub pages as `children`; the one place a destination is declared |
| `queryClient` | Optional; defaults to the shell's, whose mutation cache raises `meta.toast` |
| `toaster` | Optional; sonner's `Toaster` at the top right by default, `false` for none |

Inside it, `useAppConfig()` and `useNav()` read the two facts, and `useUser()` the signed in user. The transport and the stores run outside React, so the provider also records the config where they read it; code that calls the api before the provider first renders calls `configureApp(appConfig)` itself. `AppConfigProvider` is the config and nav alone, for a test that mounts one surface.

**The user type.** The shell knows the fields it reads (`AppUser`: the name, the avatar, the username, the unit preferences). An app registers its own user once, and `useUser`, `useAuthStore`, and `session.me` hand it back typed in full:

```ts
// src/app/types.ts
declare module "@atelic-action/ui/app" {
	interface Register {
		user: User;
	}
}
```

**The stores moved with the shell**, because the transport cannot work without the auth store and the user context keeps the units store in step with the account. Both persist under the app's prefix exactly as before (`<storagePrefix>-auth`, `<storagePrefix>-units`), so a signed in browser stays signed in across the move. An app's own stores (`cookingStore` in pinole) stay in the app.

### The Stylesheet

The shell is Tailwind and shadcn, shipped as source like everything else here. `@atelic-action/ui/styles/app.css` carries the shadcn token mapping (`@theme`), the default light and dark token values, the base layer, and the `ap-*` scaffold; the app imports it straight after Tailwind, in its own Tailwind entry, and overrides any value in its own theme after it:

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "@atelic-action/ui/styles/app.css";

@plugin "tailwindcss-animate";
@plugin "@tailwindcss/typography";

/* The app's @font-face rules (it serves the files), then its own tokens. */
```

The import has to come before any other rule, or it is dropped without a word: the build passes and the shell renders unstyled. Tailwind never scans `node_modules`, so the sheet carries `@source "../app";`, which points Tailwind at the shell's components relative to the sheet, and the app adds nothing. An app that keeps its own tokens and does not import the sheet adds the equivalent line from its own stylesheet instead:

```css
@source "../../node_modules/@atelic-action/ui/src/app";
```

Proven on a copy of pinole-app thinned onto a packed tarball: with the line or the import, the built CSS holds every utility the shell uses; with neither, 165 of them are missing.

The light theme's words pass 4.5 to 1 on what they sit on, and `tst/app/app-contrast.test.ts` reads the sheet to hold it there (8.0.0). Two stock shadcn values fell short and moved: `--destructive` is `0 72.2% 50.6%` (`#dc2626`; 4.63 to 1 under `--destructive-foreground`, 4.83 as words on a card, 4.66 on the ground) and `--muted-foreground` is `240 3.6% 43.5%` (`#6b6b73`; 4.81 on `--muted` and `--accent`, the grey a highlighted row wears). `--color-destructive-hover` is the fill mixed 85% with black, for a destructive fill's hover and press and for destructive words on the grey while pressed, so hovering never lightens the fill under its words. The provider's sonner toaster shows rich colors, whose stock light tones read 4.25 (success), 4.34 (error), 4.35 (info), and 3.07 (warning); the sheet darkens each tone's words through sonner's own variables, on a selector one element more specific than sonner's so the load order does not matter: success `hsl(140, 100%, 24%)` 5.22, info `hsl(210, 92%, 40%)` 5.28, warning `hsl(31, 92%, 32%)` 5.52, error `hsl(360, 100%, 41%)` 5.11. Destructive words read `--color-destructive-ink`, which falls back to `--destructive`, so the light theme's one red serves both; the dark theme sets `--destructive-ink` to `0 90.6% 70.8%` (red 400, `#f87171`, 6.48 to 1 on its card, 5.62 on the grey highlight), since its fill, `0 62.8% 30.6%`, read 1.79 to 1 as words on the card (8.1.0). The rest of the dark theme's values are shadcn's and are not yet checked. The sheet sits outside the `atelic-ui` layer on purpose: its tokens and resets are in Tailwind's base layer and the scaffold is unlayered, as the template carried them, so the shell renders as it did.

### The Kit

`@atelic-action/ui/app/ui` exports the shadcn components the template carried: `Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Badge`, `BadgeList`, `Button`, `Callout`, `Card`, `Checkbox`, `ClearButton`, `Command`, `CountryDropdown`, `Dialog`, `DropdownMenu`, `Form`, `Input`, `Label`, `OptionSelect`, `Pagination`, `Popover`, `Progress`, `SearchInput`, `Select`, `Separator`, `Sheet`, `Slider`, `Switch`, `Textarea`, and `Tooltip`, each with its parts. A new kit component lands here, not in an app, and it is written by hand into `src/app/ui/` and exported from its `index.ts`: the package carries no `components.json`, because `bunx shadcn add` writes its imports through the `@/` aliases the package never uses (consumers resolve none of ours), so a component taken from the shadcn registry has its imports made relative before it lands. The main entry adds the frame and its pieces (`AppLayout`, `AppPage`, `AppPageToolbar`, `Breadcrumbs`, `SectionCards`, `ActionButton`, `FormActionButtons`, `PageSkeleton`, `PageError`, `AuthGuard`, `ErrorFallback`, `GoogleGlyph`).

**What a reader and a keyboard get (8.0.0).** `CountryDropdown` shows each country by its name alone, with nothing fetched. The dropdown's popover is named (`ariaLabel`, "Countries" by default) and its search sits above the list, never inside the listbox. Elsewhere in the kit: `Progress` reports its `value` (`aria-valuenow`) against its `max`, and with no value is indeterminate; `Slider` names each thumb, the reachable `slider`, with its own `aria-label` or `aria-labelledby` and a range's thumbs with `thumbLabels`, and draws a thumb per value; `CommandDialog` takes `title` ("Commands" by default, visually hidden unless `showTitle`) and hands focus back to what opened it; `CommandSeparator` has no role and `CommandEmpty` is one disabled option, so the list holds only options and groups; `Alert` announces only with `announce` (`"assertive"` is `role="alert"`, `"polite"` a status), and `AlertTitle` is a paragraph unless given a heading `level`; `Form` describes a field only by the description and message on the page; `Pagination` shows Previous; `SearchInput` and the toolbar's search keep focus in the box when cleared by keyboard; the `OptionSelect` and `Select` list is the trigger's width, its border inside it. In the frame: `PageSkeleton` is `aria-busy` with visually hidden words (`label`, "Loading"), its pulse stopped under reduced motion; `PageError` is an alert, announced once as it appears, so render it when the error happens; `ErrorFallback`'s details box takes focus to scroll and shrinks below a long line on a phone; a collapsed rail link is named by its label, the user menu by the name or the initials it shows, and a toolbar action by its words and its `ago` time (`ariaLabel` is for an action with no words, and keeps the time).

**The toolbar's notice.** `AppPageToolbar`'s `notice` sits beside the row on a desktop (1024 and up), where `.ap-tools` is one wrapping row: after the search and the actions, before the filters. Below 1024, where the toolbar stacks, it is a line of its own under the search and the actions and above the filters. It is a plain block, never a live region (Component Rule 14).

The app's stack is optional peer dependencies, so a marketing site installs none of it: TanStack Router and Query, Tailwind, `sonner`, `zustand`, `zod`, `react-hook-form`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, the Radix primitives the kit uses, and `country-data-list`, at the ranges `template-application` already pins. An app that imports the shell has them all already.

### Thinning an App onto It

Delete `src/shared/`, `src/stores/authStore.ts`, `src/stores/unitsStore.ts`, and their tests (`tst/shared/`, `tst/stores/authStore.test.ts`, `tst/stores/unitsStore.test.ts`), then repoint every import:

| Old Path | New Path |
|---|---|
| `@/shared/components/layout` and every file in it | `@atelic-action/ui/app` |
| `@/shared/components/ui/<name>` | `@atelic-action/ui/app/ui` |
| `@/shared/components/AuthGuard`, `ErrorFallback`, `GoogleGlyph` | `@atelic-action/ui/app` |
| `@/shared/context/SidebarContext`, `@/shared/context/UserContext` | `@atelic-action/ui/app` |
| `@/shared/hooks/useDebounce`, `useIsDesktop`, `useWakeLock` | `@atelic-action/ui/app` |
| `@/shared/lib/<name>`, every file but `env` | `@atelic-action/ui/app` |
| `@/shared/lib/env` | The app's own `src/app/env.ts`: `export const env = parseEnv(import.meta.env);` |
| `@/shared/types`, `@/shared/types/query` | `@atelic-action/ui/app` |
| `@/stores/authStore`, `@/stores/unitsStore` | `@atelic-action/ui/app` |

Then the handful of edits the seam asks for:

1. **`src/app/config.ts`** resolves `apiBaseURL` itself (`env.VITE_API_BASE_URL ?? "https://api.example.com"`).
2. **`src/app/types.ts`** registers its `User` (above).
3. **`src/main.tsx`** wraps the router in `AppProvider`, and passes `showDetails={import.meta.env.DEV}` to `ErrorFallback`, which no longer reads the environment.
4. **`src/routes/__root.tsx`** keeps only `AuthGuard` and `AppLayout` around the `Outlet`; the query client, the rail state, the user, and the toaster are the provider's.
5. **`src/styles/globals.css`** keeps Tailwind, its plugins, its fonts, and any token of its own, and imports `app.css` in place of the `@theme` block, the token sets, the base layer, and the `ap-*` scaffold.
6. **`activeSection(pathname)`** takes the items now: `activeSection(pathname, navItems)`.
7. **`components.json`** no longer has a `src/shared` to add to; a new kit component is written by hand in the package's `src/app/ui/` (see [The Kit](#the-kit)).

**Tests.** Mocking `@atelic-action/ui/app` replaces what the app's own code imports from it, and nothing the shell imports from itself. A component that calls `session.me` sees a mock written over the entry (`vi.mock(import("@atelic-action/ui/app"), async (original) => ({ ...(await original()), session: mockSession }))`), but the transport reads the auth store, the token refresh, and the config through its own relative imports, so a mocked `useAuthStore` or `ensureValidToken` never reaches `apiFetch`. A test that runs through the transport (a feature's api module, a query hook) therefore drives the real shell and mocks only `fetch`:

```ts
import { configureApp, useAuthStore } from "@atelic-action/ui/app";
import { appConfig } from "@/app/config";

beforeEach(() => {
	configureApp(appConfig);
	useAuthStore.setState({
		token: "test-token",
		refreshToken: "test-refresh",
		expiresAt: Date.now() + 60 * 60 * 1000,
		user: testUser, // the app's own fixture user
		isAuthenticated: true,
	});
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [] })));
});
```

An `expiresAt` an hour out keeps the refresh path quiet; one inside five minutes sends the transport to the refresh endpoint first, through the same mocked `fetch`.

## Storybook

Every component's states live as stories, and every story runs as a test in a real browser. The built Storybook is served at [ui.atelic.me](https://ui.atelic.me) for the people building with the package: `vercel.json` builds it with `bun run storybook:build` and serves `storybook-static/`, and it is never search inventory, so `stories/public/robots.txt` disallows everything and both of its heads (`.storybook/manager-head.html` and `preview-head.html`) carry `noindex`. The old `/app` and `/app.html` paths, where the app shell used to be shown, redirect to its stories.

```bash
bun run storybook        # the dev server on the repo's own source, at localhost:6006
bun run storybook:build  # the static site, written to storybook-static/ (gitignored)
bun run test:stories     # every story as a test, in headless Chromium
bun run test:run         # the unit tests in tst/, on jsdom, as before
```

The stories live in `stories/`, outside `src/`, one file per component in a folder mirroring it (`stories/chrome/SiteHeader.stories.tsx`), and import the components from `src/` by relative path, so they always show the code in the repo. The configuration is `.storybook/`. Neither publishes: the package's `files` names `src`, `dist`, and `bin` alone. **[stories/README.md](stories/README.md) is how a story is written**: the names, the states a component needs, what a `play` function covers, how a bug a story exposes is marked and logged (one findings file per writer group, in `stories/findings/`), which files each group of writers owns, the components still owed, and the fixtures.

**The test run.** `vitest.config.ts` holds two projects. `unit` is the jsdom suite in `tst/`, unchanged, and `bun run test:run` runs it alone. `storybook` runs every story through `@storybook/addon-vitest` in Vitest's browser mode on Playwright's Chromium, headless: the story renders, its `play` function runs, and axe checks the page after it, failing the story on any violation (`a11y: { test: "error" }`). A story pins its width (`phone` 390, `tablet` 820, `desktop` 1280, `narrowDesktop` 1180, `smallDesktop` 900) and the run sizes the page to it, so layout is asserted as geometry. A marker for a known bug fails the run the day the bug is gone, accessibility markers included ([stories/README.md](stories/README.md#accessibility-and-bugs)). Playwright's Chromium is installed once per machine with `bunx playwright install chromium`; CI installs it with its system libraries and caches it.

**The frame.** A story is mounted the way its consumer mounts the component, chosen by the first segment of its title. Site pieces render inside a `.atelic-ui` root with every package sheet in a site's import order and the practice's theme last (`.storybook/theme.css`). `App/` stories run inside `AppProvider` with a fixture app under a memory router, with the shell's Tailwind sheet mounted only while the story shows, so its reset never reaches a site story. `Email/` stories render their rows in the email theme on a 680 column, with no sheet at all.

**The layer order.** `.storybook/preview-head.html` names the layers before any sheet loads (`properties, theme, base, atelic-ui, components, utilities`), the line an app's `index.html` carries, since Storybook injects sheets in whatever order its modules load. `stories/foundations/CascadeLayers.stories.tsx` proves it: the package outranks Tailwind's reset loaded after it, an app's utilities outrank the package, and an unlayered rule wins with less specificity.

**The toolbar.** Density sets `data-density` on the story's root (default, compact, comfortable; see [Density](#density)), and the viewport menu offers the same widths the tests pin.

## Releasing

1. Bump `version` in `package.json` and merge it to `main`: patch for a fix, minor for a new component or prop, major for a breaking prop or class rename.
2. Tag the merged commit `vX.Y.Z` with the same version and push the tag:

   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. The Publish workflow checks that the tag matches the version, runs the gates, and publishes to npm with provenance. It authenticates through npm trusted publishing (the package's Trusted Publisher names this repo and `publish.yml`, and its allowed actions must permit direct `npm publish`, since a configuration created after 2026-09-03 allows only `npm stage publish` by default), so no token is stored, and it needs npm 11.5.1 or later, which Node 24 ships.
