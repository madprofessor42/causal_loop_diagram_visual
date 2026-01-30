/**
 * Calculate the distance between two points
 */
export const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the angle (in radians) from one point to another
 */
export const getAngle = (centerX: number, centerY: number, pointX: number, pointY: number): number => {
  return Math.atan2(pointY - centerY, pointX - centerX);
};

/**
 * Check if a point is near the edge of a circle
 */
export const isNearEdge = (
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number,
  radius: number,
  threshold: number = 15
): boolean => {
  const distance = getDistance(centerX, centerY, mouseX, mouseY);
  return Math.abs(distance - radius) < threshold;
};

/**
 * Calculate a point on the circle's perimeter given an angle
 */
export const getPointOnCircle = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): { x: number; y: number } => {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

/**
 * Get the closest point on a circle to a given point
 */
export const getClosestPointOnCircle = (
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number; angle: number } => {
  const angle = getAngle(centerX, centerY, mouseX, mouseY);
  const point = getPointOnCircle(centerX, centerY, radius, angle);
  return { ...point, angle };
};

