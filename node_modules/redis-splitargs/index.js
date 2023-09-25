'use strict';

module.exports = splitargs;

function splitargs(line) {
  var ret = [];
  if (!line || typeof line.length !== 'number') {
    return ret;
  }

  var len = line.length;
  var pos = 0;
  while (true) {
    // skip blanks
    while (pos < len && isspace(line[pos])) {
      pos += 1;
    }

    if (pos === len) {
      break;
    }

    var inq = false; // if we are in "quotes"
    var insq = false; // if we are in "single quotes"
    var done = false;
    var current = '';

    while (!done) {
      var c = line[pos];
      if (inq) {
        if (c === '\\' && (pos + 1) < len) {
          pos += 1;

          switch (line[pos]) {
            case 'n': c = '\n'; break;
            case 'r': c = '\r'; break;
            case 't': c = '\t'; break;
            case 'b': c = '\b'; break;
            case 'a': c = '\a'; break;
            default: c = line[pos]; break;
          }
          current += c;
        } else if (c === '"') {
          // closing quote must be followed by a space or
          // nothing at all.
          if (pos + 1 < len && !isspace(line[pos + 1])) {
            throw new Error('Expect \'"\' followed by a space or nothing, got \'' + line[pos + 1] + '\'.');
          }
          done = true;
        } else if (pos === len) {
          throw new Error('Unterminated quotes.');
        } else {
          current += c;
        }
      } else if (insq) {
        if (c === '\\' && line[pos + 1] === '\'') {
          pos += 1;
          current += '\'';
        } else if (c === '\'') {
          // closing quote must be followed by a space or
          // nothing at all.
          if (pos + 1 < len && !isspace(line[pos + 1])) {
            throw new Error('Expect "\'" followed by a space or nothing, got "' + line[pos + 1] + '".');
          }
          done = true;
        } else if (pos === len) {
          throw new Error('Unterminated quotes.');
        } else {
          current += c;
        }
      } else {
        if (pos === len) {
          done = true;
        } else {
          switch (c) {
          case ' ':
          case '\n':
          case '\r':
          case '\t':
            done = true;
            break;
          case '"':
            inq = 1;
            break;
          case '\'':
            insq = 1;
            break;
          default:
            current += c;
            break;
          }
        }
      }
      if (pos < len) {
        pos += 1;
      }
    }
    ret.push(current);
    current = '';
  }

  return ret;
}

function isspace(ch) {
  return (ch === ' ') || (ch === '\t') || (ch === '\n') || (ch === '\r') || (ch === '\v') || (ch === '\f');
}
