import { cutStr } from '../../src/helpers/utils.js';

describe('utils', () => {
  it('cutStr', () => {
    assert.equal(cutStr('12345', 4), '1234...');
    assert.equal(cutStr('12345', 5), '12345');
  });
});
