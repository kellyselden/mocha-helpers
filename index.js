'use strict';

const path = require('path');
const callsites = require('callsites');
const commondir = require('commondir');
const titleize = require('titleize');
const { Runner, Test } = require('mocha');
const EventEmitter = require('events-async');
const { promisify } = require('util');

const titleSep = ' | ';

function isAlreadyInMocha() {
  return callsites().some(callsite => {
    let functionName = callsite.getFunctionName();
    if (functionName) {
      return /context\.(describe|it)/.test(functionName);
    }
  });
}

function newTitleGenerator({
  dirname,
  titleSeparator = titleSep,
  titleize: _titleize = true,
  prefix = '',
}) {
  return {
    titleSeparator,
    getFilePathTitle(suffix) {
      let callerFilePath = callsites()[2].getFileName();
      let baseDir = commondir([callerFilePath, dirname]);
      let testFilePath = callerFilePath.substr(baseDir.length + 1);
      let sections = [];
      if (prefix) {
        sections.push(prefix);
      }
      sections = sections.concat(testFilePath.replace(/-test\.js$/, '').split(path.sep));
      if (_titleize) {
        sections = sections.map(titleize);
      }
      if (suffix !== undefined && suffix !== null) {
        sections.pop();
        if (suffix) {
          sections.push(suffix);
        }
      }
      return sections.join(titleSeparator);
    },
  };
}

function formatTitle(title) {
  if (typeof title === 'function') {
    if (!title.name) {
      throw new Error('Passed a function with no name.');
    }

    title = title.name;
  }

  return title;
}

function wrapNewTitle(getFilePathTitle, options) {
  return function wrapMocha(test, modifier) {
    return function newMocha(title, callback) {
      if (!callback && typeof title !== 'string') {
        callback = title;
        title = null;
      } else {
        title = formatTitle(title);
      }

      if (!isAlreadyInMocha()) {
        title = getFilePathTitle(title);
      }

      let mocha = global[test];
      if (modifier) {
        mocha = mocha[modifier];
      }

      mocha.titleSeparator = options.titleSeparator;

      return mocha.call(mocha, title, callback);
    };
  };
}

function skipOnError(callback) {
  return async function() {
    try {
      await callback.apply(this, arguments);
    } catch {
      this.skip();
    }
  };
}

// I wish mocha had "allow failures".
// https://github.com/mochajs/mocha/issues/1480#issuecomment-487074628
// https://github.com/mochajs/mocha/issues/2451#issuecomment-487074749
function allowFail(title, callback, ...args) {
  return global.it.call(this, title, skipOnError(callback), ...args);
}

const events = new EventEmitter();

function wrapRetries(options) {
  function clone(hook) {
    hook.retriedTest = () => {};
    let clone = Test.prototype.clone.call(hook);
    delete hook.retriedTest;
    clone.type = hook.type;
    return clone;
  }

  return function wrapHook(hook) {
    return function mochaHook(callback, ...args) {
      return global[hook].call(this, async function() {
        let start = new Date();

        let { test } = this;
        let { callback: testCallback, _timeoutError } = test;

        // `Runnable` keeps the original test start time in private scope
        // and tries to detect a timeout on test finish based on
        // what it thinks the duration is. So we have to extend the
        // duration calculation based on any timed out retries.
        let timeoutOffset = 0;

        function isFinalRetry(currentRetry) {
          let retries = test.retries();
          return retries === -1 || currentRetry === retries;
        }

        function shouldRetry() {
          if (!options.retryHooks) {
            return false;
          }

          if (test.timedOut) {
            return false;
          }

          let currentRetry = test.currentRetry();
          if (isFinalRetry(currentRetry)) {
            return false;
          }

          return true;
        }

        async function setUpRetryAndClone(err) {
          await events.emit(Runner.constants.EVENT_TEST_RETRY, test, err);

          let currentRetry = test.currentRetry();
          test.currentRetry(++currentRetry);

          // test.resetTimeout();
          // dirty hack because `resetTimeout` doesn't work the way you'd expect
          timeoutOffset = new Date() - start;

          let _clone = clone(test);

          let run = promisify(_clone.run.bind(_clone));

          return run;
        }

        function resetOverrides() {
          test.callback = testCallback;
          test._timeoutError = _timeoutError;
        }

        test._timeoutError = function(ms) {
          let isCalledFromSetTimeout = test.duration === undefined;
          if (isCalledFromSetTimeout || test.duration - timeoutOffset > ms) {
            return _timeoutError.apply(this, arguments);
          }
        };

        test.callback = async function(err) {
          if (!shouldRetry()) {
            resetOverrides();

            return testCallback.apply(this, arguments);
          }

          let run = await setUpRetryAndClone(err);

          await run(function() {
            // The original test that timed out needs to be reset
            // so it can properly finish.
            let {
              timedOut,
              _timeout,
            } = test;
            Object.assign(test, {
              timedOut: false,
              _timeout: Number.MAX_SAFE_INTEGER,
            });

            let returnValue = testCallback.apply(this, arguments);

            // Then mark it timed out again. In case the original
            // timed out hook ever completes, we want it to early exit
            // in its callback.
            Object.assign(test, {
              timedOut,
              _timeout,
            });

            return returnValue;
          });
        };

        await waitForPromisesToFlushBetweenTests();

        try {
          return await callback.call(this, arguments);
        } catch (err) {
          if (!shouldRetry()) {
            throw err;
          }

          test.clearTimeout();

          let run = await setUpRetryAndClone(err);

          await run();
        }
      }, ...args);
    };
  };
}

