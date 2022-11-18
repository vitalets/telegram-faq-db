import { cutStr } from '../utils.js';

describe('utils', () => {
  it('cutStr', () => {
    expect(cutStr('12345', 4)).toBe('1234...');
    expect(cutStr('12345', 5)).toBe('12345');
  });
});
