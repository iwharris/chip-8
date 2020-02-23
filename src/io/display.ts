export type Color = number;

export const DEFAULT_DISPLAY_COLOR: Color = 0xffffff;
export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;

export interface FrameBufferPixel {
    x: number;
    y: number;
    value: number;
}

export class FrameBuffer {
    private buffer: number[];
    public readonly width: number;
    public readonly height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.buffer = new Array(width * height);
        this.clear();
    }

    private index(x: number, y: number) {
        return (y % this.height) * this.width + (x % this.width);
    }

    clear(): void {
        this.buffer.fill(0);
    }

    draw(x: number, y: number, val: number): number {
        const i = this.index(x, y);

        return (this.buffer[i] ^= val);
    }

    *iterator(): Generator<FrameBufferPixel> {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                yield {
                    x,
                    y,
                    value: this.buffer[this.index(x, y)],
                };
            }
        }
    }
}

export interface DisplayOptions {
    color?: Color;
    width?: number;
    height?: number;
}
