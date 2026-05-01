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

## ADR 0002: Render The Paddle As The Collision Capsule

Status: Superseded by ADR 0003.

### Context

The modern game uses capsule collision for the paddle. The first visual pass masked the legacy rectangular stick texture into a rounded rectangle, but the detailed brick texture still suggested a flatter rectangular surface than the collision model actually uses. That made the edges harder to read while playing.

### Decision

Keep the current paddle physics unchanged and render the paddle as a PixiJS capsule derived from the same width and height used by collision. The outer shape uses `height / 2` as the radius, matching the capsule calculation in `circleCapsuleCollision`. Decoration stays inside that boundary.

### Rationale

This fixes the player-facing mismatch without changing ball behavior, bounce angles, item effects, or legacy dimensions. The normal, bigger, and smaller paddles still use the old asset dimensions, so item balance and map compatibility stay intact.

### Consequences

The paddle no longer displays the original stick bitmap directly. The original image dimensions remain the source of truth for width and height, but the visible stick is generated with Pixi graphics so it can match the active physics shape exactly.

## ADR 0003: Render The Paddle As A Bounce-Angle Surface

Status: Amended by ADR 0004.

### Context

The paddle contact gate uses a capsule, but the gameplay feel does not behave like a rectangular wall or a simple rounded collider. When the ball hits the paddle, the incoming angle is ignored and horizontal hit position chooses the outgoing angle. The previous visual still made the stick read mostly like a rounded brick.

### Decision

Keep the existing physics unchanged and draw the paddle as a curved deflector surface derived from the bounce-angle formula. The curve uses `dy/dx = tan(outgoingAngle / 2)`, so its local visual slope communicates the left, center, and right outgoing directions.

### Rationale

This matches what players need to understand during play: landing on the left side sends the ball left, landing near the center sends it upward, and landing on the right side sends it right. The old asset dimensions still define normal, bigger, and smaller paddle sizes, preserving item balance.

### Consequences

The paddle visual now represents the control law rather than the contact capsule. This is intentionally player-facing: the collision gate remains unchanged, but the stick shape explains the bounce behavior more honestly.

## ADR 0004: Use The Bounce Surface For Paddle Contact Height

### Context

Rendering the paddle as a bounce-angle curve fixed the direction affordance, but it created a new mismatch. The visible surface dropped lower near the edges while collision still used the older flat or capsule gate, so edge hits could trigger before the ball visually reached the stick.

### Decision

Use the same bounce surface curve for paddle contact. The ball now collides against the rendered curve, and post-hit separation places the ball on that local surface height. The outgoing angle formula remains unchanged.

### Rationale

This keeps the player-facing model coherent: the visible curve explains both where the ball touches and where it will go. It also keeps the implementation simple by making the curve formula a shared physics helper used by rendering and collision.

### Consequences

Paddle edge hits occur slightly later than they did with the flat contact gate because the visible surface is lower at the edges. This is an intentional physics adjustment to align contact with the visual shape.

## ADR 0005: Add Optional Arcade Spin Physics

### Context

The current paddle model gives direct angle control from hit position. A richer modern option can let paddle movement and ball rotation influence later flight and bounces, but enabling that by default would alter the stable legacy-style feel.

### Decision

Add spin physics behind a setting that defaults off. When enabled, paddle movement and hit position set ball angular velocity. During flight, spin subtly rotates the velocity vector while preserving ball speed. Wall and block bounces reflect normally first, then current spin deflects the outgoing vector and decays.

### Rationale

This introduces skill expression without forcing it onto existing play. Keeping it as an opt-in setting preserves compatibility, while implementing the math in pure physics helpers keeps the behavior testable and tunable.

### Consequences

Spin mode is intentionally arcade-style rather than a full rigid-body simulation. It changes gameplay when enabled, so scores from spin and non-spin play may not be directly comparable.
