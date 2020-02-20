import { readFileSync } from 'fs';
import { Emulation } from './chip8/emulation';
import { StubKeyboardInput } from './chip8/input';

const input = new StubKeyboardInput();

const emu = new Emulation({} as any, input, {} as any);

const rom = readFileSync('roms/GUESS');

emu.load(rom);

// console.log(emu.dump());

emu.start();
