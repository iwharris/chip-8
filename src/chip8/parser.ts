import random from 'random';
import { ADDRESS_MASK, NIBBLE_MASK, Nibble, Byte, BYTE_MASK, Word, BIT_MASK } from '../util/mask';
import {
    CPUState,
    popStack,
    pushStack,
    readRegister,
    incrementProgramCounter,
    setRegister,
    Register,
    setAddressRegister,
    readMemory,
    readAddressRegister,
    setMemory,
    getSystemSpriteAddress,
    drawSprite,
} from './state';
import { hex, reg, pad } from '../util/string';
import { Coordinate2D } from '../util/2d';

// Helpers
const nnn = (instruction: number): number => instruction & ADDRESS_MASK;
const n = (instruction: number): number => instruction & NIBBLE_MASK;
const x = (instruction: number): Nibble => (instruction & 0x0f00) >> 8;
const y = (instruction: number): Nibble => (instruction & 0x00f0) >> 4;
const kk = (instruction: number): Byte => instruction & BYTE_MASK;

// No-op function
const NOOP = () => undefined;

export interface Instruction {
    desc: () => string;
    execute: (state: CPUState) => void;
}

export const parseInstruction = (instruction: Word): Instruction => {
    const nibble: Nibble = (instruction & 0xf000) >> 12;

    switch (nibble) {
        case 0x0: {
            if (instruction === 0x00e0) {
                return {
                    desc: () => 'CLS',
                    execute: (state: CPUState) => state.io.clearDisplay(),
                };
            } else if (instruction === 0x00ee) {
                return {
                    desc: () => 'RET',
                    execute: (state: CPUState) => {
                        popStack(state);
                    },
                };
            } else {
                const a = nnn(instruction);

                return {
                    desc: () => `(DEPRECATED) SYS ${hex(a, 3)}`,
                    execute: NOOP,
                };
            }
        }
        case 0x1: {
            // JP addr
            const a = nnn(instruction);

            return {
                desc: () => `JP ${hex(a, 3)}`,
                execute: (state: CPUState) => {
                    state.pc = a;
                },
            };
        }
        case 0x2: {
            // CALL addr
            const a = nnn(instruction);

            return {
                desc: () => `CALL ${hex(a, 3)}`,
                execute: (state: CPUState) => {
                    pushStack(state);
                    state.pc = a;
                },
            };
        }
        case 0x3: {
            // SE Vx, byte
            const rx = x(instruction);
            const byte = kk(instruction);

            return {
                desc: () => `SE ${reg(rx)}{}, ${hex(byte, 2)}}`,
                execute: (state: CPUState) => {
                    const vx = readRegister(state, rx);
                    if (vx === byte) incrementProgramCounter(state);
                },
            };
        }
        case 0x4: {
            // SNE Vx, byte
            const rx = x(instruction);
            const byte = kk(instruction);

            return {
                desc: () => `SNE ${reg(rx)}{, ${hex(byte, 2)}}`,
                execute: (state: CPUState) => {
                    const vx = readRegister(state, rx);
                    if (vx !== byte) incrementProgramCounter(state);
                },
            };
        }
        case 0x5: {
            // SE Vx, Vy
            const rx = x(instruction);
            const ry = y(instruction);

            return {
                desc: () => `SE ${reg(rx)}, ${reg(ry)}`,
                execute: (state: CPUState) => {
                    const vx = readRegister(state, rx);
                    const vy = readRegister(state, ry);
                    if (vx === vy) incrementProgramCounter(state);
                },
            };
        }
        case 0x6: {
            // LD Vx, byte
            const rx = x(instruction);
            const byte = kk(instruction);

            return {
                desc: () => `LD ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state: CPUState) => {
                    setRegister(state, rx, byte);
                },
            };
        }
        case 0x7: {
            // ADD Vx, byte
            const rx = x(instruction);
            const byte = kk(instruction);

            return {
                desc: () => `ADD ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state: CPUState) => {
                    const vx = readRegister(state, rx);
                    // TODO do we need to handle carry flag?
                    setRegister(state, rx, vx + byte);
                },
            };
        }
        case 0x8: {
            const rx = x(instruction);
            const ry = y(instruction);
            const nibble = n(instruction);

            switch (nibble) {
                case 0x0: {
                    // LD Vx, Vy
                    return {
                        desc: () => `LD ${reg(rx)}, ${reg(ry)}`,
                        execute: (state: CPUState) => {
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vy);
                        },
                    };
                }
                case 0x1: {
                    // OR Vx, Vy
                    return {
                        desc: () => `OR ${reg(rx)}, ${reg(ry)}`,
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vy >> 1);
                            setRegister(state, Register.VF, vy & BIT_MASK);
                        },
                    };
                }
                case 0x7: {
                    // SUBN Vx, Vy
                    return {
                        desc: () => `SUBN ${reg(rx)}, ${reg(ry)}`,
                        execute: (state: CPUState) => {
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
                        execute: (state: CPUState) => {
                            const vy = readRegister(state, ry);
                            setRegister(state, rx, vy << 1);
                            setRegister(state, Register.VF, (vy >> 7) & BIT_MASK);
                        },
                    };
                }
            }
        }
        case 0x9: {
            // SNE Vx, Vy
            const rx = x(instruction);
            const ry = y(instruction);

            return {
                desc: () => `SNE ${reg(rx)}, ${reg(ry)}`,
                execute: (state: CPUState) => {
                    const vx = readRegister(state, rx);
                    const vy = readRegister(state, ry);

                    if (vx !== vy) incrementProgramCounter(state);
                },
            };
        }
        case 0xa: {
            // LD I, addr
            const a = nnn(instruction);

            return {
                desc: () => `LD I, ${hex(a, 3)}`,
                execute: (state: CPUState) => {
                    setAddressRegister(state, a);
                },
            };
        }
        case 0xb: {
            // JP v0, addr
            const a = nnn(instruction);

            return {
                desc: () => `JP V0, ${hex(a, 3)}`,
                execute: (state: CPUState) => {
                    state.pc = a + readRegister(state, Register.V0);
                },
            };
        }
        case 0xc: {
            // RND Vx, byte
            const rx = x(instruction);
            const byte = kk(instruction);

            return {
                desc: () => `RND ${reg(rx)}, ${hex(byte, 2)}`,
                execute: (state: CPUState) => {
                    const randomValue = random.int(0, 255); // TODO make seedable
                    setRegister(state, rx, randomValue & byte);
                },
            };
        }
        case 0xd: {
            // DRW Vx, Vy, nibble
            const rx = x(instruction);
            const ry = y(instruction);
            const byteCount = n(instruction);

            return {
                desc: () => `DRW ${reg(rx)}, ${reg(ry)}, ${hex(nibble, 1)}`,
                execute: (state: CPUState) => {
                    const origin = [rx, ry].map((reg) => readRegister(state, reg)) as Coordinate2D;

                    // Get the bytes representing the sprite
                    const bytes = readMemory(state, readAddressRegister(state), byteCount);

                    drawSprite(state, origin, bytes);
                },
            };
        }
        case 0xe: {
            const lastByte = kk(instruction);
            const rx = x(instruction);

            switch (lastByte) {
                case 0x9e: {
                    // SKP Vx
                    return {
                        desc: () => `SKP ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            if (state.io.isKeyPressed(vx)) incrementProgramCounter(state);
                        },
                    };
                }
                case 0xa1: {
                    // SKNP Vx
                    return {
                        desc: () => `SKNP ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            if (!state.io.isKeyPressed(vx)) incrementProgramCounter(state);
                        },
                    };
                }
            }
        }
        case 0xf: {
            const lastByte = kk(instruction);
            const rx = x(instruction);

            switch (lastByte) {
                case 0x07: {
                    // LD Vx, DT
                    return {
                        desc: () => `LD ${reg(rx)}, DT`,
                        execute: (state: CPUState) => {
                            setRegister(state, rx, state.dt);
                        },
                    };
                }
                case 0x0a: {
                    // LD Vx, K
                    return {
                        desc: () => `LD ${reg(rx)}, K`,
                        execute: (state: CPUState) => {
                            const val = state.io.waitForKeypress();
                            setRegister(state, rx, val);
                        },
                    };
                }
                case 0x15: {
                    // LD DT, Vx
                    return {
                        desc: () => `LD DT, ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            state.dt = vx;
                        },
                    };
                }
                case 0x18: {
                    // LD ST, Vx
                    return {
                        desc: () => `LD ST, ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            state.st = vx;
                        },
                    };
                }
                case 0x1e: {
                    // ADD I, Vx
                    return {
                        desc: () => `ADD I, ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            const i = readAddressRegister(state);
                            setAddressRegister(state, i + vx);
                        },
                    };
                }
                case 0x29: {
                    // LD F, Vx
                    return {
                        desc: () => `LD F, ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const digit = readRegister(state, rx);
                            const spriteAddress = getSystemSpriteAddress(state, digit);
                            setAddressRegister(state, spriteAddress);
                        },
                    };
                }
                case 0x33: {
                    // LD B, Vx
                    return {
                        desc: () => `LD B, ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const vx = readRegister(state, rx);
                            const str = pad(vx.toString(), 3);

                            const byteArray = new Uint8Array(
                                str.split('').map((digit) => parseInt(digit))
                            );

                            setMemory(state, Buffer.from(byteArray), readAddressRegister(state));
                        },
                    };
                }
                case 0x55: {
                    // LD [I], Vx
                    return {
                        desc: () => `LD [I], ${reg(rx)}`,
                        execute: (state: CPUState) => {
                            const registerValues = state.registers.slice(0, rx);

                            setMemory(
                                state,
                                Buffer.from(registerValues),
                                readAddressRegister(state)
                            );
                        },
                    };
                }
                case 0x65: {
                    // LD Vx, [I]
                    return {
                        desc: () => `LD ${reg(rx)}, [I]`,
                        execute: (state: CPUState) => {
                            const values = readMemory(state, readAddressRegister(state), rx);

                            Buffer.from(values).copy(state.registers);
                        },
                    };
                }
            }
        }
    }

    throw new Error(`Unknown instruction '${hex(instruction)}'`);
};
