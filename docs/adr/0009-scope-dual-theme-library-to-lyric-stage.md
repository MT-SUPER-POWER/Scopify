# Scope the Dual Theme Library to the Lyric Stage

Scopify stores a JSON-serializable Theme Library in the persisted Lyric Stage Zustand store. Each theme contains a matched light and dark color variant, and the selected theme plus selected variant are renderer state for the Lyric Stage only. The initial library contains the seven built-in pairs derived from the existing visualizer presets.

Built-in themes are ordinary editable library entries. Their immutable seed definitions remain in code so an individual built-in theme, or the complete built-in collection, can be restored after edits or deletion. User-created and imported themes use generated identifiers and are added without replacing an existing theme.

## Consequences

- The Lyric Stage can switch light and dark variants without changing Scopify's primary application appearance.
- The Visual Settings panel and the Theme Library dialog are the two views over one persisted source of truth.
- Existing single-preset settings migrate to their matching dual theme; the former custom color setting migrates into a retained custom theme.
- Theme JSON exports and imports are scoped to one Theme Library entry, avoiding accidental replacement of a whole local library.
- Promoting this library to an application-wide appearance system remains a separate proposal because it would affect non-Folia UI, lifecycle, and accessibility contracts.
