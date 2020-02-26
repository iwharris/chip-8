import random from 'random';
import { SPRITES, SPRITE_SIZE } from './sprite';
import { hex, reg, pad } from '../util/string';
import { BIT_MASK, NIBBLE_MASK, BYTE_MASK, WORD_MASK } from '../util/mask';

type Word = number;
type Byte = number;
type Nibble = number;

enum Register {
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

// No-op function
const NOOP = () => undefined;

interface State {
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
}

interface Instruction {
    desc: () => string;
    execute: () => void;
}

export class CPU {
    private readonly io: CPUInterface;

    private state: State = {
        pc: 0,
        sp: 0,
        i: 0,
        memory: new Uint8Array(0),
        registers: new Uint8Array(0),
        stack: new Uint16Array(0),
        dt: 0,
        st: 0,
    };

    constructor(io: CPUInterface) {
        this.io = io;
        this.reset();
    }

    reset(): void {
        this.state.i = 0;
        this.state.sp = 0;
        this.state.memory = new Uint8Array(MEMORY_SIZE);
        this.state.registers = new Uint8Array(16);
        this.state.stack = new Uint16Array(16);
        this.state.dt = 0;
        this.state.st = 0;

        // Load sprites into memory
        this.setMemory(SPRITES, MEMORY_SPRITE_OFFSET);

        this.io.clearDisplay();
    }

    load(data: Buffer): void {
        if (data.length > MEMORY_SIZE)
            throw new Error(`Data exceeds the available memory (${MEMORY_SIZE} bytes)`);

        // TODO handle ETI mode

        const startingMemoryAddress = MEMORY_PROGRAM_OFFSET;
        this.state.pc = startingMemoryAddress;

        // Load program into memory
        this.setMemory(data, startingMemoryAddress);
    }

    dump(): State {
        return this.state;
    }

    /**
     * Simulates one CHIP-8 cycle.
     *
     * Reads an instruction from memory, parses it, executes it, and increments the program counter.
     */
    tick(): void {
        const rawInstruction = this.readInstruction();
        const instruction = this.parseInstruction(rawInstruction);

        // console.log(`[${hex(this.state.pc, 3)}] ${hex(rawInstruction, 4)}: ${instruction.desc()}`);

        this.incrementProgramCounter();

        instruction.execute();

        this.io.render();
    }

    private readAddressRegister(): Word {
        return this.state.i;
    }

    private setAddressRegister(value: Word): void {
        this.state.i = value & WORD_MASK; // 16 bits
    }

    private readRegister(register: number): Byte {
        return this.state.registers[register & NIBBLE_MASK];
    }

    private setRegister(register: number, value: Byte): void {
        this.state.registers[register & NIBBLE_MASK] = value & BYTE_MASK;
    }

    private readMemory(offset: number, bytesToRead: number = 1): Uint8Array {
        const numElementsToRead = bytesToRead / this.state.memory.BYTES_PER_ELEMENT;
        const bytes = new Uint8Array(numElementsToRead);
        for (let i = 0; i < numElementsToRead; i++) {
            bytes[i] = this.state.memory[offset + i];
        }
        return bytes;
    }

    private setMemory(data: Buffer, destOffset: number): void {
        data.copy(this.state.memory, destOffset, 0);
    }

    private readInstruction(): number {
        const instructionBytes = this.readMemory(this.state.pc, 2);

        return (instructionBytes[0] << 8) | instructionBytes[1];
    }

    private popStack(): void {
        this.state.pc = this.state.stack[this.state.sp];
        this.state.sp -= 1;
    }

    private pushStack(): void {
        this.state.sp += 1;
        this.state.stack[this.state.sp] = this.state.pc;
    }

    private incrementProgramCounter(): void {
        this.state.pc += 2;
    }

    private getSpriteAddress(char: Nibble): number {
        return MEMORY_SPRITE_OFFSET + char * SPRITE_SIZE;
    }

