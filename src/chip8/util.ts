import { NIBBLE_MASK } from './const';

const pad = (str: string, digits?: number): string => {
    digits = digits || str.length;

    return '0'.repeat(digits - str.length) + str;
};

export const bin = (value: number, padDigits?: number): string => pad(value.toString(2), padDigits);

export const hex = (value: number, padDigits?: number, prefix: boolean = true): string =>
    (prefix ? '0x' : '') + pad(value.toString(16).toUpperCase(), padDigits);

export const reg = (value: number): string => 'V' + hex(value & NIBBLE_MASK, 1, false);
