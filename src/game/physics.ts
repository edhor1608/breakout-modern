import type { Rect } from "./types";

export type Circle = {
  x: number;
  y: number;
  radius: number;
};

export type Velocity = {
  vx: number;
  vy: number;
};

export type CircleRectCollision = {
  axis: "x" | "y";
  overlapX: number;
  overlapY: number;
};

export type Capsule = Rect & {
  radius?: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function velocityFromAngle(angleDegrees: number, speed: number): Velocity {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    vx: Math.cos(radians) * speed,
    vy: Math.sin(radians) * speed
  };
}

export function normalizeVelocity(velocity: Velocity, speed: number): Velocity {
  const length = Math.hypot(velocity.vx, velocity.vy);
  if (length === 0) {
    return velocity;
  }

  return {
    vx: (velocity.vx / length) * speed,
    vy: (velocity.vy / length) * speed
  };
}

export function circleRectCollision(circle: Circle, rect: Rect): CircleRectCollision | undefined {
  const closestX = clamp(circle.x, rect.x - rect.width / 2, rect.x + rect.width / 2);
  const closestY = clamp(circle.y, rect.y - rect.height / 2, rect.y + rect.height / 2);
  if (Math.hypot(circle.x - closestX, circle.y - closestY) > circle.radius) {
    return undefined;
  }

  const overlapX = rect.width / 2 + circle.radius - Math.abs(circle.x - rect.x);
  const overlapY = rect.height / 2 + circle.radius - Math.abs(circle.y - rect.y);
  return {
    axis: overlapX < overlapY ? "x" : "y",
    overlapX,
    overlapY
  };
}

export function circleCapsuleCollision(circle: Circle, capsule: Capsule): boolean {
  const capRadius = capsule.radius ?? capsule.height / 2;
  const halfSegment = Math.max(0, capsule.width / 2 - capRadius);
  const closestX = clamp(circle.x, capsule.x - halfSegment, capsule.x + halfSegment);
  const distance = Math.hypot(circle.x - closestX, circle.y - capsule.y);

  return distance <= circle.radius + capRadius;
}

export function deepestCircleRectCollision<T extends Rect>(
  circle: Circle,
  rects: T[]
): { rect: T; collision: CircleRectCollision } | undefined {
  let deepest: { rect: T; collision: CircleRectCollision; depth: number } | undefined;

  for (const rect of rects) {
    const collision = circleRectCollision(circle, rect);
    if (!collision) {
      continue;
    }

    const depth = Math.min(collision.overlapX, collision.overlapY);
    if (!deepest || depth > deepest.depth) {
      deepest = { rect, collision, depth };
    }
  }

  return deepest ? { rect: deepest.rect, collision: deepest.collision } : undefined;
}

export function rectsOverlap(left: Rect, right: Rect): boolean {
  return (
    Math.abs(left.x - right.x) * 2 < left.width + right.width &&
    Math.abs(left.y - right.y) * 2 < left.height + right.height
  );
}
