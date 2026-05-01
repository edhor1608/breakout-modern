# Legacy Breakout Compatibility Spec

## Scope

This document captures the behavior the web port should preserve unless a later ADR explicitly changes it. The legacy Java/Slick2D project remains the source of truth where this spec is incomplete.

## Runtime Shape

The legacy game uses an 800 by 600 playfield and targets 120 frames per second. The modern game should keep the same logical coordinate system even if the browser canvas is scaled responsively.

The original states are main menu, gameplay, highscore, game over, game won, about, and help. The web port should keep equivalent user flows, but it does not need to preserve Slick state IDs internally.

## Maps

Legacy maps are plain text files under `maps/`. Each map is expected to contain 10 rows with 16 comma-separated integer cells per row. A value of `0` means no block. Positive values create a block with that many hits. The default map is `maps/level1.map`.

Block positions are derived from the grid: x is `25 + 50 * column`, y is `15 + 30 * row`. Block IDs in the legacy implementation use `block<column>_<row>` based on map placement order.

The web port should accept existing `.map` files unchanged. It should validate malformed files with a clear error instead of reproducing legacy crashes.

## Assets

The existing `images/`, `sounds/`, and `font/` assets are compatibility assets. The initial web port should reuse them before introducing replacements.

Important gameplay assets include `images/background.png`, `images/ball.png`, `images/stick.png`, `images/stickBigger.png`, `images/stickSmaller.png`, `images/block_1.png` through `images/block_4.png`, `images/heart.png`, `images/balken.png`, and item icons. Important sounds include `sounds/backgroundMusic.wav`, `sounds/hitBlock.wav`, `sounds/hitStick.wav`, `sounds/border.wav`, `sounds/itemHitStick.wav`, `sounds/game-over-yeah.wav`, `sounds/winSound.wav`, `sounds/click.wav`, and `sounds/evil-laugh.wav`.

## Controls

Single-player movement uses left and right arrow keys. Space starts the ball from the stick and advances menu/result screens. `P` toggles pause. `R` forces a reset/life-loss path during gameplay. Escape returns from gameplay or secondary screens to the main menu.

Multiplayer mode adds a second upper stick controlled with `A` and `D`. The existing menu toggles single-player and multiplayer mode.

## Gameplay Constants

The initial ball speed is `0.3` in legacy movement units. The ball speed increases by `0.0003` on collision. Stick speed starts at `0.5`. The stick starts at x `400` and y `565`. The player starts with three lives.

The ball starts attached to the stick before space is pressed. While attached, left and right movement also moves the ball. Losing a ball subtracts one life, resets the stick and ball, and pauses the timer until play resumes.

Spin physics is an optional modern setting and defaults off. With spin disabled, the game should preserve the deterministic legacy-style bounce behavior. With spin enabled, stick movement and hit position add ball rotation, and that rotation can curve flight and deflect later wall or block bounces.

## Blocks And Items

Blocks lose one hit on each valid ball collision. Blocks with no hits left are removed. Destroying all blocks wins the game.

Items may spawn when a block is destroyed. The legacy spawn chance starts at `0.1`, increases by `0.05` after misses, and resets after a successful spawn. Item categories are faster stick, slower stick, bigger stick, smaller stick, faster ball, and slower ball. Items fall downward and trigger when colliding with a stick. In multiplayer, stick-affecting items apply to both sticks.

## Highscores

The legacy highscore keeps at most 10 entries. Entries sort by destroyed blocks descending, then elapsed time ascending. Names are uppercased, trimmed, limited to 10 characters, and cannot contain spaces.

The web port should preserve these rules. New browser persistence should use a JSON-compatible format in local storage or IndexedDB. Java `.hsc` object files are legacy artifacts; direct in-browser reading is out of scope unless a later migration tool is added.

## Known Legacy Bugs To Avoid

The port should keep old content compatibility, not old crash behavior. Missing highscore files should produce an empty highscore list. Malformed maps should report validation errors. Missing block lookup should not be represented as a required `NullPointerException`.
