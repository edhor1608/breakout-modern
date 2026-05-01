# Contributing

Thanks for helping improve Breakout.

## Development

Use Bun for all local work.

```sh
bun install
bun run dev
```

Before opening a pull request, run:

```sh
bun run check
bun run test
bun run build
```

Use `bun run test:e2e` for changes that touch gameplay, rendering, controls, layout, or deployment boot behavior.

## Pull Requests

Keep changes focused and small. Explain what changed, why it changed, and how it was verified.

For compatibility-sensitive work, update the relevant docs under `docs/`. Feature branches should preserve useful branch knowledge, decisions, and tradeoffs in project documentation.

## Compatibility

The project intentionally preserves legacy behavior where practical:

- 800x600 logical playfield
- compatible `.map` files
- original asset dimensions
- local highscore ordering semantics
- stable keyboard controls

Changes that intentionally alter gameplay behavior should call that out clearly in the pull request.
