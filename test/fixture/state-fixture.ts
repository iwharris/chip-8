import { CPUState, createState } from '../../src/chip8/state';
import { CPUInterface } from '../../src/chip8/io';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../../src/io/display';

export const createTestState = (interfaceOpts?: MockCPUInterfaceOptions): CPUState => {
    return createState(new MockCPUInterface(interfaceOpts));
};

export interface MockCPUInterfaceOptions {
    displayWidth: number;
    displayHeight: number;
}

/**
 * A test fixture that exposes a CPUInterface implementation with useful
 * test helpers and typed mocks.
 */
export class MockCPUInterface implements CPUInterface {
    public mocks: {
        getDisplayWidth: jest.Mock<number, []>;
        getDisplayHeight: jest.Mock<number, []>;
        clearDisplay: jest.Mock<void, []>;
        drawPixel: jest.Mock<number, [number, number, number]>;
        render: jest.Mock<void, []>;
        isKeyPressed: jest.Mock<boolean, [number]>;
        waitForKeyPress: jest.Mock<number, []>;
    };

    constructor(opts?: MockCPUInterfaceOptions) {
        this.mocks = {
            getDisplayHeight: jest.fn<number, []>(() => opts?.displayHeight || DISPLAY_HEIGHT),
            getDisplayWidth: jest.fn<number, []>(() => opts?.displayWidth || DISPLAY_WIDTH),
            clearDisplay: jest.fn<void, []>(),
            drawPixel: jest.fn<number, [number, number, number]>(() => 0),
            render: jest.fn<void, []>(),
            isKeyPressed: jest.fn<boolean, [number]>(() => false),
            waitForKeyPress: jest.fn<number, []>(() => -1),
        };
    }

    /**
     * Fully resets all mocks on this class.
     *
     * @see jest.Mock.reset
     */
    reset(): void {
        for (const mockName in this.mocks) {
            (this.mocks[mockName] as jest.Mock).mockReset();
        }
    }

    // CPUInterface implementation
    // These functions just proxy the mocks that are set on this class.

    get displayWidth(): number {
        return this.mocks.getDisplayWidth();
    }

    get displayHeight(): number {
        return this.mocks.getDisplayHeight();
    }

    clearDisplay(): void {
        this.mocks.clearDisplay();
    }

    drawPixel(x: number, y: number, value: number): number {
        return this.mocks.drawPixel(x, y, value);
    }

    render(): void {
        this.mocks.render();
    }

    isKeyPressed(key: number): boolean {
        return this.mocks.isKeyPressed(key);
    }

    waitForKeypress(): number {
        return this.mocks.waitForKeyPress();
    }
}
