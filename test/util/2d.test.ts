import { isInBounds, Coordinate2D } from '../../src/util/2d';

describe('util', () => {
    describe('2d', () => {
        describe('#isInBounds', () => {
            const width = 10;
            const height = 5;
            const testBounds = (point: Coordinate2D) => isInBounds(width, height, point);

            it('should detect points that are in bounds', () => {
                const points: Coordinate2D[] = [
                    [0, 0],
                    [width - 1, height - 1],
                    [4, 4],
                    [width - 1, 0],
                    [0, height - 1],
                ];

                for (const point of points) {
                    expect(testBounds(point)).toBe(true);
                }
            });

            it('should detect points that are out of bounds', () => {
                const points: Coordinate2D[] = [
                    [-1, 0],
                    [-1, -1],
                    [0, -1],
                    [width, height],
                    [0, height],
                    [width, 0],
                ];

                for (const point of points) {
                    expect(testBounds(point)).toBe(false);
                }
            });
        });
    });
});
