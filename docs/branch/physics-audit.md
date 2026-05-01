# Physics Audit

## Coordinate Model

The game keeps the original 800 by 600 logical playfield. Pixi sprites use center anchors for gameplay entities, so paddles, balls, blocks, and items are represented by center `x` and `y` coordinates. Rectangles store full `width` and `height`; the ball stores a center point plus radius.

The canvas may scale visually in CSS, but gameplay calculations stay in logical pixels. Time-based movement uses seconds from Pixi ticker deltas.

## Current Gameplay Model

The ball is arcade-style rather than physically realistic. It uses constant-speed vectors, axis-aligned wall and rectangle collisions, rounded capsule paddle collisions, and paddle-controlled bounce angles. The lower paddle maps hit position from left edge to right edge into `-maxBounceAngle` to `+maxBounceAngle`; the upper paddle mirrors that angle downward.

Block collisions use circle-vs-rectangle intersection. When multiple adjacent blocks collide at once, the deepest collision is chosen to avoid row-order artifacts. The ball is pushed out of the block along the resolved collision axis before velocity is reflected, which prevents sticky repeated damage.

Physics is stepped in small substeps and frame deltas are capped. This avoids large frame spikes causing the ball or falling items to tunnel through thin objects.

## Fixed During Audit

The top wall was previously at y `30`, which conflicted with the legacy top row of blocks spanning y `0` to `30`. The wall is now at y `0`, so top-row blocks are playable instead of only edge-touchable.

The previous block collision picked the first matching block in map order. Dense maps could therefore damage the wrong block when the ball overlapped two neighbors. The current code chooses the deepest collision.

The previous block collision reflected velocity without separating the ball from the block. That could cause repeated collision frames while the ball was still inside the same block. The current code separates before continuing.

The previous ticker step used the raw frame delta. Large deltas from browser stalls could skip collisions. The current code caps frame time and substeps physics.

## Deliberate Simplifications

The game does not perform continuous swept collision detection. Substeps are sufficient for the current speed caps and object sizes. Spin, paddle velocity transfer, restitution coefficients, and collision normals from arbitrary surfaces are intentionally out of scope because they would change the old Breakout feel.
