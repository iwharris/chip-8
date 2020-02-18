export type Color = number;

export interface Display {
    color: Color;
    clear: () => void;
    draw: (x: number, y: number, on: boolean) => void;
}
