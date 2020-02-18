import { readFileSync } from 'fs';
import { Emulation } from './chip8/emulation';

const emu = new Emulation({} as any, {} as any, {} as any);

const rom = readFileSync('roms/GUESS');

emu.load(rom);

console.log(emu.dump());

emu.start();
