'use strict';

const { describe, it, setUpRunner } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');

describe(function() {
  let grep;

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpRunner();

  before(function() {
    let { runTests } = this;
    this.runTests = async options => {
      return await runTests(
        [path.resolve(__dirname, '../fixtures/retries-test.js')],
        {
          grep,
          ...options
        }
      );
    };
  });

  beforeEach(function() {
    global.FAILURE_COUNT = 1;
  });

  afterEach(function() {
    delete global.FAILURE_COUNT;
  });

  describe('before', function() {
    before(function() {
      grep = 'before works$';
    });

    it('works', async function() {
      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(0);
      expect(stats.passes).to.equal(0);
      expect(stats.failures).to.equal(1);
    });
  });

  describe('beforeEach', function() {
    before(function() {
      grep = 'beforeEach works$';
    });

    it('works', async function() {
      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(0);
      expect(stats.passes).to.equal(0);
      expect(stats.failures).to.equal(1);
    });
  });

  describe('afterEach', function() {
    before(function() {
      grep = 'afterEach works$';
    });

    it('works', async function() {
      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);
    });
  });

  describe('after', function() {
    before(function() {
      grep = 'after works$';
    });

    it('works', async function() {
      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);
    });
  });

  describe('muultiple errors in different hooks', function() {
    before(function() {
      grep = 'multiple works$';
    });

    it('works', async function() {
      let stats = await this.runTests({
        retries: 4
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 4
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);
    });

    it('can still fail', async function() {
      let stats = await this.runTests({
        retries: 3
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);
    });
  });
});
