'use strict';

const { describe, it, setUpObjectReset } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');

let original = {
  foo: 'bar'
};

describe(setUpObjectReset, function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpObjectReset(original);

  afterEach(function() {
    expect(original.foo).to.equal('bar');
    expect(original).to.not.have.property('bar');
  });

  it('deletes added properties', function() {
    original.bar = 'baz';
  });
});
