import {
    CPUState,
    createState,
    resetState,
    readInstruction,
    incrementProgramCounter,
    loadSystemSprites,
    loadRom,
} from './state';
import { parseInstruction } from './parser';
import { CPUInterface } from './io';
import { CPUDump } from '../util/dump';

export class CPU {
    private state: CPUState;

    constructor(io: CPUInterface) {
        this.state = createState(io);
        this.reset();
    }

    reset(): void {
        resetState(this.state);

        // Load system font (sprites) into memory
        loadSystemSprites(this.state);

        this.state.io.clearDisplay();
    }

    load(data: Buffer): void {
        loadRom(this.state, data);
    }

    dump(): CPUDump {
        return new CPUDump(this.state);
    }

    /**
     * Simulates one CHIP-8 cycle.
     *
     * Reads an instruction from memory, parses it, executes it, and increments the program counter.
     */
    tick(): void {
        const rawInstruction = readInstruction(this.state);
        const instruction = this.parseInstruction(rawInstruction);

        // console.log(`[${hex(this.state.pc, 3)}] ${hex(rawInstruction, 4)}: ${instruction.desc()}`);

        incrementProgramCounter(this.state);

        instruction.execute(this.state);

        this.state.io.render();
    }

    private parseInstruction = parseInstruction;
}
