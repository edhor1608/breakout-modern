# Decisions Log

## ADR 0001: Port Breakout To A Web-First TypeScript Runtime

### Context

The existing Breakout project is roughly ten years old and was built as a Java/Slick2D/LWJGL university project. It depends on vendored jars, native LWJGL libraries, Eclipse metadata, and Java object serialization for highscores. The goal is to give the project a maintained 2026 stack while keeping old usage patterns and content as compatible as practical.

### Decision

Build the modern version as a web-first application using TypeScript, Vite, and PixiJS. Keep the legacy Java project in the repository as a reference until the web version reaches feature parity. Preserve compatibility with existing map files and reusable assets. Use browser-native persistence for new highscores, with explicit documentation for any legacy serialized highscore migration limits.

### Rationale

TypeScript and Vite provide a small, fast, maintainable development workflow without native runtime dependencies. PixiJS fits the game because Breakout is a 2D sprite-and-collision experience, and it avoids hand-building a rendering layer on raw canvas. A web-first target makes the game easier to share with former users and easier to deploy than a desktop-only port.

### Consequences

The project will temporarily contain both legacy Java code and the new web implementation. Some behavior will need to be specified from the legacy code before it is ported, especially collision details, item effects, and highscore sorting. Java serialized highscore files cannot be consumed directly in normal browser storage, so compatibility means preserving the highscore semantics, not necessarily reading `.hsc` files client-side.
