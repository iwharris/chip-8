import { Nibble } from '../util/mask';
import { Coordinate2D } from '../util/2d';

/**
 * Height of each system sprite, in bytes
 */
export const SYSTEM_SPRITE_HEIGHT = 5;

/**
 * Width of each sprite, in bytes
 */
export const SPRITE_WIDTH = 1;

export const getSystemSpriteOffset = (char: Nibble, spriteSize: number = SYSTEM_SPRITE_HEIGHT) => {
    return char * spriteSize;
};

export function* pixelIterator(
    spriteHeight: number,
    spriteWidth: number = SPRITE_WIDTH
): Generator<Coordinate2D> {
    // TODO are system sprites 4 pixels wide or 8?
    for (let y = 0; y < spriteHeight; y++) {
        for (let x = 0; x < spriteWidth * 8; x++) {
            yield [x, y];
        }
    }
}

/**
 * Raw sprite data for the system font
 */
export const SPRITES = Buffer.from([
    // 0
    0xf0,
    0x90,
    0x90,
    0x90,
    0xf0,

    // 1
    0x20,
    0x60,
    0x20,
    0x20,
    0x70,

    // 2
    0xf0,
    0x10,
    0xf0,
    0x80,
    0xf0,

    // 3
    0xf0,
    0x10,
    0xf0,
    0x10,
    0xf0,

    // 4
    0x90,
    0x90,
    0xf0,
    0x10,
    0x10,

    // 5
    0xf0,
    0x80,
    0xf0,
    0x10,
    0xf0,

    // 6
    0xf0,
    0x80,
    0xf0,
    0x90,
    0xf0,

    // 7
    0xf0,
    0x10,
    0x20,
    0x40,
    0x40,

    // 8
    0xf0,
    0x90,
    0xf0,
    0x90,
    0xf0,

    // 9
    0xf0,
    0x90,
    0xf0,
    0x10,
    0xf0,

    // A
    0xf0,
    0x90,
    0xf0,
    0x90,
    0x90,

    // B
    0xe0,
    0x90,
    0xe0,
    0x90,
    0xe0,

    // C
    0xf0,
    0x80,
    0x80,
    0x80,
    0xf0,

    // D
    0xe0,
    0x90,
    0x90,
    0x90,
    0xe0,

    // E
    0xf0,
    0x80,
    0xf0,
    0x80,
    0xf0,

    // F
    0xf0,
    0x80,
    0xf0,
    0x80,
    0x80,
]);
