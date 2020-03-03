/**
 * A tuple that describes coordinates in the form [x, y]
 */
export type Coordinate2D = [number, number];

export const isInBounds = (width: number, height: number, [x, y]: Coordinate2D): boolean =>
    x >= 0 && x < width && y >= 0 && y < height;
