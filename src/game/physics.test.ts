import { describe, expect, it } from "vitest";
import {
  circleCapsuleCollision,
  circleRectCollision,
  deepestCircleRectCollision,
  normalizeVelocity,
  velocityFromAngle
} from "./physics";

describe("physics helpers", () => {
  it("uses 0 degrees as up and preserves speed", () => {
    const velocity = velocityFromAngle(0, 320);

    expect(velocity.vx).toBeCloseTo(0);
    expect(velocity.vy).toBeCloseTo(-320);
    expect(Math.hypot(velocity.vx, velocity.vy)).toBeCloseTo(320);
  });

  it("normalizes velocity without changing direction", () => {
    const velocity = normalizeVelocity({ vx: 3, vy: 4 }, 100);

    expect(velocity.vx).toBeCloseTo(60);
    expect(velocity.vy).toBeCloseTo(80);
  });

  it("reports the collision axis for a block hit from below", () => {
    const collision = circleRectCollision(
      { x: 25, y: 43, radius: 13 },
      { x: 25, y: 15, width: 50, height: 30 }
    );

    expect(collision?.axis).toBe("y");
  });

  it("chooses the deepest block collision instead of the first matching block", () => {
    const hit = deepestCircleRectCollision({ x: 49, y: 30, radius: 13 }, [
      { x: 75, y: 15, width: 50, height: 30 },
      { x: 25, y: 15, width: 50, height: 30 }
    ]);

    expect(hit?.rect.x).toBe(25);
  });

  it("does not collide with invisible paddle rectangle corners", () => {
    const paddle = { x: 100, y: 100, width: 130, height: 25 };
    const ball = { x: 36, y: 85, radius: 5 };

    expect(circleRectCollision(ball, paddle)).toBeDefined();
    expect(circleCapsuleCollision(ball, paddle)).toBe(false);
  });

  it("does collide with rounded paddle caps", () => {
    const paddle = { x: 100, y: 100, width: 130, height: 25 };

    expect(circleCapsuleCollision({ x: 38, y: 100, radius: 10 }, paddle)).toBe(true);
  });
});
