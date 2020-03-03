import { CPU } from './cpu';
import { CPUInterface } from './io';
import { hex, reg } from '../util/string';

enum State {
    HALTED = 'halted',
    RUNNING = 'running',
    CRASHED = 'crashed',
    // PAUSED
}

export class Emulation {
    private state: State;
    private cpu: CPU;

    get status(): State {
        return this.state;
    }

    constructor(cpuInterface: CPUInterface) {
        this.state = State.HALTED;

        this.cpu = new CPU(cpuInterface);
        this.cpu.reset();
    }

    load(data: Buffer): void {
        this.cpu.load(data);
    }

    dump() {
        const cpuDump = this.cpu.dump();

        const registerDump = Array.from(cpuDump.registers).map(
            (val, idx) => `${reg(idx)}=${hex(val, 2)}`
        );

        const stackDump = Array.from(cpuDump.stack).map((val, idx) => `${idx}: ${hex(val, 4)}`);

        const memDump = Array.from(cpuDump.memory)
            .map((byte) => hex(byte, 2))
            .join(' ');

        return {
            pc: hex(cpuDump.pc),
            sp: cpuDump.sp,
            stackDump,
            registerDump,
            memDump,
        };
    }

    start(): void {
        if (this.state !== State.HALTED) return;

        this.state = State.RUNNING;

        while (this.state === State.RUNNING) {
            try {
                this.cpu.tick();
            } catch (err) {
                this.handleCrash(err);
            }
        }
    }

    handleCrash(err: Error) {
        this.state = State.CRASHED;
        console.error(err);
        console.error(this.dump());
    }
}
