'use strict';

const { describe, it, setUpObjectReset } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const sinon = require('sinon');

describe(setUpObjectReset, function() {
  describe('standard', function() {
    let original = {
      foo: 'foo',
    };

    // eslint-disable-next-line mocha/no-setup-in-describe
    Object.defineProperty(original, 'bar', {
      value: 'bar',
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    setUpObjectReset(original);

    afterEach(function() {
      expect(original.foo).to.equal('foo');
      expect(original.bar).to.equal('bar');
      expect(original).to.not.have.property('baz');
    });

    it('resets properties', function() {
      original.foo = 'bar';
    });

    it('adds deleted properties back', function() {
      delete original.foo;
    });

    it('deletes added properties', function() {
      original.baz = 'baz';
    });
  });

  describe('custom lifecycle hooks', function() {
    it('works', function() {
      let original = {
        foo: 'foo',
      };

      let beforeAll = sinon.stub();
      let afterEach = sinon.stub();

      setUpObjectReset(original, {
        beforeAll,
        afterEach,
      });

      expect(beforeAll).to.have.been.calledOnce;
      expect(afterEach).to.have.been.calledOnce;

      beforeAll.args[0][0]();

      delete original.foo;

      afterEach.args[0][0]();

      expect(original.foo).to.equal('foo');
    });
  });
});
