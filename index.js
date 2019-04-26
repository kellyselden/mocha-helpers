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
  if (title !== undefined && title !== null) {
    sections.pop();
    if (title) {
      sections.push(title);
    }
  }
  return sections.join(titleSeparator);
}

function wrapOptions(dirname, options = {}) {
  return function wrapMocha(mocha) {
    return function newMocha(title, callback) {
      if (!callback) {
        callback = title;
        title = null;
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

function skipOnError(callback) {
  return function() {
    return Promise.resolve().then(() => {
      return callback.apply(this, arguments);
    }).catch(() => {
      this.skip();
    });
  };
}

// I wish mocha had "allow failures".
// https://github.com/mochajs/mocha/issues/1480#issuecomment-487074628
// https://github.com/mochajs/mocha/issues/2451#issuecomment-487074749
function allowFail(title, callback) {
  it(title, skipOnError(callback));
}

module.exports = function install({ exports }, dirname, options) {
  let wrapMocha = wrapOptions(dirname, options);

  exports.describe = wrapMocha(describe);
  exports.describe.only = wrapMocha(describe.only);
  exports.describe.skip = wrapMocha(describe.skip);
  exports.it = wrapMocha(it);
  exports.it.only = wrapMocha(it.only);
  exports.it.skip = wrapMocha(it.skip);

  exports.it.allowFail = allowFail;
}
