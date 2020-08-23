'use strict';

require('../..')(module);

const Mocha = require('mocha');
const clearModule = require('clear-module');

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

module.exports.setUpRunner = setUpRunner;
