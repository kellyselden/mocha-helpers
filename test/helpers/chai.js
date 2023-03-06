'use strict';

const chai = require('chai');
const sinon = require('sinon');

chai.use(require('sinon-chai'));

// This should be replaced by Chai v5
// https://github.com/chaijs/chai/issues/644
chai.use((_chai, utils) => {
  chai.Assertion.addMethod('matches', function match(expectedMatch) {
    let subject = utils.flag(this, 'object');
    let spy = sinon.spy();
    spy(subject);
    try {
      sinon.assert.calledWithMatch(spy, expectedMatch);
    } catch (error) {
      error.name = 'MatchAssertionError';
      error.message = error.message.replace(
        /^expected spy to be called with match/,
        `expected ${utils.objDisplay(subject)} to match`
      );
      throw error;
    }
  });
});

module.exports = chai;
