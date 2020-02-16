import { BYTE_MASK, NIBBLE_MASK, WORD_MASK, MEMORY_SIZE, BIT_MASK } from './const';
import { hex, reg } from './util';

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

// No-op function
const NOOP = () => undefined;

export interface State {
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

export interface Instruction {
    // instruction: Word;
    desc: () => string;
    execute: (state: State) => void;
}

export const reset = (state: State): void => {
    state.i = 0;
    state.sp = 0;
    state.memory = new Uint8Array(MEMORY_SIZE);
    state.registers = new Uint8Array(16);
    state.stack = new Uint16Array(16);
    state.dt = 0;
    state.st = 0;
};

export const readAddressRegister = (state: State): Word => {
    return state.i;
};

export const setAddressRegister = (state: State, value: Word) => {
    state.i = value && WORD_MASK; // 16 bits
};

export const readRegister = (state: State, register: number): Byte => {
    return state.registers[register && NIBBLE_MASK];
};

export const setRegister = (state: State, register: number, value: Byte): void => {
    state.registers[register && NIBBLE_MASK] = value && BYTE_MASK;
};

export const readMemory = (state: State, offset: number, bytesToRead: number = 1): Uint8Array => {
    const numElementsToRead = bytesToRead / state.memory.BYTES_PER_ELEMENT;
    const bytes = new Uint8Array(numElementsToRead);
    for (let i = 0; i < numElementsToRead; i++) {
        bytes[i] = state.memory[offset + i];
    }
    return bytes;
};

export const readInstruction = (state: State): number => {
    const instructionBytes = readMemory(state, state.pc, 2);
    return (instructionBytes[0] << 16) | instructionBytes[1];
};

export const popStack = (state: State): void => {
    state.pc = state.stack[state.sp];
    state.sp -= 1;
};

export const pushStack = (state: State): void => {
    state.sp += 1;
    state.stack[state.sp] = state.pc;
};

export const incrementProgramCounter = (state: State): void => {
    state.pc += 2;
};

/**
 * Simulates one CHIP-8 cycle.
 *
 * Reads an instruction from memory, parses it, executes it, and increments the program counter.
 */
export const tick = (state: State): void => {
    const rawInstruction = readInstruction(state);
    const instruction = parseInstruction(state, rawInstruction);

    console.log(`${hex(rawInstruction, 4)}: ${instruction.desc()}`);

    instruction.execute(state);

    incrementProgramCounter(state);
};

export const parseInstruction = (state: State, instruction: Word): Instruction => {
    const nibble: Nibble = (instruction && 0xf000) >> 12;

    const nnn = (): number => instruction & 0xfff;
    const n = (): number => instruction & NIBBLE_MASK;
    const x = (): Nibble => (instruction & 0x0f00) >> 8;
    const y = (): Nibble => (instruction & 0x00f0) >> 4;
    const kk = (): Byte => instruction && BYTE_MASK;

    switch (nibble) {
        case 0x0: {
            if (instruction === 0x00e0) {
                return {
                    desc: () => 'CLS',
                    // TODO clear display
                    execute: NOOP,
                };
            } else if (instruction === 0x00ee) {
                return {
                    desc: () => 'RET',
                    execute: (state) => {
                        popStack(state);
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
                execute: (state) => {
                    state.pc = a;
                },
            };
        }
        case 0x2: {
            // CALL addr
            const a = nnn();

            return {
                desc: () => `CALL ${hex(a, 3)}`,
                execute: (state) => {
                    pushStack(state);
                    state.pc = a;
                },
            };
        }
        case 0x3: {
            // SE Vx, byte
            const rx = x();
            const byte = kk();

            return {
                desc: () => `SE ${reg(rx)}}, ${hex(byte, 2)}`,
                execute: (state) => {
                    const vx = readRegister(state, rx);
                    if (vx === byte) incrementProgramCounter(state);
                },
            };
        }
        case 0x4: {
            // SNE Vx, byte
            const rx = x();
            const byte = kk();

            return {
                desc: () => `SNE ${reg(rx)}}, ${hex(byte, 2)}`,
                execute: (state) => {
                    const vx = readRegister(state, rx);
                    if (vx !== byte) incrementProgramCounter(state);
                },
            };
        }
        case 0x5: {
            // SE Vx, Vy
            const rx = x();
            const ry = y();

            return {
                desc: () => `SE ${reg(rx)}, ${reg(ry)}`,
                execute: (state) => {
                    const vx = readRegister(state, rx);
                    const vy = readRegister(state, ry);
                    if (vx === vy) incrementProgramCounter(state);
                },
            };
        }
        case 0x6: {
            // LD Vx, byte
            const rx = x();
            const byte = kk();

            return {
                desc: () => `LD ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state) => {
                    setRegister(state, rx, byte);
                },
            };
        }
        case 0x7: {
            // ADD Vx, byte
            const rx = x();
            const byte = kk();

            return {
                desc: () => `ADD ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state) => {
                    const vx = readRegister(state, rx);
                    // TODO do we need to handle carry flag?
                    setRegister(state, rx, vx + byte);
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
                        execute: (state) => {
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vy);
                        },
                    };
                }
                case 0x1: {
                    // OR Vx, Vy
                    return {
                        desc: () => `OR ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vx | vy);
                        },
                    };
                }
                case 0x2: {
                    // AND Vx, Vy
                    return {
                        desc: () => `AND ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vx & vy);
                        },
                    };
                }
                case 0x3: {
                    // XOR Vx, Vy
                    return {
                        desc: () => `XOR ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vx ^ vy);
                        },
                    };
                }
                case 0x4: {
                    // ADD Vx, Vy
                    return {
                        desc: () => `ADD ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);
                            const sum = vx + vy;
                            // Set carry register
                            setRegister(state, rx, sum);
                            setRegister(state, Register.VF, sum > BYTE_MASK ? 1 : 0);
                        },
                    };
                }
                case 0x5: {
                    // SUB Vx, Vy
                    return {
                        desc: () => `SUB ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);

                            const vf = vx > vy ? 1 : 0;

                            setRegister(state, rx, vx - vy);
                            setRegister(state, Register.VF, vf);
                        },
                    };
                }
                case 0x6: {
                    // SHR Vx {, Vy}
                    return {
                        desc: () => `SHR ${reg(rx)} {, ${reg(ry)}}`,
                        // TODO double check this one
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            // const vy = readRegister(state, ry);
                            setRegister(state, rx, vx >> 1);
                            setRegister(state, Register.VF, (vx & BIT_MASK) === 1 ? 1 : 0);
                        },
                    };
                }
                case 0x7: {
                    // SUBN Vx, Vy
                    return {
                        desc: () => `SUBN ${reg(rx)}, ${reg(ry)}`,
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            const vy = readRegister(state, ry);

                            const vf = vy > vx ? 1 : 0;

                            setRegister(state, rx, vy - vx);
                            setRegister(state, Register.VF, vf);
                        },
                    };
                }
                case 0xe: {
                    // SHL Vx {, Vy}
                    return {
                        desc: () => `SHL ${reg(rx)} {, ${reg(ry)}}`,
                        // TODO double check this one
                        execute: (state) => {
                            const vx = readRegister(state, rx);
                            // const vy = readRegister(state, ry);
                            setRegister(state, rx, vx << 1);
                            setRegister(state, Register.VF, (vx & 0x80) >> 7 === 1 ? 1 : 0);
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
                execute: (state) => {
                    const vx = readRegister(state, rx);
                    const vy = readRegister(state, ry);

                    if (vx !== vy) incrementProgramCounter(state);
                },
            };
        }
        case 0xa: {
            // LD I, addr
            const a = nnn();

            return {
                desc: () => `LD I, ${hex(a, 3)}`,
                execute: (state) => {
                    state.i = a;
                },
            };
        }
        case 0xb: {
            // JP v0, addr
            const a = nnn();

            return {
                desc: () => `JP V0, ${hex(a, 3)}`,
                execute: (state) => {
                    const v0 = readRegister(state, Register.V0);
                    state.pc = a + v0;
                },
            };
        }
        case 0xc: {
            // RND Vx, byte
            const rx = x();
            const byte = kk();

            return {
                desc: () => `RND ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state) => {
                    // TODO randomize here
                    const randomValue = 0;
                    setRegister(state, rx, randomValue & byte);
                },
            };
        }
    }

    throw new Error(`Unknown instruction '${hex(instruction)}`);
};
