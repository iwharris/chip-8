export interface Input {
    isPressed: (value: number) => boolean;
}

const KEY_COUNT = 16;

export class StubKeyboardInput implements Input {
    private keyMap: boolean[] = new Array(KEY_COUNT).fill(false);

    isPressed(value: number): boolean {
        return this.keyMap[value];
    }
}
