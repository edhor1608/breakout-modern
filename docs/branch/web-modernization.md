# Web Modernization Branch Notes

## Problem

This branch modernizes the old university Breakout project into a web-first game while preserving the parts that made the original usable: existing maps, assets, controls, scoring expectations, and the general game flow. The legacy Java/Slick2D/LWJGL implementation remains the behavioral reference until the new implementation has compatibility tests around the important contracts.

## Current State

The repository is an Eclipse-era Java project with vendored `slick.jar`, `eea.jar`, LWJGL 2 jars, native libraries, and assets stored directly under `images/`, `sounds/`, `font/`, and `maps/`. Main non-test Java sources still compile with the vendored jars, but the project has no portable package-manager-based build.

The game uses a fixed 800 by 600 playfield, a 10 by 16 comma-separated map format, image and sound paths from `GameParameters`, and serialized Java highscore files. Gameplay state is heavily static and coupled to Slick/EEA entities, so the modernization should avoid modifying the legacy runtime in place until a replacement is ready.

## What Worked

The old map files are simple text and can be reused directly in a web build. The image and sound assets are already in browser-friendly project folders, though the final app may copy or serve them from a web `public/` directory. The old constants provide a good first compatibility checklist.

## What Did Not Work

The original highscore files are Java object serialization and are not directly usable in a browser. The old runtime depends on native LWJGL libraries and an Eclipse classpath, which is the main reason to replace the technology stack rather than incrementally patch it.

## Decisions

Use TypeScript, Vite, and PixiJS for the modern implementation. Keep the legacy code as a reference during the port. Preserve map and asset compatibility first; replace Java highscore persistence with a browser-native format while documenting import/export limitations.

## Next Steps

Create the Vite/PixiJS app beside the legacy source with the fewest moving parts. Start with pure TypeScript modules for map parsing, score sorting, and game constants so compatibility tests can run before rendering work begins. Then wire PixiJS rendering and input around those tested modules.
