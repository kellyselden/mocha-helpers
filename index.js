'use strict';

const path = require('path');
const callsites = require('callsites');
const commondir = require('commondir');
const titleize = require('titleize');

const titleSep = ' | ';

function isAlreadyInMocha() {
  return callsites().some(callsite => {
    let functionName = callsite.getFunctionName();
    if (functionName) {
      return /^context\.(describe|it)/.test(functionName);
    }
  });
}

function getNewTitle(suffix, dirname) {
  let callerFilePath = callsites()[2].getFileName();
  let baseDir = commondir([callerFilePath, dirname]);
  let testFilePath = callerFilePath.substr(baseDir.length + 1);
  let sections = testFilePath.replace(/-test\.js$/, '').split(path.sep);
  sections = sections.map(titleize);
  if (suffix) {
    sections.push(suffix);
  }
  return sections.join(titleSep);
}

function wrapDirname(dirname) {
  return function wrapMocha(mocha) {
    return function newMocha(title, callback) {
      if (!callback) {
        callback = title;
        title = '';
      } else if (typeof title === 'function') {
        title = title.name;
      }

      if (!isAlreadyInMocha()) {
        title = getNewTitle(title, dirname);
      }

      return mocha.call(mocha, title, callback);
    };
  };
}

module.exports = function install({ exports }, dirname) {
  let wrapMocha = wrapDirname(dirname);

  exports.describe = wrapMocha(describe);
  exports.describe.only = wrapMocha(describe.only);
  exports.describe.skip = wrapMocha(describe.skip);
  exports.it = wrapMocha(it);
  exports.it.only = wrapMocha(it.only);
  exports.it.skip = wrapMocha(it.skip);
}
