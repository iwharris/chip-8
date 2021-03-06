import { MEMORY_SIZE, MEMORY_PROGRAM_OFFSET, MEMORY_SPRITE_OFFSET } from '../util/const';
import { WORD_MASK, NIBBLE_MASK, BYTE_MASK, BIT_MASK } from '../util/mask';
import { getSystemSpriteOffset, SPRITES, pixelIterator } from './sprite';
import { CPUInterface } from './io';
import { Coordinate2D, isInBounds } from '../util/2d';

type Word = number;
type Byte = number;
type Nibble = number;

export const createState = (io: CPUInterface): CPUState => ({
    pc: 0,
    sp: 0,
    i: 0,
    memory: new Uint8Array(0),
    registers: new Uint8Array(0),
    stack: new Uint16Array(0),
    dt: 0,
    st: 0,
    io,
    systemFontOffset: -1,
});

export const resetState = (state: CPUState): void => {
    state.pc = 0;
    state.sp = 0;
    state.i = 0;
    state.memory = new Uint8Array(MEMORY_SIZE);
    state.registers = new Uint8Array(16);
    state.stack = new Uint16Array(16);
    state.dt = 0;
    state.st = 0;
};

export interface CPUState {
    /**
     * Program Counter (16-bit)
     */
    pc: Word;

    /**
     * Stack pointer (8-bit)
     */
    sp: Byte;

    /**
     * Address Register (16-bit)
     */
    i: Word;

    /**
     * Memory buffer
     */
    memory: Uint8Array;

    /**
     * 16 8-bit registers: V0 to VF
     *
     * Note that VF is generally off-limits as it is used in certain operations
     */
    registers: Uint8Array;

    /**
     * Stores addresses that the interpreter should return to when finished with a subroutine
     */
    stack: Uint16Array;

    /**
     * Delay timer: 8-bit register that decrements at 60hz
     */
    dt: Byte;

    /**
     * Sound timer: 8-bit register that decrements at 60hz
     */
    st: Byte;

    /**
     * Interface to I/O devices (display, input, etc)
     */
    io: CPUInterface;

    /**
     * Memory offset for the system font
     */
    systemFontOffset: number;
}

export enum Register {
    V0,
    V1,
    V2,
    V3,
    V4,
    V5,
    V6,
    V7,
    V8,
    V9,
    VA,
    VB,
    VC,
    VD,
    VE,
    VF,
}

export const loadRom = (state: CPUState, data: Buffer): void => {
    if (data.length > MEMORY_SIZE - MEMORY_PROGRAM_OFFSET)
        throw new Error(`Data exceeds the available memory (${MEMORY_SIZE} bytes)`);

    // TODO handle ETI mode

    const startingMemoryAddress = MEMORY_PROGRAM_OFFSET;
    state.pc = startingMemoryAddress;

    // Load program into memory
    setMemory(state, data, startingMemoryAddress);
};

export const readAddressRegister = (state: CPUState): Word => {
    return state.i;
};

export const setAddressRegister = (state: CPUState, value: Word): void => {
    state.i = value & WORD_MASK; // 16 bits
};

export const readRegister = (state: CPUState, register: number): Byte => {
    return state.registers[register & NIBBLE_MASK];
};

export const setRegister = (state: CPUState, register: number, value: Byte): void => {
    state.registers[register & NIBBLE_MASK] = value & BYTE_MASK;
};

export const readMemory = (
    state: CPUState,
    offset: number,
    bytesToRead: number = 1
): Uint8Array => {
    const numElementsToRead = bytesToRead / state.memory.BYTES_PER_ELEMENT;
    const bytes = new Uint8Array(numElementsToRead);
    for (let i = 0; i < numElementsToRead; i++) {
        bytes[i] = state.memory[offset + i];
    }
    return bytes;
};

export const setMemory = (state: CPUState, data: Buffer, destOffset: number): void => {
    data.copy(state.memory, destOffset, 0);
};

export const readInstruction = (state: CPUState): number => {
    const instructionBytes = readMemory(state, state.pc, 2);

    return (instructionBytes[0] << 8) | instructionBytes[1];
};

export const popStack = (state: CPUState): void => {
    state.pc = state.stack[state.sp];
    state.sp -= 1;
};

export const pushStack = (state: CPUState): void => {
    state.sp += 1;
    state.stack[state.sp] = state.pc;
};

export const incrementProgramCounter = (state: CPUState): void => {
    state.pc += 2;
};

export const loadSystemSprites = (
    state: CPUState,
    spriteData: Buffer = SPRITES,
    offset: number = MEMORY_SPRITE_OFFSET
): void => {
    setMemory(state, spriteData, offset);
    state.systemFontOffset = MEMORY_SPRITE_OFFSET;
};

export const getSystemSpriteAddress = (state: CPUState, char: Nibble): number => {
    return state.systemFontOffset + getSystemSpriteOffset(char);
};

export const drawSprite = (state: CPUState, origin: Coordinate2D, bytes: Uint8Array): void => {
    const [originX, originY] = origin;

    const vx = originX % state.io.displayWidth;
    const vy = originY % state.io.displayHeight;

    let vf: number = 0;
    // console.log(`drawing ${byteCount} bytes at [${vx}, ${vy}]`);
    for (const [x, y] of pixelIterator(bytes.byteLength)) {
        const screenX = vx + x;
        const screenY = vy + y;
        if (isInBounds(state.io.displayWidth, state.io.displayHeight, [screenX, screenY])) {
            const pixelValue = (bytes[y] >> x) & BIT_MASK;
            vf = state.io.drawPixel(screenX, screenY, pixelValue) || vf;
        }
    }

    setRegister(state, Register.VF, vf);
};
