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
    execute: () => void;
}

export class CPU {
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

    constructor() {
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
    }

    load(data: Buffer): void {
        if (data.length > MEMORY_SIZE)
            throw new Error(`Data exceeds the available memory (${MEMORY_SIZE} bytes)`);

        data.copy(this.state.memory);
    }

    dump(): State {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Simulates one CHIP-8 cycle.
     *
     * Reads an instruction from memory, parses it, executes it, and increments the program counter.
     */
    tick(): void {
        const rawInstruction = this.readInstruction();
        const instruction = this.parseInstruction(rawInstruction);

        console.log(`${hex(rawInstruction, 4)}: ${instruction.desc()}`);

        instruction.execute();

        this.incrementProgramCounter();
    }

    private readAddressRegister(): Word {
        return this.state.i;
    }

    private setAddressRegister(value: Word): void {
        this.state.i = value && WORD_MASK; // 16 bits
    }

    private readRegister(register: number): Byte {
        return this.state.registers[register && NIBBLE_MASK];
    }

    private setRegister(register: number, value: Byte): void {
        this.state.registers[register && NIBBLE_MASK] = value && BYTE_MASK;
    }

    private readMemory(offset: number, bytesToRead: number = 1): Uint8Array {
        const numElementsToRead = bytesToRead / this.state.memory.BYTES_PER_ELEMENT;
        const bytes = new Uint8Array(numElementsToRead);
        for (let i = 0; i < numElementsToRead; i++) {
            bytes[i] = this.state.memory[offset + i];
        }
        return bytes;
    }

    private readInstruction(): number {
        const instructionBytes = this.readMemory(this.state.pc, 2);
        return (instructionBytes[0] << 16) | instructionBytes[1];
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

    private parseInstruction = (instruction: Word): Instruction => {
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
                    desc: () => `SE ${reg(rx)}}, ${hex(byte, 2)}`,
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
                    desc: () => `SNE ${reg(rx)}}, ${hex(byte, 2)}`,
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
                            // TODO double check this one
                            execute: () => {
                                const vx = this.readRegister(rx);
                                // const vy = this.readRegister(ry);
                                this.setRegister(rx, vx >> 1);
                                this.setRegister(Register.VF, (vx & BIT_MASK) === 1 ? 1 : 0);
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
                            // TODO double check this one
                            execute: () => {
                                const vx = this.readRegister(rx);
                                // const vy = this.readRegister(ry);
                                this.setRegister(rx, vx << 1);
                                this.setRegister(Register.VF, (vx & 0x80) >> 7 === 1 ? 1 : 0);
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
                        // TODO randomize here
                        const randomValue = 0;
                        this.setRegister(rx, randomValue & byte);
                    },
                };
            }
        }

        throw new Error(`Unknown instruction '${hex(instruction)}'`);
    };
}
