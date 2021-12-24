# mocha-helpers

[![npm version](https://badge.fury.io/js/mocha-helpers.svg)](https://badge.fury.io/js/mocha-helpers)

Mocha convenience helpers

## Usage

Place this file somewhere in your test directory:

```js
// test/helpers/mocha.js
require('mocha-helpers')(module);
```

Then use it via:

```js
// test/unit/my-file/my-function-test.js
const { describe, it } = require('../../helpers/mocha');
const { myFunction } = require('my-file');

describe(function() {
  it(myFunction, function() {
    // stuff
  });

  it.allowFail('skip on error', function() {
    assert.ok(false);
  });
});
```

Prints:

```
  Unit | My-File
    ✓ myFunction
```

## Retry Hooks

Make hooks follow `--retries` logic. https://github.com/mochajs/mocha/issues/2127.

```js
// test/helpers/mocha.js
require('mocha-helpers')(module, {
  retryHooks: true
});
```

Then use it via:

```js
// test/my-test.js
const { describe, beforeEach } = require('./helpers/mocha');

describe(function() {
  let retries = 0;
  beforeEach(function() {
    if (retries++ < 1) {
      throw new Error();
    }
  });

  it('works', function() {
    // stuff
  });
});
```

```
mocha test/my-test.js --retries 1
```

Prints:

```
  My-Test
    ✓ works
```

## Options

```js
require('mocha-helpers')(module, {
  dirname: __dirname,
  titleSeparator: ' | ',
  titleize: true,
  prefix: '',
  retryHooks: false
});
```
