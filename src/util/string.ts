import { NIBBLE_MASK } from './mask';

/**
 * Pads a string with zero or more characters
 *
 * @param str
 * @param desiredLength
 * @param digit
 */
export const pad = (str: string, desiredLength?: number, char: string = '0'): string => {
    desiredLength = desiredLength || str.length;

    return char.repeat(desiredLength - str.length) + str;
};

/**
 * Formats a number as binary and optionally pads it to a number of digits
 *
 * @param value
 * @param padDigits
 */
export const bin = (value: number, padDigits?: number): string => pad(value.toString(2), padDigits);

/**
 * Formats a number as hex and optionally pads it to a certain number of digits
 *
 * @param value
 * @param padDigits
 * @param prefix if true, hex value will be prefixed with '0x'
 */
export const hex = (value: number, padDigits?: number, prefix: boolean = true): string =>
    (prefix ? '0x' : '') + pad(value.toString(16).toUpperCase(), padDigits);

/**
 * Formats a register number in the form 'Vx'
 *
 * @param value
 */
export const reg = (value: number): string => 'V' + hex(value & NIBBLE_MASK, 1, false);
