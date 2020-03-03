import { CPUState } from '../chip8';
import { hex, reg } from './string';

export class CPUDump {
    private state: CPUState;

    constructor(state: CPUState) {
        this.state = state;
    }

    toJson(): any {
        const registerDump = Array.from(this.state.registers).map(
            (val, idx) => `${reg(idx)}=${hex(val, 2)}`
        );

        const stackDump = Array.from(this.state.stack).map((val, idx) => `${idx}: ${hex(val, 4)}`);

        let lastIndex;
        for (lastIndex = this.state.memory.byteLength - 1; lastIndex > 0; lastIndex--) {
            // Find index of last non-zero value in memory
            if (this.state.memory[lastIndex] !== 0x0) break;
        }
        let memDump = Array.from(this.state.memory)
            .slice(0, lastIndex)
            .map((byte) => hex(byte, 2))
            .join(' ');

        if (lastIndex !== this.state.memory.byteLength) {
            memDump += ` ...${this.state.memory.byteLength - lastIndex} empty bytes truncated...`;
        }

        return {
            pc: hex(this.state.pc),
            sp: this.state.sp,
            stackDump,
            registerDump,
            memDump,
        };
    }
}
