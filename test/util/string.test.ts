import { pad, bin, hex, reg } from '../../src/util/string';

describe('string utils', () => {
    describe('#pad', () => {
        it('should pad a string', () => {
            expect(pad(' abc', 5, ' ')).toBe('  abc');
        });

        it('should pad a string with custom chars', () => {
            expect(pad('def', 6, 'a')).toBe('aaadef');
        });
    });

    describe('#bin', () => {
        it('should format a number as binary', () => {
            expect(bin(0xf)).toBe('1111');
            expect(bin(0)).toBe('0');
        });

        it('should format a number as binary with padding', () => {
            expect(bin(0xf, 8)).toBe('00001111');
        });
    });

    describe('#hex', () => {
        it('should format a number as hex', () => {
            expect(hex(0)).toBe('0x0');
            expect(hex(10)).toBe('0xA');
            expect(hex(15)).toBe('0xF');
            expect(hex(16)).toBe('0x10');
            expect(hex(255)).toBe('0xFF');
        });

        it('should format a number as hex without the 0x prefix', () => {
            expect(hex(15, undefined, false)).toBe('F');
        });

        it('should format a number as hex with padding', () => {
            expect(hex(16, 4)).toBe('0x0010');
        });
    });

    describe('#reg', () => {
        it('should format a register name', () => {
            expect(reg(0)).toBe('V0');
            expect(reg(0xf)).toBe('VF');
        });

        it('should mask the register ID', () => {
            expect(reg(16)).toBe('V0');
            expect(reg(255)).toBe('VF');
        });
    });
});
