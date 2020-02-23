import { readFileSync } from 'fs';
import { Emulation } from './chip8/emulation';
import { TerminalInterface } from './io/terminal';

const terminalInterface = new TerminalInterface();

const emu = new Emulation(terminalInterface);

const rom = readFileSync('roms/GUESS');

emu.load(rom);

emu.start();

// console.log(emu.dump());
