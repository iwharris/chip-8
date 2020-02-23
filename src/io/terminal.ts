import terminalKit from 'terminal-kit';
import { CPUInterface } from '../chip8/cpu';
import {
    // FrameBuffer,
    Color,
    DisplayOptions,
    DEFAULT_DISPLAY_COLOR,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
} from './display';

export type TerminalInterfaceOptions = DisplayOptions & {};

export class TerminalInterface implements CPUInterface {
    private color: Color;
    private terminal: terminalKit.Terminal;
    private screenBuffer: terminalKit.ScreenBuffer;
    private width: number;
    private height: number;

    constructor(options: TerminalInterfaceOptions = {}) {
        const { width, height, color } = options;
        this.color = color || DEFAULT_DISPLAY_COLOR;
        this.width = width || DISPLAY_WIDTH;
        this.height = height || DISPLAY_HEIGHT;
        this.terminal = terminalKit.createTerminal({
            appName: 'chip8',
            appId: 'foo',
        });

        this.screenBuffer = new terminalKit.ScreenBuffer({
            dst: this.terminal,
            width: this.width,
            height: this.height,
        });

        this.terminal.color(this.color);
    }

    clearDisplay(): void {
        this.screenBuffer.clear();
        this.terminal.clear();
    }

    drawPixel(x: number, y: number, value: number): number {
        // console.log(`draw [${x}, ${y}] ${value}`);
        x %= this.width;
        y %= this.height;

        const currentPixelValue = this.screenBuffer.get({ x, y }).char === 'X' ? 1 : 0;

        const xorValue = value ^ currentPixelValue;

        this.screenBuffer.put(
            {
                x,
                y,
                attr: { color: this.color },
                wrap: false,
                dx: 1,
                dy: 0,
            },
            xorValue ? 'X' : ' '
        );

        return currentPixelValue && !xorValue ? 1 : 0;
    }

    render(): void {
        this.screenBuffer.draw({
            delta: true,
        });
    }

    isKeyPressed(key: number): boolean {
        return false;
    }

    waitForKeypress(): number {
        return 0;
    }
}
