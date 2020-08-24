'use strict';

const path = require('path');
const callsites = require('callsites');
const commondir = require('commondir');
const titleize = require('titleize');
const Mocha = require('mocha');
const clearModule = require('clear-module');

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
  return function wrapMocha(mocha) {
    mocha.titleSeparator = options.titleSeparator;

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
  return global.it.call(this, title, skipOnError(callback), ...args);
}

function wrapHook(hook, options) {
  return function mochaHook(callback, ...args) {
    return global[hook].call(this, async function() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          return await callback.call(this, arguments);
        } catch (err) {
          if (!options.retryHooks) {
            throw err;
          }

          let { currentTest } = this;
          let retries = currentTest.retries();
          let currentRetry = currentTest.currentRetry();
          if (retries === -1 || currentRetry === retries) {
            throw err;
          }

          currentTest.currentRetry(++currentRetry);
        }
      }
    }, ...args);
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
    exports[test] = wrapMocha(global[test]);
    exports[test].only = wrapMocha(global[test].only);
    exports[test].skip = wrapMocha(global[test].skip);
  }

  exports.it.allowFail = allowFail;

  for (let hook of [
    'before',
    'beforeEach',
    'afterEach',
    'after'
  ]) {
    exports[hook] = wrapHook(hook, options);
  }

  return titleGeneratorResult;
}

async function runTests(files, options) {
  let mocha = new Mocha(options);

  for (let file of files) {
    mocha.addFile(file);
  }

  let runner;

  await new Promise(resolve => {
    // `mocha.run` is synchronous if no tests were found,
    // otherwise, it's asynchronous...
    runner = mocha.run(resolve);
  });

  return runner.stats;
}

function setUpRunner() {
  Mocha.before(function() {
    this.runTests = runTests;
  });

  Mocha.afterEach(function() {
    // unfortunately, mocha caches previously run files,
    // even though it is a new instance...
    // https://github.com/mochajs/mocha/blob/v6.2.0/lib/mocha.js#L334
    clearModule.all();
  });
}

module.exports = install;
module.exports.isAlreadyInMocha = isAlreadyInMocha;
module.exports.formatTitle = formatTitle;
module.exports.titleSeparator = titleSep;
module.exports.setUpRunner = setUpRunner;