/**
 * @param {*} obj
 * @param {Object} options
 * @param {(callback: () => void) => void} options.beforeAll
 * @param {(callback: () => void) => void} options.afterEach
 */
function setUpObjectReset(obj, {
  beforeAll = global.before,
  afterEach = global.afterEach,
} = {}) {
  let original;
  let list;

  beforeAll(function() {
    original = {};
    list = new Set(Object.keys(obj));
    for (let k of list) {
      original[k] = obj[k];
    }
  });

  afterEach(function() {
    for (let k of Object.keys(obj)) {
      if (!list.has(k)) {
        delete obj[k];
      }
    }
    for (let k of list) {
      if (obj[k] !== original[k]) {
        obj[k] = original[k];
      }
    }
  });
}

function setUpCwdReset() {
  let original;

  global.before(function() {
    original = process.cwd();
  });

  global.afterEach(function() {
    process.chdir(original);
  });
}

function setUpTmpDir() {
  // eslint-disable-next-line prefer-let/prefer-let
  const createTmpDir = promisify(require('tmp').dir);

  global.beforeEach(async function() {
    this.tmpPath = await createTmpDir();
  });
}

function install({ exports }, options) {
  let callerFilePath = callsites()[1].getFileName();

  options = {
    dirname: path.dirname(callerFilePath),
    ...options,
  };

  let titleGeneratorResult = newTitleGenerator(options);

  let { getFilePathTitle } = titleGeneratorResult;

  let wrapMocha = wrapNewTitle(getFilePathTitle, options);

  for (let test of [
    'describe',
    'it',
  ]) {
    exports[test] = wrapMocha(test);
    exports[test].only = wrapMocha(test, 'only');
    exports[test].skip = wrapMocha(test, 'skip');
  }

  exports.it.allowFail = allowFail;

  let wrapHook = wrapRetries(options);

  for (let hook of [
    'before',
    'beforeEach',
    'afterEach',
    'after',
  ]) {
    exports[hook] = wrapHook(hook);
  }

  Object.assign(exports, {
    setUpObjectReset,
    setUpCwdReset,
    setUpTmpDir,
  });

  return titleGeneratorResult;
}

let promisesToFlushBetweenTests = [];
let promiseErrorsBetweenTests = [];

async function waitForPromisesToFlushBetweenTests() {
  await Promise.all(promisesToFlushBetweenTests);

  promisesToFlushBetweenTests = [];
}

const asyncEventsCallbacks = new Map();

function registerAsyncEvents(runner) {
  for (let eventName of Object.values(Runner.constants)) {
    if (asyncEventsCallbacks.has(eventName)) {
      throw new Error(`You already called "${registerAsyncEvents.name}". You must call "${unregisterAsyncEvents.name}" first.`);
    }

    function callback() {
      let promise = events.emit(eventName, ...arguments);

      // Mocha inspects the Promise rejection queue on exit or something.
      // We can't leave any rejecting promises for later.
      promise = promise.catch(err => promiseErrorsBetweenTests.push(err));

      // This allows us to wait for promises before continuing
      // when using Mocha's synchronous events.
      promisesToFlushBetweenTests.push(promise);
    }

    asyncEventsCallbacks.set(eventName, callback);

    runner.on(eventName, callback);
  }
}

async function unregisterAsyncEvents(runner) {
  for (let eventName of Object.values(Runner.constants)) {
    if (!asyncEventsCallbacks.has(eventName)) {
      throw new Error(`You must call "${registerAsyncEvents.name}" first.`);
    }

    let callback = asyncEventsCallbacks.get(eventName);

    asyncEventsCallbacks.delete(eventName);

    runner.off(eventName, callback);
  }

  await waitForPromisesToFlushBetweenTests();

  try {
    if (promiseErrorsBetweenTests.length) {
      throw promiseErrorsBetweenTests[0];
    }
  } finally {
    promiseErrorsBetweenTests = [];
  }
}

module.exports = Object.assign(install, {
  // make it easier to import in ESM/TS
  default: install,

  isAlreadyInMocha,
  formatTitle,
  titleSeparator: titleSep,
  events,
  setUpObjectReset,
  setUpCwdReset,
  setUpTmpDir,
  registerAsyncEvents,
  unregisterAsyncEvents,
});
