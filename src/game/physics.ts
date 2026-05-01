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

export type PaddleKind = "bottom" | "top";

export type SurfacePoint = {
  x: number;
  y: number;
};

export type PaddleSurfaceCollision = {
  normalized: number;
  surfaceY: number;
};

export type SpinSettings = {
  maxSpin: number;
  paddleSpinTransfer: number;
  edgeSpinTransfer: number;
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

export function rotateVelocity(velocity: Velocity, radians: number): Velocity {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    vx: velocity.vx * cos - velocity.vy * sin,
    vy: velocity.vx * sin + velocity.vy * cos
  };
}

export function curveVelocityWithSpin(
  velocity: Velocity,
  angularVelocity: number,
  deltaSeconds: number,
  strength: number,
  speed: number
): Velocity {
  return normalizeVelocity(rotateVelocity(velocity, angularVelocity * strength * deltaSeconds), speed);
}

export function deflectVelocityWithSpin(
  velocity: Velocity,
  angularVelocity: number,
  strength: number,
  speed: number
): Velocity {
  return normalizeVelocity(rotateVelocity(velocity, angularVelocity * strength), speed);
}

export function decaySpin(angularVelocity: number, deltaSeconds: number, damping: number): number {
  return angularVelocity * Math.exp(-damping * deltaSeconds);
}

export function paddleHitSpin(
  paddleVelocityX: number,
  maxPaddleVelocityX: number,
  hitNormalized: number,
  settings: SpinSettings
): number {
  const movementSpin = clamp(paddleVelocityX / maxPaddleVelocityX, -1, 1) * settings.paddleSpinTransfer;
  const edgeSpin = hitNormalized * settings.edgeSpinTransfer;
  return clamp(movementSpin + edgeSpin, -settings.maxSpin, settings.maxSpin);
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

export function paddleBounceSurfaceY(x: number, width: number, height: number, maxAngleDegrees: number): number {
  const maxAngle = (maxAngleDegrees * Math.PI) / 180;
  return -height / 2 - (width / maxAngle) * Math.log(Math.cos((maxAngle * x) / width));
}

export function createPaddleBounceSurface(
  width: number,
  height: number,
  maxAngleDegrees: number,
  segments = 24
): SurfacePoint[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const x = -width / 2 + (width * index) / segments;
    return { x, y: paddleBounceSurfaceY(x, width, height, maxAngleDegrees) };
  });
}

export function circlePaddleBounceSurfaceCollision(
  circle: Circle,
  paddle: Rect,
  kind: PaddleKind,
  maxAngleDegrees: number
): PaddleSurfaceCollision | undefined {
  const localCircle = {
    x: circle.x - paddle.x,
    y: kind === "bottom" ? circle.y - paddle.y : paddle.y - circle.y
  };
  const surface = createPaddleBounceSurface(paddle.width, paddle.height, maxAngleDegrees);
  let closest: PaddleSurfaceCollision & { distance: number } | undefined;

  for (let index = 1; index < surface.length; index += 1) {
    const start = surface[index - 1];
    const end = surface[index];
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    const t = clamp(
      ((localCircle.x - start.x) * segmentX + (localCircle.y - start.y) * segmentY) / segmentLengthSquared,
      0,
      1
    );
    const x = start.x + segmentX * t;
    const y = start.y + segmentY * t;
    const distance = Math.hypot(localCircle.x - x, localCircle.y - y);

    if (distance <= circle.radius && (!closest || distance < closest.distance)) {
      closest = { distance, normalized: clamp(x / (paddle.width / 2), -1, 1), surfaceY: y };
    }
  }

  return closest ? { normalized: closest.normalized, surfaceY: closest.surfaceY } : undefined;
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
