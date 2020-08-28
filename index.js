'use strict';

const path = require('path');
const callsites = require('callsites');
const commondir = require('commondir');
const titleize = require('titleize');
const Mocha = require('mocha');
const EventEmitter = require('events');

const { Runner } = Mocha;

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
  prefix = ''
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
    }
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

      let mocha = Mocha[test];
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
    } catch (err) {
      this.skip();
    }
  };
}

// I wish mocha had "allow failures".
// https://github.com/mochajs/mocha/issues/1480#issuecomment-487074628
// https://github.com/mochajs/mocha/issues/2451#issuecomment-487074749
function allowFail(title, callback, ...args) {
  return Mocha.it.call(this, title, skipOnError(callback), ...args);
}

const events = new EventEmitter();

function wrapRetries(options) {
  return function wrapHook(hook) {
    return function mochaHook(callback, ...args) {
      return Mocha[hook].call(this, async function() {
        let start = new Date();

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            return await callback.call(this, arguments);
          } catch (err) {
            if (!options.retryHooks) {
              throw err;
            }

            let { test, currentTest } = this;

            let retries = currentTest.retries();
            let currentRetry = currentTest.currentRetry();
            if (retries === -1 || currentRetry === retries) {
              throw err;
            }

            currentTest.currentRetry(++currentRetry);

            events.emit(Runner.constants.EVENT_TEST_RETRY, test, err);

            // test.resetTimeout();
            // dirty hack because `resetTimeout` doesn't work the way you'd expect
            let duration = new Date() - start;
            let timeout = test.timeout();
            test.timeout(duration + timeout);
          }
        }
      }, ...args);
    };
  };
}

function install({ exports }, options) {
  let callerFilePath = callsites()[1].getFileName();

  options = {
    dirname: path.dirname(callerFilePath),
    ...options
  };

  let titleGeneratorResult = newTitleGenerator(options);

  let { getFilePathTitle } = titleGeneratorResult;

  let wrapMocha = wrapNewTitle(getFilePathTitle, options);

  for (let test of [
    'describe',
    'it'
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
    'after'
  ]) {
    exports[hook] = wrapHook(hook);
  }

  return titleGeneratorResult;
}

module.exports = install;
module.exports.isAlreadyInMocha = isAlreadyInMocha;
module.exports.formatTitle = formatTitle;
module.exports.titleSeparator = titleSep;
module.exports.events = events;
