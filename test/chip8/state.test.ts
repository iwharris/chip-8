import * as State from '../../src/chip8/state';
import { MockCPUInterface } from '../fixture/state-fixture';
import { WORD_MASK } from '../../src/util/mask';

const createInitialState = (): State.CPUState => {
    const mockIo = new MockCPUInterface();
    const state = State.createState(mockIo);
    State.resetState(state);

    return state;
};

describe('State', () => {
    describe('#resetState', () => {
        it('should reset state to initial values', () => {
            const state = State.createState(new MockCPUInterface());

            // dirty the state
            state.pc = 1;
            state.sp = 2;
            state.i = 3;
            state.memory.fill(4);
            state.registers.fill(5);
            state.stack.fill(0xffff);
            state.dt = 6;
            state.st = 7;
            state.systemFontOffset = 8;

            State.resetState(state);

            expect(state.pc).toBe(0);
            expect(state.sp).toBe(0);
            expect(state.i).toBe(0);
            expect(state.memory.every((byte) => byte === 0)).toBeTruthy();
            expect(state.registers.every((byte) => byte === 0)).toBeTruthy();
            expect(state.stack.every((word) => word === 0)).toBeTruthy();
            expect(state.dt).toBe(0);
            expect(state.st).toBe(0);
        });
    });

    describe('#loadRom', () => {
        it('should load a ROM with data', () => {
            const state = createInitialState();

            const data = Buffer.from([0x1, 0xf, 0xff]);

            State.loadRom(state, data);

            expect(state.pc).toBeGreaterThan(0);
            expect(state.memory[state.pc]).toBe(data[0]);
            expect(state.memory[state.pc + 1]).toBe(data[1]);
            expect(state.memory[state.pc + 2]).toBe(data[2]);
            expect(state.memory[state.pc + 3]).toBe(0);
        });
    });

    describe('Address register', () => {
        it('should set and retrieve an address register', () => {
            const state = createInitialState();
            const address = 0xff;

            State.setAddressRegister(state, address);
            expect(State.readAddressRegister(state)).toBe(address);
        });

        it('should mask an address register that is larger than the 2-byte size', () => {
            const state = createInitialState();
            const address = WORD_MASK + 1;

            State.setAddressRegister(state, address);
            expect(State.readAddressRegister(state)).toBe(0x0);
        });
    });

    describe('Set/Read memory', () => {
        it('should set and retrieve memory at a location', () => {
            const state = createInitialState();
            const address = 0xff;
            const data = Buffer.from([0xfa, 0xfb, 0xfc, 0xfd]);

            State.setMemory(state, data, address);

            expect(state.memory[address]).toBe(data[0]);
            expect(state.memory[address + 1]).toBe(data[1]);
            expect(state.memory[address + 2]).toBe(data[2]);
            expect(state.memory[address + 3]).toBe(data[3]);

            const readBuff = Buffer.from(State.readMemory(state, address, data.byteLength));
            expect(readBuff).toEqual(data);
        });
    });
});
