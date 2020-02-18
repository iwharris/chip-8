import { CPU } from './cpu';
import { Sound } from './sound';
import { Input } from './input';
import { Display } from './display';

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

    dump(): any {
        return this.cpu.dump();
    }

    start(): void {
        if (this.state !== State.HALTED) return;

        this.state = State.RUNNING;

        while (true) this.cpu.tick();
    }
}
