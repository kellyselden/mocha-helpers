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
      return /context\.(describe|it)/.test(functionName);
    }
  });
}

function getNewTitle(title, dirname, {
  titleSeparator = titleSep,
  titleize: _titleize = true
}) {
  let callerFilePath = callsites()[2].getFileName();
  let baseDir = commondir([callerFilePath, dirname]);
  let testFilePath = callerFilePath.substr(baseDir.length + 1);
  let sections = testFilePath.replace(/-test\.js$/, '').split(path.sep);
  if (_titleize) {
    sections = sections.map(titleize);
  }
  if (title) {
    sections[sections.length - 1] = title;
  }
  return sections.join(titleSeparator);
}

function wrapOptions(dirname, options = {}) {
  return function wrapMocha(mocha) {
    return function newMocha(title, callback) {
      if (!callback) {
        callback = title;
        title = '';
      } else if (typeof title === 'function') {
        title = title.name;
      }

      if (!isAlreadyInMocha()) {
        title = getNewTitle(title, dirname, options);
      }

      return mocha.call(mocha, title, callback);
    };
  };
}

module.exports = function install({ exports }, dirname, options) {
  let wrapMocha = wrapOptions(dirname, options);

  exports.describe = wrapMocha(describe);
  exports.describe.only = wrapMocha(describe.only);
  exports.describe.skip = wrapMocha(describe.skip);
  exports.it = wrapMocha(it);
  exports.it.only = wrapMocha(it.only);
  exports.it.skip = wrapMocha(it.skip);
}
