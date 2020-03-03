import { readFileSync } from 'fs';
import { Emulation } from './emulator';
import { TerminalInterface } from './io/terminal';

const terminalInterface = new TerminalInterface();

const emu = new Emulation(terminalInterface);

const rom = readFileSync(process.argv[2]);

emu.load(rom);

emu.start();

// console.log(emu.dump());
