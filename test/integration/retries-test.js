'use strict';

const { describe, it, runTests, setUpObjectReset, events } = require('../helpers/mocha');
const { expect } = require('../helpers/chai');
const path = require('path');
const sinon = require('sinon');
const { Runner } = require('mocha');

describe(function() {
  let grep;
  let retryEventSpy;
  let errorMatcher;
  let timeoutMatcher;

  // eslint-disable-next-line mocha/no-setup-in-describe
  setUpObjectReset(global);

  before(function() {
    this.runTests = async options => {
      return await runTests.call(
        this,
        [path.resolve(__dirname, '../fixtures/retries-test.js')],
        {
          grep,
          ...options
        }
      ).promise;
    };

    retryEventSpy = sinon.spy();

    events.on(Runner.constants.EVENT_TEST_RETRY, retryEventSpy);

    errorMatcher = sinon.match.instanceOf(Error).and(sinon.match({
      code: 'ERR_ASSERTION'
    }));
    timeoutMatcher = sinon.match.instanceOf(Error).and(sinon.match({
      message: sinon.match('Timeout of 10ms exceeded.')
    }));
  });

  beforeEach(function() {
    global.FAILURE_COUNT = 1;
  });

  afterEach(function() {
    retryEventSpy.resetHistory();
  });

  after(function() {
    events.removeListener(Runner.constants.EVENT_TEST_RETRY, retryEventSpy);
  });

  describe('errors', function() {
    describe('before', function() {
      before(function() {
        grep = 'errors before works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"before all" hook in "before"' }),
          errorMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 0,
          passes: 0,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('beforeEach', function() {
      before(function() {
        grep = 'errors beforeEach works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"before each" hook in "beforeEach"' }),
          errorMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 0,
          passes: 0,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('afterEach', function() {
      before(function() {
        grep = 'errors afterEach works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"after each" hook in "afterEach"' }),
          errorMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('after', function() {
      before(function() {
        grep = 'errors after works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"after all" hook in "after"' }),
          errorMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('multiple errors in different hooks', function() {
      before(function() {
        grep = 'errors multiple works$';
      });

      it('works', async function() {
        global.BEFORE_FAILURE_COUNT = 1;
        global.BEFORE_EACH_FAILURE_COUNT = 1;
        global.AFTER_EACH_FAILURE_COUNT = 1;
        global.AFTER_FAILURE_COUNT = 1;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.callCount(4);
      });

      it('works without errors', async function() {
        global.BEFORE_FAILURE_COUNT = 0;
        global.BEFORE_EACH_FAILURE_COUNT = 0;
        global.AFTER_EACH_FAILURE_COUNT = 0;
        global.AFTER_FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        global.BEFORE_FAILURE_COUNT = 1;
        global.BEFORE_EACH_FAILURE_COUNT = 1;
        global.AFTER_EACH_FAILURE_COUNT = 1;
        global.AFTER_FAILURE_COUNT = 2;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.callCount(4);
      });
    });
  });

  describe('timeouts', function() {
    describe('before', function() {
      before(function() {
        grep = 'timeouts before works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"before all" hook in "before"' }),
          timeoutMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 0,
          passes: 0,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('beforeEach', function() {
      before(function() {
        grep = 'timeouts beforeEach works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"before each" hook in "beforeEach"' }),
          timeoutMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 0,
          passes: 0,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('afterEach', function() {
      before(function() {
        grep = 'timeouts afterEach works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"after each" hook in "afterEach"' }),
          timeoutMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('after', function() {
      before(function() {
        grep = 'timeouts after works$';
      });

      it('works', async function() {
        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
          sinon.match({ title: '"after all" hook in "after"' }),
          timeoutMatcher
        );
      });

      it('works without errors', async function() {
        global.FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        let stats = await this.runTests();

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });
    });

    describe('multiple timeouts in different hooks', function() {
      before(function() {
        grep = 'timeouts multiple works$';
      });

      it('works', async function() {
        global.BEFORE_FAILURE_COUNT = 1;
        global.BEFORE_EACH_FAILURE_COUNT = 1;
        global.AFTER_EACH_FAILURE_COUNT = 1;
        global.AFTER_FAILURE_COUNT = 1;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.callCount(4);
      });

      it('works without errors', async function() {
        global.BEFORE_FAILURE_COUNT = 0;
        global.BEFORE_EACH_FAILURE_COUNT = 0;
        global.AFTER_EACH_FAILURE_COUNT = 0;
        global.AFTER_FAILURE_COUNT = 0;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 0
        }));

        expect(retryEventSpy).to.have.not.been.called;
      });

      it('can still fail', async function() {
        global.BEFORE_FAILURE_COUNT = 1;
        global.BEFORE_EACH_FAILURE_COUNT = 1;
        global.AFTER_EACH_FAILURE_COUNT = 1;
        global.AFTER_FAILURE_COUNT = 2;

        let stats = await this.runTests({
          retries: 1
        });

        expect(stats).matches(sinon.match({
          tests: 1,
          passes: 1,
          failures: 1
        }));

        expect(retryEventSpy).to.have.callCount(4);
      });
    });
  });

  describe('errors and timeouts', function() {
    it('resets timeout', async function() {
      grep = 'errors and timeouts resets timeout works$';

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats).matches(sinon.match({
        tests: 1,
        passes: 1,
        failures: 0
      }));

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before each" hook in "resets timeout"' }),
        errorMatcher
      );
    });

    it('doesn\'t go on forever', async function() {
      grep = 'errors and timeouts resets timeout works$';

      global.FAILURE_COUNT = 2;

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats).matches(sinon.match({
        tests: 0,
        passes: 0,
        failures: 1
      }));

      expect(retryEventSpy).to.have.been.calledOnce;
    });

    it('error after timeout', async function() {
      grep = 'errors and timeouts error after timeout works$';

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats).matches(sinon.match({
        tests: 0,
        passes: 0,
        failures: 1
      }));

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before each" hook for "works"' }),
        timeoutMatcher
      );
    });

    it('time out after error', async function() {
      grep = 'errors and timeouts time out after error works$';

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats).matches(sinon.match({
        tests: 0,
        passes: 0,
        failures: 1
      }));

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before each" hook for "works"' }),
        errorMatcher
      );
    });

    it('missing currentTest', async function() {
      grep = 'errors and timeouts missing currentTest describe works$';

      let stats = await this.runTests({
        retries: 1
      });

      expect(stats).matches(sinon.match({
        tests: 1,
        passes: 1,
        failures: 0
      }));

      expect(retryEventSpy).to.have.been.calledOnce.and.calledWith(
        sinon.match({ title: '"before all" hook in "missing currentTest"' }),
        errorMatcher
      );
    });
  });
});
