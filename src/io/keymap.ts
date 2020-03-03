/**
 * Represents a key from 0 to F.
 */
export enum Key {
    K0,
    K1,
    K2,
    K3,
    K4,
    K5,
    K6,
    K7,
    K8,
    K9,
    KA,
    KB,
    KC,
    KD,
    KE,
    KF,
}

export class Keymap {
    [index: string]: Key;
}
