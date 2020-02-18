import { CPU } from './cpu';
import { Sound } from './sound';
import { Input } from './input';
import { Display } from './display';
import { hex, reg } from './util';

enum State {
    HALTED = 'halted',
    RUNNING = 'running',
    CRASHED = 'crashed',
    // PAUSED
}

export class Emulation {
    private state: State;
    private cpu: CPU;
    private display: Display;
    private input: Input;
    private sound: Sound;

    get status(): State {
        return this.state;
    }

    constructor(display: Display, input: Input, sound: Sound) {
        this.state = State.HALTED;

        this.display = display;
        this.input = input;
        this.sound = sound;

        this.cpu = new CPU();
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

        console.log({
            pc: hex(cpuDump.pc),
            sp: cpuDump.sp,
            stackDump,
            registerDump,
            // memDump,
        });
    }

    start(): void {
        if (this.state !== State.HALTED) return;

        this.state = State.RUNNING;

        for (let i = 0; i < 100; i++) this.cpu.tick();
    }
}
