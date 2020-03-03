import { CPU, CPUInterface } from './chip8';

import { CPUDump } from './util/dump';

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

    dump(): CPUDump {
        return this.cpu.dump();
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
        console.error(this.dump().toJson());
    }
}
