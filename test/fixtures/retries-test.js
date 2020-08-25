'use strict';

const mocha = {
  exports: {}
};

require('../..')(mocha, {
  retryHooks: true
});

const { before, beforeEach, afterEach, after } = mocha.exports;
const assert = require('assert');

describe('retries', function() {
  describe('before', function() {
    before(function() {
      this.attempt = 0;
    });

    // eslint-disable-next-line mocha/no-sibling-hooks
    before(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });

    it('works', function() {
      assert.ok(true);
    });
  });

  describe('beforeEach', function() {
    before(function() {
      this.attempt = 0;
    });

    beforeEach(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });

    it('works', function() {
      assert.ok(true);
    });
  });

  describe('it', function() {
    before(function() {
      this.attempt = 0;
    });

    it('works', function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });
  });

  describe('afterEach', function() {
    before(function() {
      this.attempt = 0;
    });

    afterEach(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });

    it('works', function() {
      assert.ok(true);
    });
  });

  describe('after', function() {
    before(function() {
      this.attempt = 0;
    });

    after(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });

    it('works', function() {
      assert.ok(true);
    });
  });

  describe('multiple', function() {
    before(function() {
      this.attempt = 0;
    });

    // eslint-disable-next-line mocha/no-sibling-hooks
    before(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
      this.attempt = 0;
    });

    beforeEach(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
      this.attempt = 0;
    });

    it('works', function() {
      assert.ok(true);
    });

    afterEach(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
      this.attempt = 0;
    });

    after(function() {
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
      this.attempt = 0;
    });
  });

  describe('timeout', function() {
    this.timeout(15);

    before(function() {
      this.attempt = 0;
    });

    beforeEach(async function() {
      await new Promise(resolve => setTimeout(resolve, 10));
      assert.strictEqual(this.attempt++, global.FAILURE_COUNT);
    });

    it('works', function() {
      assert.ok(true);
    });
  });
});
