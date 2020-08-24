'use strict';

require('../..')(module);

const Mocha = require('mocha');

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

  // unfortunately, mocha caches previously run files,
  // even though it is a new instance...
  // https://github.com/mochajs/mocha/blob/v6.2.0/lib/mocha.js#L334
  mocha.unloadFiles();

  return runner.stats;
}

module.exports.runTests = runTests;
module.exports.events = require('../..').events;
