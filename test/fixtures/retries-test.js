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
  describe('errors', function() {
    describe('before', function() {
      before(function() {
        this.attempt = 0;
      });

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
  });

  describe('timeouts', function() {
    this.timeout(10);

    describe('before', function() {
      before(function() {
        this.attempt = 0;
      });

      before(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      });

      it('works', function() {
        assert.ok(true);
      });
    });

    describe('beforeEach', function() {
      before(function() {
        this.attempt = 0;
        console.log('before');
      });

      beforeEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          console.log('before timeout');
          await new Promise(resolve => setTimeout(resolve, 15));
          console.log('after timeout');
        } else {
          console.log('no timeout');
        }
      });

      it('works', function() {
        assert.ok(true);
      });
    });

    describe('afterEach', function() {
      before(function() {
        this.attempt = 0;
      });

      afterEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      });

      it('works', function() {
        assert.ok(true);
      });
    });

    describe('after', function() {
      before(function() {
        this.attempt = 0;
      });

      after(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      });

      it('works', function() {
        assert.ok(true);
      });
    });

    describe('multiple', function() {
      before(function() {
        this.attempt = 0;
      });

      before(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        } else {
          this.attempt = 0;
        }
      });

      beforeEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        } else {
          this.attempt = 0;
        }
      });

      it('works', function() {
        assert.ok(true);
      });

      afterEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        } else {
          this.attempt = 0;
        }
      });

      after(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        } else {
          this.attempt = 0;
        }
      });
    });
  });

  describe('errors and timeouts', function() {
    describe('resets timeout', function() {
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

    describe('error after timeout', function() {
      this.timeout(10);

      before(function() {
        this.attempt = 0;
      });

      beforeEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 15));
        } else {
          assert.ok(false);
        }
      });

      it('works', function() {});
    });

    describe('time out after error', function() {
      this.timeout(10);

      before(function() {
        this.attempt = 0;
      });

      beforeEach(async function() {
        if (this.attempt++ < global.FAILURE_COUNT) {
          assert.ok(false);
        } else {
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      });

      it('works', function() {});
    });
  });
});
