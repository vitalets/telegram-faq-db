import assert from 'assert';
import sinon from 'sinon';

type Assert = typeof assert.strict;
type sinon = typeof sinon;

declare global {
  const assert: Assert;
  const sinon: sinon;
}

Object.assign(global, {
  assert: assert.strict,
  sinon,
});
