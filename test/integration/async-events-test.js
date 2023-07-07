'use strict';

const { describe, it, runTests, setUpObjectReset, events } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');
const sinon = require('sinon');
const { Runner } = require('mocha');
const {
  registerAsyncEvents,
  unregisterAsyncEvents
} = require('../..');

describe(function() {
  let asyncEventStub;
  let deferredPromise;

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpObjectReset(global);

  before(function() {
    this.runTests = async() => {
      let {
        promise,
        runner
      } = runTests.call(
        this,
        [path.resolve(__dirname, '../fixtures/async-events-test.js')]
      );

      try {
        registerAsyncEvents(runner);

        return await promise;
      } finally {
        await unregisterAsyncEvents(runner);
      }
    };

    asyncEventStub = sinon.stub().callsFake(async() => {
      // This is the only way to force the afterEach order,
      // for it to run after this (if it was going to).
      await new Promise(resolve => setTimeout(resolve, 2));

      deferredPromise.resolve();
    });

    global.afterEachSpy = sinon.spy();

    events.on(Runner.constants.EVENT_TEST_PASS, asyncEventStub);
  });

  beforeEach(async function() {
    let { default: pDefer } = await import('p-defer');

    deferredPromise = pDefer();
  });

  afterEach(function() {
    asyncEventStub.resetHistory();
  });

  after(function() {
    events.off(Runner.constants.EVENT_TEST_PASS, asyncEventStub);
  });

  it('works', async function() {
    let promise = this.runTests();

    await deferredPromise.promise;

    expect(global.afterEachSpy).to.not.have.been.called;

    let stats = await promise;

    expect(stats).matches(sinon.match({
      tests: 1,
      passes: 1
    }));

    expect(global.afterEachSpy).to.have.been.calledOnce;
  });
});
