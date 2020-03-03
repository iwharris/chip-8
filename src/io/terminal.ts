import terminalKit from 'terminal-kit';
import { CPUInterface } from '../chip8/io';
import {
    // FrameBuffer,
    Color,
    DisplayOptions,
    DEFAULT_DISPLAY_COLOR,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
} from './display';

export const PIXEL_CHAR: string = '\u2588';

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
        // TODO clip if a sprite would intersect the edge of the screen

        // console.log(`draw [${x}, ${y}] ${value}`);
        x %= this.width;
        y %= this.height;

        const currentPixelValue = this.screenBuffer.get({ x, y }).char === PIXEL_CHAR ? 1 : 0;

        const xorValue = value ^ currentPixelValue;

        this.screenBuffer.put(
            {
                x,
                y,
                // attr: { color: this.color },
                // direction: null,
            } as any,
            xorValue ? PIXEL_CHAR : ' '
        );

        return currentPixelValue && !xorValue ? 1 : 0;
    }

    render(): void {
        this.screenBuffer.draw({
            x: 0,
            y: 0,
            delta: true,
        });
        // this.terminal.moveTo(0, 0);
    }

    isKeyPressed(key: number): boolean {
        return false;
    }

    waitForKeypress(): number {
        // while (!this.terminal.)

        return 0;
    }
}
