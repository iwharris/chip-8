// ==============
// Numeric consts
// ==============

export const BIT_MASK = 0x1;
export const NIBBLE_MASK = 0xf;
export const BYTE_MASK = 0xff;
export const ADDRESS_MASK = 0xfff;
export const WORD_MASK = 0xffff;

// ==============
// Display consts
// ==============

/**
 * Display width, in pixels
 */
export const DISPLAY_WIDTH = 64;

/**
 * Display height, in pixels
 */
export const DISPLAY_HEIGHT = 32;

// =============
// Memory consts
// =============

/**
 * Size of system memory, in bytes
 */
export const MEMORY_SIZE = 0xfff;

/**
 * Offset where most CHIP-8 programs start
 */
export const MEMORY_PROGRAM_OFFSET = 0x200;

/**
 * Offset where sprites start
 */
export const MEMORY_SPRITE_OFFSET = 0x0;

/**
 * Offset where ETI 600 CHIP-8 programs start
 */
export const MEMORY_ETI_OFFSET = 0x600;

/**
 * Maximum depth of the stack
 */
export const STACK_SIZE = 16;
