'use strict';

const { describe, it, setUpObjectReset } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');

let original = {
  foo: 'foo'
};

Object.defineProperty(original, 'bar', {
  value: 'bar'
});

describe(setUpObjectReset, function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpObjectReset(original);

  afterEach(function() {
    expect(original.foo).to.equal('foo');
    expect(original.bar).to.equal('bar');
    expect(original).to.not.have.property('baz');
  });

  it('deletes added properties', function() {
    original.baz = 'baz';
  });
});
