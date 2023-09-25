# splitargs
Splitting Redis arguments as redis-cli

[![Build Status](https://travis-ci.org/luin/splitargs.svg?branch=master)](https://travis-ci.org/luin/splitargs)
[![Join the chat at https://gitter.im/luin/splitargs](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/luin/splitargs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Install

```shell
$ npm install redis-splitargs
```

## Usage

```javascript
var s = require('redis-splitargs');

expect(s('set foo bar')).to.eql(['set', 'foo', 'bar']);
expect(s('set "foo bar"')).to.eql(['set', 'foo bar']);
expect(s('set "foo bar\\" baz"')).to.eql(['set', 'foo bar" baz']);
expect(s('set \\  bar')).to.eql(['set', '\\', 'bar']);
expect(s('  set    foo  \r \n  bar  \v ')).to.eql(['set', 'foo', 'bar']);
expect(s('"set" "foo" "bar"')).to.eql(['set', 'foo', 'bar']);

expect(function () { s('set foo "bar'); }).to.throw();
expect(function () { s('set foo "bar"dsf'); }).to.throw();
expect(function () { s("set foo 'bar"); }).to.throw();
```
