# mocha-helpers

[![npm version](https://badge.fury.io/js/mocha-helpers.svg)](https://badge.fury.io/js/mocha-helpers)
[![Build Status](https://travis-ci.org/kellyselden/mocha-helpers.svg?branch=master)](https://travis-ci.org/kellyselden/mocha-helpers)

Mocha convenience helpers

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

## Options

```js
require('mocha-helpers')(module, {
  dirname: __dirname,
  titleSeparator: ' | ',
  titleize: true,
  prefix: ''
});
```