    private parseInstruction = (instruction: Word): Instruction => {
        const nibble: Nibble = (instruction & 0xf000) >> 12;

        const nnn = (): number => instruction & 0xfff;
        const n = (): number => instruction & NIBBLE_MASK;
        const x = (): Nibble => (instruction & 0x0f00) >> 8;
        const y = (): Nibble => (instruction & 0x00f0) >> 4;
        const kk = (): Byte => instruction & BYTE_MASK;

        switch (nibble) {
            case 0x0: {
                if (instruction === 0x00e0) {
                    return {
                        desc: () => 'CLS',
                        execute: () => this.io.clearDisplay(),
                    };
                } else if (instruction === 0x00ee) {
                    return {
                        desc: () => 'RET',
                        execute: () => {
                            this.popStack();
                        },
                    };
                } else {
                    const a = nnn();

                    return {
                        desc: () => `(DEPRECATED) SYS ${hex(a, 3)}`,
                        execute: NOOP,
                    };
                }
            }
            case 0x1: {
                // JP addr
                const a = nnn();

                return {
                    desc: () => `JP ${hex(a, 3)}`,
                    execute: () => {
                        this.state.pc = a;
                    },
                };
            }
            case 0x2: {
                // CALL addr
                const a = nnn();

                return {
                    desc: () => `CALL ${hex(a, 3)}`,
                    execute: () => {
                        this.pushStack();
                        this.state.pc = a;
                    },
                };
            }
            case 0x3: {
                // SE Vx, byte
                const rx = x();
                const byte = kk();

                return {
                    desc: () => `SE ${reg(rx)}{}, ${hex(byte, 2)}}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        if (vx === byte) this.incrementProgramCounter();
                    },
                };
            }
            case 0x4: {
                // SNE Vx, byte
                const rx = x();
                const byte = kk();

                return {
                    desc: () => `SNE ${reg(rx)}{, ${hex(byte, 2)}}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        if (vx !== byte) this.incrementProgramCounter();
                    },
                };
            }
            case 0x5: {
                // SE Vx, Vy
                const rx = x();
                const ry = y();

                return {
                    desc: () => `SE ${reg(rx)}, ${reg(ry)}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        const vy = this.readRegister(ry);
                        if (vx === vy) this.incrementProgramCounter();
                    },
                };
            }
            case 0x6: {
                // LD Vx, byte
                const rx = x();
                const byte = kk();

                return {
                    desc: () => `LD ${reg(rx)}, ${hex(byte, 2)}`,
                    execute: () => {
                        this.setRegister(rx, byte);
                    },
                };
            }
            case 0x7: {
                // ADD Vx, byte
                const rx = x();
                const byte = kk();

                return {
                    desc: () => `ADD ${reg(rx)}, ${hex(byte, 2)}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        // TODO do we need to handle carry flag?
                        this.setRegister(rx, vx + byte);
                    },
                };
            }
            case 0x8: {
                const rx = x();
                const ry = y();
                const nibble = n();

                switch (nibble) {
                    case 0x0: {
                        // LD Vx, Vy
                        return {
                            desc: () => `LD ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vy);
                            },
                        };
                    }
                    case 0x1: {
                        // OR Vx, Vy
                        return {
                            desc: () => `OR ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vx | vy);
                            },
                        };
                    }
                    case 0x2: {
                        // AND Vx, Vy
                        return {
                            desc: () => `AND ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vx & vy);
                            },
                        };
                    }
                    case 0x3: {
                        // XOR Vx, Vy
                        return {
                            desc: () => `XOR ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vx ^ vy);
                            },
                        };
                    }
                    case 0x4: {
                        // ADD Vx, Vy
                        return {
                            desc: () => `ADD ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);
                                const sum = vx + vy;
                                // Set carry register
                                this.setRegister(rx, sum);
                                this.setRegister(Register.VF, sum > BYTE_MASK ? 1 : 0);
                            },
                        };
                    }
                    case 0x5: {
                        // SUB Vx, Vy
                        return {
                            desc: () => `SUB ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);

                                const vf = vx > vy ? 1 : 0;

                                this.setRegister(rx, vx - vy);
                                this.setRegister(Register.VF, vf);
                            },
                        };
                    }
                    case 0x6: {
                        // SHR Vx {, Vy}
                        return {
                            desc: () => `SHR ${reg(rx)} {, ${reg(ry)}}`,
                            execute: () => {
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vy >> 1);
                                this.setRegister(Register.VF, vy & BIT_MASK);
                            },
                        };
                    }
                    case 0x7: {
                        // SUBN Vx, Vy
                        return {
                            desc: () => `SUBN ${reg(rx)}, ${reg(ry)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const vy = this.readRegister(ry);

                                const vf = vy > vx ? 1 : 0;

                                this.setRegister(rx, vy - vx);
                                this.setRegister(Register.VF, vf);
                            },
                        };
                    }
                    case 0xe: {
                        // SHL Vx {, Vy}
                        return {
                            desc: () => `SHL ${reg(rx)} {, ${reg(ry)}}`,
                            execute: () => {
                                const vy = this.readRegister(ry);
                                this.setRegister(rx, vy << 1);
                                this.setRegister(Register.VF, (vy >> 7) & BIT_MASK);
                            },
                        };
                    }
                }
            }
            case 0x9: {
                // SNE Vx, Vy
                const rx = x();
                const ry = y();

                return {
                    desc: () => `SNE ${reg(rx)}, ${reg(ry)}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        const vy = this.readRegister(ry);

                        if (vx !== vy) this.incrementProgramCounter();
                    },
                };
            }
            case 0xa: {
                // LD I, addr
                const a = nnn();

                return {
                    desc: () => `LD I, ${hex(a, 3)}`,
                    execute: () => {
                        this.setAddressRegister(a);
                    },
                };
            }
            case 0xb: {
                // JP v0, addr
                const a = nnn();

                return {
                    desc: () => `JP V0, ${hex(a, 3)}`,
                    execute: () => {
                        const v0 = this.readRegister(Register.V0);
                        this.state.pc = a + v0;
                    },
                };
            }
            case 0xc: {
                // RND Vx, byte
                const rx = x();
                const byte = kk();

                return {
                    desc: () => `RND ${reg(rx)}, ${hex(byte, 2)}`,
                    execute: () => {
                        const randomValue = random.int(0, 255); // TODO make seedable
                        this.setRegister(rx, randomValue & byte);
                    },
                };
            }
            case 0xd: {
                // DRW Vx, Vy, nibble
                const rx = x();
                const ry = y();
                const byteCount = n();

                return {
                    desc: () => `DRW ${reg(rx)}, ${reg(ry)}, ${hex(nibble, 1)}`,
                    execute: () => {
                        const vx = this.readRegister(rx);
                        const vy = this.readRegister(ry);

                        // Get the bytes representing the sprite
                        const bytes = this.readMemory(this.readAddressRegister(), byteCount);

                        // draw sprite at vx, vy
                        let vf: number = 0;
                        // console.log(`drawing ${byteCount} bytes at [${vx}, ${vy}]`);
                        for (let y = 0; y < byteCount; y++) {
                            for (let x = 0; x < 8; x++) {
                                const pixelValue = (bytes[y] >> x) & 0x1;
                                vf = this.io.drawPixel(vx + x, vy + y, pixelValue) || vf;
                            }
                        }

                        this.setRegister(Register.VF, vf);
                    },
                };
            }
            case 0xe: {
                const lastByte = kk();
                const rx = x();

                switch (lastByte) {
                    case 0x9e: {
                        // SKP Vx
                        return {
                            desc: () => `SKP ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                if (this.io.isKeyPressed(vx)) this.incrementProgramCounter();
                            },
                        };
                    }
                    case 0xa1: {
                        // SKNP Vx
                        return {
                            desc: () => `SKNP ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                if (!this.io.isKeyPressed(vx)) this.incrementProgramCounter();
                            },
                        };
                    }
                }
            }
            case 0xf: {
                const lastByte = kk();
                const rx = x();

                switch (lastByte) {
                    case 0x07: {
                        // LD Vx, DT
                        return {
                            desc: () => `LD ${reg(rx)}, DT`,
                            execute: () => {
                                this.setRegister(rx, this.state.dt);
                            },
                        };
                    }
                    case 0x0a: {
                        // LD Vx, K
                        return {
                            desc: () => `LD ${reg(rx)}, K`,
                            execute: () => {
                                const val = this.io.waitForKeypress();
                                this.setRegister(rx, val);
                            },
                        };
                    }
                    case 0x15: {
                        // LD DT, Vx
                        return {
                            desc: () => `LD DT, ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                this.state.dt = vx;
                            },
                        };
                    }
                    case 0x18: {
                        // LD ST, Vx
                        return {
                            desc: () => `LD ST, ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                this.state.st = vx;
                            },
                        };
                    }
                    case 0x1e: {
                        // ADD I, Vx
                        return {
                            desc: () => `ADD I, ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const i = this.readAddressRegister();
                                this.setAddressRegister(i + vx);
                            },
                        };
                    }
                    case 0x29: {
                        // LD F, Vx
                        return {
                            desc: () => `LD F, ${reg(rx)}`,
                            execute: () => {
                                const digit = this.readRegister(rx);

                                this.setAddressRegister(this.getSpriteAddress(digit));
                            },
                        };
                    }
                    case 0x33: {
                        // LD B, Vx
                        return {
                            desc: () => `LD B, ${reg(rx)}`,
                            execute: () => {
                                const vx = this.readRegister(rx);
                                const str = pad(vx.toString(), 3);

                                const byteArray = new Uint8Array(
                                    str.split('').map((digit) => parseInt(digit))
                                );

                                this.setMemory(Buffer.from(byteArray), this.readAddressRegister());
                            },
                        };
                    }
                    case 0x55: {
                        // LD [I], Vx
                        return {
                            desc: () => `LD [I], ${reg(rx)}`,
                            execute: () => {
                                const registerValues = this.state.registers.slice(0, rx);

                                this.setMemory(
                                    Buffer.from(registerValues),
                                    this.readAddressRegister()
                                );
                            },
                        };
                    }
                    case 0x65: {
                        // LD Vx, [I]
                        return {
                            desc: () => `LD ${reg(rx)}, [I]`,
                            execute: () => {
                                const values = this.readMemory(this.readAddressRegister(), rx);

                                Buffer.from(values).copy(this.state.registers);
                            },
                        };
                    }
                }
            }
        }

        throw new Error(`Unknown instruction '${hex(instruction)}'`);
    };
}

/**
 * The CPU Interface is the only way for the CPU to communicate with
 * I/O devices: display, input, and sound.
 */
export interface CPUInterface {
    /**
     * Blank the display.
     */
    clearDisplay: () => void;

    /**
     * Draw a pixel value onto the display. The pixel is XORed onto the display.
     * If it erases a pixel, return true; otherwise, return false.
     *
     * @param x {number} x-coordinate of the pixel (will wrap if it overflows the display width)
     * @param y {number} y-coordinate of the pixel (will wrap if it overflows the display height)
     * @param value {boolean} If true, represents a 1 for this pixel; otherwise, represents a 0
     *
     * @returns true if a pixel was erased, false otherwise
     */
    drawPixel: (x: number, y: number, value: number) => number;

    /**
     * Called once per CPU cycle. Can be used to blit a framebuffer to display.
     */
    render: () => void;

    /**
     * Checks whether a key is pressed.
     *
     * @param key {number} the key to query
     *
     * @returns true if <key> is currently down
     */
    isKeyPressed: (key: number) => boolean;

    /**
     * Waits for any keypress and then returns the value of the key that is pressed.
     *
     * @returns the number of the first key that is pressed
     */
    waitForKeypress: () => number;

    // Sound methods

    // TODO
}
