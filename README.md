# Breakout

A web-first TypeScript and PixiJS port of the original FoP Breakout university project.

The goal is preservation through modernization: keep the old maps, assets, controls, and game idea, while replacing the native Java/LWJGL runtime with a small browser app.

## Features

- PixiJS renderer with an 800x600 legacy logical playfield
- Compatible 10x16 comma-separated `.map` files
- Original image, font, sound, and map assets
- Single-player and two-stick mode
- Browser-local highscores with the legacy sorting rules
- TypeScript compatibility tests for maps and highscores

## Development

```sh
bun install
bun run dev
```

Useful checks:

```sh
bun run test
bun run build
```

## Compatibility

Legacy Java `.hsc` highscore files are not loaded in-browser. The web version preserves the highscore behavior and stores new entries as JSON in localStorage.
