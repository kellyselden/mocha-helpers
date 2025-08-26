'use strict';

require('../..')(module);

const Mocha = require('mocha');

function runTests(files, options) {
  let mocha = new Mocha({
    timeout: this._runnable._timeout,
    ...options,
  });

  for (let file of files) {
    mocha.addFile(file);
  }

  let runner;

  let promise = (async() => {
    try {
      await new Promise((resolve, reject) => {
        try {
          // `mocha.run` is synchronous if no tests were found,
          // otherwise, it's asynchronous...
          runner = mocha.run(resolve);
        } catch (err) {
          reject(err);
        }
      });
    } finally {
      // unfortunately, mocha caches previously run files,
      // even though it is a new instance...
      // https://github.com/mochajs/mocha/blob/v6.2.0/lib/mocha.js#L334
      mocha.unloadFiles();
    }

    return runner.stats;
  })();

  return {
    promise,
    runner,
  };
}

module.exports.runTests = runTests;
module.exports.events = require('../..').events;
