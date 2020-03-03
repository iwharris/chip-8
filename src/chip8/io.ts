/**
 * The CPU Interface is the only way for the CPU to communicate with
 * I/O devices: display, input, and sound.
 */
export interface CPUInterface {
    /**
     * Blank the display.
     */
    clearDisplay: () => void;

    /**
     * Draw a pixel value onto the display. The pixel is XORed onto the display.
     * If it erases a pixel, return true; otherwise, return false.
     *
     * @param x {number} x-coordinate of the pixel (will wrap if it overflows the display width)
     * @param y {number} y-coordinate of the pixel (will wrap if it overflows the display height)
     * @param value {boolean} If true, represents a 1 for this pixel; otherwise, represents a 0
     *
     * @returns true if a pixel was erased, false otherwise
     */
    drawPixel: (x: number, y: number, value: number) => number;

    /**
     * Called once per CPU cycle. Can be used to blit a framebuffer to display.
     */
    render: () => void;

    /**
     * Checks whether a key is pressed.
     *
     * @param key {number} the key to query
     *
     * @returns true if <key> is currently down
     */
    isKeyPressed: (key: number) => boolean;

    /**
     * Waits for any keypress and then returns the value of the key that is pressed.
     *
     * @returns the number of the first key that is pressed
     */
    waitForKeypress: () => number;

    // Sound methods

    // TODO
}
