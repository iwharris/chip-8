import { hello } from '../src/index';

describe('Unit tests', () => {
    describe('#hello', () => {
        it('should greet the world', () => {
            expect(hello()).toBe('Hello world!');
        });
    });
});
