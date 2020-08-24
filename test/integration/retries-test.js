'use strict';

const { describe, it, runTests, events } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');
const sinon = require('sinon');
const { Runner } = require('mocha');

describe(function() {
  let grep;
  let retryEventSpy;
  let errorMatcher;

  before(function() {
    this.runTests = async options => {
      return await runTests(
        [path.resolve(__dirname, '../fixtures/retries-test.js')],
        {
          grep,
          ...options
        }
      );
    };

    retryEventSpy = sinon.spy();

    events.on(Runner.constants.EVENT_TEST_RETRY, retryEventSpy);

    errorMatcher = sinon.match.instanceOf(Error).and(sinon.match({
      code: 'ERR_ASSERTION'
    }));
  });

  beforeEach(function() {
    global.FAILURE_COUNT = 1;
  });

  afterEach(function() {
    delete global.FAILURE_COUNT;

    retryEventSpy.resetHistory();
  });

  after(function() {
    events.removeListener(Runner.constants.EVENT_TEST_RETRY, retryEventSpy);
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

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before all" hook' }),
        errorMatcher
      );
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);

      expect(retryEventSpy).to.have.not.been.called;
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(0);
      expect(stats.passes).to.equal(0);
      expect(stats.failures).to.equal(1);

      expect(retryEventSpy).to.have.not.been.called;
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

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before each" hook' }),
        errorMatcher
      );
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);

      expect(retryEventSpy).to.have.not.been.called;
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(0);
      expect(stats.passes).to.equal(0);
      expect(stats.failures).to.equal(1);

      expect(retryEventSpy).to.have.not.been.called;
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

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"after each" hook' }),
        errorMatcher
      );
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);

      expect(retryEventSpy).to.have.not.been.called;
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);

      expect(retryEventSpy).to.have.not.been.called;
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

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"after all" hook' }),
        errorMatcher
      );
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);

      expect(retryEventSpy).to.have.not.been.called;
    });

    it('can still fail', async function() {
      let stats = await this.runTests();

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);

      expect(retryEventSpy).to.have.not.been.called;
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

      expect(retryEventSpy).to.have.callCount(4);
    });

    it('works without errors', async function() {
      global.FAILURE_COUNT = 0;

      let stats = await this.runTests({
        retries: 4
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(0);

      expect(retryEventSpy).to.have.not.been.called;
    });

    it('can still fail', async function() {
      let stats = await this.runTests({
        retries: 3
      });

      expect(stats.tests).to.equal(1);
      expect(stats.passes).to.equal(1);
      expect(stats.failures).to.equal(1);

      expect(retryEventSpy).to.have.callCount(3);
    });
  });
});
