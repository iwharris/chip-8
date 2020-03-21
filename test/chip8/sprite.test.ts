import { getSystemSpriteOffset, pixelIterator } from '../../src/chip8/sprite';

describe('chip8', () => {
    describe('sprite', () => {
        describe('#getSystemSpriteOffset', () => {
            it('should compute the offset of system sprites', () => {
                expect(getSystemSpriteOffset(0x0)).toBe(0);
                expect(getSystemSpriteOffset(0x1)).toBe(5);
                expect(getSystemSpriteOffset(0xf)).toBe(75);
            });

            it('should accept a custom sprite width', () => {
                expect(getSystemSpriteOffset(0, 12)).toBe(0);
                expect(getSystemSpriteOffset(5, 14)).toBe(70);
            });
        });

        describe('#pixelIterator', () => {
            it("should iterate over a small sprite's pixels", () => {
                const iter = pixelIterator(1, 4);

                expect(iter.next()).toEqual({ done: false, value: [0, 0] });
                expect(iter.next()).toEqual({ done: false, value: [1, 0] });
                expect(iter.next()).toEqual({ done: false, value: [2, 0] });
                expect(iter.next()).toEqual({ done: false, value: [3, 0] });
                expect(iter.next()).toEqual({ done: true, value: undefined });
            });

            it('should iterate over a sprite with zero height', () => {
                const iter = pixelIterator(0, 1);

                expect(iter.next()).toEqual({ done: true, value: undefined });
            });

            it('should iterate over a sprite with zero width', () => {
                const iter = pixelIterator(1, 0);

                expect(iter.next()).toEqual({ done: true, value: undefined });
            });
        });
    });
});
