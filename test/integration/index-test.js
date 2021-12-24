'use strict';

const { describe, it } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const install = require('../..');

describe(function() {
  it('exports default', function() {
    expect(install.default).to.equal(install);
  });
});
