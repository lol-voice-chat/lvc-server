'use strict';

var s = require('..');
var expect = require('chai').expect;

describe('splitargs', function () {
  it('should return result correctly', function () {
    expect(s('set foo bar')).to.eql(['set', 'foo', 'bar']);
    expect(s('set "foo bar"')).to.eql(['set', 'foo bar']);
    expect(s('set "foo bar\\" baz"')).to.eql(['set', 'foo bar" baz']);
    expect(s('set \\  bar')).to.eql(['set', '\\', 'bar']);
    expect(s('  set    foo  \r \n  bar  \v ')).to.eql(['set', 'foo', 'bar']);
    expect(s('"set" "foo" "bar"')).to.eql(['set', 'foo', 'bar']);

    expect(function () { s('set foo "bar'); }).to.throw();
    expect(function () { s('set foo "bar"dsf'); }).to.throw();
    expect(function () { s("set foo 'bar"); }).to.throw();
  });
});
