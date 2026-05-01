import { describe, expect, it } from "vitest";
import {
  curveVelocityWithSpin,
  deflectVelocityWithSpin,
  circlePaddleBounceSurfaceCollision,
  circleRectCollision,
  decaySpin,
  deepestCircleRectCollision,
  normalizeVelocity,
  paddleBounceSurfaceY,
  paddleHitSpin,
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

  it("derives the paddle surface from the bounce angle", () => {
    expect(paddleBounceSurfaceY(0, 130, 25, 56)).toBeCloseTo(-12.5);
    expect(paddleBounceSurfaceY(65, 130, 25, 56)).toBeCloseTo(4.058, 3);
  });

  it("uses the curved paddle surface as the contact height", () => {
    const paddle = { x: 100, y: 100, width: 130, height: 25 };

    expect(circlePaddleBounceSurfaceCollision({ x: 165, y: 80, radius: 13 }, paddle, "bottom", 56)).toBeUndefined();
    expect(circlePaddleBounceSurfaceCollision({ x: 165, y: 91.2, radius: 13 }, paddle, "bottom", 56)).toBeDefined();
  });

  it("mirrors the curved paddle surface for the top paddle", () => {
    const paddle = { x: 100, y: 100, width: 130, height: 25 };

    expect(circlePaddleBounceSurfaceCollision({ x: 100, y: 125.4, radius: 13 }, paddle, "top", 56)).toBeDefined();
  });

  it("adds spin from paddle movement and hit position", () => {
    const spin = paddleHitSpin(700, 700, 0.5, {
      maxSpin: 18,
      paddleSpinTransfer: 9,
      edgeSpinTransfer: 4
    });

    expect(spin).toBe(11);
  });

  it("curves flight and wall deflections with positive spin", () => {
    const curved = curveVelocityWithSpin({ vx: 0, vy: -320 }, 18, 1, 0.025, 320);
    const bounced = deflectVelocityWithSpin({ vx: 0, vy: 320 }, 18, 0.045, 320);

    expect(curved.vx).toBeGreaterThan(0);
    expect(Math.hypot(curved.vx, curved.vy)).toBeCloseTo(320);
    expect(bounced.vx).toBeLessThan(0);
    expect(Math.hypot(bounced.vx, bounced.vy)).toBeCloseTo(320);
  });

  it("decays spin over time", () => {
    expect(decaySpin(10, 1, 0.35)).toBeLessThan(10);
  });
});
