'use strict';

const mocha = {
  exports: {}
};

require('../..')(mocha);

const { afterEach } = mocha.exports;
const assert = require('assert');

describe('async events', function() {
  it('works', function() {
    assert.ok(true);
  });

  afterEach(global.afterEachSpy);
});
