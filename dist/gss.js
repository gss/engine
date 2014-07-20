/* gss-engine - version 1.0.4-beta (2014-07-20) - http://gridstylesheets.org */
;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("the-gss-error-reporter/lib/error-reporter.js", function(exports, require, module){
var ErrorReporter,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ErrorReporter = (function() {
  ErrorReporter.prototype._sourceCode = null;

  function ErrorReporter(sourceCode) {
    this.reportError = __bind(this.reportError, this);
    if (sourceCode == null) {
      throw new Error('Source code not provided');
    }
    if (toString.call(sourceCode) !== '[object String]') {
      throw new TypeError('Source code must be a string');
    }
    this._sourceCode = sourceCode;
  }

  ErrorReporter.prototype.reportError = function(message, lineNumber, columnNumber) {
    var condition, context, currentLine, error, errorLocator, gutterValue, item, lastLineNumber, lineValue, lines, longestLineNumberLength, nextLineIndex, nextLineNumber, padding, previousLineIndex, previousLineNumber, _i, _len;
    if (message == null) {
      throw new Error('Message not provided');
    }
    if (toString.call(message) !== '[object String]') {
      throw new TypeError('Message must be a string');
    }
    if (message.length === 0) {
      throw new Error('Message must not be empty');
    }
    if (lineNumber == null) {
      throw new Error('Line number not provided');
    }
    if (toString.call(lineNumber) !== '[object Number]') {
      throw new TypeError('Line number must be a number');
    }
    if (lineNumber <= 0) {
      throw new RangeError('Line number is invalid');
    }
    if (columnNumber == null) {
      throw new Error('Column number not provided');
    }
    if (toString.call(columnNumber) !== '[object Number]') {
      throw new TypeError('Column number must be a number');
    }
    if (columnNumber <= 0) {
      throw new RangeError('Column number is invalid');
    }
    lines = this._sourceCode.split('\n');
    if (lineNumber > lines.length) {
      throw new RangeError('Line number is out of range');
    }
    currentLine = lines[lineNumber - 1];
    if (columnNumber > currentLine.length) {
      throw new RangeError('Column number is out of range');
    }
    error = [];
    error.push("Error on line " + lineNumber + ", column " + columnNumber + ": " + message);
    error.push('');
    previousLineNumber = lineNumber - 1;
    nextLineNumber = lineNumber + 1;
    if (previousLineNumber - 1 >= 0) {
      previousLineIndex = previousLineNumber - 1;
    }
    if (nextLineNumber - 1 <= lines.length - 1) {
      nextLineIndex = nextLineNumber - 1;
    }
    lastLineNumber = nextLineIndex != null ? nextLineNumber : lineNumber;
    longestLineNumberLength = ("" + lastLineNumber).length;
    errorLocator = "" + (Array(columnNumber).join('-')) + "^";
    context = [];
    context.push([previousLineNumber, lines[previousLineIndex], previousLineIndex != null]);
    context.push([lineNumber, currentLine, true]);
    context.push(['^', errorLocator, true]);
    context.push([nextLineNumber, lines[nextLineIndex], nextLineIndex != null]);
    for (_i = 0, _len = context.length; _i < _len; _i++) {
      item = context[_i];
      gutterValue = item[0];
      lineValue = item[1];
      condition = item[2];
      padding = Array(longestLineNumberLength - ("" + gutterValue).length + 1).join(' ');
      gutterValue = "" + padding + gutterValue;
      if (condition) {
        error.push("" + gutterValue + " : " + lineValue);
      }
    }
    console.error(error.join('\n'));
    throw new Error(message);
  };

  return ErrorReporter;

})();

module.exports = ErrorReporter;

});
require.register("the-gss-preparser/lib/parser.js", function(exports, require, module){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = [],
        peg$c2 = function(s) {return s},
        peg$c3 = { type: "other", description: "Statement" },
        peg$c4 = { type: "other", description: "Nested Statement" },
        peg$c5 = { type: "other", description: "CCSS" },
        peg$c6 = function(ccss) { 
            return {type:'constraint', cssText: p.stringify(ccss)}; 
          },
        peg$c7 = "@",
        peg$c8 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c9 = null,
        peg$c10 = "-gss-",
        peg$c11 = { type: "literal", value: "-gss-", description: "\"-gss-\"" },
        peg$c12 = "stay",
        peg$c13 = { type: "literal", value: "stay", description: "\"stay\"" },
        peg$c14 = function(stay) { 
            return {type:'constraint', cssText: p.stringify(stay)}; 
          },
        peg$c15 = "chain",
        peg$c16 = { type: "literal", value: "chain", description: "\"chain\"" },
        peg$c17 = function(chain) { 
            return {type:'constraint', cssText: p.stringify(chain)}; 
          },
        peg$c18 = "for-each",
        peg$c19 = { type: "literal", value: "for-each", description: "\"for-each\"" },
        peg$c20 = "for-all",
        peg$c21 = { type: "literal", value: "for-all", description: "\"for-all\"" },
        peg$c22 = /^[^`]/,
        peg$c23 = { type: "class", value: "[^`]", description: "[^`]" },
        peg$c24 = "```",
        peg$c25 = { type: "literal", value: "```", description: "\"```\"" },
        peg$c26 = function(forlooper) { 
            return {type:'constraint', cssText: p.stringify(forlooper)}; 
          },
        peg$c27 = /^[a-zA-Z0-9_#.[\]\-""' *+\/$\^~%\\()~]/,
        peg$c28 = { type: "class", value: "[a-zA-Z0-9_#.[\\]\\-\"\"' *+\\/$\\^~%\\\\()~]", description: "[a-zA-Z0-9_#.[\\]\\-\"\"' *+\\/$\\^~%\\\\()~]" },
        peg$c29 = "::",
        peg$c30 = { type: "literal", value: "::", description: "\"::\"" },
        peg$c31 = ":",
        peg$c32 = { type: "literal", value: ":", description: "\":\"" },
        peg$c33 = /^[a-zA-Z0-9_\-]/,
        peg$c34 = { type: "class", value: "[a-zA-Z0-9_\\-]", description: "[a-zA-Z0-9_\\-]" },
        peg$c35 = "(",
        peg$c36 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c37 = ">=",
        peg$c38 = { type: "literal", value: ">=", description: "\">=\"" },
        peg$c39 = "==",
        peg$c40 = { type: "literal", value: "==", description: "\"==\"" },
        peg$c41 = "<=",
        peg$c42 = { type: "literal", value: "<=", description: "\"<=\"" },
        peg$c43 = "=>",
        peg$c44 = { type: "literal", value: "=>", description: "\"=>\"" },
        peg$c45 = "=<",
        peg$c46 = { type: "literal", value: "=<", description: "\"=<\"" },
        peg$c47 = { type: "other", description: "Contextual CCSS Statement" },
        peg$c48 = /^[a-zA-Z0-9\-_$]/,
        peg$c49 = { type: "class", value: "[a-zA-Z0-9\\-_$]", description: "[a-zA-Z0-9\\-_$]" },
        peg$c50 = function(prop, op, tail) {
              return {type:'constraint', cssText: "::["+p.trim(prop)+"]"+" "+op+" "+p.stringify(tail)};
            },
        peg$c51 = { type: "other", description: "CSS Line" },
        peg$c52 = function(key, val) { return {type:'style', key:key, val:val}; },
        peg$c53 = "@-gss-",
        peg$c54 = { type: "literal", value: "@-gss-", description: "\"@-gss-\"" },
        peg$c55 = "horizontal",
        peg$c56 = { type: "literal", value: "horizontal", description: "\"horizontal\"" },
        peg$c57 = "vertical",
        peg$c58 = { type: "literal", value: "vertical", description: "\"vertical\"" },
        peg$c59 = "h",
        peg$c60 = { type: "literal", value: "h", description: "\"h\"" },
        peg$c61 = "v",
        peg$c62 = { type: "literal", value: "v", description: "\"v\"" },
        peg$c63 = function(vfl) { return ['vfl', parser.stringify(vfl)]; },
        peg$c64 = "layout",
        peg$c65 = { type: "literal", value: "layout", description: "\"layout\"" },
        peg$c66 = "template",
        peg$c67 = { type: "literal", value: "template", description: "\"template\"" },
        peg$c68 = function(gtl) { return ['gtl', parser.stringify(gtl)]; },
        peg$c69 = function(block) { return ['css', parser.stringify(block)]; },
        peg$c70 = { type: "other", description: "Ruleset" },
        peg$c71 = function(sel, s) {
            return {type:'ruleset',selectors:sel,rules:s};
          },
        peg$c72 = { type: "other", description: "Directive" },
        peg$c73 = /^[^@{};]/,
        peg$c74 = { type: "class", value: "[^@{};]", description: "[^@{};]" },
        peg$c75 = function(name, terms, s) {
            var o;
            o = {type:'directive',name:p.trim(name),terms:p.trim(terms)};
            if (!!s) {o.rules = s;}
            return o;
          },
        peg$c76 = function(name, terms) {
            var o;
            o = {type:'directive',name:p.trim(name),terms:p.trim(terms)};    
            return o;
          },
        peg$c77 = { type: "other", description: "Directive Name" },
        peg$c78 = function(name) {return p.trim(name);},
        peg$c79 = { type: "other", description: "Statement Blocks" },
        peg$c80 = "{",
        peg$c81 = { type: "literal", value: "{", description: "\"{\"" },
        peg$c82 = "}",
        peg$c83 = { type: "literal", value: "}", description: "\"}\"" },
        peg$c84 = function(s) {return s;},
        peg$c85 = { type: "other", description: "SelectorList" },
        peg$c86 = function(sel, sels) {return [sel].concat(sels)},
        peg$c87 = ",",
        peg$c88 = { type: "literal", value: ",", description: "\",\"" },
        peg$c89 = function(sel) {return sel},
        peg$c90 = { type: "other", description: "Selector" },
        peg$c91 = /^[^@{},;]/,
        peg$c92 = { type: "class", value: "[^@{},;]", description: "[^@{},;]" },
        peg$c93 = function(sel) {return sel.join("").trim()},
        peg$c94 = { type: "other", description: "Comment" },
        peg$c95 = "/*",
        peg$c96 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c97 = /^[^*]/,
        peg$c98 = { type: "class", value: "[^*]", description: "[^*]" },
        peg$c99 = "*",
        peg$c100 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c101 = /^[^\/*]/,
        peg$c102 = { type: "class", value: "[^\\/*]", description: "[^\\/*]" },
        peg$c103 = "/",
        peg$c104 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c105 = function() {return ""},
        peg$c106 = { type: "other", description: "Space" },
        peg$c107 = " ",
        peg$c108 = { type: "literal", value: " ", description: "\" \"" },
        peg$c109 = /^[\t]/,
        peg$c110 = { type: "class", value: "[\\t]", description: "[\\t]" },
        peg$c111 = /^[\xA0]/,
        peg$c112 = { type: "class", value: "[\\xA0]", description: "[\\xA0]" },
        peg$c113 = /^[a-zA-Z0-9 .,#:+?!\^=()_\-$*\/\\""']/,
        peg$c114 = { type: "class", value: "[a-zA-Z0-9 .,#:+?!\\^=()_\\-$*\\/\\\\\"\"']", description: "[a-zA-Z0-9 .,#:+?!\\^=()_\\-$*\\/\\\\\"\"']" },
        peg$c115 = { type: "other", description: "multitoend" },
        peg$c116 = /^[^}]/,
        peg$c117 = { type: "class", value: "[^}]", description: "[^}]" },
        peg$c118 = { type: "other", description: "anytoend" },
        peg$c119 = /^[^;]/,
        peg$c120 = { type: "class", value: "[^;]", description: "[^;]" },
        peg$c121 = ";",
        peg$c122 = { type: "literal", value: ";", description: "\";\"" },
        peg$c123 = { type: "other", description: "TextToColon" },
        peg$c124 = /^[^:{}]/,
        peg$c125 = { type: "class", value: "[^:{}]", description: "[^:{}]" },
        peg$c126 = function(text) {return p.stringify(text)},
        peg$c127 = { type: "other", description: "TextToSemicolon" },
        peg$c128 = /^[^;{}]/,
        peg$c129 = { type: "class", value: "[^;{}]", description: "[^;{}]" },
        peg$c130 = { type: "other", description: "LineTerminator" },
        peg$c131 = /^[\n\r\u2028\u2029]/,
        peg$c132 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
        peg$c133 = "\r\n",
        peg$c134 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parsestatements();

      return s0;
    }

    function peg$parsestatements() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseLineTerminator();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseLineTerminator();
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsestatement();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsestatement();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseLineTerminator();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseLineTerminator();
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parse_();
      }

      return s0;
    }

    function peg$parsestatement() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseRuleset();
      if (s0 === peg$FAILED) {
        s0 = peg$parseccss();
        if (s0 === peg$FAILED) {
          s0 = peg$parseDirective();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecssLine();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }

      return s0;
    }

    function peg$parsenestedStatement() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseRuleset();
      if (s0 === peg$FAILED) {
        s0 = peg$parseccss();
        if (s0 === peg$FAILED) {
          s0 = peg$parseDirective();
          if (s0 === peg$FAILED) {
            s0 = peg$parseContextualCCSSLine();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecssLine();
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }

      return s0;
    }

    function peg$parsenestedStatements() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseLineTerminator();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseLineTerminator();
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenestedStatement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsenestedStatement();
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseLineTerminator();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseLineTerminator();
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parse_();
      }

      return s0;
    }

    function peg$parseccss() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parseccssStartChar();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseccssStartChar();
          }
        } else {
          s3 = peg$c0;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseccssOp();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseanytoend();
              if (s6 !== peg$FAILED) {
                s2 = [s2, s3, s4, s5, s6];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c6(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 64) {
            s3 = peg$c7;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s3 !== peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c10) {
              s4 = peg$c10;
              peg$currPos += 5;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c11); }
            }
            if (s4 === peg$FAILED) {
              s4 = peg$c9;
            }
            if (s4 !== peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c12) {
                s5 = peg$c12;
                peg$currPos += 4;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseanytoend();
                if (s6 !== peg$FAILED) {
                  s2 = [s2, s3, s4, s5, s6];
                  s1 = s2;
                } else {
                  peg$currPos = s1;
                  s1 = peg$c0;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c14(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$currPos;
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 64) {
              s3 = peg$c7;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c8); }
            }
            if (s3 !== peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c10) {
                s4 = peg$c10;
                peg$currPos += 5;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c11); }
              }
              if (s4 === peg$FAILED) {
                s4 = peg$c9;
              }
              if (s4 !== peg$FAILED) {
                if (input.substr(peg$currPos, 5) === peg$c15) {
                  s5 = peg$c15;
                  peg$currPos += 5;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c16); }
                }
                if (s5 !== peg$FAILED) {
                  s6 = peg$parseanytoend();
                  if (s6 !== peg$FAILED) {
                    s2 = [s2, s3, s4, s5, s6];
                    s1 = s2;
                  } else {
                    peg$currPos = s1;
                    s1 = peg$c0;
                  }
                } else {
                  peg$currPos = s1;
                  s1 = peg$c0;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c17(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 64) {
                s3 = peg$c7;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s3 !== peg$FAILED) {
                if (input.substr(peg$currPos, 5) === peg$c10) {
                  s4 = peg$c10;
                  peg$currPos += 5;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c11); }
                }
                if (s4 === peg$FAILED) {
                  s4 = peg$c9;
                }
                if (s4 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 8) === peg$c18) {
                    s5 = peg$c18;
                    peg$currPos += 8;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c19); }
                  }
                  if (s5 === peg$FAILED) {
                    if (input.substr(peg$currPos, 7) === peg$c20) {
                      s5 = peg$c20;
                      peg$currPos += 7;
                    } else {
                      s5 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c21); }
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = [];
                    if (peg$c22.test(input.charAt(peg$currPos))) {
                      s7 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s7 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c23); }
                    }
                    if (s7 !== peg$FAILED) {
                      while (s7 !== peg$FAILED) {
                        s6.push(s7);
                        if (peg$c22.test(input.charAt(peg$currPos))) {
                          s7 = input.charAt(peg$currPos);
                          peg$currPos++;
                        } else {
                          s7 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c23); }
                        }
                      }
                    } else {
                      s6 = peg$c0;
                    }
                    if (s6 !== peg$FAILED) {
                      if (input.substr(peg$currPos, 3) === peg$c24) {
                        s7 = peg$c24;
                        peg$currPos += 3;
                      } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c25); }
                      }
                      if (s7 !== peg$FAILED) {
                        s8 = [];
                        if (peg$c22.test(input.charAt(peg$currPos))) {
                          s9 = input.charAt(peg$currPos);
                          peg$currPos++;
                        } else {
                          s9 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c23); }
                        }
                        if (s9 !== peg$FAILED) {
                          while (s9 !== peg$FAILED) {
                            s8.push(s9);
                            if (peg$c22.test(input.charAt(peg$currPos))) {
                              s9 = input.charAt(peg$currPos);
                              peg$currPos++;
                            } else {
                              s9 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c23); }
                            }
                          }
                        } else {
                          s8 = peg$c0;
                        }
                        if (s8 !== peg$FAILED) {
                          if (input.substr(peg$currPos, 3) === peg$c24) {
                            s9 = peg$c24;
                            peg$currPos += 3;
                          } else {
                            s9 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c25); }
                          }
                          if (s9 !== peg$FAILED) {
                            s10 = peg$parseanytoend();
                            if (s10 !== peg$FAILED) {
                              s2 = [s2, s3, s4, s5, s6, s7, s8, s9, s10];
                              s1 = s2;
                            } else {
                              peg$currPos = s1;
                              s1 = peg$c0;
                            }
                          } else {
                            peg$currPos = s1;
                            s1 = peg$c0;
                          }
                        } else {
                          peg$currPos = s1;
                          s1 = peg$c0;
                        }
                      } else {
                        peg$currPos = s1;
                        s1 = peg$c0;
                      }
                    } else {
                      peg$currPos = s1;
                      s1 = peg$c0;
                    }
                  } else {
                    peg$currPos = s1;
                    s1 = peg$c0;
                  }
                } else {
                  peg$currPos = s1;
                  s1 = peg$c0;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$c0;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c26(s1);
            }
            s0 = s1;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }

      return s0;
    }

    function peg$parseccssStartChar() {
      var s0, s1, s2, s3;

      if (peg$c27.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c28); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c29) {
          s0 = peg$c29;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c30); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 58) {
            s1 = peg$c31;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$c33.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c34); }
            }
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c33.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c34); }
                }
              }
            } else {
              s2 = peg$c0;
            }
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 40) {
                s3 = peg$c35;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c36); }
              }
              if (s3 !== peg$FAILED) {
                s1 = [s1, s2, s3];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseccssOp() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c37) {
        s0 = peg$c37;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c39) {
          s0 = peg$c39;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c40); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c41) {
            s0 = peg$c41;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c42); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c43) {
              s0 = peg$c43;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c44); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c45) {
                s0 = peg$c45;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c46); }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseContextualCCSSLine() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c48.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c48.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c49); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s4 = peg$c31;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c32); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseccssOp();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseanytoend();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c50(s2, s6, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }

      return s0;
    }

    function peg$parsecssLine() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTextToColon();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTextToSemicolon();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c52(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }

      return s0;
    }

    function peg$parsevfl() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c53) {
          s3 = peg$c53;
          peg$currPos += 6;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 64) {
            s3 = peg$c7;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
        }
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 10) === peg$c55) {
            s4 = peg$c55;
            peg$currPos += 10;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c56); }
          }
          if (s4 === peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c57) {
              s4 = peg$c57;
              peg$currPos += 8;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c58); }
            }
            if (s4 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 104) {
                s4 = peg$c59;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c60); }
              }
              if (s4 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 118) {
                  s4 = peg$c61;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c62); }
                }
              }
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseanytoend();
            if (s5 !== peg$FAILED) {
              s2 = [s2, s3, s4, s5];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c63(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsegtl() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c53) {
          s3 = peg$c53;
          peg$currPos += 6;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c64) {
            s4 = peg$c64;
            peg$currPos += 6;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c65); }
          }
          if (s4 === peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c66) {
              s4 = peg$c66;
              peg$currPos += 8;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c67); }
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsemultitoend();
            if (s5 !== peg$FAILED) {
              s2 = [s2, s3, s4, s5];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$c0;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c68(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecssBlock() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = [];
      s3 = peg$parseanychar();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseanychar();
        }
      } else {
        s2 = peg$c0;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsemultitoend();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c69(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseRuleset() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSelectorList();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBlockedStatements();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c71(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }

      return s0;
    }

    function peg$parseDirective() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDirectiveName();
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c73.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c74); }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$c73.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c74); }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBlockedStatements();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c75(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseDirectiveName();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseTextToSemicolon();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c76(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c72); }
      }

      return s0;
    }

    function peg$parseDirectiveName() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 64) {
          s2 = peg$c7;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c8); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c48.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c49); }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c48.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c49); }
              }
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c78(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c77); }
      }

      return s0;
    }

    function peg$parseBlockedStatements() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 123) {
          s2 = peg$c80;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c81); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsenestedStatements();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 125) {
                  s6 = peg$c82;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c83); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s8 = [];
                    s9 = peg$parseLineTerminator();
                    while (s9 !== peg$FAILED) {
                      s8.push(s9);
                      s9 = peg$parseLineTerminator();
                    }
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c84(s4);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c79); }
      }

      return s0;
    }

    function peg$parseSelectorList() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSelector();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseSelectorListEnd();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseSelectorListEnd();
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c86(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c85); }
      }

      return s0;
    }

    function peg$parseSelectorListEnd() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s2 = peg$c87;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c88); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSelector();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c89(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSelector() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c91.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c92); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c91.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c92); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c93(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c90); }
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c95) {
          s2 = peg$c95;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c96); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c97.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c98); }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c97.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c98); }
            }
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            if (input.charCodeAt(peg$currPos) === 42) {
              s5 = peg$c99;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c100); }
            }
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                if (input.charCodeAt(peg$currPos) === 42) {
                  s5 = peg$c99;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c100); }
                }
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$currPos;
              if (peg$c101.test(input.charAt(peg$currPos))) {
                s7 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s7 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c102); }
              }
              if (s7 !== peg$FAILED) {
                s8 = [];
                if (peg$c97.test(input.charAt(peg$currPos))) {
                  s9 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s9 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c98); }
                }
                while (s9 !== peg$FAILED) {
                  s8.push(s9);
                  if (peg$c97.test(input.charAt(peg$currPos))) {
                    s9 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s9 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c98); }
                  }
                }
                if (s8 !== peg$FAILED) {
                  s9 = [];
                  if (input.charCodeAt(peg$currPos) === 42) {
                    s10 = peg$c99;
                    peg$currPos++;
                  } else {
                    s10 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c100); }
                  }
                  if (s10 !== peg$FAILED) {
                    while (s10 !== peg$FAILED) {
                      s9.push(s10);
                      if (input.charCodeAt(peg$currPos) === 42) {
                        s10 = peg$c99;
                        peg$currPos++;
                      } else {
                        s10 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c100); }
                      }
                    }
                  } else {
                    s9 = peg$c0;
                  }
                  if (s9 !== peg$FAILED) {
                    s7 = [s7, s8, s9];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$c0;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$c0;
                }
              } else {
                peg$currPos = s6;
                s6 = peg$c0;
              }
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$currPos;
                if (peg$c101.test(input.charAt(peg$currPos))) {
                  s7 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s7 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c102); }
                }
                if (s7 !== peg$FAILED) {
                  s8 = [];
                  if (peg$c97.test(input.charAt(peg$currPos))) {
                    s9 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s9 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c98); }
                  }
                  while (s9 !== peg$FAILED) {
                    s8.push(s9);
                    if (peg$c97.test(input.charAt(peg$currPos))) {
                      s9 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s9 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c98); }
                    }
                  }
                  if (s8 !== peg$FAILED) {
                    s9 = [];
                    if (input.charCodeAt(peg$currPos) === 42) {
                      s10 = peg$c99;
                      peg$currPos++;
                    } else {
                      s10 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c100); }
                    }
                    if (s10 !== peg$FAILED) {
                      while (s10 !== peg$FAILED) {
                        s9.push(s10);
                        if (input.charCodeAt(peg$currPos) === 42) {
                          s10 = peg$c99;
                          peg$currPos++;
                        } else {
                          s10 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c100); }
                        }
                      }
                    } else {
                      s9 = peg$c0;
                    }
                    if (s9 !== peg$FAILED) {
                      s7 = [s7, s8, s9];
                      s6 = s7;
                    } else {
                      peg$currPos = s6;
                      s6 = peg$c0;
                    }
                  } else {
                    peg$currPos = s6;
                    s6 = peg$c0;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$c0;
                }
              }
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 47) {
                  s6 = peg$c103;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c104); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s8 = [];
                    s9 = peg$parseLineTerminator();
                    while (s9 !== peg$FAILED) {
                      s8.push(s9);
                      s9 = peg$parseLineTerminator();
                    }
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c105();
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c94); }
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsespace();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsespace();
      }

      return s0;
    }

    function peg$parse__() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsespace();
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parsespace();
        }
      } else {
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsespace() {
      var s0, s1;

      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 32) {
        s0 = peg$c107;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c108); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c109.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c110); }
        }
        if (s0 === peg$FAILED) {
          if (peg$c111.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c112); }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c106); }
      }

      return s0;
    }

    function peg$parseanychar() {
      var s0;

      if (peg$c113.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c114); }
      }

      return s0;
    }

    function peg$parsemultitoend() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c116.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c117); }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c116.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c117); }
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 125) {
          s2 = peg$c82;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c83); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseLineTerminator();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseLineTerminator();
            }
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c115); }
      }

      return s0;
    }

    function peg$parseanytoend() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c119.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c120); }
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c119.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c120); }
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s2 = peg$c121;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c122); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseLineTerminator();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseLineTerminator();
            }
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c118); }
      }

      return s0;
    }

    function peg$parseTextToColon() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c124.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c125); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c124.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c125); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s2 = peg$c31;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c32); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseLineTerminator();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseLineTerminator();
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c126(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c123); }
      }

      return s0;
    }

    function peg$parseTextToSemicolon() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c128.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c129); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c128.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c129); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s2 = peg$c121;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c122); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseLineTerminator();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseLineTerminator();
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c126(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c127); }
      }

      return s0;
    }

    function peg$parse_terminators() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseLineTerminator();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseLineTerminator();
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseLineTerminator() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c131.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c132); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c133) {
          s1 = peg$c133;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c134); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c130); }
      }

      return s0;
    }


      var p, parser, flatten, idPrefix; 
      p = parser = this;

      String.prototype.trim = String.prototype.trim || function trim() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

      flatten = parser.flatten = function (array, isShallow) {
        var index = -1,
          length = array ? array.length : 0,
          result = [];

        while (++index < length) {
          var value = array[index];

          if (value instanceof Array) {
            Array.prototype.push.apply(result, isShallow ? value : flatten(value));
          }
          else {
            result.push(value);
          }
        }
        return result;
      }

      p.results = [];

      p.stringify = function (array) {
        return flatten(array).join("").trim();
      };

      p.trim = function (x) {
        if (typeof x === "string") {return x.trim();}
        if (x instanceof Array) {return x.join("").trim();}
        return ""
      };



    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
});
require.register("the-gss-preparser/lib/preparser.js", function(exports, require, module){
var ErrorReporter, parse;

if (typeof window !== "undefined" && window !== null) {
  parse = require('./parser').parse;
} else {
  parse = require('../lib/parser').parse;
}

ErrorReporter = require('error-reporter');

module.exports = {
  parse: function(source) {
    var columnNumber, error, errorReporter, lineNumber, message, results;
    results = null;
    try {
      results = parse(source);
    } catch (_error) {
      error = _error;
      errorReporter = new ErrorReporter(source);
      message = error.message, lineNumber = error.line, columnNumber = error.column;
      errorReporter.reportError(message, lineNumber, columnNumber);
    }
    return results;
  }
};

});
require.register("the-gss-ccss-compiler/lib/compiler.js", function(exports, require, module){
var ErrorReporter, parse;

if (typeof window !== "undefined" && window !== null) {
  parse = require('./parser').parse;
} else {
  parse = require('../lib/parser').parse;
}

ErrorReporter = require('error-reporter');

module.exports = {
  parse: function(source) {
    var columnNumber, error, errorReporter, lineNumber, message, results;
    results = null;
    try {
      results = parse(source);
    } catch (_error) {
      error = _error;
      errorReporter = new ErrorReporter(source);
      message = error.message, lineNumber = error.line, columnNumber = error.column;
      errorReporter.reportError(message, lineNumber, columnNumber);
    }
    return results;
  }
};

});
require.register("the-gss-ccss-compiler/lib/grammar.js", function(exports, require, module){
var Grammar,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Grammar = (function() {
  /* Private*/

  Grammar._createExpressionAST = function(head, tail) {
    var index, item, result, _i, _len;
    result = head;
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      result = [tail[index][1], result, tail[index][3]];
    }
    return result;
  };

  Grammar._toString = function(input) {
    if (toString.call(input) === '[object String]') {
      return input;
    }
    if (toString.call(input) === '[object Array]') {
      return input.join('');
    }
    return '';
  };

  Grammar._unpack2DExpression = function(expression) {
    var expressions, item, mapping, properties, property, _i, _len;
    mapping = {
      'bottom-left': ['left', 'bottom'],
      'bottom-right': ['right', 'bottom'],
      center: ['center-x', 'center-y'],
      'intrinsic-size': ['intrinsic-width', 'intrinsic-height'],
      position: ['x', 'y'],
      size: ['width', 'height'],
      'top-left': ['left', 'top'],
      'top-right': ['right', 'top']
    };
    expressions = [expression];
    property = expression[1];
    properties = mapping[property];
    if (properties != null) {
      expressions = [];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        item = properties[_i];
        expression = expression.slice();
        expression[1] = item;
        expressions.push(expression);
      }
    }
    return expressions;
  };

  Grammar.prototype._commands = null;

  Grammar.prototype._Error = null;

  Grammar.prototype._selectors = null;

  Grammar.prototype._addCommand = function(command) {
    return this._commands.push(command);
  };

  Grammar.prototype._addSelector = function(selector) {
    if (selector == null) {
      return;
    }
    if (__indexOf.call(this._selectors, selector) < 0) {
      this._selectors.push(selector);
    }
    return selector;
  };

  Grammar.prototype._columnNumber = function() {};

  Grammar.prototype._lineNumber = function() {};

  /* Public*/


  function Grammar(lineNumber, columnNumber, errorType) {
    this.chainer = __bind(this.chainer, this);
    this._commands = [];
    this._selectors = [];
    this._lineNumber = lineNumber;
    this._columnNumber = columnNumber;
    this._Error = errorType();
  }

  Grammar.prototype.start = function() {
    return {
      commands: JSON.parse(JSON.stringify(this._commands)),
      selectors: this._selectors
    };
  };

  Grammar.prototype.statement = function() {
    return {
      linearConstraint: function(expression) {
        return expression;
      },
      virtual: function(virtual) {
        return virtual;
      },
      conditional: function(conditional) {
        return conditional;
      },
      stay: function(stay) {
        return stay;
      },
      chain: function(chain) {
        return chain;
      },
      forEach: function(javaScript) {
        return javaScript;
      }
    };
  };

  Grammar.prototype.andOrExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.andOrOperator = function() {
    return {
      and: function() {
        return '&&';
      },
      or: function() {
        return '||';
      }
    };
  };

  Grammar.prototype.conditionalExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.conditionalOperator = function() {
    return {
      equal: function() {
        return '?==';
      },
      gt: function() {
        return '?>';
      },
      gte: function() {
        return '?>=';
      },
      lt: function() {
        return '?<';
      },
      lte: function() {
        return '?<=';
      },
      notEqual: function() {
        return '?!=';
      }
    };
  };

  Grammar.prototype.linearConstraint = function(head, tail, strengthAndWeight) {
    var command, firstExpression, headExpression, headExpressions, index, item, operator, secondExpression, tailExpression, tailExpressions, _i, _j, _len, _len1;
    firstExpression = head;
    if ((strengthAndWeight == null) || strengthAndWeight.length === 0) {
      strengthAndWeight = [];
    }
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      operator = tail[index][1];
      secondExpression = tail[index][3];
      headExpressions = Grammar._unpack2DExpression(firstExpression);
      tailExpressions = Grammar._unpack2DExpression(secondExpression);
      if (headExpressions.length > tailExpressions.length) {
        tailExpressions.push(tailExpressions[0]);
      } else if (headExpressions.length < tailExpressions.length) {
        headExpressions.push(headExpressions[0]);
      }
      for (index = _j = 0, _len1 = tailExpressions.length; _j < _len1; index = ++_j) {
        tailExpression = tailExpressions[index];
        headExpression = headExpressions[index];
        if ((headExpression != null) && (tailExpression != null)) {
          command = [operator, headExpression, tailExpression].concat(strengthAndWeight);
          this._addCommand(command);
        }
      }
      firstExpression = secondExpression;
    }
    return "LinaearExpression";
  };

  Grammar.prototype.linearConstraintOperator = function() {
    return {
      equal: function() {
        return 'eq';
      },
      gt: function() {
        return 'gt';
      },
      gte: function() {
        return 'gte';
      },
      lt: function() {
        return 'lt';
      },
      lte: function() {
        return 'lte';
      }
    };
  };

  Grammar.prototype.constraintAdditiveExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.additiveExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.additiveOperator = function() {
    return {
      plus: function() {
        return 'plus';
      },
      minus: function() {
        return 'minus';
      }
    };
  };

  Grammar.prototype.constraintMultiplicativeExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.multiplicativeExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.multiplicativeOperator = function() {
    return {
      multiply: function() {
        return 'multiply';
      },
      divide: function() {
        return 'divide';
      }
    };
  };

  Grammar.prototype.constraintPrimaryExpression = function() {
    return {
      constraintAdditiveExpression: function(expression) {
        return expression;
      }
    };
  };

  Grammar.prototype.variable = function(selector, variableNameCharacters) {
    var selectorName, variableName;
    variableName = variableNameCharacters.join('');
    if ((selector != null) && selector.length !== 0) {
      selectorName = selector.selector;
      this._addSelector(selectorName);
      switch (variableName) {
        case 'left':
          variableName = 'x';
          break;
        case 'top':
          variableName = 'y';
          break;
        case 'cx':
          variableName = 'center-x';
          break;
        case 'cy':
          variableName = 'center-y';
          break;
      }
      if (selectorName === '::window') {
        switch (variableName) {
          case 'right':
            variableName = 'width';
            break;
          case 'bottom':
            variableName = 'height';
            break;
        }
      }
    }
    if ((selector != null) && ((selectorName != null) || (selector.isVirtual != null))) {
      return ['get$', variableName, selector.ast];
    } else {
      return ['get', "[" + variableName + "]"];
    }
  };

  Grammar.prototype.literal = function(value) {
    return ['number', value];
  };

  Grammar.prototype.integer = function(digits) {
    return parseInt(digits.join(''), 10);
  };

  Grammar.prototype.signedInteger = function(sign, integer) {
    if (integer == null) {
      integer = 0;
    }
    return parseInt("" + sign + integer, 10);
  };

  Grammar.prototype.real = function(digits) {
    return parseFloat(digits.join(''));
  };

  Grammar.prototype.signedReal = function(sign, real) {
    if (real == null) {
      real = 0;
    }
    return parseFloat("" + sign + real);
  };

  /* Query selectors*/


  Grammar.prototype.selector = function() {
    return {
      id: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: "#" + selectorName,
          ast: ['$id', selectorName]
        };
      },
      reservedPseudoSelector: function(selectorName) {
        return {
          selector: "::" + selectorName,
          ast: ['$reserved', selectorName]
        };
      },
      virtual: function(nameCharacters) {
        var name;
        name = Grammar._toString(nameCharacters);
        return {
          isVirtual: true,
          ast: ['$virtual', name]
        };
      },
      "class": function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: "." + selectorName,
          ast: ['$class', selectorName]
        };
      },
      tag: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: selectorName,
          ast: ['$tag', selectorName]
        };
      },
      all: function(parts) {
        var selector;
        selector = Grammar._toString(parts);
        return {
          selector: selector,
          ast: ['$all', selector]
        };
      }
    };
  };

  Grammar.prototype.querySelectorAllParts = function() {
    return {
      withoutParens: function(selectorCharacters) {
        return Grammar._toString(selectorCharacters);
      },
      withParens: function(selectorCharacters) {
        var selector;
        selector = Grammar._toString(selectorCharacters);
        return "(" + selector + ")";
      }
    };
  };

  /* Strength and weight directives*/


  Grammar.prototype.strengthAndWeight = function() {
    var _this = this;
    return {
      valid: function(strength, weight) {
        if ((weight == null) || weight.length === 0) {
          return [strength];
        }
        return [strength, weight];
      },
      invalid: function() {
        throw new _this._Error('Invalid Strength or Weight', null, null, null, _this._lineNumber(), _this._columnNumber());
      }
    };
  };

  Grammar.prototype.weight = function(weight) {
    return Number(weight.join(''));
  };

  Grammar.prototype.strength = function(strength) {
    return {
      require: function() {
        return 'require';
      },
      strong: function() {
        return 'strong';
      },
      medium: function() {
        return 'medium';
      },
      weak: function() {
        return 'weak';
      },
      required: function() {
        return 'require';
      }
    };
  };

  /* Virtual Elements*/


  Grammar.prototype.virtualElement = function(names) {
    var command;
    command = ['virtual'].concat(names);
    this._addCommand(command);
    return command;
  };

  Grammar.prototype.virtualElementName = function(nameCharacters) {
    return nameCharacters.join('');
  };

  /* Stays*/


  Grammar.prototype.stay = function(variables) {
    var command, expression, expressions, index, stay, _i, _len;
    stay = ['stay'].concat(variables);
    expressions = Grammar._unpack2DExpression(stay[1]);
    for (index = _i = 0, _len = expressions.length; _i < _len; index = ++_i) {
      expression = expressions[index];
      command = stay.slice();
      command[1] = expressions[index];
      this._addCommand(command);
    }
    return stay;
  };

  Grammar.prototype.stayVariable = function(variable) {
    return variable;
  };

  /* Conditionals*/


  Grammar.prototype.conditional = function(result) {
    this._addCommand(result);
    return result;
  };

  /* JavaScript hooks*/


  Grammar.prototype.forEach = function(type, selector, javaScript) {
    var selectorName;
    selectorName = selector.selector;
    this._addSelector(selectorName);
    return this._addCommand([type, selector.ast, javaScript]);
  };

  Grammar.prototype.javaScript = function(characters) {
    return ['js', characters.join('').trim()];
  };

  Grammar.prototype.forLoopType = function() {
    return {
      forEach: function() {
        return 'for-each';
      },
      forAll: function() {
        return 'for-all';
      }
    };
  };

  /* Chains*/


  Grammar.prototype.chain = function(selector, chainers) {
    var ast, chainer, selectorName, _i, _len;
    selectorName = selector.selector;
    this._addSelector(selectorName);
    ast = ['chain', selector.ast];
    for (_i = 0, _len = chainers.length; _i < _len; _i++) {
      chainer = chainers[_i];
      ast = ast.concat(chainer);
    }
    return this._addCommand(ast);
  };

  Grammar.prototype.chainer = function(options) {
    var asts, bridgeValue, createChainAST, head, headCharacters, headExpression, headOperator, strengthAndWeight, tail, tailCharacters, tailOperator,
      _this = this;
    headCharacters = options.headCharacters, headExpression = options.headExpression, headOperator = options.headOperator, bridgeValue = options.bridgeValue, tailOperator = options.tailOperator, strengthAndWeight = options.strengthAndWeight, tailCharacters = options.tailCharacters;
    asts = [];
    head = Grammar._toString(headCharacters);
    tail = Grammar._toString(tailCharacters);
    createChainAST = function(operator, firstExpression, secondExpression) {
      var ast;
      ast = [operator, firstExpression, secondExpression];
      if (strengthAndWeight != null) {
        ast = ast.concat(strengthAndWeight);
      }
      return ast;
    };
    if (tail.length === 0) {
      tail = head;
    }
    if (headExpression != null) {
      headExpression.splice(1, 1, head);
      head = headExpression;
    }
    if (bridgeValue != null) {
      asts.push(createChainAST(headOperator, head, bridgeValue));
      if (tailOperator != null) {
        asts.push(createChainAST(tailOperator, bridgeValue, tail));
      } else {
        throw new this._Error('Invalid Chain Statement', null, null, null, this._lineNumber(), this._columnNumber());
      }
    } else {
      asts.push(createChainAST(headOperator, head, tail));
    }
    return asts;
  };

  Grammar.prototype.headExpression = function(operator, expression) {
    return [operator, '_REPLACE_ME_', expression];
  };

  Grammar.prototype.tailExpression = function(expression, operator) {
    return [operator, expression, '_REPLACE_ME_'];
  };

  Grammar.prototype.chainMathOperator = function() {
    return {
      plus: function() {
        return 'plus-chain';
      },
      minus: function() {
        return 'minus-chain';
      },
      multiply: function() {
        return 'multiply-chain';
      },
      divide: function() {
        return 'divide-chain';
      }
    };
  };

  Grammar.prototype.chainLinearConstraintOperator = function(operator) {
    if (operator == null) {
      operator = 'eq';
    }
    operator = "" + operator + "-chain";
    return operator;
  };

  return Grammar;

})();

module.exports = Grammar;

});
require.register("the-gss-ccss-compiler/lib/parser.js", function(exports, require, module){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = [],
        peg$c2 = function(statements) { return grammar.start(); },
        peg$c3 = function(expression) { return grammar.statement().linearConstraint(expression); },
        peg$c4 = function(virtual) { return grammar.statement().virtual(virtual); },
        peg$c5 = function(conditional) { return grammar.statement().conditional(conditional); },
        peg$c6 = function(stay) { return grammar.statement().stay(stay); },
        peg$c7 = function(chain) { return grammar.statement().chain(chain); },
        peg$c8 = function(javaScript) { return grammar.statement().forEach(javaScript); },
        peg$c9 = function(head, tail) {
              return grammar.andOrExpression(head, tail);
            },
        peg$c10 = "AND",
        peg$c11 = { type: "literal", value: "AND", description: "\"AND\"" },
        peg$c12 = "and",
        peg$c13 = { type: "literal", value: "and", description: "\"and\"" },
        peg$c14 = "And",
        peg$c15 = { type: "literal", value: "And", description: "\"And\"" },
        peg$c16 = "&&",
        peg$c17 = { type: "literal", value: "&&", description: "\"&&\"" },
        peg$c18 = function() { return grammar.andOrOperator().and(); },
        peg$c19 = "OR",
        peg$c20 = { type: "literal", value: "OR", description: "\"OR\"" },
        peg$c21 = "or",
        peg$c22 = { type: "literal", value: "or", description: "\"or\"" },
        peg$c23 = "Or",
        peg$c24 = { type: "literal", value: "Or", description: "\"Or\"" },
        peg$c25 = "||",
        peg$c26 = { type: "literal", value: "||", description: "\"||\"" },
        peg$c27 = function() { return grammar.andOrOperator().or(); },
        peg$c28 = function(head, tail) {
              return grammar.conditionalExpression(head, tail);
            },
        peg$c29 = "==",
        peg$c30 = { type: "literal", value: "==", description: "\"==\"" },
        peg$c31 = function() { return grammar.conditionalOperator().equal(); },
        peg$c32 = "<=",
        peg$c33 = { type: "literal", value: "<=", description: "\"<=\"" },
        peg$c34 = "=<",
        peg$c35 = { type: "literal", value: "=<", description: "\"=<\"" },
        peg$c36 = function() { return grammar.conditionalOperator().lte(); },
        peg$c37 = ">=",
        peg$c38 = { type: "literal", value: ">=", description: "\">=\"" },
        peg$c39 = "=>",
        peg$c40 = { type: "literal", value: "=>", description: "\"=>\"" },
        peg$c41 = function() { return grammar.conditionalOperator().gte(); },
        peg$c42 = "<",
        peg$c43 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c44 = function() { return grammar.conditionalOperator().lt(); },
        peg$c45 = ">",
        peg$c46 = { type: "literal", value: ">", description: "\">\"" },
        peg$c47 = function() { return grammar.conditionalOperator().gt(); },
        peg$c48 = "!=",
        peg$c49 = { type: "literal", value: "!=", description: "\"!=\"" },
        peg$c50 = function() { return grammar.conditionalOperator().notEqual(); },
        peg$c51 = null,
        peg$c52 = function(head, tail, strengthAndWeight) {
              return grammar.linearConstraint(head, tail, strengthAndWeight);
            },
        peg$c53 = function() { return grammar.linearConstraintOperator().equal() },
        peg$c54 = function() { return grammar.linearConstraintOperator().lte() },
        peg$c55 = function() { return grammar.linearConstraintOperator().gte() },
        peg$c56 = function() { return grammar.linearConstraintOperator().lt()  },
        peg$c57 = function() { return grammar.linearConstraintOperator().gt()  },
        peg$c58 = function(head, tail) {
              return grammar.constraintAdditiveExpression(head, tail);
            },
        peg$c59 = function(head, tail) {
              return grammar.additiveExpression(head, tail);
            },
        peg$c60 = "+",
        peg$c61 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c62 = function() { return grammar.additiveOperator().plus(); },
        peg$c63 = "-",
        peg$c64 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c65 = function() { return grammar.additiveOperator().minus(); },
        peg$c66 = function(head, tail) {
              return grammar.constraintMultiplicativeExpression(head, tail);
            },
        peg$c67 = function(head, tail) {
              return grammar.multiplicativeExpression(head, tail);
            },
        peg$c68 = "*",
        peg$c69 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c70 = function() { return grammar.multiplicativeOperator().multiply(); },
        peg$c71 = "/",
        peg$c72 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c73 = function() { return grammar.multiplicativeOperator().divide(); },
        peg$c74 = "(",
        peg$c75 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c76 = ")",
        peg$c77 = { type: "literal", value: ")", description: "\")\"" },
        peg$c78 = function(expression) {
            return grammar.constraintPrimaryExpression().constraintAdditiveExpression(expression);
          },
        peg$c79 = function(expression) { return expression; },
        peg$c80 = { type: "other", description: "variable" },
        peg$c81 = "[",
        peg$c82 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c83 = "]",
        peg$c84 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c85 = function(selector, variableNameCharacters) {
              return grammar.variable(selector, variableNameCharacters);
            },
        peg$c86 = /^[a-zA-Z0-9#.\-_$]/,
        peg$c87 = { type: "class", value: "[a-zA-Z0-9#.\\-_$]", description: "[a-zA-Z0-9#.\\-_$]" },
        peg$c88 = " ",
        peg$c89 = { type: "literal", value: " ", description: "\" \"" },
        peg$c90 = function(value) { return grammar.literal(value); },
        peg$c91 = /^[0-9]/,
        peg$c92 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c93 = function(digits) { return grammar.integer(digits); },
        peg$c94 = /^[\-+]/,
        peg$c95 = { type: "class", value: "[\\-+]", description: "[\\-+]" },
        peg$c96 = function(sign, integer) { return grammar.signedInteger(sign, integer); },
        peg$c97 = ".",
        peg$c98 = { type: "literal", value: ".", description: "\".\"" },
        peg$c99 = function(digits) { return grammar.real(digits); },
        peg$c100 = function(sign, real) { return grammar.signedReal(sign, real); },
        peg$c101 = { type: "any", description: "any character" },
        peg$c102 = { type: "other", description: "whitespace" },
        peg$c103 = /^[\t\x0B\f \xA0\uFEFF]/,
        peg$c104 = { type: "class", value: "[\\t\\x0B\\f \\xA0\\uFEFF]", description: "[\\t\\x0B\\f \\xA0\\uFEFF]" },
        peg$c105 = /^[\n\r\u2028\u2029]/,
        peg$c106 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
        peg$c107 = { type: "other", description: "end of line" },
        peg$c108 = "\n",
        peg$c109 = { type: "literal", value: "\n", description: "\"\\n\"" },
        peg$c110 = "\r\n",
        peg$c111 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
        peg$c112 = "\r",
        peg$c113 = { type: "literal", value: "\r", description: "\"\\r\"" },
        peg$c114 = "\u2028",
        peg$c115 = { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
        peg$c116 = "\u2029",
        peg$c117 = { type: "literal", value: "\u2029", description: "\"\\u2029\"" },
        peg$c118 = ";",
        peg$c119 = { type: "literal", value: ";", description: "\";\"" },
        peg$c120 = void 0,
        peg$c121 = { type: "other", description: "comment" },
        peg$c122 = "/*",
        peg$c123 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c124 = "*/",
        peg$c125 = { type: "literal", value: "*/", description: "\"*/\"" },
        peg$c126 = "//",
        peg$c127 = { type: "literal", value: "//", description: "\"//\"" },
        peg$c128 = { type: "other", description: "selector" },
        peg$c129 = "#",
        peg$c130 = { type: "literal", value: "#", description: "\"#\"" },
        peg$c131 = function(nameCharacters) {
            return grammar.selector().id(nameCharacters);
          },
        peg$c132 = "::",
        peg$c133 = { type: "literal", value: "::", description: "\"::\"" },
        peg$c134 = function(selectorName) {
            return grammar.selector().reservedPseudoSelector(selectorName);
          },
        peg$c135 = "&",
        peg$c136 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c137 = function() {
            return grammar.selector().reservedPseudoSelector("this");
          },
        peg$c138 = "\"",
        peg$c139 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c140 = /^[a-zA-Z0-9.\-_$=:+><~ ]/,
        peg$c141 = { type: "class", value: "[a-zA-Z0-9.\\-_$=:+><~ ]", description: "[a-zA-Z0-9.\\-_$=:+><~ ]" },
        peg$c142 = function(nameCharacters) {
            return grammar.selector().virtual(nameCharacters);
          },
        peg$c143 = function(nameCharacters) {
            return grammar.selector().class(nameCharacters);
          },
        peg$c144 = function(nameCharacters) {
            return grammar.selector().tag(nameCharacters);
          },
        peg$c145 = function(parts) {
            return grammar.selector().all(parts);
          },
        peg$c146 = function(selectorCharacters) {
            return grammar.querySelectorAllParts().withoutParens(selectorCharacters);
          },
        peg$c147 = /^[^)]/,
        peg$c148 = { type: "class", value: "[^)]", description: "[^)]" },
        peg$c149 = function(selectorCharacters) {
            return grammar.querySelectorAllParts().withParens(selectorCharacters);
          },
        peg$c150 = /^[a-zA-Z0-9#.\-_$=:+>'" \][]/,
        peg$c151 = { type: "class", value: "[a-zA-Z0-9#.\\-_$=:+>'\" \\][]", description: "[a-zA-Z0-9#.\\-_$=:+>'\" \\][]" },
        peg$c152 = "document",
        peg$c153 = { type: "literal", value: "document", description: "\"document\"" },
        peg$c154 = "host",
        peg$c155 = { type: "literal", value: "host", description: "\"host\"" },
        peg$c156 = "scope",
        peg$c157 = { type: "literal", value: "scope", description: "\"scope\"" },
        peg$c158 = "parent",
        peg$c159 = { type: "literal", value: "parent", description: "\"parent\"" },
        peg$c160 = "window",
        peg$c161 = { type: "literal", value: "window", description: "\"window\"" },
        peg$c162 = "viewport",
        peg$c163 = { type: "literal", value: "viewport", description: "\"viewport\"" },
        peg$c164 = function() { return "window"; },
        peg$c165 = "this",
        peg$c166 = { type: "literal", value: "this", description: "\"this\"" },
        peg$c167 = "",
        peg$c168 = function() { return "this"; },
        peg$c169 = "!",
        peg$c170 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c171 = function(strength, weight) {
            return grammar.strengthAndWeight().valid(strength, weight);
          },
        peg$c172 = function() {
            return grammar.strengthAndWeight().invalid();
          },
        peg$c173 = function(weight) { return grammar.weight(weight); },
        peg$c174 = "required",
        peg$c175 = { type: "literal", value: "required", description: "\"required\"" },
        peg$c176 = "REQUIRED",
        peg$c177 = { type: "literal", value: "REQUIRED", description: "\"REQUIRED\"" },
        peg$c178 = "Required",
        peg$c179 = { type: "literal", value: "Required", description: "\"Required\"" },
        peg$c180 = function() { return grammar.strength().required(); },
        peg$c181 = "require",
        peg$c182 = { type: "literal", value: "require", description: "\"require\"" },
        peg$c183 = "REQUIRE",
        peg$c184 = { type: "literal", value: "REQUIRE", description: "\"REQUIRE\"" },
        peg$c185 = "Require",
        peg$c186 = { type: "literal", value: "Require", description: "\"Require\"" },
        peg$c187 = function() { return grammar.strength().require(); },
        peg$c188 = "strong",
        peg$c189 = { type: "literal", value: "strong", description: "\"strong\"" },
        peg$c190 = "STRONG",
        peg$c191 = { type: "literal", value: "STRONG", description: "\"STRONG\"" },
        peg$c192 = "Strong",
        peg$c193 = { type: "literal", value: "Strong", description: "\"Strong\"" },
        peg$c194 = function() { return grammar.strength().strong(); },
        peg$c195 = "medium",
        peg$c196 = { type: "literal", value: "medium", description: "\"medium\"" },
        peg$c197 = "MEDIUM",
        peg$c198 = { type: "literal", value: "MEDIUM", description: "\"MEDIUM\"" },
        peg$c199 = "Medium",
        peg$c200 = { type: "literal", value: "Medium", description: "\"Medium\"" },
        peg$c201 = function() { return grammar.strength().medium(); },
        peg$c202 = "weak",
        peg$c203 = { type: "literal", value: "weak", description: "\"weak\"" },
        peg$c204 = "WEAK",
        peg$c205 = { type: "literal", value: "WEAK", description: "\"WEAK\"" },
        peg$c206 = "Weak",
        peg$c207 = { type: "literal", value: "Weak", description: "\"Weak\"" },
        peg$c208 = function() { return grammar.strength().weak(); },
        peg$c209 = "@",
        peg$c210 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c211 = "-gss-virtual",
        peg$c212 = { type: "literal", value: "-gss-virtual", description: "\"-gss-virtual\"" },
        peg$c213 = "virtual",
        peg$c214 = { type: "literal", value: "virtual", description: "\"virtual\"" },
        peg$c215 = function(names) {
            return grammar.virtualElement(names);
          },
        peg$c216 = /^[^"]/,
        peg$c217 = { type: "class", value: "[^\"]", description: "[^\"]" },
        peg$c218 = function(nameCharacters) {
            return grammar.virtualElementName(nameCharacters);
          },
        peg$c219 = function(variables) {
              return grammar.stay(variables);
            },
        peg$c220 = ",",
        peg$c221 = { type: "literal", value: ",", description: "\",\"" },
        peg$c222 = function(variable) { return grammar.stayVariable(variable); },
        peg$c223 = "@-gss-stay",
        peg$c224 = { type: "literal", value: "@-gss-stay", description: "\"@-gss-stay\"" },
        peg$c225 = "@stay",
        peg$c226 = { type: "literal", value: "@stay", description: "\"@stay\"" },
        peg$c227 = "@cond",
        peg$c228 = { type: "literal", value: "@cond", description: "\"@cond\"" },
        peg$c229 = function(result) { return grammar.conditional(result); },
        peg$c230 = function(type, selector, javaScript) {
            return grammar.forEach(type, selector, javaScript)
          },
        peg$c231 = "```",
        peg$c232 = { type: "literal", value: "```", description: "\"```\"" },
        peg$c233 = /^[^`]/,
        peg$c234 = { type: "class", value: "[^`]", description: "[^`]" },
        peg$c235 = function(characters) { return grammar.javaScript(characters); },
        peg$c236 = "@-gss-for-each",
        peg$c237 = { type: "literal", value: "@-gss-for-each", description: "\"@-gss-for-each\"" },
        peg$c238 = "@for-each",
        peg$c239 = { type: "literal", value: "@for-each", description: "\"@for-each\"" },
        peg$c240 = function() { return grammar.forLoopType().forEach(); },
        peg$c241 = "@-gss-for-all",
        peg$c242 = { type: "literal", value: "@-gss-for-all", description: "\"@-gss-for-all\"" },
        peg$c243 = "@for-all",
        peg$c244 = { type: "literal", value: "@for-all", description: "\"@for-all\"" },
        peg$c245 = function() { return grammar.forLoopType().forAll(); },
        peg$c246 = "-gss-",
        peg$c247 = { type: "literal", value: "-gss-", description: "\"-gss-\"" },
        peg$c248 = "chain",
        peg$c249 = { type: "literal", value: "chain", description: "\"chain\"" },
        peg$c250 = function(selector, chainers) { //sw:StrengthAndWeight?
            grammar.chain(selector, chainers);
          },
        peg$c251 = /^[a-zA-Z\-_0-9]/,
        peg$c252 = { type: "class", value: "[a-zA-Z\\-_0-9]", description: "[a-zA-Z\\-_0-9]" },
        peg$c253 = function(headCharacters, headExpression, headOperator, bridgeValue, tailOperator, strengthAndWeight, tailCharacters) {
              return grammar.chainer({
                headCharacters: headCharacters,
                headExpression: headExpression,
                headOperator: headOperator,
                bridgeValue: bridgeValue,
                tailOperator: tailOperator,
                strengthAndWeight: strengthAndWeight,
                tailCharacters: tailCharacters
              });
            },
        peg$c254 = function(operator, expression) {
            return grammar.headExpression(operator, expression);
          },
        peg$c255 = function(expression, operator) {
            return grammar.tailExpression(expression, operator);
          },
        peg$c256 = function() { return grammar.chainMathOperator().plus(); },
        peg$c257 = function() { return grammar.chainMathOperator().minus(); },
        peg$c258 = function() { return grammar.chainMathOperator().multiply(); },
        peg$c259 = function() { return grammar.chainMathOperator().divide(); },
        peg$c260 = function(operator) {
            return grammar.chainLinearConstraintOperator(operator);
          },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseStatement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseStatement();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStatement() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLinearConstraint();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEOS();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c3(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseVirtual();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseEOS();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse__();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c4(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseConditional();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseEOS();
            if (s2 !== peg$FAILED) {
              s3 = peg$parse__();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c5(s1);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseStay();
            if (s1 !== peg$FAILED) {
              s2 = peg$parseEOS();
              if (s2 !== peg$FAILED) {
                s3 = peg$parse__();
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c6(s1);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseChain();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseEOS();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parse__();
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c7(s1);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseForEach();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseEOS();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parse__();
                    if (s3 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c8(s1);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseAndOrExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseConditionalExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseAndOrOp();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseConditionalExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseAndOrOp();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseConditionalExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c9(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseAndOrOp() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c10) {
        s1 = peg$c10;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c12) {
          s1 = peg$c12;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c13); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c14) {
            s1 = peg$c14;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c15); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c16) {
              s1 = peg$c16;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c17); }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c18();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c19) {
          s1 = peg$c19;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c20); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c21) {
            s1 = peg$c21;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c22); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c23) {
              s1 = peg$c23;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c24); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c25) {
                s1 = peg$c25;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c26); }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c27();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseConditionalExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseAdditiveExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseCondOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseAdditiveExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseCondOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseAdditiveExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseCondOperator() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c29) {
        s1 = peg$c29;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c31();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c32) {
          s1 = peg$c32;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c34) {
            s1 = peg$c34;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c36();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c37) {
            s1 = peg$c37;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c39) {
              s1 = peg$c39;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c40); }
            }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c41();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 60) {
              s1 = peg$c42;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c43); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c44();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 62) {
                s1 = peg$c45;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c46); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c47();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c48) {
                  s1 = peg$c48;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c49); }
                }
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c50();
                }
                s0 = s1;
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseLinearConstraint() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseConstraintAdditiveExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseLinearConstraintOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseConstraintAdditiveExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseLinearConstraintOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseConstraintAdditiveExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseStrengthAndWeight();
            if (s4 === peg$FAILED) {
              s4 = peg$c51;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c52(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseLinearConstraintOperator() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c29) {
        s1 = peg$c29;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c53();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c32) {
          s1 = peg$c32;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c34) {
            s1 = peg$c34;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c54();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c37) {
            s1 = peg$c37;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c39) {
              s1 = peg$c39;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c40); }
            }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c55();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 60) {
              s1 = peg$c42;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c43); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c56();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 62) {
                s1 = peg$c45;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c46); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c57();
              }
              s0 = s1;
            }
          }
        }
      }

      return s0;
    }

    function peg$parseConstraintAdditiveExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseConstraintMultiplicativeExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseAdditiveOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseConstraintMultiplicativeExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseAdditiveOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseConstraintMultiplicativeExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c58(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseAdditiveExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseMultiplicativeExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseAdditiveOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseMultiplicativeExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseAdditiveOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseMultiplicativeExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c59(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseAdditiveOperator() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c60;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c61); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c62();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s1 = peg$c63;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c64); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c65();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseConstraintMultiplicativeExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseConstraintPrimaryExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseMultiplicativeOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseConstraintPrimaryExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseMultiplicativeOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseConstraintPrimaryExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c66(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseMultiplicativeExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parsePrimaryExpression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseMultiplicativeOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parsePrimaryExpression();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse__();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseMultiplicativeOperator();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsePrimaryExpression();
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c67(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseMultiplicativeOperator() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c68;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c69); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c70();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 47) {
          s1 = peg$c71;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c73();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseConstraintPrimaryExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$parseVar();
      if (s0 === peg$FAILED) {
        s0 = peg$parseLiteral();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c74;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c75); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse__();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseConstraintAdditiveExpression();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse__();
                if (s4 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 41) {
                    s5 = peg$c76;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c77); }
                  }
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c78(s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parsePrimaryExpression() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$parseVar();
      if (s0 === peg$FAILED) {
        s0 = peg$parseLiteral();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c74;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c75); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse__();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseAndOrExpression();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse__();
                if (s4 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 41) {
                    s5 = peg$c76;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c77); }
                  }
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c79(s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseVar() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSelector();
      if (s1 === peg$FAILED) {
        s1 = peg$c51;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c81;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c82); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseNameChars();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseNameChars();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s4 = peg$c83;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c84); }
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c85(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }

      return s0;
    }

    function peg$parseNameChars() {
      var s0;

      if (peg$c86.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c87); }
      }

      return s0;
    }

    function peg$parseNameCharsWithSpace() {
      var s0;

      s0 = peg$parseNameChars();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c88;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
      }

      return s0;
    }

    function peg$parseLiteral() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseReal();
      if (s1 === peg$FAILED) {
        s1 = peg$parseInteger();
        if (s1 === peg$FAILED) {
          s1 = peg$parseSignedReal();
          if (s1 === peg$FAILED) {
            s1 = peg$parseSignedInteger();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c90(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseInteger() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c91.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c92); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c91.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c92); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c93(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSignedInteger() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (peg$c94.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c95); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseInteger();
        if (s2 === peg$FAILED) {
          s2 = peg$c51;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c96(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseReal() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseInteger();
      if (s2 === peg$FAILED) {
        s2 = peg$c51;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c97;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c98); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseInteger();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c99(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSignedReal() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (peg$c94.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c95); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseReal();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c100(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSourceCharacter() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c101); }
      }

      return s0;
    }

    function peg$parseWhiteSpace() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c103.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c104); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c102); }
      }

      return s0;
    }

    function peg$parseLineTerminator() {
      var s0;

      if (peg$c105.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c106); }
      }

      return s0;
    }

    function peg$parseLineTerminatorSequence() {
      var s0, s1;

      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c108;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c109); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c110) {
          s0 = peg$c110;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c111); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 13) {
            s0 = peg$c112;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c113); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 8232) {
              s0 = peg$c114;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c115); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 8233) {
                s0 = peg$c116;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c117); }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c107); }
      }

      return s0;
    }

    function peg$parseEOS() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s2 = peg$c118;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c119); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseLineTerminatorSequence();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse__();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseEOF();
            if (s2 !== peg$FAILED) {
              s1 = [s1, s2];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseEOF() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      if (input.length > peg$currPos) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c101); }
      }
      peg$silentFails--;
      if (s1 === peg$FAILED) {
        s0 = peg$c120;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseComment() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseMultiLineComment();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSingleLineComment();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c121); }
      }

      return s0;
    }

    function peg$parseMultiLineComment() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c122) {
        s1 = peg$c122;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c123); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c124) {
          s5 = peg$c124;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c125); }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c120;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c124) {
            s5 = peg$c124;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c125); }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c120;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c124) {
            s3 = peg$c124;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c125); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseMultiLineCommentNoLineTerminator() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c122) {
        s1 = peg$c122;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c123); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c124) {
          s5 = peg$c124;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c125); }
        }
        if (s5 === peg$FAILED) {
          s5 = peg$parseLineTerminator();
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c120;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c124) {
            s5 = peg$c124;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c125); }
          }
          if (s5 === peg$FAILED) {
            s5 = peg$parseLineTerminator();
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c120;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c124) {
            s3 = peg$c124;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c125); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSingleLineComment() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c126) {
        s1 = peg$c126;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c127); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseLineTerminator();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c120;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parseLineTerminator();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c120;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseLineTerminator();
          if (s3 === peg$FAILED) {
            s3 = peg$parseEOF();
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseMultiLineCommentNoLineTerminator();
        if (s1 === peg$FAILED) {
          s1 = peg$parseSingleLineComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseMultiLineCommentNoLineTerminator();
          if (s1 === peg$FAILED) {
            s1 = peg$parseSingleLineComment();
          }
        }
      }

      return s0;
    }

    function peg$parse__() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLineTerminatorSequence();
        if (s1 === peg$FAILED) {
          s1 = peg$parseComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseLineTerminatorSequence();
          if (s1 === peg$FAILED) {
            s1 = peg$parseComment();
          }
        }
      }

      return s0;
    }

    function peg$parseSelector() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 35) {
        s1 = peg$c129;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c130); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c131(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c132) {
          s1 = peg$c132;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c133); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseReservedPseudos();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c134(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 38) {
            s1 = peg$c135;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c136); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c137();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
              s1 = peg$c138;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c139); }
            }
            if (s1 !== peg$FAILED) {
              s2 = [];
              if (peg$c140.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c141); }
              }
              if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                  s2.push(s3);
                  if (peg$c140.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c141); }
                  }
                }
              } else {
                s2 = peg$c0;
              }
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 34) {
                  s3 = peg$c138;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c139); }
                }
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c142(s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 46) {
                s1 = peg$c97;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c98); }
              }
              if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parseNameChars();
                if (s3 !== peg$FAILED) {
                  while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parseNameChars();
                  }
                } else {
                  s2 = peg$c0;
                }
                if (s2 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c143(s2);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = [];
                s2 = peg$parseNameChars();
                if (s2 !== peg$FAILED) {
                  while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parseNameChars();
                  }
                } else {
                  s1 = peg$c0;
                }
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c144(s1);
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 40) {
                    s1 = peg$c74;
                    peg$currPos++;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c75); }
                  }
                  if (s1 !== peg$FAILED) {
                    s2 = [];
                    s3 = peg$parseQuerySelectorAllParts();
                    if (s3 !== peg$FAILED) {
                      while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$parseQuerySelectorAllParts();
                      }
                    } else {
                      s2 = peg$c0;
                    }
                    if (s2 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 41) {
                        s3 = peg$c76;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c77); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c145(s2);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c128); }
      }

      return s0;
    }

    function peg$parseQuerySelectorAllParts() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseQuerySelectorChars();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseQuerySelectorChars();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c146(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c74;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (peg$c147.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c148); }
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c147.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c148); }
            }
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s3 = peg$c76;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c77); }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c149(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseQuerySelectorChars() {
      var s0;

      if (peg$c150.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c151); }
      }

      return s0;
    }

    function peg$parseReservedPseudos() {
      var s0, s1;

      if (input.substr(peg$currPos, 8) === peg$c152) {
        s0 = peg$c152;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c153); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c154) {
          s0 = peg$c154;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c155); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c156) {
            s0 = peg$c156;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c157); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c158) {
              s0 = peg$c158;
              peg$currPos += 6;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c159); }
            }
          }
        }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 6) === peg$c160) {
          s1 = peg$c160;
          peg$currPos += 6;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c161); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 8) === peg$c162) {
            s1 = peg$c162;
            peg$currPos += 8;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c163); }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c164();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 4) === peg$c165) {
            s1 = peg$c165;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c166); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$c167;
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c168();
          }
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parseStrengthAndWeight() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c169;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c170); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseStrength();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseWeight();
          if (s3 === peg$FAILED) {
            s3 = peg$c51;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c171(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 33) {
          s1 = peg$c169;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c170); }
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c101); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c51;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c172();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseWeight() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c91.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c92); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c91.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c92); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c173(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseStrength() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c174) {
        s1 = peg$c174;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c175); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 8) === peg$c176) {
          s1 = peg$c176;
          peg$currPos += 8;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c177); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 8) === peg$c178) {
            s1 = peg$c178;
            peg$currPos += 8;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c179); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c180();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 7) === peg$c181) {
          s1 = peg$c181;
          peg$currPos += 7;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c182); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c183) {
            s1 = peg$c183;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c184); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 7) === peg$c185) {
              s1 = peg$c185;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c186); }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c187();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c188) {
            s1 = peg$c188;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c189); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c190) {
              s1 = peg$c190;
              peg$currPos += 6;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c191); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c192) {
                s1 = peg$c192;
                peg$currPos += 6;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c193); }
              }
            }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c194();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c195) {
              s1 = peg$c195;
              peg$currPos += 6;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c196); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c197) {
                s1 = peg$c197;
                peg$currPos += 6;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c198); }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 6) === peg$c199) {
                  s1 = peg$c199;
                  peg$currPos += 6;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c200); }
                }
              }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c201();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 4) === peg$c202) {
                s1 = peg$c202;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c203); }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c204) {
                  s1 = peg$c204;
                  peg$currPos += 4;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c205); }
                }
                if (s1 === peg$FAILED) {
                  if (input.substr(peg$currPos, 4) === peg$c206) {
                    s1 = peg$c206;
                    peg$currPos += 4;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c207); }
                  }
                }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c208();
              }
              s0 = s1;
            }
          }
        }
      }

      return s0;
    }

    function peg$parseVirtual() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
        s1 = peg$c209;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c210); }
      }
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 12) === peg$c211) {
          s2 = peg$c211;
          peg$currPos += 12;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c212); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c213) {
            s2 = peg$c213;
            peg$currPos += 7;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c214); }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseVirtualName();
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseVirtualName();
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c215(s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseVirtualName() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c138;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c139); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c216.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c217); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c216.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c217); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c138;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c139); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c218(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStay() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseStayStart();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseStayVars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseStayVars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c219(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStayVars() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseVar();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 44) {
              s4 = peg$c220;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c221); }
            }
            if (s4 === peg$FAILED) {
              s4 = peg$c51;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c222(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStayStart() {
      var s0;

      if (input.substr(peg$currPos, 10) === peg$c223) {
        s0 = peg$c223;
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c224); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c225) {
          s0 = peg$c225;
          peg$currPos += 5;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c226); }
        }
      }

      return s0;
    }

    function peg$parseConditional() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c227) {
        s1 = peg$c227;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c228); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse__();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseAndOrExpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c229(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseForEach() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseForLooperType();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse__();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSelector();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseJavaScript();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c230(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseJavaScript() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c231) {
        s1 = peg$c231;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c232); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c233.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c234); }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$c233.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c234); }
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c231) {
            s3 = peg$c231;
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c232); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c235(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseForLooperType() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 14) === peg$c236) {
        s1 = peg$c236;
        peg$currPos += 14;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c237); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 9) === peg$c238) {
          s1 = peg$c238;
          peg$currPos += 9;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c239); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c240();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 13) === peg$c241) {
          s1 = peg$c241;
          peg$currPos += 13;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c242); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 8) === peg$c243) {
            s1 = peg$c243;
            peg$currPos += 8;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c244); }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c245();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseChain() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
        s1 = peg$c209;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c210); }
      }
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c246) {
          s2 = peg$c246;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c247); }
        }
        if (s2 === peg$FAILED) {
          s2 = peg$c51;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c248) {
            s3 = peg$c248;
            peg$currPos += 5;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c249); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseSelector();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse__();
                if (s6 !== peg$FAILED) {
                  s7 = [];
                  s8 = peg$parseChainer();
                  if (s8 !== peg$FAILED) {
                    while (s8 !== peg$FAILED) {
                      s7.push(s8);
                      s8 = peg$parseChainer();
                    }
                  } else {
                    s7 = peg$c0;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parse__();
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c250(s5, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseChainer() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c251.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c252); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c251.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c252); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c74;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c75); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseHeadExp();
            if (s4 === peg$FAILED) {
              s4 = peg$c51;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseChainEq();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseAdditiveExpression();
                    if (s8 === peg$FAILED) {
                      s8 = peg$c51;
                    }
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parse_();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseChainEq();
                        if (s10 === peg$FAILED) {
                          s10 = peg$c51;
                        }
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parse_();
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parseStrengthAndWeight();
                            if (s12 === peg$FAILED) {
                              s12 = peg$c51;
                            }
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parse_();
                              if (s13 !== peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 41) {
                                  s14 = peg$c76;
                                  peg$currPos++;
                                } else {
                                  s14 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c77); }
                                }
                                if (s14 !== peg$FAILED) {
                                  s15 = [];
                                  if (peg$c251.test(input.charAt(peg$currPos))) {
                                    s16 = input.charAt(peg$currPos);
                                    peg$currPos++;
                                  } else {
                                    s16 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c252); }
                                  }
                                  while (s16 !== peg$FAILED) {
                                    s15.push(s16);
                                    if (peg$c251.test(input.charAt(peg$currPos))) {
                                      s16 = input.charAt(peg$currPos);
                                      peg$currPos++;
                                    } else {
                                      s16 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c252); }
                                    }
                                  }
                                  if (s15 !== peg$FAILED) {
                                    s16 = peg$parse__();
                                    if (s16 !== peg$FAILED) {
                                      peg$reportedPos = s0;
                                      s1 = peg$c253(s1, s4, s6, s8, s10, s12, s15);
                                      s0 = s1;
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$c0;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$c0;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$c0;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$c0;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$c0;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseHeadExp() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseChainMath();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseAdditiveExpression();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c254(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseTailExp() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseAdditiveExpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseChainMath();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c255(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseChainMath() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c60;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c61); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c256();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s1 = peg$c63;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c64); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c257();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 42) {
            s1 = peg$c68;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c69); }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c258();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 47) {
              s1 = peg$c71;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c72); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c259();
            }
            s0 = s1;
          }
        }
      }

      return s0;
    }

    function peg$parseChainEq() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseLinearConstraintOperator();
      if (s1 === peg$FAILED) {
        s1 = peg$c51;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c260(s1);
      }
      s0 = s1;

      return s0;
    }


      var grammar = (function() {
        var getLineNumber = function() {
          return line();
        };

        var getColumnNumber = function() {
          return column();
        };

        var getErrorType = function() {
          return SyntaxError;
        };

        var Grammar = require('./grammar');
        return new Grammar(getLineNumber, getColumnNumber, getErrorType);
      })();


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
});
require.register("the-gss-vfl-compiler/lib/compiler.js", function(exports, require, module){
var ErrorReporter, parse;

if (typeof window !== "undefined" && window !== null) {
  parse = require('./parser').parse;
} else {
  parse = require('../lib/parser').parse;
}

ErrorReporter = require('error-reporter');

module.exports = {
  parse: function(source) {
    var columnNumber, error, errorReporter, lineNumber, message, results;
    results = null;
    try {
      results = parse(source);
    } catch (_error) {
      error = _error;
      errorReporter = new ErrorReporter(source);
      message = error.message, lineNumber = error.line, columnNumber = error.column;
      errorReporter.reportError(message, lineNumber, columnNumber);
    }
    return results;
  }
};

});
require.register("the-gss-vfl-compiler/lib/parser.js", function(exports, require, module){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = [],
        peg$c2 = function() { return parser.getResults(); },
        peg$c3 = function(vfl) { return parser.getResults().concat(vfl); },
        peg$c4 = function(exp) { return exp; },
        peg$c5 = null,
        peg$c6 = function(d, head, tail, o) {
              var connection, result, ccss, chainedViews, withContainer,
                tailView, tailViewObj, headView, headViewObj;      
              result = head;      
              headViewObj = head;
              headView = headViewObj.view;      
              chainedViews = [];      
              if (headView !== "|") {chainedViews.push(headView);}
              parser.addPreds(headView,head.preds,d);      
              for (var i = 0; i < tail.length; i++) {        
                connection = tail[i][1];
                tailViewObj = tail[i][3]
                tailView = tailViewObj.view;        
                if (tailView !== "|") {chainedViews.push(tailView);}
                parser.addPreds(tailView,tail[i][3].preds,d);
                result = [
                  //"c",
                  connection,
                  result,
                  tailView
                ];
                if (!(headViewObj.isPoint && tailViewObj.isPoint)) {
                  withContainer = ( headView =="|" || tailView === "|");
                  ccss = p.getLeftVar(headView, d, o, headViewObj) + " " 
                    + p.getConnectionString(connection, d, o, withContainer) + " " 
                    + p.getRightVar(tailView, d, o, tailViewObj)   
                    + p.getTrailingOptions(o)
                    + p.getSW(o);
                  parser.addC(
                    ccss.trim()
                );}
                headViewObj = tailViewObj;
                headView = tailView;
              }
              parser.addChains(chainedViews,o);
              return {'vfl':d, o:o};
            },
        peg$c7 = function(d, selector, o, s) {
           var ccss = "@chain ";
           selector = selector.join("").trim();   
           ccss += selector + " ";
           ccss += p.leftVarNames[d] + "(";
           if (o.gap) {
             ccss += "+" + o.gap;
           }
           ccss += ")" + p.rightVarNames[d];
           if (o.chains) {
             o.chains.forEach( function (chain) {
                ccss += " " + chain[0] + "("; 
                if (chain[1]) {
                  if (chain[1].raw) {
                    ccss += chain[1].raw;
                  }
                }
                ccss += ")";
               });
           }
           ccss += p.getTrailingOptions(o);
           ccss += p.getSW(o);
           parser.addC(ccss.trim());
           return {vfl:d,o:o}
         },
        peg$c8 = "@horizontal",
        peg$c9 = { type: "literal", value: "@horizontal", description: "\"@horizontal\"" },
        peg$c10 = "@-gss-horizontal",
        peg$c11 = { type: "literal", value: "@-gss-horizontal", description: "\"@-gss-horizontal\"" },
        peg$c12 = "@-gss-h",
        peg$c13 = { type: "literal", value: "@-gss-h", description: "\"@-gss-h\"" },
        peg$c14 = "@h",
        peg$c15 = { type: "literal", value: "@h", description: "\"@h\"" },
        peg$c16 = function() {return 0;},
        peg$c17 = "@vertical",
        peg$c18 = { type: "literal", value: "@vertical", description: "\"@vertical\"" },
        peg$c19 = "@-gss-vertical",
        peg$c20 = { type: "literal", value: "@-gss-vertical", description: "\"@-gss-vertical\"" },
        peg$c21 = "@-gss-v",
        peg$c22 = { type: "literal", value: "@-gss-v", description: "\"@-gss-v\"" },
        peg$c23 = "@v",
        peg$c24 = { type: "literal", value: "@v", description: "\"@v\"" },
        peg$c25 = function() {return 1;},
        peg$c26 = function(os) {
            var obj = {};
            obj.chains = [];
            for (var i = 0; i < os.length; i++) {          
              // proccess chains
              if (!!os[i].chain) {
                obj.chains.push(os[i].chain);
              }
              // or just add option
              else {
                obj[os[i].key] = os[i].value;
              }            
            }
            return obj;
          },
        peg$c27 = { type: "other", description: "Option" },
        peg$c28 = function(chain) { return chain; },
        peg$c29 = "(",
        peg$c30 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c31 = ")",
        peg$c32 = { type: "literal", value: ")", description: "\")\"" },
        peg$c33 = function(key, value) {return {key:key.join(''), value:value.join('')};},
        peg$c34 = function(sw) {return {key:"sw",value:sw}; },
        peg$c35 = /^[^>=<!)]/,
        peg$c36 = { type: "class", value: "[^>=<!)]", description: "[^>=<!)]" },
        peg$c37 = { type: "other", description: "Chain" },
        peg$c38 = "chain-",
        peg$c39 = { type: "literal", value: "chain-", description: "\"chain-\"" },
        peg$c40 = function(prop, preds) { return {'chain':[prop.join(""),preds]};},
        peg$c41 = { type: "other", description: "ChainPredicate" },
        peg$c42 = function(items) {
            items.raw = "";
            items.forEach( function (item){
              items.raw += item.raw;
            });
            return items;
          },
        peg$c43 = "()",
        peg$c44 = { type: "literal", value: "()", description: "\"()\"" },
        peg$c45 = function() {return {raw:""};},
        peg$c46 = ",",
        peg$c47 = { type: "literal", value: ",", description: "\",\"" },
        peg$c48 = function(item) {
            item.raw = item.headEq + item.value + item.tailEq + item.s;
            return item;
          },
        peg$c49 = function(headEq, value, tailEq, s) {
              return {headEq:p.join(headEq),value:p.join(value),tailEq:p.join(tailEq),s:p.join(s)};},
        peg$c50 = /^[^>=<!) ]/,
        peg$c51 = { type: "class", value: "[^>=<!) ]", description: "[^>=<!) ]" },
        peg$c52 = { type: "other", description: "VFL Element" },
        peg$c53 = "[",
        peg$c54 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c55 = "]",
        peg$c56 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c57 = function(name, pred) {return {view:p.stringify(name),preds:pred};},
        peg$c58 = "|",
        peg$c59 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c60 = /^[^~\-]/,
        peg$c61 = { type: "class", value: "[^~\\-]", description: "[^~\\-]" },
        peg$c62 = function(point) {return {view:"|", isPoint:true, pos:point};},
        peg$c63 = function() {return {view:"|"};},
        peg$c64 = { type: "other", description: "Point" },
        peg$c65 = "<",
        peg$c66 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c67 = /^[^>]/,
        peg$c68 = { type: "class", value: "[^>]", description: "[^>]" },
        peg$c69 = ">",
        peg$c70 = { type: "literal", value: ">", description: "\">\"" },
        peg$c71 = function(position) {
            return p.stringify(position);
          },
        peg$c72 = { type: "other", description: "Predicate" },
        peg$c73 = function(preds) {return preds;},
        peg$c74 = { type: "other", description: "Predicate Expression" },
        peg$c75 = "==",
        peg$c76 = { type: "literal", value: "==", description: "\"==\"" },
        peg$c77 = "<=",
        peg$c78 = { type: "literal", value: "<=", description: "\"<=\"" },
        peg$c79 = ">=",
        peg$c80 = { type: "literal", value: ">=", description: "\">=\"" },
        peg$c81 = "=<",
        peg$c82 = { type: "literal", value: "=<", description: "\"=<\"" },
        peg$c83 = function() {return "<=";},
        peg$c84 = "=>",
        peg$c85 = { type: "literal", value: "=>", description: "\"=>\"" },
        peg$c86 = function() {return ">=";},
        peg$c87 = function(eq) {return eq;},
        peg$c88 = /^[+\-\/*]/,
        peg$c89 = { type: "class", value: "[+\\-\\/*]", description: "[+\\-\\/*]" },
        peg$c90 = function(op) {return op;},
        peg$c91 = function(name) {return ["view",name.join("")];},
        peg$c92 = function(n) {return n.join("");},
        peg$c93 = function(name) {return "[" + name.join("") + "]";},
        peg$c94 = function(view, prop) {return view.join("") + "[" + prop.join("") + "]";},
        peg$c95 = function() {return "";},
        peg$c96 = { type: "other", description: "VFL Connection" },
        peg$c97 = "-",
        peg$c98 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c99 = function(gap) {return {op:"==",gap:gap.join("")};},
        peg$c100 = function() {return {op:"==",gap:"__STANDARD__"};},
        peg$c101 = "~",
        peg$c102 = { type: "literal", value: "~", description: "\"~\"" },
        peg$c103 = function(gap) {return {op:"<=",gap:gap.join("")};},
        peg$c104 = function() {return {op:"<=",gap:"__STANDARD__"};},
        peg$c105 = function() {return {op:"<="};},
        peg$c106 = "",
        peg$c107 = function() {return {op:"=="};},
        peg$c108 = { type: "other", description: "VFL Connection Gap" },
        peg$c109 = /^[a-zA-Z0-9#._$]/,
        peg$c110 = { type: "class", value: "[a-zA-Z0-9#._$]", description: "[a-zA-Z0-9#._$]" },
        peg$c111 = { type: "other", description: "Strength / Weight" },
        peg$c112 = "!",
        peg$c113 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c114 = /^[a-zA-Z]/,
        peg$c115 = { type: "class", value: "[a-zA-Z]", description: "[a-zA-Z]" },
        peg$c116 = /^[0-9]/,
        peg$c117 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c118 = function(s, w) { 
            var val;
            val = "!" + p.join(s) + p.join(w);
            return val.trim();
          },
        peg$c119 = { type: "any", description: "any character" },
        peg$c120 = function() {
            throw new SyntaxError('Invalid Strength or Weight', null, null, null, line(), column());
          },
        peg$c121 = /^[a-zA-Z0-9#.\-_$:""]/,
        peg$c122 = { type: "class", value: "[a-zA-Z0-9#.\\-_$:\"\"]", description: "[a-zA-Z0-9#.\\-_$:\"\"]" },
        peg$c123 = " ",
        peg$c124 = { type: "literal", value: " ", description: "\" \"" },
        peg$c125 = function(val) {
            return [ "number",
              val
            ];
          },
        peg$c126 = function(digits) {
            return parseInt(digits.join(""), 10);
          },
        peg$c127 = ".",
        peg$c128 = { type: "literal", value: ".", description: "\".\"" },
        peg$c129 = function(digits) {
            return parseFloat(digits.join(""));
          },
        peg$c130 = /^[\-+]/,
        peg$c131 = { type: "class", value: "[\\-+]", description: "[\\-+]" },
        peg$c132 = { type: "other", description: "whitespace" },
        peg$c133 = /^[\t\x0B\f \xA0\uFEFF]/,
        peg$c134 = { type: "class", value: "[\\t\\x0B\\f \\xA0\\uFEFF]", description: "[\\t\\x0B\\f \\xA0\\uFEFF]" },
        peg$c135 = /^[\n\r\u2028\u2029]/,
        peg$c136 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
        peg$c137 = { type: "other", description: "end of line" },
        peg$c138 = "\n",
        peg$c139 = { type: "literal", value: "\n", description: "\"\\n\"" },
        peg$c140 = "\r\n",
        peg$c141 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
        peg$c142 = "\r",
        peg$c143 = { type: "literal", value: "\r", description: "\"\\r\"" },
        peg$c144 = "\u2028",
        peg$c145 = { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
        peg$c146 = "\u2029",
        peg$c147 = { type: "literal", value: "\u2029", description: "\"\\u2029\"" },
        peg$c148 = ";",
        peg$c149 = { type: "literal", value: ";", description: "\";\"" },
        peg$c150 = void 0,
        peg$c151 = { type: "other", description: "comment" },
        peg$c152 = "/*",
        peg$c153 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c154 = "*/",
        peg$c155 = { type: "literal", value: "*/", description: "\"*/\"" },
        peg$c156 = "//",
        peg$c157 = { type: "literal", value: "//", description: "\"//\"" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseStatement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseStatement();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c2();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsedebug() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseStatement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseStatement();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c3(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStatement() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseVFLStatement();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEOS();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseVFLStatement() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = peg$parseDimension();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse__();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseView();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$currPos;
            s6 = peg$parse__();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseConnection();
              if (s7 === peg$FAILED) {
                s7 = peg$c5;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$parse__();
                if (s8 !== peg$FAILED) {
                  s9 = peg$parseView();
                  if (s9 !== peg$FAILED) {
                    s6 = [s6, s7, s8, s9];
                    s5 = s6;
                  } else {
                    peg$currPos = s5;
                    s5 = peg$c0;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$c0;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$c0;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$c0;
            }
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$currPos;
              s6 = peg$parse__();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseConnection();
                if (s7 === peg$FAILED) {
                  s7 = peg$c5;
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse__();
                  if (s8 !== peg$FAILED) {
                    s9 = peg$parseView();
                    if (s9 !== peg$FAILED) {
                      s6 = [s6, s7, s8, s9];
                      s5 = s6;
                    } else {
                      peg$currPos = s5;
                      s5 = peg$c0;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$c0;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$c0;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$c0;
              }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse__();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseOptions();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c6(s1, s3, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseVFLPluralStatement();
      }

      return s0;
    }

    function peg$parseVFLPluralStatement() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseDimension();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse__();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseNameChars();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseNameChars();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseOptions();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse__();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseStrengthAndWeight();
                  if (s7 === peg$FAILED) {
                    s7 = peg$c5;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c7(s1, s3, s5, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseDimension() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 11) === peg$c8) {
        s1 = peg$c8;
        peg$currPos += 11;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 16) === peg$c10) {
          s1 = peg$c10;
          peg$currPos += 16;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c12) {
            s1 = peg$c12;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c13); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c14) {
              s1 = peg$c14;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c15); }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c16();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 9) === peg$c17) {
          s1 = peg$c17;
          peg$currPos += 9;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 14) === peg$c19) {
            s1 = peg$c19;
            peg$currPos += 14;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c20); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 7) === peg$c21) {
              s1 = peg$c21;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c22); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c23) {
                s1 = peg$c23;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c24); }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c25();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseOptions() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseOption();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseOption();
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c26(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseOption() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseChain();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse__();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseNameChars();
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parseNameChars();
            }
          } else {
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
              s3 = peg$c29;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c30); }
            }
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parseOpionValueChars();
              if (s5 !== peg$FAILED) {
                while (s5 !== peg$FAILED) {
                  s4.push(s5);
                  s5 = peg$parseOpionValueChars();
                }
              } else {
                s4 = peg$c0;
              }
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s5 = peg$c31;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c33(s2, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse__();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseStrengthAndWeight();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c34(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }

      return s0;
    }

    function peg$parseOpionValueChars() {
      var s0;

      if (peg$c35.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c36); }
      }

      return s0;
    }

    function peg$parseChain() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c38) {
        s1 = peg$c38;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseChainPredicate();
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c40(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }

      return s0;
    }

    function peg$parseChainPredicate() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c29;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseChainPredicateItems();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseChainPredicateItems();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c31;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c42(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c43) {
          s1 = peg$c43;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c44); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c45();
        }
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }

      return s0;
    }

    function peg$parseChainPredicateItems() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseChainPredicateItem();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c46;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c47); }
          }
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c48(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseChainPredicateItem() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parsePredEq();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseChainPredVal();
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 === peg$FAILED) {
              s4 = peg$c5;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsePredEq();
              if (s5 === peg$FAILED) {
                s5 = peg$c5;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 === peg$FAILED) {
                  s6 = peg$c5;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseStrengthAndWeight();
                  if (s7 === peg$FAILED) {
                    s7 = peg$c5;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c49(s1, s3, s5, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsePredEq();
        if (s1 === peg$FAILED) {
          s1 = peg$c5;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 === peg$FAILED) {
            s2 = peg$c5;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseChainPredVal();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 === peg$FAILED) {
                s4 = peg$c5;
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parsePredEq();
                if (s5 === peg$FAILED) {
                  s5 = peg$c5;
                }
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_();
                  if (s6 === peg$FAILED) {
                    s6 = peg$c5;
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parseStrengthAndWeight();
                    if (s7 === peg$FAILED) {
                      s7 = peg$c5;
                    }
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c49(s1, s3, s5, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsePredEq();
          if (s1 === peg$FAILED) {
            s1 = peg$c5;
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 === peg$FAILED) {
              s2 = peg$c5;
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseChainPredVal();
              if (s3 === peg$FAILED) {
                s3 = peg$c5;
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 === peg$FAILED) {
                  s4 = peg$c5;
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parsePredEq();
                  if (s5 === peg$FAILED) {
                    s5 = peg$c5;
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 === peg$FAILED) {
                      s6 = peg$c5;
                    }
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parseStrengthAndWeight();
                      if (s7 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c49(s1, s3, s5, s7);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseChainPredVal() {
      var s0, s1;

      s0 = [];
      if (peg$c50.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c50.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c51); }
          }
        }
      } else {
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseView() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c53;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsePredicate();
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s4 = peg$c55;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c56); }
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c57(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 124) {
          s1 = peg$c58;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c59); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          if (peg$c60.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c61); }
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseNameChars();
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseNameChars();
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              s3 = [s3, s4];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsePredicate();
            if (s3 === peg$FAILED) {
              s3 = peg$c5;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 124) {
                s4 = peg$c58;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c59); }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c57(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsePoint();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c62(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 124) {
              s1 = peg$c58;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c59); }
            }
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c63();
            }
            s0 = s1;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c52); }
      }

      return s0;
    }

    function peg$parsePoint() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c65;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c67.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c68); }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c67.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c68); }
              }
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 === peg$FAILED) {
              s4 = peg$c5;
            }
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 62) {
                s5 = peg$c69;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c70); }
              }
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c71(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }

      return s0;
    }

    function peg$parsePredicate() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c29;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsePredEq();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsePredExpression();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseStrengthAndWeight();
            if (s6 === peg$FAILED) {
              s6 = peg$c5;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parse_();
              if (s7 === peg$FAILED) {
                s7 = peg$c5;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$parsePredSeperator();
                if (s8 !== peg$FAILED) {
                  s9 = peg$parse_();
                  if (s9 === peg$FAILED) {
                    s9 = peg$c5;
                  }
                  if (s9 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8, s9];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parsePredEq();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsePredExpression();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseStrengthAndWeight();
                if (s6 === peg$FAILED) {
                  s6 = peg$c5;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 === peg$FAILED) {
                    s7 = peg$c5;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsePredSeperator();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parse_();
                      if (s9 === peg$FAILED) {
                        s9 = peg$c5;
                      }
                      if (s9 !== peg$FAILED) {
                        s4 = [s4, s5, s6, s7, s8, s9];
                        s3 = s4;
                      } else {
                        peg$currPos = s3;
                        s3 = peg$c0;
                      }
                    } else {
                      peg$currPos = s3;
                      s3 = peg$c0;
                    }
                  } else {
                    peg$currPos = s3;
                    s3 = peg$c0;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c31;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c73(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c72); }
      }

      return s0;
    }

    function peg$parsePredExpression() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      s1 = peg$parsePredOp();
      if (s1 === peg$FAILED) {
        s1 = peg$parsePredLiteral();
        if (s1 === peg$FAILED) {
          s1 = peg$parsePredVariable();
          if (s1 === peg$FAILED) {
            s1 = peg$parsePredViewVariable();
            if (s1 === peg$FAILED) {
              s1 = peg$parsePredView();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parsePredOp();
          if (s1 === peg$FAILED) {
            s1 = peg$parsePredLiteral();
            if (s1 === peg$FAILED) {
              s1 = peg$parsePredVariable();
              if (s1 === peg$FAILED) {
                s1 = peg$parsePredViewVariable();
                if (s1 === peg$FAILED) {
                  s1 = peg$parsePredView();
                }
              }
            }
          }
        }
      } else {
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }

      return s0;
    }

    function peg$parsePredEq() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 === peg$FAILED) {
        s1 = peg$c5;
      }
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c75) {
          s2 = peg$c75;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c76); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c77) {
            s2 = peg$c77;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c78); }
          }
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 60) {
              s2 = peg$c65;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c66); }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c79) {
                s2 = peg$c79;
                peg$currPos += 2;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c80); }
              }
              if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 62) {
                  s2 = peg$c69;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c70); }
                }
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.substr(peg$currPos, 2) === peg$c81) {
                    s3 = peg$c81;
                    peg$currPos += 2;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c82); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s2;
                    s3 = peg$c83();
                  }
                  s2 = s3;
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.substr(peg$currPos, 2) === peg$c84) {
                      s3 = peg$c84;
                      peg$currPos += 2;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c85); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c86();
                    }
                    s2 = s3;
                  }
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c87(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredOp() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (peg$c88.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c89); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c90(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredView() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseNameChars();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseNameChars();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c91(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredLiteral() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseNumber();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseNumber();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c92(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredVariable() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c53;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
            s3 = peg$c55;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c56); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 === peg$FAILED) {
              s4 = peg$c5;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c93(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredViewVariable() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseNameChars();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseNameChars();
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c53;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseNameChars();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseNameChars();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s4 = peg$c55;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c56); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 === peg$FAILED) {
                s5 = peg$c5;
              }
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c94(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsePredSeperator() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 44) {
        s1 = peg$c46;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c5;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c95();
      }
      s0 = s1;

      return s0;
    }

    function peg$parseConnection() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c97;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c98); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseGapChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseGapChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s3 = peg$c97;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c98); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c99(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s1 = peg$c97;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c98); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c100();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 126) {
            s1 = peg$c101;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c102); }
          }
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseGapChars();
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseGapChars();
              }
            } else {
              s2 = peg$c0;
            }
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 126) {
                s3 = peg$c101;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c102); }
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c103(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 126) {
              s1 = peg$c101;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c102); }
            }
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c97;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c98); }
              }
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 126) {
                  s3 = peg$c101;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c102); }
                }
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c104();
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 126) {
                s1 = peg$c101;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c102); }
              }
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c105();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$c106;
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c107();
                }
                s0 = s1;
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c96); }
      }

      return s0;
    }

    function peg$parseGapChars() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c109.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c110); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c108); }
      }

      return s0;
    }

    function peg$parseStrengthAndWeight() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c112;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c114.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c115); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c114.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c115); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 === peg$FAILED) {
          s2 = peg$c5;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c116.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c116.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c117); }
              }
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 === peg$FAILED) {
            s3 = peg$c5;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c118(s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 33) {
          s1 = peg$c112;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c113); }
        }
        if (s1 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c119); }
          }
          if (s2 === peg$FAILED) {
            s2 = peg$c5;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c120();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c111); }
      }

      return s0;
    }

    function peg$parseNameChars() {
      var s0;

      if (peg$c121.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c122); }
      }

      return s0;
    }

    function peg$parseNameCharsWithSpace() {
      var s0;

      s0 = peg$parseNameChars();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c123;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
      }

      return s0;
    }

    function peg$parseLiteral() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseNumber();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c125(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseNumber() {
      var s0;

      s0 = peg$parseReal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseInteger();
      }

      return s0;
    }

    function peg$parseInteger() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c116.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c117); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c116.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c126(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseReal() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseInteger();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c127;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c128); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseInteger();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c129(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSignedInteger() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c130.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c131); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c5;
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c116.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c117); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c116.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c117); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSourceCharacter() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c119); }
      }

      return s0;
    }

    function peg$parseWhiteSpace() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c133.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c134); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c132); }
      }

      return s0;
    }

    function peg$parseLineTerminator() {
      var s0;

      if (peg$c135.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c136); }
      }

      return s0;
    }

    function peg$parseLineTerminatorSequence() {
      var s0, s1;

      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c138;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c139); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c140) {
          s0 = peg$c140;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c141); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 13) {
            s0 = peg$c142;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c143); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 8232) {
              s0 = peg$c144;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c145); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 8233) {
                s0 = peg$c146;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c147); }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c137); }
      }

      return s0;
    }

    function peg$parseEOS() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s2 = peg$c148;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c149); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseLineTerminatorSequence();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse__();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseEOF();
            if (s2 !== peg$FAILED) {
              s1 = [s1, s2];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseEOF() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      if (input.length > peg$currPos) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c119); }
      }
      peg$silentFails--;
      if (s1 === peg$FAILED) {
        s0 = peg$c150;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseComment() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseMultiLineComment();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSingleLineComment();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c151); }
      }

      return s0;
    }

    function peg$parseMultiLineComment() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c152) {
        s1 = peg$c152;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c153); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c154) {
          s5 = peg$c154;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c155); }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c150;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c154) {
            s5 = peg$c154;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c155); }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c150;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c154) {
            s3 = peg$c154;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c155); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseMultiLineCommentNoLineTerminator() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c152) {
        s1 = peg$c152;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c153); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c154) {
          s5 = peg$c154;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c155); }
        }
        if (s5 === peg$FAILED) {
          s5 = peg$parseLineTerminator();
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c150;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c154) {
            s5 = peg$c154;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c155); }
          }
          if (s5 === peg$FAILED) {
            s5 = peg$parseLineTerminator();
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c150;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c154) {
            s3 = peg$c154;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c155); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSingleLineComment() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c156) {
        s1 = peg$c156;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c157); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseLineTerminator();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c150;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parseLineTerminator();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c150;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseLineTerminator();
          if (s3 === peg$FAILED) {
            s3 = peg$parseEOF();
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseMultiLineCommentNoLineTerminator();
        if (s1 === peg$FAILED) {
          s1 = peg$parseSingleLineComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseMultiLineCommentNoLineTerminator();
          if (s1 === peg$FAILED) {
            s1 = peg$parseSingleLineComment();
          }
        }
      }

      return s0;
    }

    function peg$parse__() {
      var s0, s1;

      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLineTerminatorSequence();
        if (s1 === peg$FAILED) {
          s1 = peg$parseComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseLineTerminatorSequence();
          if (s1 === peg$FAILED) {
            s1 = peg$parseComment();
          }
        }
      }

      return s0;
    }


      var p, parser, cs, leftVarNames, superLeftVarNames, rightVarNames, superRightVarNames, standardGapNames, getSuperViewName, getGapString, sizeVarNames; 

      p = parser = this;
      
      
      p.trickleDownOptions = ["name"];
      sizeVarNames = p.sizeVarNames = ["width", "height"];
      leftVarNames = p.leftVarNames = ["right", "bottom"];
      superLeftVarNames = p.superLeftVarNames = ["left", "top"];
      rightVarNames = p.rightVarNames = ["left", "top"];
      superRightVarNames = p.superRightVarNames = ["right", "bottom"];

      cs = parser.cs = [];

      parser.addC = function (c) {
        cs.push(c);
      };

      parser.addPreds = function (view,preds,d) {
        var pred, ccss, eq, exps, exp;
        if (preds) {      
          for (var i = 0; i < preds.length; i++) {
            pred = preds[i];
            eq = pred[0];
            ccss = view + "[" + sizeVarNames[d] + "] " + eq + " ";
            exps = pred[1];
            for (var j = 0; j < exps.length; j++) {       
              exp = exps[j];
              if (exp[0] === "view") {
                exp = exp[1] + "[" + sizeVarNames[d] + "]";
              }
              ccss += exp + " ";
            }
            if (pred[2]) {
              ccss += pred[2];
            } // strength & weight
            cs.push(ccss.trim());
          }
        }
      };

      parser.defaultChainObject = {
        headEq: "==",
        value: "",
        tailEq: "",
        s: ""
      };

      parser.chainTailEqMap = {
        "<=": ">=",
        ">=": "<=",
        "==": "==",
        "<" : ">",
        ">" : "<" 
      };

      parser.addChains = function (views,o) {
        var chains, chain, prop, preds, connector, ccss, view, pred;
        chains = o.chains;
        if (chains) {     
          for (var i = 0; i < chains.length; i++) {
            chain = chains[i];
            prop = chain[0];
            preds = chain[1];
            if (preds === "" || !preds) {
              // load default chain predicate
              preds = [parser.defaultChainObject];
            } 
            for (var j = 0; j < preds.length; j++) {
              pred = preds[j];
              ccss = "";
              for (var k = 0; k < views.length - 1; k++) {
                view = views[k];  
                if (pred.headEq === "") {
                  pred.headEq = parser.defaultChainObject.headEq;
                }
                ccss += " " + view + "[" + prop + "] " + pred.headEq;
                if (pred.value !== "") {
                  ccss += " " + pred.value;
                  if (views.length > 1) {
                    if (pred.tailEq === "") {
                      pred.tailEq = parser.chainTailEqMap[pred.headEq];
                    }
                    ccss += " " + pred.tailEq;
                  }
                  else {
                    ccss += " " + pred.s;                
                    cs.push(ccss.trim());
                  }
                }
              }
              if (views.length > 1) {
                 ccss += " " + views[views.length-1] + "[" + prop + "]";
                 ccss += p.getTrailingOptions(o);
                 ccss += " " + pred.s;
                 cs.push(ccss.trim());
              }
            }
          }
        } 
      };

      getSuperViewName = function (o) {
        if (o.in === undefined) {
          return "::this";
        }
        return o.in;
      };

      parser.getLeftVar = function (view, dimension, o, viewObj) {
        var varName, viewName;
        if (viewObj.isPoint) {
          return viewObj.pos;
        }
        else if (view === "|") {
          viewName = getSuperViewName(o);
          varName = superLeftVarNames[dimension];
        }
        else {
          viewName = view;
          varName = leftVarNames[dimension];
        }
        return viewName + "[" + varName + "]";
      };
      
      parser.getRightVar = function (view, dimension, o, viewObj) {
        var varName;
        if (viewObj.isPoint) {
          return viewObj.pos;
        }
        else if (view === "|") {
          view = getSuperViewName(o);
          varName = superRightVarNames[dimension];
        }
        else {
          varName = rightVarNames[dimension];
          
        }
        return view + "[" + varName + "]";
      };
      
      standardGapNames = ["[hgap]", "[vgap]"];
      
      getGapString = function (g,d,o,withContainer) {
        if (g === undefined) {return "";}
        if (g === "__STANDARD__") {
          // use gap if given with `gap()` or `outer-gap`
          if (withContainer && o['outer-gap']) {
            g = o['outer-gap'];
          } else if (o.gap) {
            g = o.gap;
          // else use standard var
          } else {
            g = standardGapNames[d];
          }
        }
        return "+ " + g;
      };

      parser.getConnectionString = function (c, d, o, withContainer) {
        
        return (getGapString(c.gap,d,o,withContainer) + " " + c.op).trim();
      };
          
      p.getTrailingOptions = function (o) {
        var string = "";
        if (o) {
          p.trickleDownOptions.forEach(function(key){
            if (o[key] != null) {
              string = string + " " + key + "(" + o[key] + ")";
            }
          });
        }
        return string;
      };
      
      p.getSW = function (o) {
        if (o.sw) {
          return " " + o.sw.trim();
        }
        return "";
      };
      

      parser.getResults = function () {
        return this.cs;
      };
      
      p.flatten = function (array, isShallow) {
        
        if (typeof array === "string") {return array;}
        
        var index = -1,
          length = array ? array.length : 0,
          result = [];

        while (++index < length) {
          var value = array[index];

          if (value instanceof Array) {
            Array.prototype.push.apply(result, isShallow ? value : p.flatten(value));
          }
          else {
            result.push(value);
          }
        }
        return result;
      }

      p.trim = function (x) {
        if (typeof x === "string") {return x.trim();}
        if (x instanceof Array) {return x.join("").trim();}
        return ""
      };

      p.join = function (a) {
        if (!a) {return "";}
        if (a.join){return a.join("");}
        return a;
      };
      
      p.stringify = function (array) {
        if (!array) {return "";}
        return p.trim(p.join(p.flatten(array)));
      };
      


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
});
require.register("the-gss-vgl-compiler/lib/compiler.js", function(exports, require, module){
var ErrorReporter, parse;

if (typeof window !== "undefined" && window !== null) {
  parse = require('./parser').parse;
} else {
  parse = require('../lib/parser').parse;
}

ErrorReporter = require('error-reporter');

module.exports = {
  parse: function(source) {
    var columnNumber, error, errorReporter, lineNumber, message, results;
    results = null;
    try {
      results = parse(source);
    } catch (_error) {
      error = _error;
      errorReporter = new ErrorReporter(source);
      message = error.message, lineNumber = error.line, columnNumber = error.column;
      errorReporter.reportError(message, lineNumber, columnNumber);
    }
    return results;
  }
};

});
require.register("the-gss-vgl-compiler/lib/parser.js", function(exports, require, module){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = [],
        peg$c2 = function() {return p.getResults()},
        peg$c3 = "@",
        peg$c4 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c5 = function(vfls) { return vfls; },
        peg$c6 = { type: "other", description: "grid-rows / grid-cols" },
        peg$c7 = "grid-",
        peg$c8 = { type: "literal", value: "grid-", description: "\"grid-\"" },
        peg$c9 = "-gss-grid-",
        peg$c10 = { type: "literal", value: "-gss-grid-", description: "\"-gss-grid-\"" },
        peg$c11 = "\"",
        peg$c12 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c13 = function(d, line, stuff) {
            var vfl, props;
            vfl = "@"+ ['v','h'][d] +" "+ 
              line +" "+
              "in"+"(::)" +" "+ 
              "chain-"+p.size[d]+"(::["+p.size[d] +"]) "+       
              "chain-"+p.size[1-d] +" "+
              "chain-"+p.pos[d]+"(::["+p.pos[d] +"]) "+
              p.trim(stuff);
            p.addVFL(vfl.trim());
          },
        peg$c14 = { type: "other", description: "grid-template" },
        peg$c15 = "template",
        peg$c16 = { type: "literal", value: "template", description: "\"template\"" },
        peg$c17 = /^[0-9a-zA-Z\-_]/,
        peg$c18 = { type: "class", value: "[0-9a-zA-Z\\-_]", description: "[0-9a-zA-Z\\-_]" },
        peg$c19 = function(name, lines, options) {
             p.addTemplate(lines,p.stringify(name),options);    
          },
        peg$c20 = { type: "other", description: "template line" },
        peg$c21 = function(zones) {
            return p.processHZones(zones);    
          },
        peg$c22 = { type: "other", description: "Template Options" },
        peg$c23 = function(o) {
            var result = {};
            if (o) {
              result = {}
              o.forEach(function(obj){
                result[obj.key] = obj.value;
              })
            } 
            return result;
          },
        peg$c24 = { type: "other", description: "TemplateOption" },
        peg$c25 = "(",
        peg$c26 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c27 = ")",
        peg$c28 = { type: "literal", value: ")", description: "\")\"" },
        peg$c29 = function(key, value) {return {key:key.join(''), value:value.join('')};},
        peg$c30 = /^[^>=<!)]/,
        peg$c31 = { type: "class", value: "[^>=<!)]", description: "[^>=<!)]" },
        peg$c32 = { type: "other", description: "Template Zone" },
        peg$c33 = "0",
        peg$c34 = { type: "literal", value: "0", description: "\"0\"" },
        peg$c35 = "1",
        peg$c36 = { type: "literal", value: "1", description: "\"1\"" },
        peg$c37 = "2",
        peg$c38 = { type: "literal", value: "2", description: "\"2\"" },
        peg$c39 = "3",
        peg$c40 = { type: "literal", value: "3", description: "\"3\"" },
        peg$c41 = "4",
        peg$c42 = { type: "literal", value: "4", description: "\"4\"" },
        peg$c43 = "5",
        peg$c44 = { type: "literal", value: "5", description: "\"5\"" },
        peg$c45 = "6",
        peg$c46 = { type: "literal", value: "6", description: "\"6\"" },
        peg$c47 = "7",
        peg$c48 = { type: "literal", value: "7", description: "\"7\"" },
        peg$c49 = "8",
        peg$c50 = { type: "literal", value: "8", description: "\"8\"" },
        peg$c51 = "9",
        peg$c52 = { type: "literal", value: "9", description: "\"9\"" },
        peg$c53 = "a",
        peg$c54 = { type: "literal", value: "a", description: "\"a\"" },
        peg$c55 = "b",
        peg$c56 = { type: "literal", value: "b", description: "\"b\"" },
        peg$c57 = "c",
        peg$c58 = { type: "literal", value: "c", description: "\"c\"" },
        peg$c59 = "d",
        peg$c60 = { type: "literal", value: "d", description: "\"d\"" },
        peg$c61 = "e",
        peg$c62 = { type: "literal", value: "e", description: "\"e\"" },
        peg$c63 = "f",
        peg$c64 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c65 = "g",
        peg$c66 = { type: "literal", value: "g", description: "\"g\"" },
        peg$c67 = "h",
        peg$c68 = { type: "literal", value: "h", description: "\"h\"" },
        peg$c69 = "i",
        peg$c70 = { type: "literal", value: "i", description: "\"i\"" },
        peg$c71 = "j",
        peg$c72 = { type: "literal", value: "j", description: "\"j\"" },
        peg$c73 = "k",
        peg$c74 = { type: "literal", value: "k", description: "\"k\"" },
        peg$c75 = "l",
        peg$c76 = { type: "literal", value: "l", description: "\"l\"" },
        peg$c77 = "m",
        peg$c78 = { type: "literal", value: "m", description: "\"m\"" },
        peg$c79 = "n",
        peg$c80 = { type: "literal", value: "n", description: "\"n\"" },
        peg$c81 = "o",
        peg$c82 = { type: "literal", value: "o", description: "\"o\"" },
        peg$c83 = "p",
        peg$c84 = { type: "literal", value: "p", description: "\"p\"" },
        peg$c85 = "q",
        peg$c86 = { type: "literal", value: "q", description: "\"q\"" },
        peg$c87 = "r",
        peg$c88 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c89 = "s",
        peg$c90 = { type: "literal", value: "s", description: "\"s\"" },
        peg$c91 = "t",
        peg$c92 = { type: "literal", value: "t", description: "\"t\"" },
        peg$c93 = "u",
        peg$c94 = { type: "literal", value: "u", description: "\"u\"" },
        peg$c95 = "v",
        peg$c96 = { type: "literal", value: "v", description: "\"v\"" },
        peg$c97 = "w",
        peg$c98 = { type: "literal", value: "w", description: "\"w\"" },
        peg$c99 = "x",
        peg$c100 = { type: "literal", value: "x", description: "\"x\"" },
        peg$c101 = "y",
        peg$c102 = { type: "literal", value: "y", description: "\"y\"" },
        peg$c103 = "z",
        peg$c104 = { type: "literal", value: "z", description: "\"z\"" },
        peg$c105 = "A",
        peg$c106 = { type: "literal", value: "A", description: "\"A\"" },
        peg$c107 = "B",
        peg$c108 = { type: "literal", value: "B", description: "\"B\"" },
        peg$c109 = "C",
        peg$c110 = { type: "literal", value: "C", description: "\"C\"" },
        peg$c111 = "D",
        peg$c112 = { type: "literal", value: "D", description: "\"D\"" },
        peg$c113 = "E",
        peg$c114 = { type: "literal", value: "E", description: "\"E\"" },
        peg$c115 = "F",
        peg$c116 = { type: "literal", value: "F", description: "\"F\"" },
        peg$c117 = "G",
        peg$c118 = { type: "literal", value: "G", description: "\"G\"" },
        peg$c119 = "H",
        peg$c120 = { type: "literal", value: "H", description: "\"H\"" },
        peg$c121 = "I",
        peg$c122 = { type: "literal", value: "I", description: "\"I\"" },
        peg$c123 = "J",
        peg$c124 = { type: "literal", value: "J", description: "\"J\"" },
        peg$c125 = "K",
        peg$c126 = { type: "literal", value: "K", description: "\"K\"" },
        peg$c127 = "L",
        peg$c128 = { type: "literal", value: "L", description: "\"L\"" },
        peg$c129 = "M",
        peg$c130 = { type: "literal", value: "M", description: "\"M\"" },
        peg$c131 = "N",
        peg$c132 = { type: "literal", value: "N", description: "\"N\"" },
        peg$c133 = "O",
        peg$c134 = { type: "literal", value: "O", description: "\"O\"" },
        peg$c135 = "P",
        peg$c136 = { type: "literal", value: "P", description: "\"P\"" },
        peg$c137 = "Q",
        peg$c138 = { type: "literal", value: "Q", description: "\"Q\"" },
        peg$c139 = "R",
        peg$c140 = { type: "literal", value: "R", description: "\"R\"" },
        peg$c141 = "S",
        peg$c142 = { type: "literal", value: "S", description: "\"S\"" },
        peg$c143 = "T",
        peg$c144 = { type: "literal", value: "T", description: "\"T\"" },
        peg$c145 = "U",
        peg$c146 = { type: "literal", value: "U", description: "\"U\"" },
        peg$c147 = "V",
        peg$c148 = { type: "literal", value: "V", description: "\"V\"" },
        peg$c149 = "W",
        peg$c150 = { type: "literal", value: "W", description: "\"W\"" },
        peg$c151 = "X",
        peg$c152 = { type: "literal", value: "X", description: "\"X\"" },
        peg$c153 = "Y",
        peg$c154 = { type: "literal", value: "Y", description: "\"Y\"" },
        peg$c155 = "Z",
        peg$c156 = { type: "literal", value: "Z", description: "\"Z\"" },
        peg$c157 = function(zone) {
            return {xspan:zone.length,name:zone[0],x:zone};
          },
        peg$c158 = ".",
        peg$c159 = { type: "literal", value: ".", description: "\".\"" },
        peg$c160 = function() {
            var name = p.getBlankName();
            return {xspan:1,name:name,x:[name]};
          },
        peg$c161 = { type: "other", description: "Row or Col Dimension" },
        peg$c162 = "rows",
        peg$c163 = { type: "literal", value: "rows", description: "\"rows\"" },
        peg$c164 = function() {return 0;},
        peg$c165 = "cols",
        peg$c166 = { type: "literal", value: "cols", description: "\"cols\"" },
        peg$c167 = function() {return 1;},
        peg$c168 = { type: "other", description: "1D Line" },
        peg$c169 = null,
        peg$c170 = function(headcon, head, tails) {
            var result; 
            result = "|";
            if (headcon) {result += headcon;}
            result += head;
            tails.forEach(function (tail){
              result += tail;
            });
            result += "|";
            return result;
          },
        peg$c171 = { type: "other", description: "!D LineChunk" },
        peg$c172 = function(name, connect) {
            
            var result;
            name = p.trim(name);
            result = '["'+name+'"]';    
            p.addVirtual(name);
            if (connect) {
              result = result + connect;
            }
            return result;
          },
        peg$c173 = { type: "other", description: "1D Connection" },
        peg$c174 = "-",
        peg$c175 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c176 = "~",
        peg$c177 = { type: "literal", value: "~", description: "\"~\"" },
        peg$c178 = /^[0-9]/,
        peg$c179 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c180 = function(connect) {return p.stringify(connect);},
        peg$c181 = { type: "other", description: "!D Connection Type" },
        peg$c182 = /^[a-zA-Z0-9#_$:]/,
        peg$c183 = { type: "class", value: "[a-zA-Z0-9#_$:]", description: "[a-zA-Z0-9#_$:]" },
        peg$c184 = /^[a-zA-Z0-9#.\-_$:]/,
        peg$c185 = { type: "class", value: "[a-zA-Z0-9#.\\-_$:]", description: "[a-zA-Z0-9#.\\-_$:]" },
        peg$c186 = " ",
        peg$c187 = { type: "literal", value: " ", description: "\" \"" },
        peg$c188 = function(val) {
            return [ "number",
              val
            ];
          },
        peg$c189 = function(digits) {
            return parseInt(digits.join(""), 10);
          },
        peg$c190 = function(digits) {
            return parseFloat(digits.join(""));
          },
        peg$c191 = /^[\-+]/,
        peg$c192 = { type: "class", value: "[\\-+]", description: "[\\-+]" },
        peg$c193 = { type: "any", description: "any character" },
        peg$c194 = { type: "other", description: "whitespace" },
        peg$c195 = /^[\t\x0B\f \xA0\uFEFF]/,
        peg$c196 = { type: "class", value: "[\\t\\x0B\\f \\xA0\\uFEFF]", description: "[\\t\\x0B\\f \\xA0\\uFEFF]" },
        peg$c197 = /^[\n\r\u2028\u2029]/,
        peg$c198 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
        peg$c199 = { type: "other", description: "end of line" },
        peg$c200 = "\n",
        peg$c201 = { type: "literal", value: "\n", description: "\"\\n\"" },
        peg$c202 = "\r\n",
        peg$c203 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
        peg$c204 = "\r",
        peg$c205 = { type: "literal", value: "\r", description: "\"\\r\"" },
        peg$c206 = "\u2028",
        peg$c207 = { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
        peg$c208 = "\u2029",
        peg$c209 = { type: "literal", value: "\u2029", description: "\"\\u2029\"" },
        peg$c210 = /^[a-zA-Z0-9 .,#:+?!\^=()_\-$*\/\\""'[\]]/,
        peg$c211 = { type: "class", value: "[a-zA-Z0-9 .,#:+?!\\^=()_\\-$*\\/\\\\\"\"'[\\]]", description: "[a-zA-Z0-9 .,#:+?!\\^=()_\\-$*\\/\\\\\"\"'[\\]]" },
        peg$c212 = { type: "other", description: "End of Statement" },
        peg$c213 = ";",
        peg$c214 = { type: "literal", value: ";", description: "\";\"" },
        peg$c215 = void 0,
        peg$c216 = { type: "other", description: "Comment" },
        peg$c217 = { type: "other", description: "MultiLineComment" },
        peg$c218 = "/*",
        peg$c219 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c220 = "*/",
        peg$c221 = { type: "literal", value: "*/", description: "\"*/\"" },
        peg$c222 = { type: "other", description: "MultiLineCommentNoLineTerminator" },
        peg$c223 = { type: "other", description: "Single Line Comment" },
        peg$c224 = "//",
        peg$c225 = { type: "literal", value: "//", description: "\"//\"" },
        peg$c226 = { type: "other", description: "Whitespace / Comment" },
        peg$c227 = { type: "other", description: "Whitespace / Comment / Newline" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseStatement();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseStatement();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c2();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseStatement() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
        s1 = peg$c3;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseVGLStatement();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEOS();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c5(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseVGLStatement() {
      var s0;

      s0 = peg$parseRowsCols();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTemplate();
      }

      return s0;
    }

    function peg$parseRowsCols() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c7) {
        s1 = peg$c7;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 10) === peg$c9) {
          s1 = peg$c9;
          peg$currPos += 10;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c10); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseRowColDimension();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c11;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c12); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseLine();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 34) {
                  s6 = peg$c11;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c12); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse__();
                  if (s7 !== peg$FAILED) {
                    s8 = [];
                    s9 = peg$parseAnyChar();
                    while (s9 !== peg$FAILED) {
                      s8.push(s9);
                      s9 = peg$parseAnyChar();
                    }
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c13(s2, s5, s8);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }

      return s0;
    }

    function peg$parseTemplate() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c7) {
        s1 = peg$c7;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 10) === peg$c9) {
          s1 = peg$c9;
          peg$currPos += 10;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c10); }
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 8) === peg$c15) {
          s2 = peg$c15;
          peg$currPos += 8;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            s4 = [];
            if (peg$c17.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c18); }
            }
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                if (peg$c17.test(input.charAt(peg$currPos))) {
                  s5 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c18); }
                }
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseTemplateLine();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseTemplateLine();
                }
              } else {
                s5 = peg$c0;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseTemplateOptions();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c19(s4, s5, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c14); }
      }

      return s0;
    }

    function peg$parseTemplateLine() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s2 = peg$c11;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c12); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseTemplateZone();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseTemplateZone();
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 34) {
              s4 = peg$c11;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c12); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse__();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c21(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c20); }
      }

      return s0;
    }

    function peg$parseTemplateOptions() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseTemplateOption();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseTemplateOption();
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c23(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }

      return s0;
    }

    function peg$parseTemplateOption() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 40) {
            s3 = peg$c25;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c26); }
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseOpionValueChars();
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parseOpionValueChars();
              }
            } else {
              s4 = peg$c0;
            }
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s5 = peg$c27;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c28); }
              }
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c29(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c24); }
      }

      return s0;
    }

    function peg$parseOpionValueChars() {
      var s0;

      if (peg$c30.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }

      return s0;
    }

    function peg$parseTemplateZone() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (input.charCodeAt(peg$currPos) === 48) {
        s2 = peg$c33;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (input.charCodeAt(peg$currPos) === 48) {
            s2 = peg$c33;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c34); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
        s1 = [];
        if (input.charCodeAt(peg$currPos) === 49) {
          s2 = peg$c35;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (input.charCodeAt(peg$currPos) === 49) {
              s2 = peg$c35;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 === peg$FAILED) {
          s1 = [];
          if (input.charCodeAt(peg$currPos) === 50) {
            s2 = peg$c37;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
              s1.push(s2);
              if (input.charCodeAt(peg$currPos) === 50) {
                s2 = peg$c37;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c38); }
              }
            }
          } else {
            s1 = peg$c0;
          }
          if (s1 === peg$FAILED) {
            s1 = [];
            if (input.charCodeAt(peg$currPos) === 51) {
              s2 = peg$c39;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c40); }
            }
            if (s2 !== peg$FAILED) {
              while (s2 !== peg$FAILED) {
                s1.push(s2);
                if (input.charCodeAt(peg$currPos) === 51) {
                  s2 = peg$c39;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c40); }
                }
              }
            } else {
              s1 = peg$c0;
            }
            if (s1 === peg$FAILED) {
              s1 = [];
              if (input.charCodeAt(peg$currPos) === 52) {
                s2 = peg$c41;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c42); }
              }
              if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                  s1.push(s2);
                  if (input.charCodeAt(peg$currPos) === 52) {
                    s2 = peg$c41;
                    peg$currPos++;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c42); }
                  }
                }
              } else {
                s1 = peg$c0;
              }
              if (s1 === peg$FAILED) {
                s1 = [];
                if (input.charCodeAt(peg$currPos) === 53) {
                  s2 = peg$c43;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c44); }
                }
                if (s2 !== peg$FAILED) {
                  while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (input.charCodeAt(peg$currPos) === 53) {
                      s2 = peg$c43;
                      peg$currPos++;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c44); }
                    }
                  }
                } else {
                  s1 = peg$c0;
                }
                if (s1 === peg$FAILED) {
                  s1 = [];
                  if (input.charCodeAt(peg$currPos) === 54) {
                    s2 = peg$c45;
                    peg$currPos++;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c46); }
                  }
                  if (s2 !== peg$FAILED) {
                    while (s2 !== peg$FAILED) {
                      s1.push(s2);
                      if (input.charCodeAt(peg$currPos) === 54) {
                        s2 = peg$c45;
                        peg$currPos++;
                      } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c46); }
                      }
                    }
                  } else {
                    s1 = peg$c0;
                  }
                  if (s1 === peg$FAILED) {
                    s1 = [];
                    if (input.charCodeAt(peg$currPos) === 55) {
                      s2 = peg$c47;
                      peg$currPos++;
                    } else {
                      s2 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c48); }
                    }
                    if (s2 !== peg$FAILED) {
                      while (s2 !== peg$FAILED) {
                        s1.push(s2);
                        if (input.charCodeAt(peg$currPos) === 55) {
                          s2 = peg$c47;
                          peg$currPos++;
                        } else {
                          s2 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c48); }
                        }
                      }
                    } else {
                      s1 = peg$c0;
                    }
                    if (s1 === peg$FAILED) {
                      s1 = [];
                      if (input.charCodeAt(peg$currPos) === 56) {
                        s2 = peg$c49;
                        peg$currPos++;
                      } else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c50); }
                      }
                      if (s2 !== peg$FAILED) {
                        while (s2 !== peg$FAILED) {
                          s1.push(s2);
                          if (input.charCodeAt(peg$currPos) === 56) {
                            s2 = peg$c49;
                            peg$currPos++;
                          } else {
                            s2 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c50); }
                          }
                        }
                      } else {
                        s1 = peg$c0;
                      }
                      if (s1 === peg$FAILED) {
                        s1 = [];
                        if (input.charCodeAt(peg$currPos) === 57) {
                          s2 = peg$c51;
                          peg$currPos++;
                        } else {
                          s2 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c52); }
                        }
                        if (s2 !== peg$FAILED) {
                          while (s2 !== peg$FAILED) {
                            s1.push(s2);
                            if (input.charCodeAt(peg$currPos) === 57) {
                              s2 = peg$c51;
                              peg$currPos++;
                            } else {
                              s2 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c52); }
                            }
                          }
                        } else {
                          s1 = peg$c0;
                        }
                        if (s1 === peg$FAILED) {
                          s1 = [];
                          if (input.charCodeAt(peg$currPos) === 97) {
                            s2 = peg$c53;
                            peg$currPos++;
                          } else {
                            s2 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c54); }
                          }
                          if (s2 !== peg$FAILED) {
                            while (s2 !== peg$FAILED) {
                              s1.push(s2);
                              if (input.charCodeAt(peg$currPos) === 97) {
                                s2 = peg$c53;
                                peg$currPos++;
                              } else {
                                s2 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c54); }
                              }
                            }
                          } else {
                            s1 = peg$c0;
                          }
                          if (s1 === peg$FAILED) {
                            s1 = [];
                            if (input.charCodeAt(peg$currPos) === 98) {
                              s2 = peg$c55;
                              peg$currPos++;
                            } else {
                              s2 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c56); }
                            }
                            if (s2 !== peg$FAILED) {
                              while (s2 !== peg$FAILED) {
                                s1.push(s2);
                                if (input.charCodeAt(peg$currPos) === 98) {
                                  s2 = peg$c55;
                                  peg$currPos++;
                                } else {
                                  s2 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c56); }
                                }
                              }
                            } else {
                              s1 = peg$c0;
                            }
                            if (s1 === peg$FAILED) {
                              s1 = [];
                              if (input.charCodeAt(peg$currPos) === 99) {
                                s2 = peg$c57;
                                peg$currPos++;
                              } else {
                                s2 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c58); }
                              }
                              if (s2 !== peg$FAILED) {
                                while (s2 !== peg$FAILED) {
                                  s1.push(s2);
                                  if (input.charCodeAt(peg$currPos) === 99) {
                                    s2 = peg$c57;
                                    peg$currPos++;
                                  } else {
                                    s2 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c58); }
                                  }
                                }
                              } else {
                                s1 = peg$c0;
                              }
                              if (s1 === peg$FAILED) {
                                s1 = [];
                                if (input.charCodeAt(peg$currPos) === 100) {
                                  s2 = peg$c59;
                                  peg$currPos++;
                                } else {
                                  s2 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c60); }
                                }
                                if (s2 !== peg$FAILED) {
                                  while (s2 !== peg$FAILED) {
                                    s1.push(s2);
                                    if (input.charCodeAt(peg$currPos) === 100) {
                                      s2 = peg$c59;
                                      peg$currPos++;
                                    } else {
                                      s2 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c60); }
                                    }
                                  }
                                } else {
                                  s1 = peg$c0;
                                }
                                if (s1 === peg$FAILED) {
                                  s1 = [];
                                  if (input.charCodeAt(peg$currPos) === 101) {
                                    s2 = peg$c61;
                                    peg$currPos++;
                                  } else {
                                    s2 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c62); }
                                  }
                                  if (s2 !== peg$FAILED) {
                                    while (s2 !== peg$FAILED) {
                                      s1.push(s2);
                                      if (input.charCodeAt(peg$currPos) === 101) {
                                        s2 = peg$c61;
                                        peg$currPos++;
                                      } else {
                                        s2 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c62); }
                                      }
                                    }
                                  } else {
                                    s1 = peg$c0;
                                  }
                                  if (s1 === peg$FAILED) {
                                    s1 = peg$currPos;
                                    s2 = [];
                                    if (input.charCodeAt(peg$currPos) === 102) {
                                      s3 = peg$c63;
                                      peg$currPos++;
                                    } else {
                                      s3 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c64); }
                                    }
                                    if (s3 !== peg$FAILED) {
                                      while (s3 !== peg$FAILED) {
                                        s2.push(s3);
                                        if (input.charCodeAt(peg$currPos) === 102) {
                                          s3 = peg$c63;
                                          peg$currPos++;
                                        } else {
                                          s3 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c64); }
                                        }
                                      }
                                    } else {
                                      s2 = peg$c0;
                                    }
                                    if (s2 !== peg$FAILED) {
                                      s3 = [];
                                      if (input.charCodeAt(peg$currPos) === 103) {
                                        s4 = peg$c65;
                                        peg$currPos++;
                                      } else {
                                        s4 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c66); }
                                      }
                                      if (s4 !== peg$FAILED) {
                                        while (s4 !== peg$FAILED) {
                                          s3.push(s4);
                                          if (input.charCodeAt(peg$currPos) === 103) {
                                            s4 = peg$c65;
                                            peg$currPos++;
                                          } else {
                                            s4 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c66); }
                                          }
                                        }
                                      } else {
                                        s3 = peg$c0;
                                      }
                                      if (s3 !== peg$FAILED) {
                                        s2 = [s2, s3];
                                        s1 = s2;
                                      } else {
                                        peg$currPos = s1;
                                        s1 = peg$c0;
                                      }
                                    } else {
                                      peg$currPos = s1;
                                      s1 = peg$c0;
                                    }
                                    if (s1 === peg$FAILED) {
                                      s1 = [];
                                      if (input.charCodeAt(peg$currPos) === 104) {
                                        s2 = peg$c67;
                                        peg$currPos++;
                                      } else {
                                        s2 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c68); }
                                      }
                                      if (s2 !== peg$FAILED) {
                                        while (s2 !== peg$FAILED) {
                                          s1.push(s2);
                                          if (input.charCodeAt(peg$currPos) === 104) {
                                            s2 = peg$c67;
                                            peg$currPos++;
                                          } else {
                                            s2 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c68); }
                                          }
                                        }
                                      } else {
                                        s1 = peg$c0;
                                      }
                                      if (s1 === peg$FAILED) {
                                        s1 = [];
                                        if (input.charCodeAt(peg$currPos) === 105) {
                                          s2 = peg$c69;
                                          peg$currPos++;
                                        } else {
                                          s2 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c70); }
                                        }
                                        if (s2 !== peg$FAILED) {
                                          while (s2 !== peg$FAILED) {
                                            s1.push(s2);
                                            if (input.charCodeAt(peg$currPos) === 105) {
                                              s2 = peg$c69;
                                              peg$currPos++;
                                            } else {
                                              s2 = peg$FAILED;
                                              if (peg$silentFails === 0) { peg$fail(peg$c70); }
                                            }
                                          }
                                        } else {
                                          s1 = peg$c0;
                                        }
                                        if (s1 === peg$FAILED) {
                                          s1 = [];
                                          if (input.charCodeAt(peg$currPos) === 106) {
                                            s2 = peg$c71;
                                            peg$currPos++;
                                          } else {
                                            s2 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c72); }
                                          }
                                          if (s2 !== peg$FAILED) {
                                            while (s2 !== peg$FAILED) {
                                              s1.push(s2);
                                              if (input.charCodeAt(peg$currPos) === 106) {
                                                s2 = peg$c71;
                                                peg$currPos++;
                                              } else {
                                                s2 = peg$FAILED;
                                                if (peg$silentFails === 0) { peg$fail(peg$c72); }
                                              }
                                            }
                                          } else {
                                            s1 = peg$c0;
                                          }
                                          if (s1 === peg$FAILED) {
                                            s1 = [];
                                            if (input.charCodeAt(peg$currPos) === 107) {
                                              s2 = peg$c73;
                                              peg$currPos++;
                                            } else {
                                              s2 = peg$FAILED;
                                              if (peg$silentFails === 0) { peg$fail(peg$c74); }
                                            }
                                            if (s2 !== peg$FAILED) {
                                              while (s2 !== peg$FAILED) {
                                                s1.push(s2);
                                                if (input.charCodeAt(peg$currPos) === 107) {
                                                  s2 = peg$c73;
                                                  peg$currPos++;
                                                } else {
                                                  s2 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c74); }
                                                }
                                              }
                                            } else {
                                              s1 = peg$c0;
                                            }
                                            if (s1 === peg$FAILED) {
                                              s1 = [];
                                              if (input.charCodeAt(peg$currPos) === 108) {
                                                s2 = peg$c75;
                                                peg$currPos++;
                                              } else {
                                                s2 = peg$FAILED;
                                                if (peg$silentFails === 0) { peg$fail(peg$c76); }
                                              }
                                              if (s2 !== peg$FAILED) {
                                                while (s2 !== peg$FAILED) {
                                                  s1.push(s2);
                                                  if (input.charCodeAt(peg$currPos) === 108) {
                                                    s2 = peg$c75;
                                                    peg$currPos++;
                                                  } else {
                                                    s2 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c76); }
                                                  }
                                                }
                                              } else {
                                                s1 = peg$c0;
                                              }
                                              if (s1 === peg$FAILED) {
                                                s1 = [];
                                                if (input.charCodeAt(peg$currPos) === 109) {
                                                  s2 = peg$c77;
                                                  peg$currPos++;
                                                } else {
                                                  s2 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c78); }
                                                }
                                                if (s2 !== peg$FAILED) {
                                                  while (s2 !== peg$FAILED) {
                                                    s1.push(s2);
                                                    if (input.charCodeAt(peg$currPos) === 109) {
                                                      s2 = peg$c77;
                                                      peg$currPos++;
                                                    } else {
                                                      s2 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c78); }
                                                    }
                                                  }
                                                } else {
                                                  s1 = peg$c0;
                                                }
                                                if (s1 === peg$FAILED) {
                                                  s1 = [];
                                                  if (input.charCodeAt(peg$currPos) === 110) {
                                                    s2 = peg$c79;
                                                    peg$currPos++;
                                                  } else {
                                                    s2 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c80); }
                                                  }
                                                  if (s2 !== peg$FAILED) {
                                                    while (s2 !== peg$FAILED) {
                                                      s1.push(s2);
                                                      if (input.charCodeAt(peg$currPos) === 110) {
                                                        s2 = peg$c79;
                                                        peg$currPos++;
                                                      } else {
                                                        s2 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c80); }
                                                      }
                                                    }
                                                  } else {
                                                    s1 = peg$c0;
                                                  }
                                                  if (s1 === peg$FAILED) {
                                                    s1 = [];
                                                    if (input.charCodeAt(peg$currPos) === 111) {
                                                      s2 = peg$c81;
                                                      peg$currPos++;
                                                    } else {
                                                      s2 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c82); }
                                                    }
                                                    if (s2 !== peg$FAILED) {
                                                      while (s2 !== peg$FAILED) {
                                                        s1.push(s2);
                                                        if (input.charCodeAt(peg$currPos) === 111) {
                                                          s2 = peg$c81;
                                                          peg$currPos++;
                                                        } else {
                                                          s2 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c82); }
                                                        }
                                                      }
                                                    } else {
                                                      s1 = peg$c0;
                                                    }
                                                    if (s1 === peg$FAILED) {
                                                      s1 = [];
                                                      if (input.charCodeAt(peg$currPos) === 112) {
                                                        s2 = peg$c83;
                                                        peg$currPos++;
                                                      } else {
                                                        s2 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c84); }
                                                      }
                                                      if (s2 !== peg$FAILED) {
                                                        while (s2 !== peg$FAILED) {
                                                          s1.push(s2);
                                                          if (input.charCodeAt(peg$currPos) === 112) {
                                                            s2 = peg$c83;
                                                            peg$currPos++;
                                                          } else {
                                                            s2 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c84); }
                                                          }
                                                        }
                                                      } else {
                                                        s1 = peg$c0;
                                                      }
                                                      if (s1 === peg$FAILED) {
                                                        s1 = [];
                                                        if (input.charCodeAt(peg$currPos) === 113) {
                                                          s2 = peg$c85;
                                                          peg$currPos++;
                                                        } else {
                                                          s2 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c86); }
                                                        }
                                                        if (s2 !== peg$FAILED) {
                                                          while (s2 !== peg$FAILED) {
                                                            s1.push(s2);
                                                            if (input.charCodeAt(peg$currPos) === 113) {
                                                              s2 = peg$c85;
                                                              peg$currPos++;
                                                            } else {
                                                              s2 = peg$FAILED;
                                                              if (peg$silentFails === 0) { peg$fail(peg$c86); }
                                                            }
                                                          }
                                                        } else {
                                                          s1 = peg$c0;
                                                        }
                                                        if (s1 === peg$FAILED) {
                                                          s1 = [];
                                                          if (input.charCodeAt(peg$currPos) === 114) {
                                                            s2 = peg$c87;
                                                            peg$currPos++;
                                                          } else {
                                                            s2 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c88); }
                                                          }
                                                          if (s2 !== peg$FAILED) {
                                                            while (s2 !== peg$FAILED) {
                                                              s1.push(s2);
                                                              if (input.charCodeAt(peg$currPos) === 114) {
                                                                s2 = peg$c87;
                                                                peg$currPos++;
                                                              } else {
                                                                s2 = peg$FAILED;
                                                                if (peg$silentFails === 0) { peg$fail(peg$c88); }
                                                              }
                                                            }
                                                          } else {
                                                            s1 = peg$c0;
                                                          }
                                                          if (s1 === peg$FAILED) {
                                                            s1 = [];
                                                            if (input.charCodeAt(peg$currPos) === 115) {
                                                              s2 = peg$c89;
                                                              peg$currPos++;
                                                            } else {
                                                              s2 = peg$FAILED;
                                                              if (peg$silentFails === 0) { peg$fail(peg$c90); }
                                                            }
                                                            if (s2 !== peg$FAILED) {
                                                              while (s2 !== peg$FAILED) {
                                                                s1.push(s2);
                                                                if (input.charCodeAt(peg$currPos) === 115) {
                                                                  s2 = peg$c89;
                                                                  peg$currPos++;
                                                                } else {
                                                                  s2 = peg$FAILED;
                                                                  if (peg$silentFails === 0) { peg$fail(peg$c90); }
                                                                }
                                                              }
                                                            } else {
                                                              s1 = peg$c0;
                                                            }
                                                            if (s1 === peg$FAILED) {
                                                              s1 = [];
                                                              if (input.charCodeAt(peg$currPos) === 116) {
                                                                s2 = peg$c91;
                                                                peg$currPos++;
                                                              } else {
                                                                s2 = peg$FAILED;
                                                                if (peg$silentFails === 0) { peg$fail(peg$c92); }
                                                              }
                                                              if (s2 !== peg$FAILED) {
                                                                while (s2 !== peg$FAILED) {
                                                                  s1.push(s2);
                                                                  if (input.charCodeAt(peg$currPos) === 116) {
                                                                    s2 = peg$c91;
                                                                    peg$currPos++;
                                                                  } else {
                                                                    s2 = peg$FAILED;
                                                                    if (peg$silentFails === 0) { peg$fail(peg$c92); }
                                                                  }
                                                                }
                                                              } else {
                                                                s1 = peg$c0;
                                                              }
                                                              if (s1 === peg$FAILED) {
                                                                s1 = [];
                                                                if (input.charCodeAt(peg$currPos) === 117) {
                                                                  s2 = peg$c93;
                                                                  peg$currPos++;
                                                                } else {
                                                                  s2 = peg$FAILED;
                                                                  if (peg$silentFails === 0) { peg$fail(peg$c94); }
                                                                }
                                                                if (s2 !== peg$FAILED) {
                                                                  while (s2 !== peg$FAILED) {
                                                                    s1.push(s2);
                                                                    if (input.charCodeAt(peg$currPos) === 117) {
                                                                      s2 = peg$c93;
                                                                      peg$currPos++;
                                                                    } else {
                                                                      s2 = peg$FAILED;
                                                                      if (peg$silentFails === 0) { peg$fail(peg$c94); }
                                                                    }
                                                                  }
                                                                } else {
                                                                  s1 = peg$c0;
                                                                }
                                                                if (s1 === peg$FAILED) {
                                                                  s1 = [];
                                                                  if (input.charCodeAt(peg$currPos) === 118) {
                                                                    s2 = peg$c95;
                                                                    peg$currPos++;
                                                                  } else {
                                                                    s2 = peg$FAILED;
                                                                    if (peg$silentFails === 0) { peg$fail(peg$c96); }
                                                                  }
                                                                  if (s2 !== peg$FAILED) {
                                                                    while (s2 !== peg$FAILED) {
                                                                      s1.push(s2);
                                                                      if (input.charCodeAt(peg$currPos) === 118) {
                                                                        s2 = peg$c95;
                                                                        peg$currPos++;
                                                                      } else {
                                                                        s2 = peg$FAILED;
                                                                        if (peg$silentFails === 0) { peg$fail(peg$c96); }
                                                                      }
                                                                    }
                                                                  } else {
                                                                    s1 = peg$c0;
                                                                  }
                                                                  if (s1 === peg$FAILED) {
                                                                    s1 = [];
                                                                    if (input.charCodeAt(peg$currPos) === 119) {
                                                                      s2 = peg$c97;
                                                                      peg$currPos++;
                                                                    } else {
                                                                      s2 = peg$FAILED;
                                                                      if (peg$silentFails === 0) { peg$fail(peg$c98); }
                                                                    }
                                                                    if (s2 !== peg$FAILED) {
                                                                      while (s2 !== peg$FAILED) {
                                                                        s1.push(s2);
                                                                        if (input.charCodeAt(peg$currPos) === 119) {
                                                                          s2 = peg$c97;
                                                                          peg$currPos++;
                                                                        } else {
                                                                          s2 = peg$FAILED;
                                                                          if (peg$silentFails === 0) { peg$fail(peg$c98); }
                                                                        }
                                                                      }
                                                                    } else {
                                                                      s1 = peg$c0;
                                                                    }
                                                                    if (s1 === peg$FAILED) {
                                                                      s1 = [];
                                                                      if (input.charCodeAt(peg$currPos) === 120) {
                                                                        s2 = peg$c99;
                                                                        peg$currPos++;
                                                                      } else {
                                                                        s2 = peg$FAILED;
                                                                        if (peg$silentFails === 0) { peg$fail(peg$c100); }
                                                                      }
                                                                      if (s2 !== peg$FAILED) {
                                                                        while (s2 !== peg$FAILED) {
                                                                          s1.push(s2);
                                                                          if (input.charCodeAt(peg$currPos) === 120) {
                                                                            s2 = peg$c99;
                                                                            peg$currPos++;
                                                                          } else {
                                                                            s2 = peg$FAILED;
                                                                            if (peg$silentFails === 0) { peg$fail(peg$c100); }
                                                                          }
                                                                        }
                                                                      } else {
                                                                        s1 = peg$c0;
                                                                      }
                                                                      if (s1 === peg$FAILED) {
                                                                        s1 = [];
                                                                        if (input.charCodeAt(peg$currPos) === 121) {
                                                                          s2 = peg$c101;
                                                                          peg$currPos++;
                                                                        } else {
                                                                          s2 = peg$FAILED;
                                                                          if (peg$silentFails === 0) { peg$fail(peg$c102); }
                                                                        }
                                                                        if (s2 !== peg$FAILED) {
                                                                          while (s2 !== peg$FAILED) {
                                                                            s1.push(s2);
                                                                            if (input.charCodeAt(peg$currPos) === 121) {
                                                                              s2 = peg$c101;
                                                                              peg$currPos++;
                                                                            } else {
                                                                              s2 = peg$FAILED;
                                                                              if (peg$silentFails === 0) { peg$fail(peg$c102); }
                                                                            }
                                                                          }
                                                                        } else {
                                                                          s1 = peg$c0;
                                                                        }
                                                                        if (s1 === peg$FAILED) {
                                                                          s1 = [];
                                                                          if (input.charCodeAt(peg$currPos) === 122) {
                                                                            s2 = peg$c103;
                                                                            peg$currPos++;
                                                                          } else {
                                                                            s2 = peg$FAILED;
                                                                            if (peg$silentFails === 0) { peg$fail(peg$c104); }
                                                                          }
                                                                          if (s2 !== peg$FAILED) {
                                                                            while (s2 !== peg$FAILED) {
                                                                              s1.push(s2);
                                                                              if (input.charCodeAt(peg$currPos) === 122) {
                                                                                s2 = peg$c103;
                                                                                peg$currPos++;
                                                                              } else {
                                                                                s2 = peg$FAILED;
                                                                                if (peg$silentFails === 0) { peg$fail(peg$c104); }
                                                                              }
                                                                            }
                                                                          } else {
                                                                            s1 = peg$c0;
                                                                          }
                                                                          if (s1 === peg$FAILED) {
                                                                            s1 = [];
                                                                            if (input.charCodeAt(peg$currPos) === 65) {
                                                                              s2 = peg$c105;
                                                                              peg$currPos++;
                                                                            } else {
                                                                              s2 = peg$FAILED;
                                                                              if (peg$silentFails === 0) { peg$fail(peg$c106); }
                                                                            }
                                                                            if (s2 !== peg$FAILED) {
                                                                              while (s2 !== peg$FAILED) {
                                                                                s1.push(s2);
                                                                                if (input.charCodeAt(peg$currPos) === 65) {
                                                                                  s2 = peg$c105;
                                                                                  peg$currPos++;
                                                                                } else {
                                                                                  s2 = peg$FAILED;
                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c106); }
                                                                                }
                                                                              }
                                                                            } else {
                                                                              s1 = peg$c0;
                                                                            }
                                                                            if (s1 === peg$FAILED) {
                                                                              s1 = [];
                                                                              if (input.charCodeAt(peg$currPos) === 66) {
                                                                                s2 = peg$c107;
                                                                                peg$currPos++;
                                                                              } else {
                                                                                s2 = peg$FAILED;
                                                                                if (peg$silentFails === 0) { peg$fail(peg$c108); }
                                                                              }
                                                                              if (s2 !== peg$FAILED) {
                                                                                while (s2 !== peg$FAILED) {
                                                                                  s1.push(s2);
                                                                                  if (input.charCodeAt(peg$currPos) === 66) {
                                                                                    s2 = peg$c107;
                                                                                    peg$currPos++;
                                                                                  } else {
                                                                                    s2 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c108); }
                                                                                  }
                                                                                }
                                                                              } else {
                                                                                s1 = peg$c0;
                                                                              }
                                                                              if (s1 === peg$FAILED) {
                                                                                s1 = [];
                                                                                if (input.charCodeAt(peg$currPos) === 67) {
                                                                                  s2 = peg$c109;
                                                                                  peg$currPos++;
                                                                                } else {
                                                                                  s2 = peg$FAILED;
                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c110); }
                                                                                }
                                                                                if (s2 !== peg$FAILED) {
                                                                                  while (s2 !== peg$FAILED) {
                                                                                    s1.push(s2);
                                                                                    if (input.charCodeAt(peg$currPos) === 67) {
                                                                                      s2 = peg$c109;
                                                                                      peg$currPos++;
                                                                                    } else {
                                                                                      s2 = peg$FAILED;
                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c110); }
                                                                                    }
                                                                                  }
                                                                                } else {
                                                                                  s1 = peg$c0;
                                                                                }
                                                                                if (s1 === peg$FAILED) {
                                                                                  s1 = [];
                                                                                  if (input.charCodeAt(peg$currPos) === 68) {
                                                                                    s2 = peg$c111;
                                                                                    peg$currPos++;
                                                                                  } else {
                                                                                    s2 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c112); }
                                                                                  }
                                                                                  if (s2 !== peg$FAILED) {
                                                                                    while (s2 !== peg$FAILED) {
                                                                                      s1.push(s2);
                                                                                      if (input.charCodeAt(peg$currPos) === 68) {
                                                                                        s2 = peg$c111;
                                                                                        peg$currPos++;
                                                                                      } else {
                                                                                        s2 = peg$FAILED;
                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c112); }
                                                                                      }
                                                                                    }
                                                                                  } else {
                                                                                    s1 = peg$c0;
                                                                                  }
                                                                                  if (s1 === peg$FAILED) {
                                                                                    s1 = [];
                                                                                    if (input.charCodeAt(peg$currPos) === 69) {
                                                                                      s2 = peg$c113;
                                                                                      peg$currPos++;
                                                                                    } else {
                                                                                      s2 = peg$FAILED;
                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c114); }
                                                                                    }
                                                                                    if (s2 !== peg$FAILED) {
                                                                                      while (s2 !== peg$FAILED) {
                                                                                        s1.push(s2);
                                                                                        if (input.charCodeAt(peg$currPos) === 69) {
                                                                                          s2 = peg$c113;
                                                                                          peg$currPos++;
                                                                                        } else {
                                                                                          s2 = peg$FAILED;
                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c114); }
                                                                                        }
                                                                                      }
                                                                                    } else {
                                                                                      s1 = peg$c0;
                                                                                    }
                                                                                    if (s1 === peg$FAILED) {
                                                                                      s1 = [];
                                                                                      if (input.charCodeAt(peg$currPos) === 70) {
                                                                                        s2 = peg$c115;
                                                                                        peg$currPos++;
                                                                                      } else {
                                                                                        s2 = peg$FAILED;
                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c116); }
                                                                                      }
                                                                                      if (s2 !== peg$FAILED) {
                                                                                        while (s2 !== peg$FAILED) {
                                                                                          s1.push(s2);
                                                                                          if (input.charCodeAt(peg$currPos) === 70) {
                                                                                            s2 = peg$c115;
                                                                                            peg$currPos++;
                                                                                          } else {
                                                                                            s2 = peg$FAILED;
                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c116); }
                                                                                          }
                                                                                        }
                                                                                      } else {
                                                                                        s1 = peg$c0;
                                                                                      }
                                                                                      if (s1 === peg$FAILED) {
                                                                                        s1 = [];
                                                                                        if (input.charCodeAt(peg$currPos) === 71) {
                                                                                          s2 = peg$c117;
                                                                                          peg$currPos++;
                                                                                        } else {
                                                                                          s2 = peg$FAILED;
                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c118); }
                                                                                        }
                                                                                        if (s2 !== peg$FAILED) {
                                                                                          while (s2 !== peg$FAILED) {
                                                                                            s1.push(s2);
                                                                                            if (input.charCodeAt(peg$currPos) === 71) {
                                                                                              s2 = peg$c117;
                                                                                              peg$currPos++;
                                                                                            } else {
                                                                                              s2 = peg$FAILED;
                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c118); }
                                                                                            }
                                                                                          }
                                                                                        } else {
                                                                                          s1 = peg$c0;
                                                                                        }
                                                                                        if (s1 === peg$FAILED) {
                                                                                          s1 = [];
                                                                                          if (input.charCodeAt(peg$currPos) === 72) {
                                                                                            s2 = peg$c119;
                                                                                            peg$currPos++;
                                                                                          } else {
                                                                                            s2 = peg$FAILED;
                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c120); }
                                                                                          }
                                                                                          if (s2 !== peg$FAILED) {
                                                                                            while (s2 !== peg$FAILED) {
                                                                                              s1.push(s2);
                                                                                              if (input.charCodeAt(peg$currPos) === 72) {
                                                                                                s2 = peg$c119;
                                                                                                peg$currPos++;
                                                                                              } else {
                                                                                                s2 = peg$FAILED;
                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c120); }
                                                                                              }
                                                                                            }
                                                                                          } else {
                                                                                            s1 = peg$c0;
                                                                                          }
                                                                                          if (s1 === peg$FAILED) {
                                                                                            s1 = [];
                                                                                            if (input.charCodeAt(peg$currPos) === 73) {
                                                                                              s2 = peg$c121;
                                                                                              peg$currPos++;
                                                                                            } else {
                                                                                              s2 = peg$FAILED;
                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c122); }
                                                                                            }
                                                                                            if (s2 !== peg$FAILED) {
                                                                                              while (s2 !== peg$FAILED) {
                                                                                                s1.push(s2);
                                                                                                if (input.charCodeAt(peg$currPos) === 73) {
                                                                                                  s2 = peg$c121;
                                                                                                  peg$currPos++;
                                                                                                } else {
                                                                                                  s2 = peg$FAILED;
                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c122); }
                                                                                                }
                                                                                              }
                                                                                            } else {
                                                                                              s1 = peg$c0;
                                                                                            }
                                                                                            if (s1 === peg$FAILED) {
                                                                                              s1 = [];
                                                                                              if (input.charCodeAt(peg$currPos) === 74) {
                                                                                                s2 = peg$c123;
                                                                                                peg$currPos++;
                                                                                              } else {
                                                                                                s2 = peg$FAILED;
                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c124); }
                                                                                              }
                                                                                              if (s2 !== peg$FAILED) {
                                                                                                while (s2 !== peg$FAILED) {
                                                                                                  s1.push(s2);
                                                                                                  if (input.charCodeAt(peg$currPos) === 74) {
                                                                                                    s2 = peg$c123;
                                                                                                    peg$currPos++;
                                                                                                  } else {
                                                                                                    s2 = peg$FAILED;
                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c124); }
                                                                                                  }
                                                                                                }
                                                                                              } else {
                                                                                                s1 = peg$c0;
                                                                                              }
                                                                                              if (s1 === peg$FAILED) {
                                                                                                s1 = [];
                                                                                                if (input.charCodeAt(peg$currPos) === 75) {
                                                                                                  s2 = peg$c125;
                                                                                                  peg$currPos++;
                                                                                                } else {
                                                                                                  s2 = peg$FAILED;
                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c126); }
                                                                                                }
                                                                                                if (s2 !== peg$FAILED) {
                                                                                                  while (s2 !== peg$FAILED) {
                                                                                                    s1.push(s2);
                                                                                                    if (input.charCodeAt(peg$currPos) === 75) {
                                                                                                      s2 = peg$c125;
                                                                                                      peg$currPos++;
                                                                                                    } else {
                                                                                                      s2 = peg$FAILED;
                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c126); }
                                                                                                    }
                                                                                                  }
                                                                                                } else {
                                                                                                  s1 = peg$c0;
                                                                                                }
                                                                                                if (s1 === peg$FAILED) {
                                                                                                  s1 = [];
                                                                                                  if (input.charCodeAt(peg$currPos) === 76) {
                                                                                                    s2 = peg$c127;
                                                                                                    peg$currPos++;
                                                                                                  } else {
                                                                                                    s2 = peg$FAILED;
                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c128); }
                                                                                                  }
                                                                                                  if (s2 !== peg$FAILED) {
                                                                                                    while (s2 !== peg$FAILED) {
                                                                                                      s1.push(s2);
                                                                                                      if (input.charCodeAt(peg$currPos) === 76) {
                                                                                                        s2 = peg$c127;
                                                                                                        peg$currPos++;
                                                                                                      } else {
                                                                                                        s2 = peg$FAILED;
                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c128); }
                                                                                                      }
                                                                                                    }
                                                                                                  } else {
                                                                                                    s1 = peg$c0;
                                                                                                  }
                                                                                                  if (s1 === peg$FAILED) {
                                                                                                    s1 = [];
                                                                                                    if (input.charCodeAt(peg$currPos) === 77) {
                                                                                                      s2 = peg$c129;
                                                                                                      peg$currPos++;
                                                                                                    } else {
                                                                                                      s2 = peg$FAILED;
                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c130); }
                                                                                                    }
                                                                                                    if (s2 !== peg$FAILED) {
                                                                                                      while (s2 !== peg$FAILED) {
                                                                                                        s1.push(s2);
                                                                                                        if (input.charCodeAt(peg$currPos) === 77) {
                                                                                                          s2 = peg$c129;
                                                                                                          peg$currPos++;
                                                                                                        } else {
                                                                                                          s2 = peg$FAILED;
                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c130); }
                                                                                                        }
                                                                                                      }
                                                                                                    } else {
                                                                                                      s1 = peg$c0;
                                                                                                    }
                                                                                                    if (s1 === peg$FAILED) {
                                                                                                      s1 = [];
                                                                                                      if (input.charCodeAt(peg$currPos) === 78) {
                                                                                                        s2 = peg$c131;
                                                                                                        peg$currPos++;
                                                                                                      } else {
                                                                                                        s2 = peg$FAILED;
                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c132); }
                                                                                                      }
                                                                                                      if (s2 !== peg$FAILED) {
                                                                                                        while (s2 !== peg$FAILED) {
                                                                                                          s1.push(s2);
                                                                                                          if (input.charCodeAt(peg$currPos) === 78) {
                                                                                                            s2 = peg$c131;
                                                                                                            peg$currPos++;
                                                                                                          } else {
                                                                                                            s2 = peg$FAILED;
                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c132); }
                                                                                                          }
                                                                                                        }
                                                                                                      } else {
                                                                                                        s1 = peg$c0;
                                                                                                      }
                                                                                                      if (s1 === peg$FAILED) {
                                                                                                        s1 = [];
                                                                                                        if (input.charCodeAt(peg$currPos) === 79) {
                                                                                                          s2 = peg$c133;
                                                                                                          peg$currPos++;
                                                                                                        } else {
                                                                                                          s2 = peg$FAILED;
                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c134); }
                                                                                                        }
                                                                                                        if (s2 !== peg$FAILED) {
                                                                                                          while (s2 !== peg$FAILED) {
                                                                                                            s1.push(s2);
                                                                                                            if (input.charCodeAt(peg$currPos) === 79) {
                                                                                                              s2 = peg$c133;
                                                                                                              peg$currPos++;
                                                                                                            } else {
                                                                                                              s2 = peg$FAILED;
                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c134); }
                                                                                                            }
                                                                                                          }
                                                                                                        } else {
                                                                                                          s1 = peg$c0;
                                                                                                        }
                                                                                                        if (s1 === peg$FAILED) {
                                                                                                          s1 = [];
                                                                                                          if (input.charCodeAt(peg$currPos) === 80) {
                                                                                                            s2 = peg$c135;
                                                                                                            peg$currPos++;
                                                                                                          } else {
                                                                                                            s2 = peg$FAILED;
                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c136); }
                                                                                                          }
                                                                                                          if (s2 !== peg$FAILED) {
                                                                                                            while (s2 !== peg$FAILED) {
                                                                                                              s1.push(s2);
                                                                                                              if (input.charCodeAt(peg$currPos) === 80) {
                                                                                                                s2 = peg$c135;
                                                                                                                peg$currPos++;
                                                                                                              } else {
                                                                                                                s2 = peg$FAILED;
                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c136); }
                                                                                                              }
                                                                                                            }
                                                                                                          } else {
                                                                                                            s1 = peg$c0;
                                                                                                          }
                                                                                                          if (s1 === peg$FAILED) {
                                                                                                            s1 = [];
                                                                                                            if (input.charCodeAt(peg$currPos) === 81) {
                                                                                                              s2 = peg$c137;
                                                                                                              peg$currPos++;
                                                                                                            } else {
                                                                                                              s2 = peg$FAILED;
                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c138); }
                                                                                                            }
                                                                                                            if (s2 !== peg$FAILED) {
                                                                                                              while (s2 !== peg$FAILED) {
                                                                                                                s1.push(s2);
                                                                                                                if (input.charCodeAt(peg$currPos) === 81) {
                                                                                                                  s2 = peg$c137;
                                                                                                                  peg$currPos++;
                                                                                                                } else {
                                                                                                                  s2 = peg$FAILED;
                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c138); }
                                                                                                                }
                                                                                                              }
                                                                                                            } else {
                                                                                                              s1 = peg$c0;
                                                                                                            }
                                                                                                            if (s1 === peg$FAILED) {
                                                                                                              s1 = [];
                                                                                                              if (input.charCodeAt(peg$currPos) === 82) {
                                                                                                                s2 = peg$c139;
                                                                                                                peg$currPos++;
                                                                                                              } else {
                                                                                                                s2 = peg$FAILED;
                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c140); }
                                                                                                              }
                                                                                                              if (s2 !== peg$FAILED) {
                                                                                                                while (s2 !== peg$FAILED) {
                                                                                                                  s1.push(s2);
                                                                                                                  if (input.charCodeAt(peg$currPos) === 82) {
                                                                                                                    s2 = peg$c139;
                                                                                                                    peg$currPos++;
                                                                                                                  } else {
                                                                                                                    s2 = peg$FAILED;
                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c140); }
                                                                                                                  }
                                                                                                                }
                                                                                                              } else {
                                                                                                                s1 = peg$c0;
                                                                                                              }
                                                                                                              if (s1 === peg$FAILED) {
                                                                                                                s1 = [];
                                                                                                                if (input.charCodeAt(peg$currPos) === 83) {
                                                                                                                  s2 = peg$c141;
                                                                                                                  peg$currPos++;
                                                                                                                } else {
                                                                                                                  s2 = peg$FAILED;
                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c142); }
                                                                                                                }
                                                                                                                if (s2 !== peg$FAILED) {
                                                                                                                  while (s2 !== peg$FAILED) {
                                                                                                                    s1.push(s2);
                                                                                                                    if (input.charCodeAt(peg$currPos) === 83) {
                                                                                                                      s2 = peg$c141;
                                                                                                                      peg$currPos++;
                                                                                                                    } else {
                                                                                                                      s2 = peg$FAILED;
                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c142); }
                                                                                                                    }
                                                                                                                  }
                                                                                                                } else {
                                                                                                                  s1 = peg$c0;
                                                                                                                }
                                                                                                                if (s1 === peg$FAILED) {
                                                                                                                  s1 = [];
                                                                                                                  if (input.charCodeAt(peg$currPos) === 84) {
                                                                                                                    s2 = peg$c143;
                                                                                                                    peg$currPos++;
                                                                                                                  } else {
                                                                                                                    s2 = peg$FAILED;
                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c144); }
                                                                                                                  }
                                                                                                                  if (s2 !== peg$FAILED) {
                                                                                                                    while (s2 !== peg$FAILED) {
                                                                                                                      s1.push(s2);
                                                                                                                      if (input.charCodeAt(peg$currPos) === 84) {
                                                                                                                        s2 = peg$c143;
                                                                                                                        peg$currPos++;
                                                                                                                      } else {
                                                                                                                        s2 = peg$FAILED;
                                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c144); }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  } else {
                                                                                                                    s1 = peg$c0;
                                                                                                                  }
                                                                                                                  if (s1 === peg$FAILED) {
                                                                                                                    s1 = [];
                                                                                                                    if (input.charCodeAt(peg$currPos) === 85) {
                                                                                                                      s2 = peg$c145;
                                                                                                                      peg$currPos++;
                                                                                                                    } else {
                                                                                                                      s2 = peg$FAILED;
                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c146); }
                                                                                                                    }
                                                                                                                    if (s2 !== peg$FAILED) {
                                                                                                                      while (s2 !== peg$FAILED) {
                                                                                                                        s1.push(s2);
                                                                                                                        if (input.charCodeAt(peg$currPos) === 85) {
                                                                                                                          s2 = peg$c145;
                                                                                                                          peg$currPos++;
                                                                                                                        } else {
                                                                                                                          s2 = peg$FAILED;
                                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c146); }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    } else {
                                                                                                                      s1 = peg$c0;
                                                                                                                    }
                                                                                                                    if (s1 === peg$FAILED) {
                                                                                                                      s1 = [];
                                                                                                                      if (input.charCodeAt(peg$currPos) === 86) {
                                                                                                                        s2 = peg$c147;
                                                                                                                        peg$currPos++;
                                                                                                                      } else {
                                                                                                                        s2 = peg$FAILED;
                                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c148); }
                                                                                                                      }
                                                                                                                      if (s2 !== peg$FAILED) {
                                                                                                                        while (s2 !== peg$FAILED) {
                                                                                                                          s1.push(s2);
                                                                                                                          if (input.charCodeAt(peg$currPos) === 86) {
                                                                                                                            s2 = peg$c147;
                                                                                                                            peg$currPos++;
                                                                                                                          } else {
                                                                                                                            s2 = peg$FAILED;
                                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c148); }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      } else {
                                                                                                                        s1 = peg$c0;
                                                                                                                      }
                                                                                                                      if (s1 === peg$FAILED) {
                                                                                                                        s1 = [];
                                                                                                                        if (input.charCodeAt(peg$currPos) === 87) {
                                                                                                                          s2 = peg$c149;
                                                                                                                          peg$currPos++;
                                                                                                                        } else {
                                                                                                                          s2 = peg$FAILED;
                                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c150); }
                                                                                                                        }
                                                                                                                        if (s2 !== peg$FAILED) {
                                                                                                                          while (s2 !== peg$FAILED) {
                                                                                                                            s1.push(s2);
                                                                                                                            if (input.charCodeAt(peg$currPos) === 87) {
                                                                                                                              s2 = peg$c149;
                                                                                                                              peg$currPos++;
                                                                                                                            } else {
                                                                                                                              s2 = peg$FAILED;
                                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c150); }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        } else {
                                                                                                                          s1 = peg$c0;
                                                                                                                        }
                                                                                                                        if (s1 === peg$FAILED) {
                                                                                                                          s1 = [];
                                                                                                                          if (input.charCodeAt(peg$currPos) === 88) {
                                                                                                                            s2 = peg$c151;
                                                                                                                            peg$currPos++;
                                                                                                                          } else {
                                                                                                                            s2 = peg$FAILED;
                                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c152); }
                                                                                                                          }
                                                                                                                          if (s2 !== peg$FAILED) {
                                                                                                                            while (s2 !== peg$FAILED) {
                                                                                                                              s1.push(s2);
                                                                                                                              if (input.charCodeAt(peg$currPos) === 88) {
                                                                                                                                s2 = peg$c151;
                                                                                                                                peg$currPos++;
                                                                                                                              } else {
                                                                                                                                s2 = peg$FAILED;
                                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c152); }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          } else {
                                                                                                                            s1 = peg$c0;
                                                                                                                          }
                                                                                                                          if (s1 === peg$FAILED) {
                                                                                                                            s1 = [];
                                                                                                                            if (input.charCodeAt(peg$currPos) === 89) {
                                                                                                                              s2 = peg$c153;
                                                                                                                              peg$currPos++;
                                                                                                                            } else {
                                                                                                                              s2 = peg$FAILED;
                                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c154); }
                                                                                                                            }
                                                                                                                            if (s2 !== peg$FAILED) {
                                                                                                                              while (s2 !== peg$FAILED) {
                                                                                                                                s1.push(s2);
                                                                                                                                if (input.charCodeAt(peg$currPos) === 89) {
                                                                                                                                  s2 = peg$c153;
                                                                                                                                  peg$currPos++;
                                                                                                                                } else {
                                                                                                                                  s2 = peg$FAILED;
                                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c154); }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            } else {
                                                                                                                              s1 = peg$c0;
                                                                                                                            }
                                                                                                                            if (s1 === peg$FAILED) {
                                                                                                                              s1 = [];
                                                                                                                              if (input.charCodeAt(peg$currPos) === 90) {
                                                                                                                                s2 = peg$c155;
                                                                                                                                peg$currPos++;
                                                                                                                              } else {
                                                                                                                                s2 = peg$FAILED;
                                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c156); }
                                                                                                                              }
                                                                                                                              if (s2 !== peg$FAILED) {
                                                                                                                                while (s2 !== peg$FAILED) {
                                                                                                                                  s1.push(s2);
                                                                                                                                  if (input.charCodeAt(peg$currPos) === 90) {
                                                                                                                                    s2 = peg$c155;
                                                                                                                                    peg$currPos++;
                                                                                                                                  } else {
                                                                                                                                    s2 = peg$FAILED;
                                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c156); }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              } else {
                                                                                                                                s1 = peg$c0;
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c157(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c158;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c159); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c160();
        }
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }

      return s0;
    }

    function peg$parseRowColDimension() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c162) {
        s1 = peg$c162;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c163); }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c164();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 4) === peg$c165) {
          s1 = peg$c165;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c166); }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c167();
        }
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c161); }
      }

      return s0;
    }

    function peg$parseLine() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseConnection();
      if (s1 === peg$FAILED) {
        s1 = peg$c169;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseLineChunk();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseLineChunk();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseLineChunk();
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c170(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c168); }
      }

      return s0;
    }

    function peg$parseLineChunk() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseVirtualNameChars();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseVirtualNameChars();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse__();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseConnection();
            if (s4 === peg$FAILED) {
              s4 = peg$c169;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse__();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c172(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c171); }
      }

      return s0;
    }

    function peg$parseConnection() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s2 = peg$c174;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c175); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 126) {
          s2 = peg$c176;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c177); }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$c178.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c179); }
        }
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            if (peg$c178.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c179); }
            }
          }
        } else {
          s3 = peg$c0;
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s3 = peg$c174;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c175); }
          }
        }
        if (s3 === peg$FAILED) {
          s3 = peg$c169;
        }
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s4 = peg$c174;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c175); }
          }
          if (s4 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 126) {
              s4 = peg$c176;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c177); }
            }
          }
          if (s4 === peg$FAILED) {
            s4 = peg$c169;
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c180(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c173); }
      }

      return s0;
    }

    function peg$parseConnectionTypes() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c174;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c175); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 126) {
          s0 = peg$c176;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c177); }
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 45) {
            s1 = peg$c174;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c175); }
          }
          if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$c178.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c179); }
            }
            if (s3 !== peg$FAILED) {
              while (s3 !== peg$FAILED) {
                s2.push(s3);
                if (peg$c178.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c179); }
                }
              }
            } else {
              s2 = peg$c0;
            }
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s3 = peg$c174;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c175); }
              }
              if (s3 !== peg$FAILED) {
                s1 = [s1, s2, s3];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 126) {
              s1 = peg$c176;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c177); }
            }
            if (s1 !== peg$FAILED) {
              s2 = [];
              if (peg$c178.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c179); }
              }
              if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                  s2.push(s3);
                  if (peg$c178.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c179); }
                  }
                }
              } else {
                s2 = peg$c0;
              }
              if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 45) {
                  s2 = peg$c174;
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c175); }
                }
              }
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 126) {
                  s3 = peg$c176;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c177); }
                }
                if (s3 !== peg$FAILED) {
                  s1 = [s1, s2, s3];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c181); }
      }

      return s0;
    }

    function peg$parseVirtualNameChars() {
      var s0;

      if (peg$c182.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c183); }
      }

      return s0;
    }

    function peg$parseNameChars() {
      var s0;

      if (peg$c184.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c185); }
      }

      return s0;
    }

    function peg$parseNameCharsWithSpace() {
      var s0;

      s0 = peg$parseNameChars();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 32) {
          s0 = peg$c186;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c187); }
        }
      }

      return s0;
    }

    function peg$parseLiteral() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseNumber();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c188(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseNumber() {
      var s0;

      s0 = peg$parseReal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseInteger();
      }

      return s0;
    }

    function peg$parseInteger() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c178.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c179); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c178.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c179); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c189(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseReal() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseInteger();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c158;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c159); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseInteger();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c190(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseSignedInteger() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c191.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c192); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c169;
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c178.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c179); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c178.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c179); }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseSourceCharacter() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c193); }
      }

      return s0;
    }

    function peg$parseWhiteSpace() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c195.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c196); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c194); }
      }

      return s0;
    }

    function peg$parseLineTerminator() {
      var s0;

      if (peg$c197.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c198); }
      }

      return s0;
    }

    function peg$parseLineTerminatorSequence() {
      var s0, s1;

      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c200;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c201); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c202) {
          s0 = peg$c202;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c203); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 13) {
            s0 = peg$c204;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c205); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 8232) {
              s0 = peg$c206;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c207); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 8233) {
                s0 = peg$c208;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c209); }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c199); }
      }

      return s0;
    }

    function peg$parseAnyChar() {
      var s0;

      if (peg$c210.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c211); }
      }

      return s0;
    }

    function peg$parseEOS() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parse__();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s2 = peg$c213;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c214); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseLineTerminatorSequence();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse__();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseEOF();
            if (s2 !== peg$FAILED) {
              s1 = [s1, s2];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }

      return s0;
    }

    function peg$parseEOF() {
      var s0, s1;

      s0 = peg$currPos;
      peg$silentFails++;
      if (input.length > peg$currPos) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c193); }
      }
      peg$silentFails--;
      if (s1 === peg$FAILED) {
        s0 = peg$c215;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseComment() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseMultiLineComment();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSingleLineComment();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }

      return s0;
    }

    function peg$parseMultiLineComment() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c218) {
        s1 = peg$c218;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c219); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c220) {
          s5 = peg$c220;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c221); }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c215;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c220) {
            s5 = peg$c220;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c221); }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c215;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c220) {
            s3 = peg$c220;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c221); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c217); }
      }

      return s0;
    }

    function peg$parseMultiLineCommentNoLineTerminator() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c218) {
        s1 = peg$c218;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c219); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c220) {
          s5 = peg$c220;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c221); }
        }
        if (s5 === peg$FAILED) {
          s5 = peg$parseLineTerminator();
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c215;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c220) {
            s5 = peg$c220;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c221); }
          }
          if (s5 === peg$FAILED) {
            s5 = peg$parseLineTerminator();
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c215;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c220) {
            s3 = peg$c220;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c221); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c222); }
      }

      return s0;
    }

    function peg$parseSingleLineComment() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c224) {
        s1 = peg$c224;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c225); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseLineTerminator();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c215;
        } else {
          peg$currPos = s4;
          s4 = peg$c0;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseSourceCharacter();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parseLineTerminator();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c215;
          } else {
            peg$currPos = s4;
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parseSourceCharacter();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseLineTerminator();
          if (s3 === peg$FAILED) {
            s3 = peg$parseEOF();
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c223); }
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseMultiLineCommentNoLineTerminator();
        if (s1 === peg$FAILED) {
          s1 = peg$parseSingleLineComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseMultiLineCommentNoLineTerminator();
          if (s1 === peg$FAILED) {
            s1 = peg$parseSingleLineComment();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c226); }
      }

      return s0;
    }

    function peg$parse__() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLineTerminatorSequence();
        if (s1 === peg$FAILED) {
          s1 = peg$parseComment();
        }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseLineTerminatorSequence();
          if (s1 === peg$FAILED) {
            s1 = peg$parseComment();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c227); }
      }

      return s0;
    }


      var p, parser, vfls, virtuals, ccss, asts, blankCount; 

      p = parser = this;
      
      blankCount = 0;
      
      p.getBlankName = function () {
        blankCount++;
        return "blank-" + blankCount;
      };
      
      p.size = ['width','height'];
      p.pos = ['x','y'];

      p.getResults = function () {
        var _ccss = virtuals.sort().join(" ");
        if (_ccss.length == 0) {
          _ccss = ccss;
        }
        else {
          _ccss = ["@virtual "+_ccss].concat(ccss);
        }
        return {
            //asts: asts, // DEBUG
            ccss: _ccss,
            vfl: vfls
          }
      }

      asts = [];
      
      p.addAST = function (stuff) {
        asts.push(stuff);
      }

      ccss = [];
      
      p.addCCSS = function (statement) {
        ccss.push(statement)
      }

      virtuals = [];
      
      p.addVirtual = function (virtual) {
        if (virtuals.indexOf(virtual) === -1) {
          virtuals.push('"'+virtual+'"');
        }
      }

      vfls = [];

      p.addVFL = function (vfl) {
        vfls.push(vfl);
      }


      p.addTemplate = function (lines,name,options) {
        var ast, prefix, container;
        
        prefix = name+'-';
        ast = p.processHLines(lines);
        ast.name = name;
        
        if (options.in) {
          container = options.in;
        }
        else {
          container = "::";
        }

        var md, mdOp, outergap, gaps, g, hasGap;
        
        gaps = {};
        hasGap = false;
        
        g = options.gap;
        if (g) { 
          hasGap = true;
          gaps.top = g;
          gaps.right = g;
          gaps.bottom = g;
          gaps.left = g;
          gaps.h = g;
          gaps.v = g;
        }    
        g = options['h-gap'];
        if (g) { 
          hasGap = true;
          gaps.right = g;
          gaps.left = g;
          gaps.h = g;
        }
        g = options['v-gap'];
        if (g) { 
          hasGap = true;
          gaps.top = g;
          gaps.bottom = g;
          gaps.v = g;
        }
        g = options['outer-gap'];
        if (g) { 
          hasGap = true;
          gaps.top = g;
          gaps.right = g;
          gaps.bottom = g;
          gaps.left = g;
        }
        g = options['top-gap'];
        if (g) { 
          hasGap = true;
          gaps.top = g;
        }
        g = options['right-gap']; 
        if (g) { 
          hasGap = true;
          gaps.right = g;
        }
        g = options['bottom-gap']; 
        if (g) { 
          hasGap = true;
          gaps.bottom = g;
        }
        g = options['left-gap']; 
        if (g) { 
          hasGap = true;
          gaps.left = g;
        }
        
        
        if (hasGap) {
          mdOp = "<=";
        } else {
          mdOp = "==";
        }
        
        
        // md-width     
        // -------------------------------------------------
        // == (this[width] - gap.left - gap.right - gap * (span - 1)) / span
        
        md = '::['+name+'-md-width] ' + mdOp + ' ';
        if (gaps.right || gaps.left || gaps.h) {
          md += '(' + container + '[width]';
          if (gaps.right) {md += ' - ' + gaps.right;}
          if (gaps.left ) {md += ' - ' + gaps.left;}      
          if (gaps.h && ast.yspan > 1){
            md += ' - ' + gaps.h;
            if (ast.yspan > 2) {md += ' * ' + (ast.yspan - 1);}
          }
          md += ')';
        } else {
          md += container + '[width]';
        }
        if (ast.yspan > 1){md += ' / ' + ast.yspan;}
        md += " !require";
        p.addCCSS(md);
        
        
        // md-height
        // -------------------------------------------------
      
        md = '::['+name+'-md-height] ' + mdOp + ' ';
        if (gaps.top || gaps.bottom || gaps.v) {
          md += '(' + container + '[height]';
          if (gaps.top) {md += ' - ' + gaps.top;}
          if (gaps.bottom ) {md += ' - ' + gaps.bottom;}
          if (gaps.v && ast.xspan > 1){
            md += ' - ' + gaps.v;
            if (ast.xspan > 2) {md += ' * ' + (ast.xspan - 1);}
          }
          md += ')';
        } else {
          md += container + '[height]';
        }    
        if (ast.xspan > 1){md += ' / ' + ast.xspan;}
        md += " !require";
        p.addCCSS(md);
        
        
        // virtual widths
        // -------------------------------------------------
        // == md-width * span - gap * (span - 1)
        
        var xspan, wccss;
        for (var el in ast.widths) {
          p.addVirtual(prefix+el);
          xspan = ast.widths[el];
          wccss = '"'+prefix+el+'"[width] == ';
          wccss +='::['+ast.name+'-md-width]';
          if (xspan > 1) {
            wccss += ' * ' + xspan;
            if (gaps.h) {
              wccss += ' + ' + gaps.h;
              if (xspan > 2) {
                wccss += ' * ' + (xspan - 1);
              }
            }
          }
          p.addCCSS(wccss)
        }
        
        
        // virtual heights
        // -------------------------------------------------
        
        var yspan, hccss;
        for (var el in ast.heights) {
          yspan = ast.heights[el];
          hccss = '"'+prefix+el+'"[height] == ';
          hccss +='::['+ast.name+'-md-height]';
          if (yspan > 1) {
            hccss += ' * ' + yspan;
            if (gaps.v) {
              hccss += ' + ' + gaps.v;
              if (yspan > 2) {
                hccss += ' * ' + (yspan - 1);
              }
            }
          }
          p.addCCSS(hccss);
        }

        var vfl, vflFooter;
        ast.v.forEach(function(brij){
          brij = brij.split("%-v-%");
          vfl = '@v ["'+prefix+brij[0]+'"]';
          if (gaps.v) {vfl += '-';}
          vfl += '["'+prefix+brij[1]+'"]';
          if (gaps.v) {vfl += ' gap('+gaps.v+')';}
          p.addVFL(vfl);
        });
       
        ast.h.forEach(function(brij){
          brij = brij.split("%-h-%");
          vfl = '@h ["'+prefix+brij[0]+'"]';
          if (gaps.h) {vfl += '-';}
          vfl += '["'+prefix+brij[1]+'"]';
          if (gaps.h) {vfl += ' gap('+gaps.h+')';}
          p.addVFL(vfl);
        });
        
        var edgeEls;
        
        edgeEls = [];
        ast.cols[0].y.forEach(function(el){
          if (edgeEls.indexOf(el) > -1) {return null;}
          edgeEls.push(el);
          vfl = '@h |';
          if (gaps.left) {vfl += '-';}
          vfl += '["'+prefix+el+'"]'+' in('+container+')';   
          if (gaps.left) {vfl += ' gap('+gaps.left+')';}
          p.addVFL(vfl);
        });

        edgeEls = [];
        ast.rows[0].x.forEach(function(el){
          if (edgeEls.indexOf(el) > -1) {return null;}
          edgeEls.push(el);
          vfl = '@v |';
          if (gaps.top) {vfl += '-';}
          vfl += '["'+prefix+el+'"]'+' in('+container+')';
          if (gaps.top) {vfl += ' gap('+gaps.top+')';}
          p.addVFL(vfl);
        });

        edgeEls = [];
        ast.cols[ast.cols.length-1].y.forEach(function(el){
          if (edgeEls.indexOf(el) > -1) {return null;}
          edgeEls.push(el);
          vfl = '@h ["'+prefix+el+'"]';
          if (gaps.right) {vfl += '-';}
          vfl +='|'+' in('+container+')';
          if (gaps.right) {vfl += ' gap('+gaps.right+')';}
          p.addVFL(vfl);
        });

        edgeEls = [];
        ast.rows[ast.rows.length-1].x.forEach(function(el){
          if (edgeEls.indexOf(el) > -1) {return null;}
          edgeEls.push(el);
          vfl = '@v ["'+prefix+el+'"]';
          if (gaps.bottom) {vfl += '-';}
          vfl += '|'+' in('+container+')';
          if (gaps.bottom) {vfl += ' gap('+gaps.bottom+')';}
          p.addVFL(vfl);
        });

        

        //p.addVFL(ast);
        p.addAST(ast);
        
        return ast;
      }

      p.processHZones = function (zones) {
        var xspan, curr, prev, h, x, widths,
          dotCounter, isDot;
        xspan = 0;
        h = [];
        widths = {};
        x = [];
        dotCounter = 0;    
        zones.forEach(function(zone){
          isDot = false;
          curr = zone.name;
          
          // "." are each treated as an empty zone
          if (curr === "-DOT-") {
            isDot = false;
            dotCounter++;
            curr += dotCounter;
          }
          x = x.concat(zone.x);
          delete zone.x;
          if (prev && prev !== curr) {   
            h.push([prev,curr].join("%-h-%"));
          }
          widths[zone.name] = zone.xspan;
          xspan += zone.xspan;
          prev = curr;
        });
        return {xspan:xspan,x:x,h:h,widths:widths};
      }
      
      p.processHLines = function (lines) {
        var cols,i,j,col,results;
        results = {heights:{},widths:{},v:[],h:[]};
        cols = [];
        i = 0;


        lines.forEach(function(row){
          j = 0;
          for (var nam in row.widths) {        
            results.widths[nam] = row.widths[nam];
          }
          row.h.forEach(function(hh){
            if (results.h.indexOf(hh) === -1) {results.h.push(hh);}
          })
          row.x.forEach(function(xx){
            var col;
            if (!cols[j]) {cols[j] = {y:[]};}
            col = cols[j];
            col.y.push(xx);
            j++;
          })
          i++;
        });    

        cols.forEach(function(col){
          var curr, currspan, prev, vStr, heights, i, v;
          v = [];            
          currspan = 0;
          prev = null;
          i = 0;
          col.y.forEach(function(name){        
            curr = name;
            currspan++;
            if (col.y[i+1]!==curr) {
              results.heights[name] = currspan;
              currspan = 0;
            }
            if (prev && prev !== curr) {
              vStr = [prev,curr].join("%-v-%")
              if (results.v.indexOf(vStr) === -1) {results.v.push(vStr);}
            }
            prev = curr;
            i++;
          })
        })

        results.yspan = cols.length;
        results.xspan = lines.length;
        results.cols = cols;
        results.rows = lines;           

        return results;
      }  


      p.trim = function (x) {
        if (typeof x === "string") {return x.trim();}
        if (x instanceof Array) {return x.join("").trim();}
        return ""
      };

      p.flatten = function (array, isShallow) {
        var index = -1,
          length = array ? array.length : 0,
          result = [];

        while (++index < length) {
          var value = array[index];

          if (value instanceof Array) {
            Array.prototype.push.apply(result, isShallow ? value : p.flatten(value));
          }
          else {
            result.push(value);
          }
        }
        return result;
      }

      p.stringify = function (array) {
        return p.trim(p.flatten(array));
      };
      


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
});
require.register("the-gss-compiler/lib/gss-compiler.js", function(exports, require, module){
var ccss, compile, inject, parseRules, preparser, uuid, vfl, vgl;

preparser = require('gss-preparser');

ccss = require('ccss-compiler');

vfl = require('vfl-compiler');

vgl = require('vgl-compiler');

uuid = function() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r, v;
    r = Math.random() * 16 | 0;
    v = (c === "x" ? r : r & 0x3 | 0x8);
    return v.toString(16);
  });
};

compile = function(gss) {
  var error, rules;
  try {
    rules = preparser.parse(gss.trim());
  } catch (_error) {
    error = _error;
    error.name = 'Preparse error';
    throw error;
  }
  rules = parseRules(rules);
  return rules;
};

parseRules = function(rules) {
  var ccssRule, ccssRules, chunk, css, error, info, key, parsed, subParsed, subrules, val, vflRule, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1;
  css = "";
  for (_i = 0, _len = rules.length; _i < _len; _i++) {
    chunk = rules[_i];
    parsed = {};
    switch (chunk.type) {
      case 'directive':
        switch (chunk.name) {
          case 'grid-template':
          case '-gss-grid-template':
          case 'grid-rows':
          case '-gss-rows':
          case 'grid-cols':
          case '-gss-grid-cols':
            try {
              subrules = vgl.parse("@" + chunk.name + " " + chunk.terms);
            } catch (_error) {
              error = _error;
              error.name = "VGL parse error: @" + chunk.name + " " + chunk.terms;
              throw error;
            }
            parsed = {
              selectors: [],
              commands: []
            };
            _ref = subrules.ccss;
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
              ccssRule = _ref[_j];
              try {
                subParsed = ccss.parse(ccssRule);
              } catch (_error) {
                error = _error;
                error.name = 'VGL generated CCSS parse error';
                throw error;
              }
              parsed.selectors = parsed.selectors.concat(subParsed.selectors);
              parsed.commands = parsed.commands.concat(subParsed.commands);
            }
            _ref1 = subrules.vfl;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
              vflRule = _ref1[_k];
              try {
                subParsed = ccss.parse(vfl.parse(vflRule).join("; "));
              } catch (_error) {
                error = _error;
                error.name = 'VGL generated VFL parse error';
                throw error;
              }
              parsed.selectors = parsed.selectors.concat(subParsed.selectors);
              parsed.commands = parsed.commands.concat(subParsed.commands);
            }
            break;
          case 'horizontal':
          case 'vertical':
          case '-gss-horizontal':
          case '-gss-vertical':
          case 'h':
          case 'v':
          case '-gss-h':
          case '-gss-v':
            try {
              ccssRules = vfl.parse("@" + chunk.name + " " + chunk.terms);
            } catch (_error) {
              error = _error;
              error.name = "VFL parse error: @" + chunk.name + " " + chunk.terms;
              throw error;
            }
            parsed = {
              selectors: [],
              commands: []
            };
            for (_l = 0, _len3 = ccssRules.length; _l < _len3; _l++) {
              ccssRule = ccssRules[_l];
              try {
                subParsed = ccss.parse(ccssRule);
              } catch (_error) {
                error = _error;
                info = [];
                info.push('Generated by VFL statement:');
                info.push('');
                info.push("@" + chunk.name + " " + chunk.terms);
                console.info(info.join('\n'));
                error.name = 'VFL generated CCSS parse error';
                throw error;
              }
              parsed.selectors = parsed.selectors.concat(subParsed.selectors);
              parsed.commands = parsed.commands.concat(subParsed.commands);
            }
            break;
          case 'if':
          case 'elseif':
          case 'else':
            if (chunk.terms.length > 0) {
              try {
                parsed = ccss.parse("@cond" + chunk.terms + ";");
              } catch (_error) {
                error = _error;
                error.name = 'CCSS conditional parse error';
                throw error;
              }
              parsed.clause = parsed.commands[0];
              delete parsed.commands;
            } else {
              parsed.clause = null;
            }
        }
        break;
      case 'constraint':
        try {
          parsed = ccss.parse(chunk.cssText);
        } catch (_error) {
          error = _error;
          error.name = 'Constraint parse error';
          throw error;
        }
    }
    for (key in parsed) {
      val = parsed[key];
      chunk[key] = val;
    }
    if (chunk.rules) {
      parseRules(chunk.rules);
    }
  }
  return rules;
};

inject = function(chunks) {
  var _inject;
  _inject = function(_rules, parent) {
    var rule, _i, _len, _ref, _results;
    _results = [];
    for (_i = 0, _len = _rules.length; _i < _len; _i++) {
      rule = _rules[_i];
      rule._uuid = uuid();
      if (parent) {
        rule._parent_uuid = parent._uuid;
      }
      if (((_ref = rule.rules) != null ? _ref.length : void 0) > 0) {
        _results.push(_inject(rule.rules, rule));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  _inject(chunks);
  return chunks;
};

exports.compile = compile;

});
require.register("d4tocchini-customevent-polyfill/CustomEvent.js", function(exports, require, module){
var CustomEvent;

CustomEvent = function(event, params) {
  var evt;
  params = params || {
    bubbles: false,
    cancelable: false,
    detail: undefined
  };
  evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

CustomEvent.prototype = window.Event.prototype;

window.CustomEvent = CustomEvent;

});
require.register("slightlyoff-cassowary.js/index.js", function(exports, require, module){
module.exports = require("./src/c.js");
require("./src/HashTable.js");
require("./src/HashSet.js");
require("./src/Error.js");
require("./src/SymbolicWeight.js");
require("./src/Strength.js");
require("./src/Variable.js");
require("./src/Point.js");
require("./src/Expression.js");
require("./src/Constraint.js");
require("./src/Constraint.js");
require("./src/EditInfo.js");
require("./src/Tableau.js");
require("./src/SimplexSolver.js");
require("./src/Timer.js");
require("./src/parser/parser.js");
require("./src/parser/api.js");

});
require.register("slightlyoff-cassowary.js/src/c.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(scope){
"use strict";

// For Safari 5.x. Go-go-gadget ridiculously long release cycle!
try {
  (function(){}).bind(scope);
} catch (e) {
  Object.defineProperty(Function.prototype, "bind", {
    value: function(scope) {
      var f = this;
      return function() { return f.apply(scope, arguments); }
    },
    enumerable: false,
    configurable: true,
    writable: true,
  });
}

var inBrowser = (typeof scope["HTMLElement"] != "undefined");

var getTagName = function(proto) {
  var tn = null;
  while (proto && proto != Object.prototype) {
      if (proto.tagName) {
        tn = proto.tagName;
        break;
      }
    proto = proto.prototype;
  }
  return tn || "div";
};
var epsilon = 1e-8;

var  _t_map = {};
var walkForMethod = function(ctor, name) {
  if (!ctor || !name) return;

  // Check the class-side first, the look at the prototype, then walk up
  if (typeof ctor[name] == "function") {
    return ctor[name];
  }
  var p = ctor.prototype;
  if (p && typeof p[name] == "function") {
    return p[name];
  }
  if (p === Object.prototype ||
      p === Function.prototype) {
    return;
  }

  if (typeof ctor.__super__ == "function") {
    return walkForMethod(ctor.__super__, name);
  }
};

// Global
var c = scope.c = function() {
  if(c._api) {
    return c._api.apply(this, arguments);
  }
};

//
// Configuration
//
c.debug = false;
c.trace = false;
c.verbose = false;
c.traceAdded = false;
c.GC = false;

//
// Constants
//
c.GEQ = 1;
c.LEQ = 2;


//
// Utility methods
//
c.inherit = function(props) {
  var ctor = null;
  var parent = null;

  if (props["extends"]) {
    parent = props["extends"];
    delete props["extends"];
  }

  if (props["initialize"]) {
    ctor = props["initialize"];
    delete props["initialize"];
  }

  var realCtor = ctor || function() { };

  Object.defineProperty(realCtor, "__super__", {
    value: (parent) ? parent : Object,
    enumerable: false,
    configurable: true,
    writable: false,
  });

  if (props["_t"]) {
    _t_map[props["_t"]] = realCtor;
  }

  // FIXME(slightlyoff): would like to have class-side inheritance!
  // It's easy enough to do when we have __proto__, but we don't in IE 9/10.
  //   = (

  /*
  // NOTE: would happily do this except it's 2x slower. Boo!
  props.__proto__ = parent ? parent.prototype : Object.prototype;
  realCtor.prototype = props;
  */

  var rp = realCtor.prototype = Object.create(
    ((parent) ? parent.prototype : Object.prototype)
  );

  c.extend(rp, props);

  // If we're in a browser, we want to support "subclassing" HTML elements.
  // This needs some magic and we rely on a wrapped constructor hack to make
  // it happen.
  if (inBrowser) {
    if (parent && parent.prototype instanceof scope.HTMLElement) {
      var intermediateCtor = realCtor;
      var tn = getTagName(rp);
      var upgrade = function(el) {
        el.__proto__ = rp;
        intermediateCtor.apply(el, arguments);
        if (rp["created"]) { el.created(); }
        if (rp["decorate"]) { el.decorate(); }
        return el;
      };
      this.extend(rp, { upgrade: upgrade, });

      realCtor = function() {
        // We hack the constructor to always return an element with it's
        // prototype wired to ours. Boo.
        return upgrade(
          scope.document.createElement(tn)
        );
      }
      realCtor.prototype = rp;
      this.extend(realCtor, { ctor: intermediateCtor, }); // HACK!!!
    }
  }

  return realCtor;
};

c.own = function(obj, cb, context) {
  Object.getOwnPropertyNames(obj).forEach(cb, context||scope);
  return obj;
};

c.extend = function(obj, props) {
  c.own(props, function(x) {
    var pd = Object.getOwnPropertyDescriptor(props, x);
    try {
      if ( (typeof pd["get"] == "function") ||
           (typeof pd["set"] == "function") ) {
        Object.defineProperty(obj, x, pd);
      } else if (typeof pd["value"] == "function" ||x.charAt(0) === "_") {
        pd.writable = true;
        pd.configurable = true;
        pd.enumerable = false;
        Object.defineProperty(obj, x, pd);
      } else {
          obj[x] = props[x];
      }
    } catch(e) {
      // console.warn("c.extend assignment failed on property", x);
    }
  });
  return obj;
};

// FIXME: legacy API to be removed
c.traceprint = function(s /*String*/) { if (c.verbose) { console.log(s); } };
c.fnenterprint = function(s /*String*/) { console.log("* " + s); };
c.fnexitprint = function(s /*String*/) { console.log("- " + s); };

c.assert = function(f /*boolean*/, description /*String*/) {
  if (!f) {
    throw new c.InternalError("Assertion failed: " + description);
  }
};

var exprFromVarOrValue = function(v) {
  if (typeof v == "number" ) {
    return c.Expression.fromConstant(v);
  } else if(v instanceof c.Variable) {
    return c.Expression.fromVariable(v);
  }
  return v;
};

c.plus = function(e1, e2) {
  e1 = exprFromVarOrValue(e1);
  e2 = exprFromVarOrValue(e2);
  return e1.plus(e2);
};

c.minus = function(e1, e2) {
  e1 = exprFromVarOrValue(e1);
  e2 = exprFromVarOrValue(e2);
  return e1.minus(e2);
};

c.times = function(e1, e2) {
  e1 = exprFromVarOrValue(e1);
  e2 = exprFromVarOrValue(e2);
  return e1.times(e2);
};

c.divide = function(e1, e2) {
  e1 = exprFromVarOrValue(e1);
  e2 = exprFromVarOrValue(e2);
  return e1.divide(e2);
};

c.approx = function(a, b) {
  if (a === b) { return true; }
  a = +(a);
  b = +(b);
  if (a == 0) {
    return (Math.abs(b) < epsilon);
  }
  if (b == 0) {
    return (Math.abs(a) < epsilon);
  }
  return (Math.abs(a - b) < Math.abs(a) * epsilon);
};

var count = 1;
c._inc = function() { return count++; };

c.parseJSON = function(str) {
  return JSON.parse(str, function(k, v) {
    if (typeof v != "object" || typeof v["_t"] != "string") {
      return v;
    }
    var type = v["_t"];
    var ctor = _t_map[type];
    if (type && ctor) {
      var fromJSON = walkForMethod(ctor, "fromJSON");
      if (fromJSON) {
        return fromJSON(v, ctor);
      }
    }
    return v;
  });
};

if (typeof define === 'function' && define.amd) {
  // Require.js
  define(c);
} else if (typeof module === 'object' && module.exports) {
  // CommonJS
  module.exports = c;
} else {
  // Browser without module container
  scope.c = c;
}

})(this);

});
require.register("slightlyoff-cassowary.js/src/HashTable.js", function(exports, require, module){
/**
 * Copyright 2012 Alex Russell <slightlyoff@google.com>.
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * This is an API compatible re-implementation of the subset of jshashtable
 * which Cassowary actually uses.
 *
 * Features removed:
 *
 *     - multiple values per key
 *     - error tollerent hashing of any variety
 *     - overly careful (or lazy) size counting, etc.
 *     - Crockford's "class" pattern. We use the system from c.js.
 *     - any attempt at back-compat with broken runtimes.
 *
 * APIs removed, mostly for lack of use in Cassowary:
 *
 *     - support for custom hashing and equality functions as keys to ctor
 *     - isEmpty() -> check for !ht.size()
 *     - putAll()
 *     - entries()
 *     - containsKey()
 *     - containsValue()
 *     - keys()
 *     - values()
 *
 * Additions:
 *
 *     - new "scope" parameter to each() and escapingEach()
 */

(function(c) {
"use strict";

var copyOwn = function(src, dest) {
  Object.keys(src).forEach(function(x) {
    dest[x] = src[x];
  });
};

if (false && typeof Map != "undefined") {

  c.HashTable = c.inherit({

    initialize: function() {
      this.size = 0;
      this._store = new Map();
      this._keys = [];
      // this.get = this._store.get.bind(this._store);
    },

    set: function(key, value) {
      this._store.set(key, value);
      if (this._keys.indexOf(key) == -1) {
        this.size++;
        // delete this._keys[this._keys.indexOf(key)];
        this._keys.push(key);
      } /* else {
        delete this._keys[this._keys.indexOf(key)];
        this._keys.push(key);
      }
      */
    },

    get: function(key) {
      return this._store.get(key);
    },

    clear: function() {
      this.size = 0;
      this._store = new Map();
      this._keys = [];
    },

    delete: function(key) {
      if (this._store.delete(key) && this.size > 0) {
        delete this._keys[this._keys.indexOf(key)];
        this.size--;
      }
    },

    each: function(callback, scope) {
      if (!this.size) { return; }
      this._keys.forEach(function(k){
        if (typeof k == "undefined") { return; }
        var v = this._store.get(k);
        if (typeof v != "undefined") {
          callback.call(scope||null, k, v);
        }
      }, this);
    },

    escapingEach: function(callback, scope) {
      if (!this.size) { return; }

      var that = this;
      var kl = this._keys.length;
      var context;
      for (var x = 0; x < kl; x++) {
        if (typeof this._keys[x] != "undefined") {
          (function(k) {
            var v = that._store.get(k);
            if (typeof v != "undefined") {
              context = callback.call(scope||null, k, v);
            }
          })(this._keys[x]);

          if (context) {
            if (context.retval !== undefined) {
              return context;
            }
            if (context.brk) {
              break;
            }
          }
        }
      }
    },

    clone: function() {
      var n = new c.HashTable();
      if (this.size) {
        this.each(function(k, v) {
          n.set(k, v);
        });
      }
      return n;
    }
  });
} else {
  // For escapingEach
  var defaultContext = {};

  c.HashTable = c.inherit({

    initialize: function() {
      this.size = 0;
      this._store = {};
      this._keyStrMap = {};
      this._deleted = 0;
    },

    set: function(key, value) {
      var hash = key.hashCode;

      if (typeof this._store[hash] == "undefined") {
        // FIXME(slightlyoff): if size gooes above the V8 property limit,
        // compact or go to a tree.
        this.size++;
      }
      this._store[hash] = value;
      this._keyStrMap[hash] = key;
    },

    get: function(key) {
      if(!this.size) { return null; }

      key = key.hashCode;

      var v = this._store[key];
      if (typeof v != "undefined") {
        return this._store[key];
      }
      return null;
    },

    clear: function() {
      this.size = 0;
      this._store = {};
      this._keyStrMap = {};
    },

    _compact: function() {
      // console.time("HashTable::_compact()");
      var ns = {};
      copyOwn(this._store, ns);
      this._store = ns;
      // console.timeEnd("HashTable::_compact()");
    },

    _compactThreshold: 100,
    _perhapsCompact: function() {
      // If we have more properties than V8's fast property lookup limit, don't
      // bother
      if (this._size > 30) return;
      if (this._deleted > this._compactThreshold) {
        this._compact();
        this._deleted = 0;
      }
    },

    delete: function(key) {
      key = key.hashCode;
      if (!this._store.hasOwnProperty(key)) {
        return;
      }
      this._deleted++;

      // FIXME(slightlyoff):
      //    I hate this because it causes these objects to go megamorphic = (
      //    Sadly, Cassowary is hugely sensitive to iteration order changes, and
      //    "delete" preserves order when Object.keys() is called later.
      delete this._store[key];
      // Note: we don't delete from _keyStrMap because we only get the
      // Object.keys() from _store, so it's the only one we need to keep up-to-
      // date.

      if (this.size > 0) {
        this.size--;
      }
    },

    each: function(callback, scope) {
      if (!this.size) { return; }

      this._perhapsCompact();

      var store = this._store;
      var keyMap = this._keyStrMap;
      for (var x in this._store) {
        if (this._store.hasOwnProperty(x)) {
          callback.call(scope||null, keyMap[x], store[x]);
        }
      }
    },

    escapingEach: function(callback, scope) {
      if (!this.size) { return; }

      this._perhapsCompact();

      var that = this;
      var store = this._store;
      var keyMap = this._keyStrMap;
      var context = defaultContext;
      var kl = Object.keys(store);
      for (var x = 0; x < kl.length; x++) {
        (function(v) {
          if (that._store.hasOwnProperty(v)) {
            context = callback.call(scope||null, keyMap[v], store[v]);
          }
        })(kl[x]);

        if (context) {
          if (context.retval !== undefined) {
            return context;
          }
          if (context.brk) {
            break;
          }
        }
      }
    },

    clone: function() {
      var n = new c.HashTable();
      if (this.size) {
        n.size = this.size;
        copyOwn(this._store, n._store);
        copyOwn(this._keyStrMap, n._keyStrMap);
      }
      return n;
    },

    equals: function(other) {
      if (other === this) {
        return true;
      }

      if (!(other instanceof c.HashTable) || other._size !== this._size) {
        return false;
      }

      var codes = Object.keys(this._store);
      for (var i = 0; i < codes.length; i++) {
        var code = codes[i];
        if (this._keyStrMap[code] !== other._keyStrMap[code] ||
            this._store[code] !== other._store[code]) {
          return false;
        }
      }

      return true;
    },

    toString: function(h) {
      var answer = "";
      this.each(function(k, v) { answer += k + " => " + v + "\n"; });
      return answer;
    },
  });
}

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/HashSet.js", function(exports, require, module){
/**
 * Copyright 2011, Alex Russell <slightlyoff@google.com>
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * API compatible re-implementation of jshashset.js, including only what
 * Cassowary needs. Built for speed, not comfort.
 */
(function(c) {
"use strict";

c.HashSet = c.inherit({
  _t: "c.HashSet",

  initialize: function() {
    this.storage = [];
    this.size = 0;
    this.hashCode = c._inc();
  },

  add: function(item) {
    var s = this.storage, io = s.indexOf(item);
    if (s.indexOf(item) == -1) { s[s.length] = item; }
    this.size = this.storage.length;
  },

  values: function() {
    // FIXME(slightlyoff): is it safe to assume we won't be mutated by our caller?
    //                     if not, return this.storage.slice(0);
    return this.storage;
  },

  has: function(item) {
    var s = this.storage;
    return (s.indexOf(item) != -1);
  },

  delete: function(item) {
    var io = this.storage.indexOf(item);
    if (io == -1) { return null; }
    this.storage.splice(io, 1)[0];
    this.size = this.storage.length;
  },

  clear: function() {
    this.storage.length = 0;
  },

  each: function(func, scope) {
    if(this.size)
      this.storage.forEach(func, scope);
  },

  escapingEach: function(func, scope) {
    // FIXME(slightlyoff): actually escape!
    if (this.size)
      this.storage.forEach(func, scope);
  },

  toString: function() {
    var answer = this.size + " {";
    var first = true;
    this.each(function(e) {
      if (!first) {
        answer += ", ";
      } else {
        first = false;
      }
      answer += e;
    });
    answer += "}\n";
    return answer;
  },

  toJSON: function() {
    var d = [];
    this.each(function(e) {
      d[d.length] = e.toJSON();
    });
    return {
      _t: "c.HashSet",
      data: d
    };
  },

  fromJSON: function(o) {
    var r = new c.HashSet();
    if (o.data) {
      r.size = o.data.length;
      r.storage = o.data;
    }
    return r;
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Error.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c){
  "use strict";

  c.Error = c.inherit({
    // extends: Error,
    initialize: function(s /*String*/) { if (s) { this._description = s; } },
    _name: "c.Error",
    _description: "An error has occured in Cassowary",
    set description(v)   { this._description = v; },
    get description()    { return "(" + this._name + ") " + this._description; },
    get message()        { return this.description; },
    toString: function() { return this.description; },
  });

  var errorType = function(name, error) {
    return c.inherit({
      extends: c.Error,
      initialize: function() { c.Error.apply(this, arguments); },
      _name: name||"", _description: error||""
    });
  };

  c.ConstraintNotFound =
    errorType("c.ConstraintNotFound",
        "Tried to remove a constraint never added to the tableu");

  c.InternalError =
    errorType("c.InternalError");

  c.NonExpression =
    errorType("c.NonExpression",
        "The resulting expression would be non");

  c.NotEnoughStays =
    errorType("c.NotEnoughStays",
        "There are not enough stays to give specific values to every variable");

  c.RequiredFailure =
    errorType("c.RequiredFailure", "A required constraint cannot be satisfied");

  c.TooDifficult =
    errorType("c.TooDifficult", "The constraints are too difficult to solve");

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/SymbolicWeight.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

var multiplier = 1000;

c.SymbolicWeight = c.inherit({
  _t: "c.SymbolicWeight",
  initialize: function(/*w1, w2, w3*/) {
    this.value = 0;
    var factor = 1;
    for (var i = arguments.length - 1; i >= 0; --i) {
      this.value += arguments[i] * factor;
      factor *= multiplier;
    }
  },

  toJSON: function() {
    return {
      _t: this._t,
      value: this.value
    };
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Strength.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {

c.Strength = c.inherit({
  initialize: function(name /*String*/, symbolicWeight, w2, w3) {
    this.name = name;
    if (symbolicWeight instanceof c.SymbolicWeight) {
      this.symbolicWeight = symbolicWeight;
    } else {
      this.symbolicWeight = new c.SymbolicWeight(symbolicWeight, w2, w3);
    }
  },

  get required() {
    return (this === c.Strength.required);
  },

  toString: function() {
    return this.name + (!this.isRequired ? (":" + this.symbolicWeight) : "");
  },
});

/* public static final */
c.Strength.required = new c.Strength("<Required>", 1000, 1000, 1000);
/* public static final  */
c.Strength.strong = new c.Strength("strong", 1, 0, 0);
/* public static final  */
c.Strength.medium = new c.Strength("medium", 0, 1, 0);
/* public static final  */
c.Strength.weak = new c.Strength("weak", 0, 0, 1);

})(this["c"]||((typeof module != "undefined") ? module.parent.exports.c : {}));

});
require.register("slightlyoff-cassowary.js/src/Variable.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.AbstractVariable = c.inherit({
  isDummy:      false,
  isExternal:   false,
  isPivotable:  false,
  isRestricted: false,

  _init: function(args, varNamePrefix) {
    // Common mixin initialization.
    this.hashCode = c._inc();
    this.name = (varNamePrefix||"") + this.hashCode;
    if (args) {
      if (typeof args.name != "undefined") {
        this.name = args.name;
      }
      if (typeof args.value != "undefined") {
        this.value = args.value;
      }
      if (typeof args.prefix != "undefined") {
        this._prefix = args.prefix;
      }
    }
  },

  _prefix: "",
  name: "",
  value: 0,

  valueOf: function() { return this.value; },

  toJSON: function() {
    var o = {};
    if (this._t) {
      o._t = this._t;
    }
    if (this.name) {
      o.name = this.name;
    }
    if (typeof this.value != "undefined") {
      o.value = this.value;
    }
    if (this._prefix) {
      o._prefix = this._prefix;
    }
    if (this._t) {
      o._t = this._t;
    }
    return o;
  },

  fromJSON: function(o, Ctor) {
    var r = new Ctor();
    c.extend(r, o);
    return r;
  },

  toString: function() {
    return this._prefix + "[" + this.name + ":" + this.value + "]";
  },

});

c.Variable = c.inherit({
  _t: "c.Variable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "v");
    var vm = c.Variable._map;
    if (vm) { vm[this.name] = this; }
  },
  isExternal:     true,
});

/* static */
// c.Variable._map = [];

c.DummyVariable = c.inherit({
  _t: "c.DummyVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "d");
  },
  isDummy:        true,
  isRestricted:   true,
  value:         "dummy",
});

c.ObjectiveVariable = c.inherit({
  _t: "c.ObjectiveVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "o");
  },
  value:         "obj",
});

c.SlackVariable = c.inherit({
  _t: "c.SlackVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "s");
  },
  isPivotable:    true,
  isRestricted:   true,
  value:         "slack",
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Point.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";
c.Point = c.inherit({
  initialize: function(x, y, suffix) {
    if (x instanceof c.Variable) {
      this._x = x;
    } else {
      var xArgs = { value: x };
      if (suffix) {
        xArgs.name = "x" + suffix;
      }
      this._x = new c.Variable(xArgs);
    }
    if (y instanceof c.Variable) {
      this._y = y;
    } else {
      var yArgs = { value: y };
      if (suffix) {
        yArgs.name = "y" + suffix;
      }
      this._y = new c.Variable(yArgs);
    }
  },

  get x() { return this._x; },
  set x(xVar) {
    if (xVar instanceof c.Variable) {
      this._x = xVar;
    } else {
      this._x.value = xVar;
    }
  },

  get y() { return this._y; },
  set y(yVar) {
    if (yVar instanceof c.Variable) {
      this._y = yVar;
    } else {
      this._y.value = yVar;
    }
  },

  toString: function() {
    return "(" + this.x + ", " + this.y + ")";
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Expression.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {
"use strict";

var checkNumber = function(value, otherwise){
  // if(isNaN(value)) { debugger; }
  return (typeof value === "number") ? value : otherwise;
};

c.Expression = c.inherit({

  initialize: function(cvar /*c.AbstractVariable*/,
                       value /*double*/,
                       constant /*double*/) {
    this.constant = checkNumber(constant, 0);
    this.terms = new c.HashTable();
    if (cvar instanceof c.AbstractVariable) {
      value = checkNumber(value, 1);
      this.setVariable(cvar, value);
    } else if (typeof cvar == "number") {
      if (!isNaN(cvar)) {
        this.constant = cvar;
      } else {
        console.trace();
      }
    }
  },

  initializeFromHash: function(constant /*ClDouble*/, terms /*c.Hashtable*/) {
    if (c.verbose) {
      console.log("*******************************");
      console.log("clone c.initializeFromHash");
      console.log("*******************************");
    }

    if (c.GC) console.log("clone c.Expression");
    this.constant = constant;
    this.terms = terms.clone();
    return this;
  },

  multiplyMe: function(x /*double*/) {
    this.constant *= x;
    var t = this.terms;
    t.each(function(clv, coeff) { t.set(clv, coeff * x); });
    return this;
  },

  clone: function() {
    if (c.verbose) {
      console.log("*******************************");
      console.log("clone c.Expression");
      console.log("*******************************");
    }

    var e = c.Expression.empty();
    e.initializeFromHash(this.constant, this.terms);
    return e;
  },

  times: function(x) {
    if (typeof x == 'number') {
      return (this.clone()).multiplyMe(x);
    } else {
      if (this.isConstant) {
        return x.times(this.constant);
      } else if (x.isConstant) {
        return this.times(x.constant);
      } else {
        throw new c.NonExpression();
      }
    }
  },

  plus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, 1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, 1);
    }
  },

  minus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, -1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, -1);
    }
  },

  divide: function(x) {
    if (typeof x == 'number') {
      if (c.approx(x, 0)) {
        throw new c.NonExpression();
      }
      return this.times(1 / x);
    } else if (x instanceof c.Expression) {
      if (!x.isConstant) {
        throw new c.NonExpression();
      }
      return this.times(1 / x.constant);
    }
  },

  addExpression: function(expr /*c.Expression*/,
                          n /*double*/,
                          subject /*c.AbstractVariable*/,
                          solver /*c.Tableau*/) {

    // console.log("c.Expression::addExpression()", expr, n);
    // console.trace();
    if (expr instanceof c.AbstractVariable) {
      expr = c.Expression.fromVariable(expr);
      // if(c.trace) console.log("addExpression: Had to cast a var to an expression");
    }
    n = checkNumber(n, 1);
    this.constant += (n * expr.constant);
    expr.terms.each(function(clv, coeff) {
      // console.log("clv:", clv, "coeff:", coeff, "subject:", subject);
      this.addVariable(clv, coeff * n, subject, solver);
    }, this);
    return this;
  },

  addVariable: function(v /*c.AbstractVariable*/, cd /*double*/, subject, solver) {
    if (cd == null) {
      cd = 1;
    }

    /*
    if (c.trace) console.log("c.Expression::addVariable():", v , cd);
    */
    var coeff = this.terms.get(v);
    if (coeff) {
      var newCoefficient = coeff + cd;
      if (newCoefficient == 0 || c.approx(newCoefficient, 0)) {
        if (solver) {
          solver.noteRemovedVariable(v, subject);
        }
        this.terms.delete(v);
      } else {
        this.setVariable(v, newCoefficient);
      }
    } else {
      if (!c.approx(cd, 0)) {
        this.setVariable(v, cd);
        if (solver) {
          solver.noteAddedVariable(v, subject);
        }
      }
    }
    return this;
  },

  setVariable: function(v /*c.AbstractVariable*/, c /*double*/) {
    // console.log("terms.set(", v, c, ")");
    this.terms.set(v, c);
    return this;
  },

  anyPivotableVariable: function() {
    if (this.isConstant) {
      throw new c.InternalError("anyPivotableVariable called on a constant");
    }

    var rv = this.terms.escapingEach(function(clv, c) {
      if (clv.isPivotable) return { retval: clv };
    });

    if (rv && rv.retval !== undefined) {
      return rv.retval;
    }

    return null;
  },

  substituteOut: function(outvar  /*c.AbstractVariable*/,
                          expr    /*c.Expression*/,
                          subject /*c.AbstractVariable*/,
                          solver  /*ClTableau*/) {

    /*
    if (c.trace) {
      c.fnenterprint("CLE:substituteOut: " + outvar + ", " + expr + ", " + subject + ", ...");
      c.traceprint("this = " + this);
    }
    */
    var setVariable = this.setVariable.bind(this);
    var terms = this.terms;
    var multiplier = terms.get(outvar);
    terms.delete(outvar);
    this.constant += (multiplier * expr.constant);
    /*
    console.log("substituteOut:",
                "\n\toutvar:", outvar,
                "\n\texpr:", expr.toString(),
                "\n\tmultiplier:", multiplier,
                "\n\tterms:", terms);
    */
    expr.terms.each(function(clv, coeff) {
      var oldCoefficient = terms.get(clv);
      if (oldCoefficient) {
        var newCoefficient = oldCoefficient + multiplier * coeff;
        if (c.approx(newCoefficient, 0)) {
          solver.noteRemovedVariable(clv, subject);
          terms.delete(clv);
        } else {
          terms.set(clv, newCoefficient);
        }
      } else {
        terms.set(clv, multiplier * coeff);
        if (solver) {
          solver.noteAddedVariable(clv, subject);
        }
      }
    });
    // if (c.trace) c.traceprint("Now this is " + this);
  },

  changeSubject: function(old_subject /*c.AbstractVariable*/,
                          new_subject /*c.AbstractVariable*/) {
    this.setVariable(old_subject, this.newSubject(new_subject));
  },

  newSubject: function(subject /*c.AbstractVariable*/) {
    // if (c.trace) c.fnenterprint("newSubject:" + subject);

    var reciprocal = 1 / this.terms.get(subject);
    this.terms.delete(subject);
    this.multiplyMe(-reciprocal);
    return reciprocal;
  },

  // Return the coefficient corresponding to variable var, i.e.,
  // the 'ci' corresponding to the 'vi' that var is:
  //     v1*c1 + v2*c2 + .. + vn*cn + c
  coefficientFor: function(clv /*c.AbstractVariable*/) {
    return this.terms.get(clv) || 0;
  },

  get isConstant() {
    return this.terms.size == 0;
  },

  toString: function() {
    var bstr = ''; // answer
    var needsplus = false;
    if (!c.approx(this.constant, 0) || this.isConstant) {
      bstr += this.constant;
      if (this.isConstant) {
        return bstr;
      } else {
        needsplus = true;
      }
    }
    this.terms.each( function(clv, coeff) {
      if (needsplus) {
        bstr += " + ";
      }
      bstr += coeff + "*" + clv;
      needsplus = true;
    });
    return bstr;
  },

  equals: function(other) {
    if (other === this) {
      return true;
    }

    return other instanceof c.Expression &&
           other.constant === this.constant &&
           other.terms.equals(this.terms);
  },

  Plus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.plus(e2);
  },

  Minus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.minus(e2);
  },

  Times: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.times(e2);
  },

  Divide: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.divide(e2);
  },
});

c.Expression.empty = function() {
  return new c.Expression(undefined, 1, 0);
};

c.Expression.fromConstant = function(cons) {
  return new c.Expression(cons);
};

c.Expression.fromValue = function(v) {
  v = +(v);
  return new c.Expression(undefined, v, 0);
};

c.Expression.fromVariable = function(v) {
  return new c.Expression(v, 1, 0);
}

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Constraint.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.AbstractConstraint = c.inherit({
  initialize: function(strength /*c.Strength*/, weight /*double*/) {
    this.hashCode = c._inc();
    this.strength = strength || c.Strength.required;
    this.weight = weight || 1;
  },

  isEditConstraint: false,
  isInequality:     false,
  isStayConstraint: false,
  get required() { return (this.strength === c.Strength.required); },

  toString: function() {
    // this is abstract -- it intentionally leaves the parens unbalanced for
    // the subclasses to complete (e.g., with ' = 0', etc.
    return this.strength + " {" + this.weight + "} (" + this.expression +")";
  },
});

var ts = c.AbstractConstraint.prototype.toString;

var EditOrStayCtor = function(cv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
  c.AbstractConstraint.call(this, strength || c.Strength.strong, weight);
  this.variable = cv;
  this.expression = new c.Expression(cv, -1, cv.value);
};

c.EditConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isEditConstraint: true,
  toString: function() { return "edit:" + ts.call(this); },
});

c.StayConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isStayConstraint: true,
  toString: function() { return "stay:" + ts.call(this); },
});

var lc =
c.Constraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function(cle /*c.Expression*/,
                       strength /*c.Strength*/,
                       weight /*double*/) {
    c.AbstractConstraint.call(this, strength, weight);
    this.expression = cle;
  },
});

c.Inequality = c.inherit({
  extends: c.Constraint,

  _cloneOrNewCle: function(cle) {
    // FIXME(D4): move somewhere else?
    if (cle.clone)  {
      return cle.clone();
    } else {
      return new c.Expression(cle);
    }
  },

  initialize: function(a1, a2, a3, a4, a5) {
    // FIXME(slightlyoff): what a disgusting mess. Should at least add docs.
    // console.log("c.Inequality.initialize(", a1, a2, a3, a4, a5, ")");

    var a1IsExp = a1 instanceof c.Expression,
        a3IsExp = a3 instanceof c.Expression,
        a1IsVar = a1 instanceof c.AbstractVariable,
        a3IsVar = a3 instanceof c.AbstractVariable,
        a1IsNum = typeof(a1) == 'number',
        a3IsNum = typeof(a3) == 'number';

    // (cle || number), op, cv
    if ((a1IsExp || a1IsNum) && a3IsVar) {
      var cle = a1, op = a2, cv = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(cv);
      } else if (op == c.GEQ) {
        this.expression.addVariable(cv, -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cv, op, (cle || number)
    } else if (a1IsVar && (a3IsExp || a3IsNum)) {
      var cle = a3, op = a2, cv = a1, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(cv);
      } else if (op == c.LEQ) {
        this.expression.addVariable(cv, -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cle, op, num
    } else if (a1IsExp && a3IsNum) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle1), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.GEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
      return this
    // num, op, cle
    } else if (a1IsNum && a3IsExp) {
      var cle1 = a3, op = a2, cle2 = a1, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle1), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
      return this
    // cle op cle
    } else if (a1IsExp && a3IsExp) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle2), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle1));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle1), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cle
    } else if (a1IsExp) {
      return lc.call(this, a1, a2, a3);
    // >=
    } else if (a2 == c.GEQ) {
      lc.call(this, new c.Expression(a3), a4, a5);
      this.expression.multiplyMe(-1);
      this.expression.addVariable(a1);
    // <=
    } else if (a2 == c.LEQ) {
      lc.call(this, new c.Expression(a3), a4, a5);
      this.expression.addVariable(a1,-1);
    // error
    } else {
      throw new c.InternalError("Invalid operator in c.Inequality constructor");
    }
  },

  isInequality: true,

  toString: function() {
    // return "c.Inequality: " + this.hashCode;
    return lc.prototype.toString.call(this) + " >= 0) id: " + this.hashCode;
  },
});

c.Equation = c.inherit({
  extends: c.Constraint,
  initialize: function(a1, a2, a3, a4) {
    // FIXME(slightlyoff): this is just a huge mess.
    if (a1 instanceof c.Expression && !a2 || a2 instanceof c.Strength) {
      lc.call(this, a1, a2, a3);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (a2 instanceof c.Expression)) {

      var cv = a1, cle = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if ((a1 instanceof c.AbstractVariable) &&
               (typeof(a2) == 'number')) {

      var cv = a1, val = a2, strength = a3, weight = a4;
      lc.call(this, new c.Expression(val), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if ((a1 instanceof c.Expression) &&
               (a2 instanceof c.AbstractVariable)) {

      var cle = a1, cv = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if (((a1 instanceof c.Expression) || (a1 instanceof c.AbstractVariable) ||
                (typeof(a1) == 'number')) &&
               ((a2 instanceof c.Expression) || (a2 instanceof c.AbstractVariable) ||
                (typeof(a2) == 'number'))) {

      if (a1 instanceof c.Expression) {
        a1 = a1.clone();
      } else {
        a1 = new c.Expression(a1);
      }

      if (a2 instanceof c.Expression) {
        a2 = a2.clone();
      } else {
        a2 = new c.Expression(a2);
      }

      lc.call(this, a1, a3, a4);
      this.expression.addExpression(a2, -1);

    } else {
      throw "Bad initializer to c.Equation";
    }
    c.assert(this.strength instanceof c.Strength, "_strength not set");
  },

  toString: function() {
    return lc.prototype.toString.call(this) + " = 0)";
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/EditInfo.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.EditInfo = c.inherit({
  initialize: function(cn      /*c.Constraint*/,
                       eplus   /*c.SlackVariable*/,
                       eminus  /*c.SlackVariable*/,
                       prevEditConstant /*double*/,
                       i /*int*/) {
    this.constraint = cn;
    this.editPlus = eplus;
    this.editMinus = eminus;
    this.prevEditConstant = prevEditConstant;
    this.index = i;
  },
  toString: function() {
    return "<cn=" + this.constraint +
           ", ep=" + this.editPlus +
           ", em=" + this.editMinus +
           ", pec=" + this.prevEditConstant +
           ", index=" + this.index + ">";
  }
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Tableau.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Tableau = c.inherit({
  initialize: function() {
    // columns is a mapping from variables which occur in expressions to the
    // set of basic variables whose expressions contain them
    // i.e., it's a mapping from variables in expressions (a column) to the
    // set of rows that contain them
    this.columns = new c.HashTable(); // values are sets

    // _rows maps basic variables to the expressions for that row in the tableau
    this.rows = new c.HashTable();    // values are c.Expressions

    // the collection of basic variables that have infeasible rows
    // (used when reoptimizing)
    this._infeasibleRows = new c.HashSet();

    // the set of rows where the basic variable is external this was added to
    // the C++ version to reduce time in setExternalVariables()
    this._externalRows = new c.HashSet();

    // the set of external variables which are parametric this was added to the
    // C++ version to reduce time in setExternalVariables()
    this._externalParametricVars = new c.HashSet();
  },

  // Variable v has been removed from an Expression.  If the Expression is in a
  // tableau the corresponding basic variable is subject (or if subject is nil
  // then it's in the objective function). Update the column cross-indices.
  noteRemovedVariable: function(v /*c.AbstractVariable*/,
                                subject /*c.AbstractVariable*/) {
    c.trace && console.log("c.Tableau::noteRemovedVariable: ", v, subject);
    var column = this.columns.get(v);
    if (subject && column) {
      column.delete(subject);
    }
  },

  noteAddedVariable: function(v /*c.AbstractVariable*/, subject /*c.AbstractVariable*/) {
    // if (c.trace) console.log("c.Tableau::noteAddedVariable:", v, subject);
    if (subject) {
      this.insertColVar(v, subject);
    }
  },

  getInternalInfo: function() {
    var retstr = "Tableau Information:\n";
    retstr += "Rows: " + this.rows.size;
    retstr += " (= " + (this.rows.size - 1) + " constraints)";
    retstr += "\nColumns: " + this.columns.size;
    retstr += "\nInfeasible Rows: " + this._infeasibleRows.size;
    retstr += "\nExternal basic variables: " + this._externalRows.size;
    retstr += "\nExternal parametric variables: ";
    retstr += this._externalParametricVars.size;
    retstr += "\n";
    return retstr;
  },

  toString: function() {
    var bstr = "Tableau:\n";
    this.rows.each(function(clv, expr) {
      bstr += clv;
      bstr += " <==> ";
      bstr += expr;
      bstr += "\n";
    });
    bstr += "\nColumns:\n";
    bstr += this.columns;
    bstr += "\nInfeasible rows: ";
    bstr += this._infeasibleRows;
    bstr += "External basic variables: ";
    bstr += this._externalRows;
    bstr += "External parametric variables: ";
    bstr += this._externalParametricVars;
    return bstr;
  },

  /*
  toJSON: function() {
    // Creates an object representation of the Tableau.
  },
  */

  // Convenience function to insert a variable into
  // the set of rows stored at columns[param_var],
  // creating a new set if needed
  insertColVar: function(param_var /*c.Variable*/,
                         rowvar /*c.Variable*/) {
    var rowset = /* Set */ this.columns.get(param_var);
    if (!rowset) {
      rowset = new c.HashSet();
      this.columns.set(param_var, rowset);
    }
    rowset.add(rowvar);
  },

  addRow: function(aVar /*c.AbstractVariable*/,
                   expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("addRow: " + aVar + ", " + expr);
    this.rows.set(aVar, expr);
    expr.terms.each(function(clv, coeff) {
      this.insertColVar(clv, aVar);
      if (clv.isExternal) {
        this._externalParametricVars.add(clv);
      }
    }, this);
    if (aVar.isExternal) {
      this._externalRows.add(aVar);
    }
    if (c.trace) c.traceprint(this.toString());
  },

  removeColumn: function(aVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeColumn:" + aVar);
    var rows = /* Set */ this.columns.get(aVar);
    if (rows) {
      this.columns.delete(aVar);
      rows.each(function(clv) {
        var expr = /* c.Expression */this.rows.get(clv);
        expr.terms.delete(aVar);
      }, this);
    } else {
      if (c.trace) console.log("Could not find var", aVar, "in columns");
    }
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
      this._externalParametricVars.delete(aVar);
    }
  },

  removeRow: function(aVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeRow:" + aVar);
    var expr = /* c.Expression */this.rows.get(aVar);
    c.assert(expr != null);
    expr.terms.each(function(clv, coeff) {
      var varset = this.columns.get(clv);
      if (varset != null) {
        if (c.trace) console.log("removing from varset:", aVar);
        varset.delete(aVar);
      }
    }, this);
    this._infeasibleRows.delete(aVar);
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
    }
    this.rows.delete(aVar);
    if (c.trace) c.fnexitprint("returning " + expr);
    return expr;
  },

  substituteOut: function(oldVar /*c.AbstractVariable*/,
                          expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("substituteOut:" + oldVar + ", " + expr);
    if (c.trace) c.traceprint(this.toString());

    var varset = this.columns.get(oldVar);
    varset.each(function(v) {
      var row = this.rows.get(v);
      row.substituteOut(oldVar, expr, v, this);
      if (v.isRestricted && row.constant < 0) {
        this._infeasibleRows.add(v);
      }
    }, this);

    if (oldVar.isExternal) {
      this._externalRows.add(oldVar);
      this._externalParametricVars.delete(oldVar);
    }

    this.columns.delete(oldVar);
  },

  columnsHasKey: function(subject /*c.AbstractVariable*/) {
    return !!this.columns.get(subject);
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/SimplexSolver.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
var t = c.Tableau;
var tp = t.prototype;
var epsilon = 1e-8;
var weak = c.Strength.weak;

c.SimplexSolver = c.inherit({
  extends: c.Tableau,
  initialize: function(){

    c.Tableau.call(this);
    this._stayMinusErrorVars = [];
    this._stayPlusErrorVars = [];

    this._errorVars = new c.HashTable(); // cn -> Set of cv

    this._markerVars = new c.HashTable(); // cn -> Set of cv

    // this._resolve_pair = [0, 0];
    this._objective = new c.ObjectiveVariable({ name: "Z" });

    this._editVarMap = new c.HashTable(); // cv -> c.EditInfo
    this._editVarList = [];

    this._slackCounter = 0;
    this._artificialCounter = 0;
    this._dummyCounter = 0;
    this.autoSolve = true;
    this._needsSolving = false;

    this._optimizeCount = 0;

    this.rows.set(this._objective, c.Expression.empty());
    this._editVariableStack = [0]; // Stack
    if (c.trace)
      c.traceprint("objective expr == " + this.rows.get(this._objective));
  },

  add: function(/*c.Constraint, ...*/) {
    for (var x = 0; x < arguments.length; x++) {
      this.addConstraint(arguments[x]);
    }
    return this;
  },

  _addEditConstraint: function(cn, eplus_eminus, prevEConstant) {
      var i = this._editVarMap.size;
      var cvEplus = /* c.SlackVariable */eplus_eminus[0];
      var cvEminus = /* c.SlackVariable */eplus_eminus[1];
      /*
      if (!cvEplus instanceof c.SlackVariable) {
        console.warn("cvEplus not a slack variable =", cvEplus);
      }
      if (!cvEminus instanceof c.SlackVariable) {
        console.warn("cvEminus not a slack variable =", cvEminus);
      }
      c.debug && console.log("new c.EditInfo(" + cn + ", " + cvEplus + ", " +
                                  cvEminus + ", " + prevEConstant + ", " +
                                  i +")");
      */
      var ei = new c.EditInfo(cn, cvEplus, cvEminus, prevEConstant, i)
      this._editVarMap.set(cn.variable, ei);
      this._editVarList[i] = { v: cn.variable, info: ei };
  },

  addConstraint: function(cn /*c.Constraint*/) {
    c.trace && c.fnenterprint("addConstraint: " + cn);
    var eplus_eminus = new Array(2);
    var prevEConstant = new Array(1); // so it can be output to
    var expr = this.newExpression(cn, /*output to*/ eplus_eminus, prevEConstant);
    prevEConstant = prevEConstant[0];

    if (!this.tryAddingDirectly(expr)) {
      this.addWithArtificialVariable(expr);
    }


    this._needsSolving = true;
    if (cn.isEditConstraint) {
      this._addEditConstraint(cn, eplus_eminus, prevEConstant);
    }
    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  addConstraintNoException: function(cn /*c.Constraint*/) {
    c.trace && c.fnenterprint("addConstraintNoException: " + cn);
    // FIXME(slightlyoff): change this to enable chaining
    try {
      this.addConstraint(cn);
      return true;
    } catch (e /*c.RequiredFailure*/){
      return false;
    }
  },

  addEditVar: function(v /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    c.trace && c.fnenterprint("addEditVar: " + v + " @ " + strength + " {" + weight + "}");
    return this.addConstraint(
        new c.EditConstraint(v, strength || c.Strength.strong, weight));
  },

  beginEdit: function() {
    // FIXME(slightlyoff): we shouldn't throw here. Log instead
    c.assert(this._editVarMap.size > 0, "_editVarMap.size > 0");
    this._infeasibleRows.clear();
    this._resetStayConstants();
    this._editVariableStack[this._editVariableStack.length] = this._editVarMap.size;
    return this;
  },

  endEdit: function() {
    // FIXME(slightlyoff): we shouldn't throw here. Log instead
    c.assert(this._editVarMap.size > 0, "_editVarMap.size > 0");
    this.resolve();
    this._editVariableStack.pop();
    this.removeEditVarsTo(
      this._editVariableStack[this._editVariableStack.length - 1]
    );
    return this;
  },

  removeAllEditVars: function() {
    return this.removeEditVarsTo(0);
  },

  removeEditVarsTo: function(n /*int*/) {
    try {
      var evll = this._editVarList.length;
      // only remove the variable if it's not in the set of variable
      // from a previous nested outer edit
      // e.g., if I do:
      // Edit x,y
      // Edit w,h,x,y
      // EndEdit
      // The end edit needs to only get rid of the edits on w,h
      // not the ones on x,y
      for(var x = n; x < evll; x++) {
        if (this._editVarList[x]) {
          this.removeConstraint(
            this._editVarMap.get(this._editVarList[x].v).constraint
          );
        }
      }
      this._editVarList.length = n;
      c.assert(this._editVarMap.size == n, "_editVarMap.size == n");
      return this;
    } catch (e /*ConstraintNotFound*/){
      throw new c.InternalError("Constraint not found in removeEditVarsTo");
    }
  },

  // Add weak stays to the x and y parts of each point. These have
  // increasing weights so that the solver will try to satisfy the x
  // and y stays on the same point, rather than the x stay on one and
  // the y stay on another.
  addPointStays: function(points /*[{ x: .., y: ..}, ...]*/) {
    c.trace && console.log("addPointStays", points);
    points.forEach(function(p, idx) {
      this.addStay(p.x, weak, Math.pow(2, idx));
      this.addStay(p.y, weak, Math.pow(2, idx));
    }, this);
    return this;
  },

  addStay: function(v /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    var cn = new c.StayConstraint(v,
                                  strength || weak,
                                  weight   || 1);
    return this.addConstraint(cn);
  },

  // FIXME(slightlyoff): add a removeStay

  removeConstraint: function(cn /*c.Constraint*/) {
    // console.log("removeConstraint('", cn, "')");
    c.trace && c.fnenterprint("removeConstraintInternal: " + cn);
    c.trace && c.traceprint(this.toString());
    this._needsSolving = true;
    this._resetStayConstants();
    var zRow = this.rows.get(this._objective);
    var eVars = /* Set */this._errorVars.get(cn);
    c.trace && c.traceprint("eVars == " + eVars);
    if (eVars != null) {
      eVars.each(function(cv) {
        var expr = this.rows.get(cv);
        if (expr == null) {
          zRow.addVariable(cv,
                           -cn.weight * cn.strength.symbolicWeight.value,
                           this._objective,
                           this);
        } else {
          zRow.addExpression(expr,
                             -cn.weight * cn.strength.symbolicWeight.value,
                             this._objective,
                             this);
        }
        c.trace && c.traceprint("now eVars == " + eVars);
      }, this);
    }
    var marker = this._markerVars.get(cn);
    this._markerVars.delete(cn);
    if (marker == null) {
      throw new c.InternalError("Constraint not found in removeConstraintInternal");
    }
    c.trace && c.traceprint("Looking to remove var " + marker);
    if (this.rows.get(marker) == null) {
      var col = this.columns.get(marker);
      // console.log("col is:", col, "from marker:", marker);
      c.trace && c.traceprint("Must pivot -- columns are " + col);
      var exitVar = null;
      var minRatio = 0;
      col.each(function(v) {
        if (v.isRestricted) {
          var expr = this.rows.get(v);
          var coeff = expr.coefficientFor(marker);
          c.trace && c.traceprint("Marker " + marker + "'s coefficient in " + expr + " is " + coeff);
          if (coeff < 0) {
            var r = -expr.constant / coeff;
            if (
              exitVar == null ||
              r < minRatio    ||
              (c.approx(r, minRatio) && v.hashCode < exitVar.hashCode)
            ) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);
      if (exitVar == null) {
        c.trace && c.traceprint("exitVar is still null");
        col.each(function(v) {
          if (v.isRestricted) {
            var expr = this.rows.get(v);
            var coeff = expr.coefficientFor(marker);
            var r = expr.constant / coeff;
            if (exitVar == null || r < minRatio) {
              minRatio = r;
              exitVar = v;
            }
          }
        }, this);
      }
      if (exitVar == null) {
        if (col.size == 0) {
          this.removeColumn(marker);
        } else {
          col.escapingEach(function(v) {
            if (v != this._objective) {
              exitVar = v;
              return { brk: true };
            }
          }, this);
        }
      }
      if (exitVar != null) {
        this.pivot(marker, exitVar);
      }
    }
    if (this.rows.get(marker) != null) {
      var expr = this.removeRow(marker);
    }

    if (eVars != null) {
      eVars.each(function(v) {
        if (v != marker) { this.removeColumn(v); }
      }, this);
    }

    if (cn.isStayConstraint) {
      if (eVars != null) {
        for (var i = 0; i < this._stayPlusErrorVars.length; i++) {
          eVars.delete(this._stayPlusErrorVars[i]);
          eVars.delete(this._stayMinusErrorVars[i]);
        }
      }
    } else if (cn.isEditConstraint) {
      c.assert(eVars != null, "eVars != null");
      var cei = this._editVarMap.get(cn.variable);
      this.removeColumn(cei.editMinus);
      this._editVarMap.delete(cn.variable);
    }

    if (eVars != null) {
      this._errorVars.delete(eVars);
    }

    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }

    return this;
  },

  reset: function() {
    c.trace && c.fnenterprint("reset");
    throw new c.InternalError("reset not implemented");
  },

  resolveArray: function(newEditConstants) {
    c.trace && c.fnenterprint("resolveArray" + newEditConstants);
    var l = newEditConstants.length
    this._editVarMap.each(function(v, cei) {
      var i = cei.index;
      if (i < l)
        this.suggestValue(v, newEditConstants[i]);
    }, this);
    this.resolve();
  },

  resolvePair: function(x /*double*/, y /*double*/) {
    this.suggestValue(this._editVarList[0].v, x);
    this.suggestValue(this._editVarList[1].v, y);
    this.resolve();
  },

  resolve: function() {
    c.trace && c.fnenterprint("resolve()");
    this.dualOptimize();
    this._setExternalVariables();
    this._infeasibleRows.clear();
    this._resetStayConstants();
  },

  suggestValue: function(v /*c.Variable*/, x /*double*/) {
    c.trace && console.log("suggestValue(" + v + ", " + x + ")");
    var cei = this._editVarMap.get(v);
    if (!cei) {
      throw new c.Error("suggestValue for variable " + v + ", but var is not an edit variable");
    }
    var delta = x - cei.prevEditConstant;
    cei.prevEditConstant = x;
    this.deltaEditConstant(delta, cei.editPlus, cei.editMinus);
    return this;
  },

  solve: function() {
    if (this._needsSolving) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  setEditedValue: function(v /*c.Variable*/, n /*double*/) {
    if (!(this.columnsHasKey(v) || (this.rows.get(v) != null))) {
      v.value = n;
      return this;
    }

    if (!c.approx(n, v.value)) {
      this.addEditVar(v);
      this.beginEdit();

      try {
        this.suggestValue(v, n);
      } catch (e) {
        throw new c.InternalError("Error in setEditedValue");
      }

      this.endEdit();
    }
    return this;
  },

  addVar: function(v /*c.Variable*/) {
    if (!(this.columnsHasKey(v) || (this.rows.get(v) != null))) {
      try {
        this.addStay(v);
      } catch (e /*c.RequiredFailure*/){
        throw new c.InternalError("Error in addVar -- required failure is impossible");
      }

      c.trace && c.traceprint("added initial stay on " + v);
    }
    return this;
  },

  getInternalInfo: function() {
    var retstr = tp.getInternalInfo.call(this);
    retstr += "\nSolver info:\n";
    retstr += "Stay Error Variables: ";
    retstr += this._stayPlusErrorVars.length + this._stayMinusErrorVars.length;
    retstr += " (" + this._stayPlusErrorVars.length + " +, ";
    retstr += this._stayMinusErrorVars.length + " -)\n";
    retstr += "Edit Variables: " + this._editVarMap.size;
    retstr += "\n";
    return retstr;
  },

  getDebugInfo: function() {
    return this.toString() + this.getInternalInfo() + "\n";
  },

  toString: function() {
    var bstr = tp.getInternalInfo.call(this);
    bstr += "\n_stayPlusErrorVars: ";
    bstr += '[' + this._stayPlusErrorVars + ']';
    bstr += "\n_stayMinusErrorVars: ";
    bstr += '[' + this._stayMinusErrorVars + ']';
    bstr += "\n";
    bstr += "_editVarMap:\n" + this._editVarMap;
    bstr += "\n";
    return bstr;
  },

  addWithArtificialVariable: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("addWithArtificialVariable: " + expr);
    var av = new c.SlackVariable({
      value: ++this._artificialCounter,
      prefix: "a"
    });
    var az = new c.ObjectiveVariable({ name: "az" });
    var azRow = /* c.Expression */expr.clone();
    c.trace && c.traceprint("before addRows:\n" + this);
    this.addRow(az, azRow);
    this.addRow(av, expr);
    c.trace && c.traceprint("after addRows:\n" + this);
    this.optimize(az);
    var azTableauRow = this.rows.get(az);
    c.trace && c.traceprint("azTableauRow.constant == " + azTableauRow.constant);
    if (!c.approx(azTableauRow.constant, 0)) {
      this.removeRow(az);
      this.removeColumn(av);
      throw new c.RequiredFailure();
    }
    var e = this.rows.get(av);
    if (e != null) {
      if (e.isConstant) {
        this.removeRow(av);
        this.removeRow(az);
        return;
      }
      var entryVar = e.anyPivotableVariable();
      this.pivot(entryVar, av);
    }
    c.assert(this.rows.get(av) == null, "rowExpression(av) == null");
    this.removeColumn(av);
    this.removeRow(az);
  },

  tryAddingDirectly: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("tryAddingDirectly: " + expr);
    var subject = this.chooseSubject(expr);
    if (subject == null) {
      c.trace && c.fnexitprint("returning false");
      return false;
    }
    expr.newSubject(subject);
    if (this.columnsHasKey(subject)) {
      this.substituteOut(subject, expr);
    }
    this.addRow(subject, expr);
    c.trace && c.fnexitprint("returning true");
    return true;
  },

  chooseSubject: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("chooseSubject: " + expr);
    var subject = null;
    var foundUnrestricted = false;
    var foundNewRestricted = false;
    var terms = expr.terms;
    var rv = terms.escapingEach(function(v, c) {
      if (foundUnrestricted) {
        if (!v.isRestricted) {
          if (!this.columnsHasKey(v)) {
            return { retval: v };
          }
        }
      } else {
        if (v.isRestricted) {
          if (!foundNewRestricted && !v.isDummy && c < 0) {
            var col = this.columns.get(v);
            if (col == null ||
                (col.size == 1 && this.columnsHasKey(this._objective))
            ) {
              subject = v;
              foundNewRestricted = true;
            }
          }
        } else {
          subject = v;
          foundUnrestricted = true;
        }
      }
    }, this);
    if (rv && rv.retval !== undefined) {
      return rv.retval;
    }

    if (subject != null) {
      return subject;
    }

    var coeff = 0;

    // subject is nil.
    // Make one last check -- if all of the variables in expr are dummy
    // variables, then we can pick a dummy variable as the subject
    var rv = terms.escapingEach(function(v,c) {
      if (!v.isDummy)  {
        return {retval:null};
      }
      if (!this.columnsHasKey(v)) {
        subject = v;
        coeff = c;
      }
    }, this);
    if (rv && rv.retval !== undefined) return rv.retval;

    if (!c.approx(expr.constant, 0)) {
      throw new c.RequiredFailure();
    }
    if (coeff > 0) {
      expr.multiplyMe(-1);
    }
    return subject;
  },

  deltaEditConstant: function(delta /*double*/,
                              plusErrorVar /*c.AbstractVariable*/,
                              minusErrorVar /*c.AbstractVariable*/) {
    if (c.trace)
      c.fnenterprint("deltaEditConstant :" + delta + ", " + plusErrorVar + ", " + minusErrorVar);

    var exprPlus = this.rows.get(plusErrorVar);
    if (exprPlus != null) {
      exprPlus.constant += delta;
      if (exprPlus.constant < 0) {
        this._infeasibleRows.add(plusErrorVar);
      }
      return;
    }
    var exprMinus = this.rows.get(minusErrorVar);
    if (exprMinus != null) {
      exprMinus.constant += -delta;
      if (exprMinus.constant < 0) {
        this._infeasibleRows.add(minusErrorVar);
      }
      return;
    }
    var columnVars = this.columns.get(minusErrorVar);
    if (!columnVars) {
      console.log("columnVars is null -- tableau is:\n" + this);
    }
    columnVars.each(function(basicVar) {
      var expr = this.rows.get(basicVar);
      var c = expr.coefficientFor(minusErrorVar);
      expr.constant += (c * delta);
      if (basicVar.isRestricted && expr.constant < 0) {
        this._infeasibleRows.add(basicVar);
      }
    }, this);
  },

  // We have set new values for the constants in the edit constraints.
  // Re-Optimize using the dual simplex algorithm.
  dualOptimize: function() {
    c.trace && c.fnenterprint("dualOptimize:");
    var zRow = this.rows.get(this._objective);
    // need to handle infeasible rows
    while (this._infeasibleRows.size) {
      var exitVar = this._infeasibleRows.values()[0];
      this._infeasibleRows.delete(exitVar);
      var entryVar = null;
      var expr = this.rows.get(exitVar);
      // exitVar might have become basic after some other pivoting
      // so allow for the case of its not being there any longer
      if (expr) {
        if (expr.constant < 0) {
          var ratio = Number.MAX_VALUE;
          var r;
          var terms = expr.terms;
          terms.each(function(v, cd) {
            if (cd > 0 && v.isPivotable) {
              var zc = zRow.coefficientFor(v);
              r = zc / cd;
              if (r < ratio ||
                  (c.approx(r, ratio) && v.hashCode < entryVar.hashCode)
              ) {
                entryVar = v;
                ratio = r;
              }
            }
          });
          if (ratio == Number.MAX_VALUE) {
            throw new c.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");
          }
          this.pivot(entryVar, exitVar);
        }
      }
    }
  },

  // Make a new linear Expression representing the constraint cn,
  // replacing any basic variables with their defining expressions.
  // Normalize if necessary so that the Constant is non-negative.  If
  // the constraint is non-required give its error variables an
  // appropriate weight in the objective function.
  newExpression: function(cn /*c.Constraint*/,
                          /** outputs to **/ eplus_eminus /*Array*/,
                          prevEConstant) {
    if (c.trace) {
      c.fnenterprint("newExpression: " + cn);
      c.traceprint("cn.isInequality == " + cn.isInequality);
      c.traceprint("cn.required == " + cn.required);
    }

    var cnExpr = cn.expression;
    var expr = c.Expression.fromConstant(cnExpr.constant);
    var slackVar = new c.SlackVariable();
    var dummyVar = new c.DummyVariable();
    var eminus = new c.SlackVariable();
    var eplus = new c.SlackVariable();
    var cnTerms = cnExpr.terms;
    // console.log(cnTerms.size);

    cnTerms.each(function(v, c) {
      var e = this.rows.get(v);
      if (!e) {
        expr.addVariable(v, c);
      } else {
        expr.addExpression(e, c);
      }
    }, this);

    if (cn.isInequality) {
      // cn is an inequality, so Add a slack variable. The original constraint
      // is expr>=0, so that the resulting equality is expr-slackVar=0. If cn is
      // also non-required Add a negative error variable, giving:
      //
      //    expr - slackVar = -errorVar
      //
      // in other words:
      //
      //    expr - slackVar + errorVar = 0
      //
      // Since both of these variables are newly created we can just Add
      // them to the Expression (they can't be basic).
      c.trace && c.traceprint("Inequality, adding slack");
      ++this._slackCounter;
      slackVar = new c.SlackVariable({
        value: this._slackCounter,
        prefix: "s"
      });
      expr.setVariable(slackVar, -1);

      this._markerVars.set(cn, slackVar);
      if (!cn.required) {
        ++this._slackCounter;
        eminus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "em"
        });
        expr.setVariable(eminus, 1);
        var zRow = this.rows.get(this._objective);
        zRow.setVariable(eminus, cn.strength.symbolicWeight.value * cn.weight);
        this.insertErrorVar(cn, eminus);
        this.noteAddedVariable(eminus, this._objective);
      }
    } else {
      if (cn.required) {
        c.trace && c.traceprint("Equality, required");
        // Add a dummy variable to the Expression to serve as a marker for this
        // constraint.  The dummy variable is never allowed to enter the basis
        // when pivoting.
        ++this._dummyCounter;
        dummyVar = new c.DummyVariable({
          value: this._dummyCounter,
          prefix: "d"
        });
        eplus_eminus[0] = dummyVar;
        eplus_eminus[1] = dummyVar;
        prevEConstant[0] = cnExpr.constant;
        expr.setVariable(dummyVar, 1);
        this._markerVars.set(cn, dummyVar);
        c.trace && c.traceprint("Adding dummyVar == d" + this._dummyCounter);
      } else {
        // cn is a non-required equality. Add a positive and a negative error
        // variable, making the resulting constraint
        //       expr = eplus - eminus
        // in other words:
        //       expr - eplus + eminus = 0
        c.trace && c.traceprint("Equality, not required");
        ++this._slackCounter;
        eplus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "ep"
        });
        eminus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "em"
        });
        expr.setVariable(eplus, -1);
        expr.setVariable(eminus, 1);
        this._markerVars.set(cn, eplus);
        var zRow = this.rows.get(this._objective);
        c.trace && console.log(zRow);
        var swCoeff = cn.strength.symbolicWeight.value * cn.weight;
        if (swCoeff == 0) {
          c.trace && c.traceprint("cn == " + cn);
          c.trace && c.traceprint("adding " + eplus + " and " + eminus + " with swCoeff == " + swCoeff);
        }
        zRow.setVariable(eplus, swCoeff);
        this.noteAddedVariable(eplus, this._objective);
        zRow.setVariable(eminus, swCoeff);
        this.noteAddedVariable(eminus, this._objective);

        this.insertErrorVar(cn, eminus);
        this.insertErrorVar(cn, eplus);

        if (cn.isStayConstraint) {
          this._stayPlusErrorVars[this._stayPlusErrorVars.length] = eplus;
          this._stayMinusErrorVars[this._stayMinusErrorVars.length] = eminus;
        } else if (cn.isEditConstraint) {
          eplus_eminus[0] = eplus;
          eplus_eminus[1] = eminus;
          prevEConstant[0] = cnExpr.constant;
        }
      }
    }
    // the Constant in the Expression should be non-negative. If necessary
    // normalize the Expression by multiplying by -1
    if (expr.constant < 0) expr.multiplyMe(-1);
    c.trace && c.fnexitprint("returning " + expr);
    return expr;
  },

  // Minimize the value of the objective.  (The tableau should already be
  // feasible.)
  optimize: function(zVar /*c.ObjectiveVariable*/) {
    c.trace && c.fnenterprint("optimize: " + zVar);
    c.trace && c.traceprint(this.toString());
    this._optimizeCount++;

    var zRow = this.rows.get(zVar);
    c.assert(zRow != null, "zRow != null");
    var entryVar = null;
    var exitVar = null;
    var objectiveCoeff, terms;

    while (true) {
      objectiveCoeff = 0;
      terms = zRow.terms;

      // Find the most negative coefficient in the objective function (ignoring
      // the non-pivotable dummy variables). If all coefficients are positive
      // we're done
      terms.escapingEach(function(v, c) {
        if (v.isPivotable && c < objectiveCoeff) {
          objectiveCoeff = c;
          entryVar = v;
          // Break on success
          return { brk: 1 };
        }
      }, this);

      if (objectiveCoeff >= -epsilon)
        return;

      c.trace && console.log("entryVar:", entryVar,
                             "objectiveCoeff:", objectiveCoeff);

      // choose which variable to move out of the basis
      // Only consider pivotable basic variables
      // (i.e. restricted, non-dummy variables)
      var minRatio = Number.MAX_VALUE;
      var columnVars = this.columns.get(entryVar);
      var r = 0;

      columnVars.each(function(v) {
        c.trace && c.traceprint("Checking " + v);
        if (v.isPivotable) {
          var expr = this.rows.get(v);
          var coeff = expr.coefficientFor(entryVar);
          c.trace && c.traceprint("pivotable, coeff = " + coeff);
          // only consider negative coefficients
          if (coeff < 0) {
            r = -expr.constant / coeff;
            // Bland's anti-cycling rule:
            // if multiple variables are about the same,
            // always pick the lowest via some total
            // ordering -- I use their addresses in memory
            //    if (r < minRatio ||
            //              (c.approx(r, minRatio) &&
            //               v.get_pclv() < exitVar.get_pclv()))
            if (r < minRatio ||
                (c.approx(r, minRatio) &&
                 v.hashCode < exitVar.hashCode)
            ) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);

      // If minRatio is still nil at this point, it means that the
      // objective function is unbounded, i.e. it can become
      // arbitrarily negative.  This should never happen in this
      // application.
      if (minRatio == Number.MAX_VALUE) {
        throw new c.InternalError("Objective function is unbounded in optimize");
      }

      // console.time("SimplexSolver::optimize pivot()");
      this.pivot(entryVar, exitVar);
      // console.timeEnd("SimplexSolver::optimize pivot()");

      c.trace && c.traceprint(this.toString());
    }
  },

  // Do a Pivot.  Move entryVar into the basis (i.e. make it a basic variable),
  // and move exitVar out of the basis (i.e., make it a parametric variable)
  pivot: function(entryVar /*c.AbstractVariable*/, exitVar /*c.AbstractVariable*/) {
    c.trace && console.log("pivot: ", entryVar, exitVar);
    var time = false;

    time && console.time(" SimplexSolver::pivot");

    // the entryVar might be non-pivotable if we're doing a RemoveConstraint --
    // otherwise it should be a pivotable variable -- enforced at call sites,
    // hopefully
    if (entryVar == null) {
      console.warn("pivot: entryVar == null");
    }

    if (exitVar == null) {
      console.warn("pivot: exitVar == null");
    }
    // console.log("SimplexSolver::pivot(", entryVar, exitVar, ")")

    // expr is the Expression for the exit variable (about to leave the basis) --
    // so that the old tableau includes the equation:
    //   exitVar = expr
    time && console.time("  removeRow");
    var expr = this.removeRow(exitVar);
    time && console.timeEnd("  removeRow");

    // Compute an Expression for the entry variable.  Since expr has
    // been deleted from the tableau we can destructively modify it to
    // build this Expression.
    time && console.time("  changeSubject");
    expr.changeSubject(exitVar, entryVar);
    time && console.timeEnd("  changeSubject");

    time && console.time("  substituteOut");
    this.substituteOut(entryVar, expr);
    time && console.timeEnd("  substituteOut");
    /*
    if (entryVar.isExternal) {
      // entry var is no longer a parametric variable since we're moving
      // it into the basis
      console.log("entryVar is external!");
      this._externalParametricVars.delete(entryVar);
    }
    */

    time && console.time("  addRow")
    this.addRow(entryVar, expr);
    time && console.timeEnd("  addRow")

    time && console.timeEnd(" SimplexSolver::pivot");
  },

  // Each of the non-required stays will be represented by an equation
  // of the form
  //     v = c + eplus - eminus
  // where v is the variable with the stay, c is the previous value of
  // v, and eplus and eminus are slack variables that hold the error
  // in satisfying the stay constraint.  We are about to change
  // something, and we want to fix the constants in the equations
  // representing the stays.  If both eplus and eminus are nonbasic
  // they have value 0 in the current solution, meaning the previous
  // stay was exactly satisfied.  In this case nothing needs to be
  // changed.  Otherwise one of them is basic, and the other must
  // occur only in the Expression for that basic error variable.
  // Reset the Constant in this Expression to 0.
  _resetStayConstants: function() {
    c.trace && console.log("_resetStayConstants");
    var spev = this._stayPlusErrorVars;
    var l = spev.length;
    for (var i = 0; i < l; i++) {
      var expr = this.rows.get(spev[i]);
      if (expr === null) {
        expr = this.rows.get(this._stayMinusErrorVars[i]);
      }
      if (expr != null) {
        expr.constant = 0;
      }
    }
  },

  _setExternalVariables: function() {
    c.trace && c.fnenterprint("_setExternalVariables:");
    c.trace && c.traceprint(this.toString());
    var changed = {};

    // console.log("this._externalParametricVars:", this._externalParametricVars);
    this._externalParametricVars.each(function(v) {
      if (this.rows.get(v) != null) {
        if (c.trace)
          console.log("Error: variable" + v + " in _externalParametricVars is basic");
      } else {
        v.value = 0;
        changed[v.name] = 0;
      }
    }, this);
    // console.log("this._externalRows:", this._externalRows);
    this._externalRows.each(function(v) {
      var expr = this.rows.get(v);
      if (v.value != expr.constant) {
        // console.log(v.toString(), v.value, expr.constant);
        v.value = expr.constant;
        changed[v.name] = expr.constant;
      }
      // c.trace && console.log("v == " + v);
      // c.trace && console.log("expr == " + expr);
    }, this);
    this._changed = changed;
    this._needsSolving = false;
    this._informCallbacks();
    this.onsolved();
  },

  onsolved: function() {
    // Lifecycle stub. Here for dirty, dirty monkey patching.
  },

  _informCallbacks: function() {
    if(!this._callbacks) return;

    var changed = this._changed;
    this._callbacks.forEach(function(fn) {
      fn(changed);
    });
  },

  _addCallback: function(fn) {
    var a = (this._callbacks || (this._callbacks = []));
    a[a.length] = fn;
  },

  insertErrorVar: function(cn /*c.Constraint*/, aVar /*c.AbstractVariable*/) {
    c.trace && c.fnenterprint("insertErrorVar:" + cn + ", " + aVar);
    var constraintSet = /* Set */this._errorVars.get(aVar);
    if (!constraintSet) {
      constraintSet = new c.HashSet();
      this._errorVars.set(cn, constraintSet);
    }
    constraintSet.add(aVar);
  },
});
})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/Timer.js", function(exports, require, module){
// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Timer = c.inherit({
  initialize: function() {
    this.isRunning = false;
    this._elapsedMs = 0;
  },

  start: function() {
    this.isRunning = true;
    this._startReading = new Date();
    return this;
  },

  stop: function() {
    this.isRunning = false;
    this._elapsedMs += (new Date()) - this._startReading;
    return this;
  },

  reset: function() {
    this.isRunning = false;
    this._elapsedMs = 0;
    return this;
  },

  elapsedTime : function() {
    if (!this.isRunning) {
      return this._elapsedMs / 1000;
    } else {
      return (this._elapsedMs + (new Date() - this._startReading)) / 1000;
    }
  },
});

})(this["c"]||module.parent.exports||{});

});
require.register("slightlyoff-cassowary.js/src/parser/parser.js", function(exports, require, module){
this.c.parser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "Statement": parse_Statement,
        "SourceCharacter": parse_SourceCharacter,
        "IdentifierStart": parse_IdentifierStart,
        "WhiteSpace": parse_WhiteSpace,
        "LineTerminator": parse_LineTerminator,
        "LineTerminatorSequence": parse_LineTerminatorSequence,
        "EOS": parse_EOS,
        "EOF": parse_EOF,
        "Comment": parse_Comment,
        "MultiLineComment": parse_MultiLineComment,
        "MultiLineCommentNoLineTerminator": parse_MultiLineCommentNoLineTerminator,
        "SingleLineComment": parse_SingleLineComment,
        "_": parse__,
        "__": parse___,
        "Literal": parse_Literal,
        "Integer": parse_Integer,
        "Real": parse_Real,
        "SignedInteger": parse_SignedInteger,
        "Identifier": parse_Identifier,
        "IdentifierName": parse_IdentifierName,
        "PrimaryExpression": parse_PrimaryExpression,
        "UnaryExpression": parse_UnaryExpression,
        "UnaryOperator": parse_UnaryOperator,
        "MultiplicativeExpression": parse_MultiplicativeExpression,
        "MultiplicativeOperator": parse_MultiplicativeOperator,
        "AdditiveExpression": parse_AdditiveExpression,
        "AdditiveOperator": parse_AdditiveOperator,
        "InequalityExpression": parse_InequalityExpression,
        "InequalityOperator": parse_InequalityOperator,
        "LinearExpression": parse_LinearExpression
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse___();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_Statement();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_Statement();
          }
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, statements) { return statements; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Statement() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_LinearExpression();
        if (result0 !== null) {
          result1 = parse_EOS();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, expression) { return expression; })(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SourceCharacter() {
        var result0;
        
        if (input.length > pos) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("any character");
          }
        }
        return result0;
      }
      
      function parse_IdentifierStart() {
        var result0;
        
        if (/^[a-zA-Z]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z]");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 36) {
            result0 = "$";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"$\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 95) {
              result0 = "_";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"_\"");
              }
            }
          }
        }
        return result0;
      }
      
      function parse_WhiteSpace() {
        var result0;
        
        reportFailures++;
        if (/^[\t\x0B\f \xA0\uFEFF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\t\\x0B\\f \\xA0\\uFEFF]");
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      function parse_LineTerminator() {
        var result0;
        
        if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\n\\r\\u2028\\u2029]");
          }
        }
        return result0;
      }
      
      function parse_LineTerminatorSequence() {
        var result0;
        
        reportFailures++;
        if (input.charCodeAt(pos) === 10) {
          result0 = "\n";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\n\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "\r\n") {
            result0 = "\r\n";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\r\\n\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 13) {
              result0 = "\r";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\r\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 8232) {
                result0 = "\u2028";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"\\u2028\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 8233) {
                  result0 = "\u2029";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"\\u2029\"");
                  }
                }
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("end of line");
        }
        return result0;
      }
      
      function parse_EOS() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = parse___();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 59) {
            result1 = ";";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\";\"");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          result0 = parse__();
          if (result0 !== null) {
            result1 = parse_LineTerminatorSequence();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            result0 = parse___();
            if (result0 !== null) {
              result1 = parse_EOF();
              if (result1 !== null) {
                result0 = [result0, result1];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_EOF() {
        var result0;
        var pos0;
        
        pos0 = pos;
        reportFailures++;
        if (input.length > pos) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("any character");
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Comment() {
        var result0;
        
        reportFailures++;
        result0 = parse_MultiLineComment();
        if (result0 === null) {
          result0 = parse_SingleLineComment();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comment");
        }
        return result0;
      }
      
      function parse_MultiLineComment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "/*") {
          result0 = "/*";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/*\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          if (input.substr(pos, 2) === "*/") {
            result2 = "*/";
            pos += 2;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\"*/\"");
            }
          }
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            result3 = parse_SourceCharacter();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              result3 = parse_SourceCharacter();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_MultiLineCommentNoLineTerminator() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "/*") {
          result0 = "/*";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"/*\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          if (input.substr(pos, 2) === "*/") {
            result2 = "*/";
            pos += 2;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\"*/\"");
            }
          }
          if (result2 === null) {
            result2 = parse_LineTerminator();
          }
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            result3 = parse_SourceCharacter();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            if (result2 === null) {
              result2 = parse_LineTerminator();
            }
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              result3 = parse_SourceCharacter();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            if (input.substr(pos, 2) === "*/") {
              result2 = "*/";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"*/\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SingleLineComment() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        if (input.substr(pos, 2) === "//") {
          result0 = "//";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"//\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          pos1 = pos;
          pos2 = pos;
          reportFailures++;
          result2 = parse_LineTerminator();
          reportFailures--;
          if (result2 === null) {
            result2 = "";
          } else {
            result2 = null;
            pos = pos2;
          }
          if (result2 !== null) {
            result3 = parse_SourceCharacter();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = pos1;
            }
          } else {
            result2 = null;
            pos = pos1;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos1 = pos;
            pos2 = pos;
            reportFailures++;
            result2 = parse_LineTerminator();
            reportFailures--;
            if (result2 === null) {
              result2 = "";
            } else {
              result2 = null;
              pos = pos2;
            }
            if (result2 !== null) {
              result3 = parse_SourceCharacter();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = pos1;
              }
            } else {
              result2 = null;
              pos = pos1;
            }
          }
          if (result1 !== null) {
            result2 = parse_LineTerminator();
            if (result2 === null) {
              result2 = parse_EOF();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse__() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_WhiteSpace();
        if (result1 === null) {
          result1 = parse_MultiLineCommentNoLineTerminator();
          if (result1 === null) {
            result1 = parse_SingleLineComment();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_WhiteSpace();
          if (result1 === null) {
            result1 = parse_MultiLineCommentNoLineTerminator();
            if (result1 === null) {
              result1 = parse_SingleLineComment();
            }
          }
        }
        return result0;
      }
      
      function parse___() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_WhiteSpace();
        if (result1 === null) {
          result1 = parse_LineTerminatorSequence();
          if (result1 === null) {
            result1 = parse_Comment();
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_WhiteSpace();
          if (result1 === null) {
            result1 = parse_LineTerminatorSequence();
            if (result1 === null) {
              result1 = parse_Comment();
            }
          }
        }
        return result0;
      }
      
      function parse_Literal() {
        var result0;
        var pos0;
        
        pos0 = pos;
        result0 = parse_Real();
        if (result0 === null) {
          result0 = parse_Integer();
        }
        if (result0 !== null) {
          result0 = (function(offset, val) {
            return {
              type: "NumericLiteral",
              value: val
            }
          })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Integer() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        if (/^[0-9]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[0-9]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, digits) {
            return parseInt(digits.join(""));
          })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Real() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_Integer();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 46) {
            result1 = ".";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_Integer();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, digits) {
            return parseFloat(digits.join(""));
          })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SignedInteger() {
        var result0, result1, result2;
        var pos0;
        
        pos0 = pos;
        if (/^[\-+]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\-+]");
          }
        }
        result0 = result0 !== null ? result0 : "";
        if (result0 !== null) {
          if (/^[0-9]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[0-9]");
            }
          }
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              if (/^[0-9]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9]");
                }
              }
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_Identifier() {
        var result0;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        result0 = parse_IdentifierName();
        if (result0 !== null) {
          result0 = (function(offset, name) { return name; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_IdentifierName() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        result0 = parse_IdentifierStart();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_IdentifierStart();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_IdentifierStart();
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, start, parts) {
              return start + parts.join("");
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_PrimaryExpression() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        result0 = parse_Identifier();
        if (result0 !== null) {
          result0 = (function(offset, name) { return { type: "Variable", name: name }; })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_Literal();
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            if (input.charCodeAt(pos) === 40) {
              result0 = "(";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"(\"");
              }
            }
            if (result0 !== null) {
              result1 = parse___();
              if (result1 !== null) {
                result2 = parse_LinearExpression();
                if (result2 !== null) {
                  result3 = parse___();
                  if (result3 !== null) {
                    if (input.charCodeAt(pos) === 41) {
                      result4 = ")";
                      pos++;
                    } else {
                      result4 = null;
                      if (reportFailures === 0) {
                        matchFailed("\")\"");
                      }
                    }
                    if (result4 !== null) {
                      result0 = [result0, result1, result2, result3, result4];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, expression) { return expression; })(pos0, result0[2]);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_UnaryExpression() {
        var result0, result1, result2;
        var pos0, pos1;
        
        result0 = parse_PrimaryExpression();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_UnaryOperator();
          if (result0 !== null) {
            result1 = parse___();
            if (result1 !== null) {
              result2 = parse_UnaryExpression();
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, operator, expression) {
                return {
                  type:       "UnaryExpression",
                  operator:   operator,
                  expression: expression
                };
              })(pos0, result0[0], result0[2]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_UnaryOperator() {
        var result0;
        
        if (input.charCodeAt(pos) === 43) {
          result0 = "+";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 33) {
              result0 = "!";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"!\"");
              }
            }
          }
        }
        return result0;
      }
      
      function parse_MultiplicativeExpression() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_UnaryExpression();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_MultiplicativeOperator();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_UnaryExpression();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_MultiplicativeOperator();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_UnaryExpression();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              var result = head;
              for (var i = 0; i < tail.length; i++) {
                result = {
                  type:     "MultiplicativeExpression",
                  operator: tail[i][1],
                  left:     result,
                  right:    tail[i][3]
                };
              }
              return result;
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_MultiplicativeOperator() {
        var result0;
        
        if (input.charCodeAt(pos) === 42) {
          result0 = "*";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"*\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 47) {
            result0 = "/";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"/\"");
            }
          }
        }
        return result0;
      }
      
      function parse_AdditiveExpression() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_MultiplicativeExpression();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_AdditiveOperator();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_MultiplicativeExpression();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_AdditiveOperator();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_MultiplicativeExpression();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              var result = head;
              for (var i = 0; i < tail.length; i++) {
                result = {
                  type:     "AdditiveExpression",
                  operator: tail[i][1],
                  left:     result,
                  right:    tail[i][3]
                };
              }
              return result;
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_AdditiveOperator() {
        var result0;
        
        if (input.charCodeAt(pos) === 43) {
          result0 = "+";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"+\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 45) {
            result0 = "-";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"-\"");
            }
          }
        }
        return result0;
      }
      
      function parse_InequalityExpression() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_AdditiveExpression();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse___();
          if (result2 !== null) {
            result3 = parse_InequalityOperator();
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_AdditiveExpression();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_InequalityOperator();
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_AdditiveExpression();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              var result = head;
              for (var i = 0; i < tail.length; i++) {
                result = {
                  type:     "Inequality",
                  operator: tail[i][1],
                  left:     result,
                  right:    tail[i][3]
                };
              }
              return result;
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_InequalityOperator() {
        var result0;
        
        if (input.substr(pos, 2) === "<=") {
          result0 = "<=";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"<=\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === ">=") {
            result0 = ">=";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\">=\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 60) {
              result0 = "<";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"<\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 62) {
                result0 = ">";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\">\"");
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_LinearExpression() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_InequalityExpression();
        if (result0 !== null) {
          result1 = [];
          pos2 = pos;
          result2 = parse___();
          if (result2 !== null) {
            if (input.substr(pos, 2) === "==") {
              result3 = "==";
              pos += 2;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("\"==\"");
              }
            }
            if (result3 !== null) {
              result4 = parse___();
              if (result4 !== null) {
                result5 = parse_InequalityExpression();
                if (result5 !== null) {
                  result2 = [result2, result3, result4, result5];
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          } else {
            result2 = null;
            pos = pos2;
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = pos;
            result2 = parse___();
            if (result2 !== null) {
              if (input.substr(pos, 2) === "==") {
                result3 = "==";
                pos += 2;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"==\"");
                }
              }
              if (result3 !== null) {
                result4 = parse___();
                if (result4 !== null) {
                  result5 = parse_InequalityExpression();
                  if (result5 !== null) {
                    result2 = [result2, result3, result4, result5];
                  } else {
                    result2 = null;
                    pos = pos2;
                  }
                } else {
                  result2 = null;
                  pos = pos2;
                }
              } else {
                result2 = null;
                pos = pos2;
              }
            } else {
              result2 = null;
              pos = pos2;
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, head, tail) {
              var result = head;
              for (var i = 0; i < tail.length; i++) {
                result = {
                  type:     "Equality",
                  operator: tail[i][1],
                  left:     result,
                  right:    tail[i][3]
                };
              }
              return result;
            })(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();

});
require.register("slightlyoff-cassowary.js/src/parser/api.js", function(exports, require, module){
// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

(function(c){
"use strict";

var solver = new c.SimplexSolver();
var vars = {};
var exprs = {};

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var _c = function(expr) {
  if (exprs[expr]) {
    return exprs[expr];
  }
  switch(expr.type) {
    case "Inequality":
      var op = (expr.operator == "<=") ? c.LEQ : c.GEQ;
      var i = new c.Inequality(_c(expr.left), op, _c(expr.right), weak);
      solver.addConstraint(i);
      return i;
    case "Equality":
      var i = new c.Equation(_c(expr.left), _c(expr.right), weak);
      solver.addConstraint(i);
      return i;
    case "MultiplicativeExpression":
      var i = c.times(_c(expr.left), _c(expr.right));
      solver.addConstraint(i);
      return i;
    case "AdditiveExpression":
      if (expr.operator == "+") {
        return c.plus(_c(expr.left), _c(expr.right));
      } else {
        return c.minus(_c(expr.left), _c(expr.right));
      }
    case "NumericLiteral":
      return new c.Expression(expr.value);
    case "Variable":
      // console.log(expr);
      if(!vars[expr.name]) {
        vars[expr.name] = new c.Variable({ name: expr.name });
      }
      return vars[expr.name];
    case "UnaryExpression":
      console.log("UnaryExpression...WTF?");
      break;
  }
};

var compile = function(expressions) {
  return expressions.map(_c);
};

// Global API entrypoint
c._api = function() {
  var args = Array.prototype.slice.call(arguments);
  if (args.length == 1) {
    if(typeof args[0] == "string") {
      // Parse and execute it
      var r = c.parser.parse(args[0]);
      return compile(r);
    } else if(typeof args[0] == "function") {
      solver._addCallback(args[0]);
    }
  }
};

})(this["c"]||module.parent.exports||{});

});
require.register("gss/lib/GSS-with-compiler.js", function(exports, require, module){
var Compiler;

require("./GSS.js");

Compiler = GSS.Compiler = require("gss-compiler");

GSS.compile = function(rules) {
  var ast, e;
  ast = {};
  if (typeof rules === "string") {
    try {
      ast = Compiler.compile(rules);
    } catch (_error) {
      e = _error;
      console.warn("compiler error", e);
      ast = {};
    }
  } else if (typeof rules === "object") {
    ast = rules;
  } else {
    throw new Error("Unrecognized GSS rule format. Should be string or AST");
  }
  return ast;
};

GSS.Engine.prototype['compile'] = function(source) {
  return this.run(GSS.compile(source));
};

GSS.Getter.prototype['readAST:text/gss'] = function(node) {
  var ast, source;
  source = node.textContent.trim();
  if (source.length === 0) {
    return {};
  }
  ast = GSS.compile(source);
  return ast;
};

});
require.register("gss/lib/GSS.js", function(exports, require, module){
var GSS, LOG_PASS, TIME, TIME_END, key, val, _ref;

require("customevent-polyfill");

require("cassowary");

if (window.GSS) {
  throw new Error("Only one GSS object per window");
}

GSS = window.GSS = function(o) {
  var engine;
  if (o === document || o === window) {
    return GSS.engines.root;
  }
  if (o.tagName) {
    engine = GSS.get.engine(o);
    if (engine) {
      return engine;
    }
    return new GSS.Engine({
      scope: o
    });
  } else if (o !== null && typeof o === 'object') {
    if (o.scope) {
      engine = GSS.get.engine(o.scope);
      if (engine) {
        return engine;
      }
    }
    return new GSS.Engine(o);
  } else {
    throw new Error("");
  }
};

GSS.config = {
  defaultStrength: 'weak',
  defaultWeight: 0,
  verticalScroll: true,
  horizontalScroll: false,
  resizeDebounce: 32,
  defaultMatrixType: 'mat4',
  observe: true,
  observerOptions: {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  },
  debug: false,
  warn: true,
  perf: false,
  fractionalPixels: true,
  readyClass: true,
  processBeforeSet: null,
  maxDisplayRecursionDepth: 30,
  useWorker: !!window.Worker,
  worker: '../dist/worker.js',
  useOffsetParent: true
};

if (typeof GSS_CONFIG !== "undefined" && GSS_CONFIG !== null) {
  for (key in GSS_CONFIG) {
    val = GSS_CONFIG[key];
    GSS.config[key] = val;
  }
}

GSS.deblog = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, arguments);
  }
};

GSS.warn = function() {};

GSS.error = function(message) {
  GSS.trigger('error', message);
  throw new Error(message);
};

GSS.warn = function(message) {
  GSS.trigger('warn', message);
  if (GSS.config.warn) {
    return typeof console.warn === "function" ? console.warn.apply(console, arguments) : void 0;
  }
};

LOG_PASS = function(pass, bg) {
  if (bg == null) {
    bg = "green";
  }
  return GSS.deblog("%c" + pass, "color:white; padding:2px; font-size:14px; background:" + bg + ";");
};

TIME = function() {
  if (GSS.config.perf) {
    return console.time.apply(console, arguments);
  }
};

TIME_END = function() {
  if (GSS.config.perf) {
    return console.timeEnd.apply(console, arguments);
  }
};

GSS._ = require("./_.js");

GSS.glMatrix = require('../vendor/gl-matrix');

GSS.EventTrigger = require("./EventTrigger.js");

GSS.Getter = require("./dom/Getter.js");

GSS.Commander = require("./Commander.js");

GSS.Query = require("./dom/Query.js");

GSS.Thread = require("./Thread.js");

GSS.Engine = require("./Engine.js");

GSS.View = require("./dom/View.js");

GSS.Rule = require("./gssom/Rule.js");

require("./gssom/StyleSheet.js");

_ref = require("./dom/IdMixin.js");
for (key in _ref) {
  val = _ref[key];
  if (GSS[key]) {
    throw new Error("IdMixin key clash: " + key);
  }
  GSS[key] = val;
}

GSS.EventTrigger.make(GSS);

GSS.get = new GSS.Getter();

GSS.observer = require("./dom/Observer.js");

GSS.boot = function() {
  var html;
  GSS.body = document.body || GSS.getElementsByTagName('body')[0];
  GSS.html = html = GSS.body.parentNode;
  GSS({
    scope: GSS.Getter.getRootScope(),
    is_root: true
  });
  document.dispatchEvent(new CustomEvent('GSS', {
    detail: GSS,
    bubbles: false,
    cancelable: false
  }));
  GSS.setupObserver();
  GSS.update();
  GSS.observe();
  return GSS.trigger("afterLoaded");
};

GSS.update = function() {
  GSS.styleSheets.find();
  GSS.updateIfNeeded();
  return GSS.layoutIfNeeded();
};

GSS.needsUpdate = false;

GSS.setNeedsUpdate = function(bool) {
  if (bool) {
    if (!GSS.needsUpdate) {
      GSS._.defer(GSS.updateIfNeeded);
    }
    return GSS.needsUpdate = true;
  } else {
    return GSS.needsUpdate = false;
  }
};

GSS.updateIfNeeded = function() {
  if (GSS.needsUpdate) {
    LOG_PASS("Update Pass", "orange");
    TIME("update pass");
    GSS.engines.root.updateIfNeeded();
    GSS.setNeedsUpdate(false);
    return TIME_END("update pass");
  }
};

GSS.needsLayout = false;

GSS.setNeedsLayout = function(bool) {
  if (bool) {
    if (!GSS.needsLayout) {
      GSS._.defer(GSS.layoutIfNeeded);
    }
    return GSS.needsLayout = true;
  } else {
    return GSS.needsLayout = false;
  }
};

GSS.layoutIfNeeded = function() {
  if (GSS.needsLayout) {
    LOG_PASS("Layout Pass", "green");
    TIME("layout pass");
    GSS.engines.root.layoutIfNeeded();
    GSS.setNeedsLayout(false);
    return TIME_END("layout pass");
  }
};

/*
GSS.needsDisplay = false

GSS.setNeedsDisplay = (bool) ->
  if bool
    if !GSS.needsDisplay
      GSS._.defer GSS.displayIfNeeded
    GSS.needsDisplay = true        
  else
    GSS.needsDisplay = false

GSS.displayIfNeeded = () ->
  if GSS.needsDisplay
    LOG_PASS "Display Pass", "violet"
    TIME "display pass"
    GSS.engines.root.displayIfNeeded()
    GSS.setNeedsDisplay false
    TIME_END "display pass"
    TIME_END "RENDER"
*/


Object.defineProperty(GSS, 'vars', {
  get: function() {
    return GSS.engines.root.vars;
  }
});

GSS.printCss = function() {
  return GSS.get.view(GSS.engines.root.scope).printCssTree();
};

});
require.register("gss/lib/_.js", function(exports, require, module){
var firstSupportedStylePrefix, getTime, nativeTrim, nativeTrimLeft, nativeTrimRight, tempDiv, _,
  __slice = [].slice;

getTime = Date.now || function() {
  return new Date().getTime();
};

tempDiv = document.createElement("div");

firstSupportedStylePrefix = function(prefixedPropertyNames) {
  var name, _i, _len;
  for (_i = 0, _len = prefixedPropertyNames.length; _i < _len; _i++) {
    name = prefixedPropertyNames[_i];
    if (typeof tempDiv.style[name] !== 'undefined') {
      return name;
    }
  }
  return null;
};

nativeTrim = String.prototype.trim;

nativeTrimRight = String.prototype.trimRight;

nativeTrimLeft = String.prototype.trimLeft;

_ = {
  transformPrefix: firstSupportedStylePrefix(["transform", "WebkitTransform", "MozTransform", "OTransform", "msTransform"]),
  boxSizingPrefix: firstSupportedStylePrefix(["boxSizing", "WebkitBoxSizing", "MozBoxSizing", "OBoxSizing", "msBoxSizing"]),
  defer: function(func) {
    return setTimeout(func, 1);
  },
  debounce: function(func, wait, immediate) {
    var args, context, result, timeout, timestamp;
    timeout = void 0;
    args = void 0;
    context = void 0;
    timestamp = void 0;
    result = void 0;
    return function() {
      var callNow, later;
      context = this;
      args = __slice.call(arguments);
      timestamp = getTime();
      later = function() {
        var last;
        last = getTime() - timestamp;
        if (last < wait) {
          return timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            return result = func.apply(context, args);
          }
        }
      };
      callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
      }
      return result;
    };
  },
  cloneDeep: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  cloneObject: function(obj) {
    var i, target;
    target = {};
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        target[i] = obj[i];
      }
    }
    return target;
  },
  filterVarsForDisplay: function(vars) {
    var idx, k, key, keysToKill, obj, val, _i, _len;
    obj = {};
    keysToKill = [];
    for (key in vars) {
      val = vars[key];
      idx = key.indexOf("intrinsic-");
      if (idx !== -1) {
        keysToKill.push(key.replace("intrinsic-", ""));
      } else {
        obj[key] = val;
      }
    }
    for (_i = 0, _len = keysToKill.length; _i < _len; _i++) {
      k = keysToKill[_i];
      delete obj[k];
    }
    return obj;
  },
  varsByViewId: function(vars) {
    var gid, key, prop, val, varsById;
    varsById = {};
    for (key in vars) {
      val = vars[key];
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        if (!varsById[gid]) {
          varsById[gid] = {};
        }
        prop = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        varsById[gid][prop] = val;
      }
    }
    return varsById;
  },
  mat4ToCSS: function(a) {
    return 'matrix3d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
  },
  mat2dToCSS: function(a) {
    return 'matrix(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ')';
  },
  camelize: function(s) {
    var result;
    result = s.replace(/[-_\s]+(.)?/g, function(match, c) {
      if (c) {
        return c.toUpperCase();
      } else {
        return "";
      }
    });
    return result;
  },
  dasherize: function(str) {
    return this.trim(str).replace(/([A-Z])/g, "-$1").replace(/[-_\s]+/g, "-").toLowerCase();
  },
  trim: function(str, characters) {
    if (str == null) {
      return "";
    }
    if (!characters && nativeTrim) {
      return nativeTrim.call(str);
    }
    characters = defaultToWhiteSpace(characters);
    return String(str).replace(new RegExp("^" + characters + "+|" + characters + "+$", "g"), "");
  }
};

module.exports = _;

});
require.register("gss/lib/EventTrigger.js", function(exports, require, module){
var EventTrigger;

EventTrigger = (function() {
  function EventTrigger() {
    this._listenersByType = {};
    this;
  }

  EventTrigger.prototype._getListeners = function(type) {
    var byType;
    if (this._listenersByType[type]) {
      byType = this._listenersByType[type];
    } else {
      byType = [];
      this._listenersByType[type] = byType;
    }
    return byType;
  };

  EventTrigger.prototype.on = function(type, listener) {
    var listeners;
    listeners = this._getListeners(type);
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
    return this;
  };

  EventTrigger.prototype.once = function(type, listener) {
    var that, wrap;
    wrap = null;
    that = this;
    wrap = function(o) {
      that.off(type, wrap);
      return listener.call(that, o);
    };
    this.on(type, wrap);
    return this;
  };

  EventTrigger.prototype.off = function(type, listener) {
    var i, listeners;
    listeners = this._getListeners(type);
    i = listeners.indexOf(listener);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
    return this;
  };

  EventTrigger.prototype.offAll = function(target) {
    var i, listeners, type, _ref;
    if (typeof target === "string") {
      if (target) {
        this._listenersByType[target] = [];
      }
    } else if (typeof target === "function") {
      _ref = this._listenersByType;
      for (type in _ref) {
        listeners = _ref[type];
        i = listeners.indexOf(target);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
    } else {
      this._listenersByType = {};
    }
    return this;
  };

  EventTrigger.prototype.trigger = function(type, o) {
    var listener, _i, _len, _ref;
    _ref = this._getListeners(type);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      listener = _ref[_i];
      if (listener != null) {
        listener.call(this, o);
      }
    }
    return this;
  };

  return EventTrigger;

})();

EventTrigger.make = function(obj) {
  var key, val, _ref;
  if (obj == null) {
    obj = {};
  }
  EventTrigger.prototype.constructor.call(obj);
  _ref = EventTrigger.prototype;
  for (key in _ref) {
    val = _ref[key];
    if (key === "constructor") {
      val.call(obj);
    } else {
      obj[key] = val;
    }
  }
  return obj;
};

module.exports = EventTrigger;

});
require.register("gss/lib/dom/Query.js", function(exports, require, module){
/*

Encapsulates Dom Queries used in GSS rules

JSPerf debunking *big* perf gain from liveNodeLists: 

- http://jsperf.com/getelementsbyclassname-vs-queryselectorall/70
- http://jsperf.com/queryselectorall-vs-getelementsbytagname/77
*/

var LOG, Query, arrayAddsRemoves,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

arrayAddsRemoves = function(old, neu) {
  var adds, n, o, removes, _i, _j, _len, _len1;
  adds = [];
  removes = [];
  for (_i = 0, _len = neu.length; _i < _len; _i++) {
    n = neu[_i];
    if (old.indexOf(n) === -1) {
      adds.push(n);
    }
  }
  for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
    o = old[_j];
    if (neu.indexOf(o) === -1) {
      removes.push(o);
    }
  }
  return {
    adds: adds,
    removes: removes
  };
};

LOG = function() {
  return GSS.deblog.apply(GSS, ["Query"].concat(__slice.call(arguments)));
};

Query = (function(_super) {
  __extends(Query, _super);

  Query.prototype.isQuery = true;

  function Query(o) {
    if (o == null) {
      o = {};
    }
    Query.__super__.constructor.apply(this, arguments);
    this.selector = o.selector || (function() {
      throw new Error("GssQuery must have a selector");
    })();
    this.createNodeList = o.createNodeList || (function() {
      throw new Error("GssQuery must implement createNodeList()");
    })();
    this.isMulti = o.isMulti || false;
    this.isLive = o.isLive || false;
    this.ids = o.ids || [];
    this.lastAddedIds = [];
    this.lastRemovedIds = [];
    LOG("constructor() @", this);
    this;
  }

  Query.prototype._updated_once = false;

  Query.prototype.changedLastUpdate = false;

  Query.prototype.update = function() {
    var adds, el, id, newIds, oldIds, removes, _i, _len, _ref, _ref1;
    LOG("update() @", this);
    if (this.is_destroyed) {
      throw new Error("Can't update destroyed query: " + this.selector);
    }
    this.changedLastUpdate = false;
    if (!this.isLive || !this._updated_once) {
      this.nodeList = this.createNodeList();
      this._updated_once = true;
    }
    oldIds = this.ids;
    newIds = [];
    _ref = this.nodeList;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      id = GSS.setupId(el);
      if (id) {
        newIds.push(id);
      }
    }
    _ref1 = arrayAddsRemoves(oldIds, newIds), adds = _ref1.adds, removes = _ref1.removes;
    if (adds.length > 0) {
      this.changedLastUpdate = true;
    }
    this.lastAddedIds = adds;
    if (removes.length > 0) {
      this.changedLastUpdate = true;
    }
    this.lastRemovedIds = removes;
    this.ids = newIds;
    if (this.changedLastUpdate) {
      this.trigger('afterChange');
    }
    return this;
  };

  Query.prototype.forEach = function(callback) {
    var el, _i, _len, _ref, _results;
    _ref = this.nodeList;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      _results.push(callback.call(this, el));
    }
    return _results;
  };

  Query.prototype.first = function() {
    return this.nodeList[0];
  };

  Query.prototype.last = function() {
    return this.nodeList[this.nodeList.length - 1];
  };

  Query.prototype.next = function(el) {
    return this.nodeList[this.indexOf(el) + 1];
  };

  Query.prototype.prev = function(el) {
    return this.nodeList[this.indexOf(el) - 1];
  };

  Query.prototype.indexOf = function(el) {
    return Array.prototype.indexOf.call(this.nodeList, el);
  };

  Query.prototype.is_destroyed = false;

  Query.prototype.destroy = function() {
    this.offAll();
    this.is_destroyed = true;
    this.ids = null;
    this.lastAddedIds = null;
    this.lastRemovedIds = null;
    this.createNodeList = null;
    this.nodeList = null;
    return this.changedLastUpdate = null;
  };

  return Query;

})(GSS.EventTrigger);

Query.Set = (function(_super) {
  __extends(Set, _super);

  function Set() {
    Set.__super__.constructor.apply(this, arguments);
    this.bySelector = {};
    return this;
  }

  Set.prototype.clean = function() {
    var query, selector, _ref;
    _ref = this.bySelector;
    for (selector in _ref) {
      query = _ref[selector];
      query.destroy();
      delete this.bySelector[selector];
    }
    return this.bySelector = {};
  };

  Set.prototype.destroy = function() {
    var query, selector, _ref;
    _ref = this.bySelector;
    for (selector in _ref) {
      query = _ref[selector];
      query.destroy();
      this.bySelector[selector] = null;
    }
    this.offAll();
    return this.bySelector = null;
  };

  Set.prototype.add = function(o) {
    var query, selector;
    selector = o.selector;
    query = this.bySelector[selector];
    if (!query) {
      query = new GSS.Query(o);
      query.update();
      this.bySelector[selector] = query;
    }
    return query;
  };

  Set.prototype.remove = function(o) {
    var query, selector;
    selector = o.selector;
    query = this.bySelector[selector];
    if (query) {
      query.destroy();
      delete this.bySelector[selector];
    }
    return query;
  };

  Set.prototype.update = function() {
    var el, globalRemoves, o, query, removedIds, removes, rid, selector, selectorsWithAdds, trigger, _i, _len, _ref;
    selectorsWithAdds = [];
    removes = [];
    globalRemoves = [];
    trigger = false;
    _ref = this.bySelector;
    for (selector in _ref) {
      query = _ref[selector];
      query.update();
      if (query.changedLastUpdate) {
        if (query.lastAddedIds.length > 0) {
          trigger = true;
          selectorsWithAdds.push(selector);
        }
        if (query.lastRemovedIds.length > 0) {
          trigger = true;
          removedIds = query.lastRemovedIds;
          for (_i = 0, _len = removedIds.length; _i < _len; _i++) {
            rid = removedIds[_i];
            if (globalRemoves.indexOf(rid) === -1) {
              el = GSS.getById(rid);
              if (document.documentElement.contains(el)) {
                globalRemoves.push(rid);
                removes.push(selector + "$" + rid);
              } else {
                removes.push("$" + rid);
              }
            }
          }
        }
      }
    }
    GSS._ids_killed(globalRemoves);
    if (!trigger) {
      return trigger;
    }
    if (trigger) {
      o = {
        removes: removes,
        selectorsWithAdds: selectorsWithAdds
      };
      this.trigger('update', o);
      return o;
    }
  };

  return Set;

})(GSS.EventTrigger);

module.exports = Query;

});
require.register("gss/lib/dom/View.js", function(exports, require, module){
var View, transformPrefix,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

transformPrefix = GSS._.transformPrefix;

View = (function() {
  function View() {
    this.printCssTree = __bind(this.printCssTree, this);
    this.recycle = __bind(this.recycle, this);
    this.attach = __bind(this.attach, this);
    this.values = {};
    this.is_positioned = false;
    this.el = null;
    this.id = null;
    this.parentOffsets = null;
    this.style = null;
    this.Matrix = null;
    this.matrixType = null;
    this.virtuals = null;
    this;
  }

  View.prototype.attach = function(el, id) {
    this.el = el;
    this.id = id;
    if (!this.el) {
      throw new Error("View needs el");
    }
    if (!this.id) {
      throw new Error("View needs id");
    }
    View.byId[this.id] = this;
    this.is_positioned = false;
    this.el.gssView = this;
    GSS.trigger('view:attach', this);
    if (!this.matrixType) {
      this.matrixType = GSS.config.defaultMatrixType;
    }
    this.Matrix = GSS.glMatrix[this.matrixType] || (function() {
      throw new Error("View matrixType not found: " + this.matrixType);
    }).call(this);
    if (!this.matrix) {
      this.matrix = this.Matrix.create();
    }
    return this;
  };

  View.prototype.recycle = function() {
    GSS.trigger('view:detach', this);
    this.is_positioned = false;
    this.el = null;
    delete View.byId[this.id];
    this.id = null;
    this.parentOffsets = null;
    this.style = null;
    this.Matrix.identity(this.matrix);
    this.matrixType = null;
    this.virtuals = null;
    this.values = {};
    return View.recycled.push(this);
  };

  View.prototype.updateParentOffsets = function() {
    return this.parentOffsets = this.getParentOffsets();
  };

  View.prototype.getParentOffsets = function() {
    var box;
    box = this.el.getBoundingClientRect();
    return {
      y: box.top + (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
      x: box.left + (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0)
    };
  };

  View.prototype.getParentOffsets__ = function() {
    var el, offsets;
    el = this.el;
    /*
    if !GSS.config.useOffsetParent 
      return { 
        x:0
        y:0
      }
    */

    offsets = {
      x: 0,
      y: 0
    };
    if (!el.offsetParent) {
      return offsets;
    }
    el = el.offsetParent;
    while (true) {
      offsets.x += el.offsetLeft;
      offsets.y += el.offsetTop;
      if (!el.offsetParent) {
        break;
      }
      el = el.offsetParent;
    }
    return offsets;
  };

  View.prototype.needsDisplay = false;

  View.prototype.display = function(offsets) {
    var key, o, prop, transformPropUnit, unit, val, xLocal, yLocal, _ref, _ref1;
    if (!this.values) {
      return;
    }
    o = {};
    _ref = this.values;
    for (key in _ref) {
      val = _ref[key];
      o[key] = val;
    }
    if ((o.x != null) || (o.y != null)) {
      if (this.parentOffsets) {
        offsets.x += this.parentOffsets.x;
        offsets.y += this.parentOffsets.y;
      }
      if (o.x != null) {
        xLocal = o.x - offsets.x;
        delete o.x;
      } else {
        xLocal = 0;
      }
      if (o.y != null) {
        yLocal = o.y - offsets.y;
        delete o.y;
      } else {
        yLocal = 0;
      }
      if (!GSS.config.fractionalPixels) {
        xLocal = Math.round(xLocal);
        yLocal = Math.round(yLocal);
      }
      this.values.xLocal = xLocal;
      this.values.yLocal = yLocal;
      this._positionMatrix(xLocal, yLocal);
    }
    transformPropUnit = {
      'rotate': 'deg',
      'rotate-x': 'deg',
      'rotate-y': 'deg',
      'rotate-z': 'deg',
      'scale': '',
      'scale-x': '',
      'scale-y': '',
      'scale-z': '',
      'translate': 'px',
      'translate-x': 'px',
      'translate-y': 'px',
      'translate-z': 'px',
      'skew-x': 'deg',
      'skew-y': 'deg',
      'perspective': 'px'
    };
    for (prop in transformPropUnit) {
      unit = transformPropUnit[prop];
      val = o[prop];
      if (val != null) {
        if (!this.style[transformPrefix]) {
          this.style[transformPrefix] = '';
        }
        this.style[transformPrefix] += " " + (GSS._.camelize(prop)) + "(" + val + unit + ")";
        delete o[prop];
      }
    }
    if (o['z-index'] != null) {
      this.style['zIndex'] = o['z-index'];
      delete o['z-index'];
    }
    if (o['opacity'] != null) {
      this.style['opacity'] = o['opacity'];
      delete o['opacity'];
    }
    /*   
    if o['line-height']?
      @style['line-height'] = o['line-height']
      delete o['line-height']
    */

    if (!GSS.config.fractionalPixels) {
      if (o.width != null) {
        o.width = Math.round(o.width);
      }
      if (o.height != null) {
        o.height = Math.round(o.height);
      }
    }
    for (key in o) {
      val = o[key];
      key = GSS._.camelize(key);
      this.style[key] = val + "px";
    }
    _ref1 = this.style;
    for (key in _ref1) {
      val = _ref1[key];
      this.el.style[key] = val;
    }
    return this;
  };

  /*
  _positionTranslate: (xLocal, yLocal) ->
    @style[transformPrefix] += " translateX(#{@xLocal}px)"
    @style[transformPrefix] += " translateY(#{@yLocal}px)"
  */


  View.prototype.positionIfNeeded = function() {
    if (!this.is_positioned) {
      this.style.position = 'absolute';
      this.style.margin = '0px';
      this.style.top = '0px';
      this.style.left = '0px';
    }
    return this.is_positioned = true;
  };

  View.prototype._positionMatrix = function(xLocal, yLocal) {
    this.Matrix.translate(this.matrix, this.matrix, [xLocal, yLocal, 0]);
    return this.style[transformPrefix] = GSS._[this.matrixType + "ToCSS"](this.matrix);
  };

  View.prototype.printCss = function() {
    var css, found, key, val, _ref;
    css = "";
    if (this.is_positioned) {
      css += 'position:absolute;';
      css += 'margin:0px;';
      css += 'top:0px;';
      css += 'left:0px;';
    }
    found = false;
    _ref = this.style;
    for (key in _ref) {
      val = _ref[key];
      found = true;
      css += "" + (GSS._.dasherize(key)) + ":" + val + ";";
    }
    if (!found) {
      return "";
    }
    return ("#" + this.id + "{") + css + "}";
  };

  View.prototype.printCssTree = function(el, recurseLevel) {
    var child, children, css, view, _i, _len;
    if (recurseLevel == null) {
      recurseLevel = 0;
    }
    if (!el) {
      el = this.el;
      css = this.printCss();
    } else {
      css = "";
    }
    if (recurseLevel > GSS.config.maxDisplayRecursionDepth) {
      return "";
    }
    children = el.children;
    if (!children) {
      return "";
    }
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      view = GSS.get.view(child);
      if (view) {
        css += view.printCssTree();
      } else {
        css += this.printCssTree(child, recurseLevel + 1);
      }
    }
    return css;
  };

  View.prototype.displayIfNeeded = function(offsets, pass_to_children) {
    if (offsets == null) {
      offsets = {
        x: 0,
        y: 0
      };
    }
    if (pass_to_children == null) {
      pass_to_children = true;
    }
    if (this.needsDisplay) {
      this.display(offsets);
      this.setNeedsDisplay(false);
    }
    offsets = {
      x: 0,
      y: 0
    };
    if (this.values.x) {
      offsets.x += this.values.x;
    }
    if (this.values.y) {
      offsets.y += this.values.y;
    }
    if (pass_to_children) {
      return this.displayChildrenIfNeeded(offsets);
    }
  };

  View.prototype.setNeedsDisplay = function(bool) {
    if (bool) {
      return this.needsDisplay = true;
    } else {
      return this.needsDisplay = false;
    }
  };

  View.prototype.displayChildrenIfNeeded = function(offsets) {
    return this._displayChildrenIfNeeded(this.el, offsets, 0);
  };

  View.prototype._displayChildrenIfNeeded = function(el, offsets, recurseLevel) {
    var child, children, view, _i, _len, _results;
    if (recurseLevel <= GSS.config.maxDisplayRecursionDepth) {
      children = el.children;
      if (!children) {
        return null;
      }
      _results = [];
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        view = GSS.get.view(child);
        if (view) {
          _results.push(view.displayIfNeeded(offsets));
        } else {
          _results.push(this._displayChildrenIfNeeded(child, offsets, recurseLevel + 1));
        }
      }
      return _results;
    }
  };

  View.prototype.updateValues = function(o) {
    this.values = o;
    this.style = {};
    this.Matrix.identity(this.matrix);
    if (this.el.getAttribute('gss-parent-offsets') != null) {
      this.updateParentOffsets();
    }
    if ((o.x != null) || (o.y != null)) {
      this.positionIfNeeded();
    }
    this.setNeedsDisplay(true);
    return this;
  };

  View.prototype.getParentView = function() {
    var el, gid;
    el = this.el.parentElement;
    while (true) {
      gid = el._gss_id;
      if (gid) {
        return View.byId[gid];
      }
      if (!el.parentElement) {
        break;
      }
      el = el.parentElement;
    }
  };

  View.prototype.addVirtuals = function(names) {
    var name, _i, _len;
    if (!this.virtuals) {
      return this.virtuals = [].concat(names);
    }
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      name = names[_i];
      this.addVirtual(name);
    }
    return null;
  };

  View.prototype.addVirtual = function(name) {
    if (!this.virtuals) {
      return this.virtuals = [name];
    }
    if (this.virtuals.indexOf(name) === -1) {
      this.virtuals.push(name);
    }
    return null;
  };

  View.prototype.hasVirtual = function(name) {
    if (!this.virtuals) {
      return false;
    } else if (this.virtuals.indexOf(name) === -1) {
      return false;
    }
    return true;
  };

  View.prototype.nearestViewWithVirtual = function(name) {
    var ancestor;
    ancestor = this;
    while (ancestor) {
      if (ancestor.hasVirtual(name)) {
        return ancestor;
      }
      ancestor = ancestor.parentElement;
    }
    return null;
  };

  return View;

})();

View.byId = {};

View.recycled = [];

View.count = 0;

View["new"] = function(_arg) {
  var el, id, view;
  el = _arg.el, id = _arg.id;
  View.count++;
  if (View.recycled.length > 0) {
    view = View.recycled.pop();
  } else {
    view = new View();
  }
  return view.attach(el, id);
};

module.exports = View;

});
require.register("gss/lib/dom/Observer.js", function(exports, require, module){
var LOG, observer, _unobservedElements,
  __slice = [].slice;

LOG = function() {
  return GSS.deblog.apply(GSS, ["Observer"].concat(__slice.call(arguments)));
};

observer = null;

GSS.is_observing = false;

GSS.observe = function() {
  if (!observer) {
    return;
  }
  if (!GSS.is_observing && GSS.config.observe) {
    observer.observe(document.body, GSS.config.observerOptions);
    return GSS.is_observing = true;
  }
};

GSS.unobserve = function() {
  if (!observer) {
    return;
  }
  observer.disconnect();
  return GSS.is_observing = false;
};

GSS._unobservedElements = _unobservedElements = [];

GSS.observeElement = function(el) {
  if (_unobservedElements.indexOf(el) === -1) {
    return _unobservedElements.push(el);
  }
};

GSS.unobserveElement = function(el) {
  var i;
  i = _unobservedElements.indexOf(el);
  if (i > -1) {
    return _unobservedElements.splice(i, 1);
  }
};

GSS.setupObserver = function() {
  if (!window.MutationObserver) {
    if (window.WebKitMutationObserver) {
      window.MutationObserver = window.WebKitMutationObserver;
    } else {
      window.MutationObserver = window.JsMutationObserver;
    }
  }
  if (!window.MutationObserver) {
    return;
  }
  return observer = new MutationObserver(function(mutations) {
    var e, engine, enginesToReset, gid, i, invalidMeasureIds, m, needsUpdateQueries, nodesToIgnore, observableMutation, removed, scope, sheet, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref;
    LOG("MutationObserver", mutations);
    enginesToReset = [];
    nodesToIgnore = [];
    needsUpdateQueries = [];
    invalidMeasureIds = [];
    observableMutation = false;
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      m = mutations[_i];
      if (_unobservedElements.indexOf(m.target) !== -1) {
        continue;
      } else {
        observableMutation = true;
      }
      if (m.type === "characterData") {
        if (!m.target.parentElement) {
          continue;
        }
        sheet = m.target.parentElement.gssStyleSheet;
        if (sheet) {
          sheet.reload();
          e = sheet.engine;
          if (enginesToReset.indexOf(e) === -1) {
            enginesToReset.push(e);
          }
        }
      }
      if (m.type === "attributes" || m.type === "childList") {
        if (m.type === "attributes" && m.attributename === "data-gss-id") {
          nodesToIgnore.push(m.target);
        } else if (nodesToIgnore.indexOf(m.target) === -1) {
          scope = GSS.get.nearestScope(m.target);
          if (scope) {
            if (needsUpdateQueries.indexOf(scope) === -1) {
              needsUpdateQueries.push(scope);
            }
          }
        }
      }
      gid = null;
      if (m.type === "characterData" || m.type === "attributes" || m.type === "childList") {
        if (m.type === "characterData") {
          target = m.target.parentElement;
          gid = GSS.getId(m.target.parentElement);
        } else if (nodesToIgnore.indexOf(m.target) === -1) {
          gid = GSS.getId(m.target);
        }
        if (gid != null) {
          gid = "$" + gid;
          if (invalidMeasureIds.indexOf(gid) === -1) {
            invalidMeasureIds.push(gid);
          }
        }
      }
    }
    if (!observableMutation) {
      return null;
    }
    removed = GSS.styleSheets.findAllRemoved();
    for (_j = 0, _len1 = removed.length; _j < _len1; _j++) {
      sheet = removed[_j];
      sheet.destroy();
      e = sheet.engine;
      if (enginesToReset.indexOf(e) === -1) {
        enginesToReset.push(e);
      }
    }
    i = 0;
    engine = GSS.engines[i];
    while (!!engine) {
      if (i > 0) {
        if (engine.scope) {
          if (!document.documentElement.contains(engine.scope)) {
            engine.destroyChildren();
            engine.destroy();
          }
        }
      }
      i++;
      engine = GSS.engines[i];
    }
    for (_k = 0, _len2 = enginesToReset.length; _k < _len2; _k++) {
      e = enginesToReset[_k];
      if (!e.is_destroyed) {
        e.reset();
      }
    }
    for (_l = 0, _len3 = needsUpdateQueries.length; _l < _len3; _l++) {
      scope = needsUpdateQueries[_l];
      e = GSS.get.engine(scope);
      if (e) {
        if (!e.is_destroyed) {
          if (enginesToReset.indexOf(e) === -1) {
            e.updateQueries();
          }
        }
      }
    }
    if (invalidMeasureIds.length > 0) {
      _ref = GSS.engines;
      for (_m = 0, _len4 = _ref.length; _m < _len4; _m++) {
        e = _ref[_m];
        if (!e.is_destroyed) {
          e.commander.handleInvalidMeasures(invalidMeasureIds);
        }
      }
    }
    enginesToReset = null;
    nodesToIgnore = null;
    needsUpdateQueries = null;
    invalidMeasureIds = null;
    return GSS.update();
    /*
    for m in mutations
      if m.removedNodes.length > 0 # nodelist are weird?
        for node in m.removedNodes
    
      if m.addedNodes.length > 0 # nodelist are weird?
        for node in m.addedNodes
    */

  });
};

GSS.isDisplayed = false;

GSS.onDisplay = function() {
  GSS.trigger("display");
  if (GSS.isDisplayed) {
    return;
  }
  GSS.isDisplayed = true;
  if (GSS.config.readyClass) {
    return GSS._.defer(function() {
      GSS.html.classList.add("gss-ready");
      return GSS.html.classList.remove("gss-not-ready");
    });
  }
};

document.addEventListener("DOMContentLoaded", function(e) {
  return GSS.boot();
});

module.exports = observer;

});
require.register("gss/lib/gssom/Node.js", function(exports, require, module){


});
require.register("gss/lib/gssom/StyleSheet.js", function(exports, require, module){
var Rule, StyleSheet,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Rule = GSS.Rule;

StyleSheet = (function(_super) {
  __extends(StyleSheet, _super);

  StyleSheet.prototype.isScoped = false;

  /*    
  el:  Node
  engine:     Engine
  rules:      []
  isScoped:   Boolean
  */


  function StyleSheet(o) {
    var key, tagName, val;
    if (o == null) {
      o = {};
    }
    StyleSheet.__super__.constructor.apply(this, arguments);
    for (key in o) {
      val = o[key];
      this[key] = val;
    }
    if (!this.engine) {
      throw new Error("StyleSheet needs engine");
    }
    this.engine.addStyleSheet(this);
    GSS.styleSheets.push(this);
    this.isRemote = false;
    this.remoteSourceText = null;
    if (this.el) {
      tagName = this.el.tagName;
      if (tagName === "LINK") {
        this.isRemote = true;
      }
    }
    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
    this.loadIfNeeded();
    return this;
  }

  StyleSheet.prototype.addRules = function(rules) {
    var r, rule, _i, _len, _results;
    this.setNeedsInstall(true);
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      r = rules[_i];
      r.parent = this;
      r.styleSheet = this;
      r.engine = this.engine;
      rule = new GSS.Rule(r);
      _results.push(this.rules.push(rule));
    }
    return _results;
  };

  StyleSheet.prototype.isLoading = false;

  StyleSheet.prototype.needsLoad = true;

  StyleSheet.prototype.reload = function() {
    this.destroyRules();
    return this._load();
  };

  StyleSheet.prototype.loadIfNeeded = function() {
    if (this.needsLoad) {
      this.needsLoad = false;
      this._load();
    }
    return this;
  };

  StyleSheet.prototype._load = function() {
    if (this.isRemote) {
      return this._loadRemote();
    } else if (this.el) {
      return this._loadInline();
    }
  };

  StyleSheet.prototype._loadInline = function() {
    return this.addRules(GSS.get.readAST(this.el));
  };

  StyleSheet.prototype._loadRemote = function() {
    var req, url,
      _this = this;
    if (this.remoteSourceText) {
      return this.addRules(GSS.compile(this.remoteSourceText));
    }
    url = this.el.getAttribute('href');
    if (!url) {
      return null;
    }
    req = new XMLHttpRequest;
    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status !== 200) {
        return;
      }
      _this.remoteSourceText = req.responseText.trim();
      _this.addRules(GSS.compile(_this.remoteSourceText));
      _this.isLoading = false;
      return _this.trigger('loaded');
    };
    this.isLoading = true;
    req.open('GET', url, true);
    return req.send(null);
  };

  StyleSheet.prototype.needsInstall = false;

  StyleSheet.prototype.setNeedsInstall = function(bool) {
    if (bool) {
      this.engine.setNeedsUpdate(true);
      return this.needsInstall = true;
    } else {
      return this.needsInstall = false;
    }
  };

  StyleSheet.prototype.install = function() {
    if (this.needsInstall) {
      this.setNeedsInstall(false);
      return this._install();
    }
  };

  StyleSheet.prototype.reinstall = function() {
    return this._install();
  };

  StyleSheet.prototype._install = function() {
    var rule, _i, _len, _ref, _results;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.install());
    }
    return _results;
  };

  StyleSheet.prototype.reset = function() {
    var rule, _i, _len, _ref, _results;
    this.setNeedsInstall(true);
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.reset());
    }
    return _results;
  };

  StyleSheet.prototype.destroyRules = function() {
    var rule, _i, _len, _ref;
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.destroy();
    }
    return this.rules = [];
  };

  StyleSheet.prototype.destroy = function() {
    var i;
    i = this.engine.styleSheets.indexOf(this);
    this.engine.styleSheets.splice(i, 1);
    i = GSS.styleSheets.indexOf(this);
    return GSS.styleSheets.splice(i, 1);
  };

  StyleSheet.prototype.isRemoved = function() {
    if (this.el && !document.body.contains(this.el) && !document.head.contains(this.el)) {
      return true;
    }
    return false;
  };

  StyleSheet.prototype.needsDumpCSS = false;

  StyleSheet.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      this.engine.setNeedsDumpCSS(true);
      return this.needsDumpCSS = true;
    } else {
      return this.needsDumpCSS = false;
    }
  };

  StyleSheet.prototype.dumpCSSIfNeeded = function() {
    if (this.needsDumpCSS) {
      return this.dumpCSS();
    }
  };

  StyleSheet.prototype.dumpCSS = function() {
    var css, rule, ruleCSS, _i, _len, _ref;
    css = "";
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      ruleCSS = rule.dumpCSS();
      if (ruleCSS) {
        css = css + ruleCSS;
      }
    }
    return css;
  };

  return StyleSheet;

})(GSS.EventTrigger);

StyleSheet.fromNode = function(node) {
  var engine, sheet;
  if (node.gssStyleSheet) {
    return node.gssStyleSheet;
  }
  engine = GSS({
    scope: GSS.get.scopeForStyleNode(node)
  });
  sheet = new GSS.StyleSheet({
    el: node,
    engine: engine,
    engineId: engine.id
  });
  node.gssStyleSheet = sheet;
  return sheet;
};

StyleSheet.Collection = (function() {
  function Collection() {
    var collection, key, val;
    collection = [];
    for (key in this) {
      val = this[key];
      collection[key] = val;
    }
    return collection;
  }

  Collection.prototype.install = function() {
    var sheet, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      sheet = this[_i];
      sheet.install();
    }
    return this;
  };

  Collection.prototype.find = function() {
    var node, nodes, sheet, _i, _len;
    nodes = document.querySelectorAll('[type="text/gss"], [type="text/gss-ast"]');
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      sheet = GSS.StyleSheet.fromNode(node);
    }
    return this;
  };

  Collection.prototype.findAllRemoved = function() {
    var removed, sheet, _i, _len;
    removed = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      sheet = this[_i];
      if (sheet.isRemoved()) {
        removed.push(sheet);
      }
    }
    return removed;
  };

  return Collection;

})();

GSS.StyleSheet = StyleSheet;

GSS.styleSheets = new GSS.StyleSheet.Collection();

module.exports = StyleSheet;

});
require.register("gss/lib/gssom/Rule.js", function(exports, require, module){
var Rule, _rule_cid;

_rule_cid = 0;

Rule = (function() {
  Rule.prototype.isRule = true;

  function Rule(o) {
    var key, val;
    _rule_cid++;
    this.cid = _rule_cid;
    for (key in o) {
      val = o[key];
      this[key] = val;
    }
    this.boundConditionals = [];
    if (this.name === 'else' || this.name === 'elseif' || this.name === "if") {
      this.isConditional = true;
    }
    /*
    @rules
    @commands
    @selectors
    @type
    @parent
    @styleSheet
    @isApplied
    */

    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
    this.Type = Rule.types[this.type] || (function() {
      throw new Error("Rule type, " + type + ", not found");
    })();
    this;
  }

  Rule.prototype.addRules = function(rules) {
    var r, rule, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      r = rules[_i];
      r.parent = this;
      r.styleSheet = this.styleSheet;
      r.engine = this.engine;
      rule = new GSS.Rule(r);
      _results.push(this.rules.push(rule));
    }
    return _results;
  };

  Rule.prototype._selectorContext = null;

  Rule.prototype.needsInstall = true;

  Rule.prototype.install = function() {
    var rule, _i, _len, _ref;
    if (this.needsInstall) {
      this.needsInstall = false;
      this.Type.install.call(this);
    }
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.install();
    }
    return this;
  };

  Rule.prototype.uninstall = function() {};

  Rule.prototype.reset = function() {
    var rule, _i, _len, _ref, _results;
    this.needsInstall = true;
    this.boundConditionals = [];
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.reset());
    }
    return _results;
  };

  Rule.prototype.destroy = function() {
    this.rules = null;
    this.commands = null;
    this.engine = null;
    this.parent = null;
    this.styleSheet = null;
    return this.boundConditionals = null;
  };

  Rule.prototype.executeCommands = function() {
    if (this.commands) {
      return this.engine.run(this);
    }
  };

  Rule.prototype.nextSibling = function() {
    var i;
    i = this.parent.rules.indexOf(this);
    return this.parent.rules[i + 1];
  };

  Rule.prototype.prevSibling = function() {
    var i;
    i = this.parent.rules.indexOf(this);
    return this.parent.rules[i - 1];
  };

  Rule.prototype.getSelectorContext = function() {
    if (!this._selectorContext) {
      this._selectorContext = this._computeSelectorContext();
    }
    return this._selectorContext;
  };

  Rule.prototype._computeSelectorContext = function() {
    var $, $$, parent, rule, selectorContext, _context, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    selectorContext = [];
    rule = this;
    while (rule.parent) {
      parent = rule.parent;
      if (!parent.isConditional) {
        if ((parent != null ? (_ref = parent.selectors) != null ? _ref.length : void 0 : void 0) > 0) {
          if (selectorContext.length === 0) {
            _ref1 = parent.selectors;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              $ = _ref1[_i];
              selectorContext.push($);
            }
          } else {
            _context = [];
            _ref2 = parent.selectors;
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              $ = _ref2[_j];
              for (_k = 0, _len2 = selectorContext.length; _k < _len2; _k++) {
                $$ = selectorContext[_k];
                _context.push($ + " " + $$);
              }
            }
            selectorContext = _context;
          }
        }
      }
      rule = parent;
    }
    this.selectorContext = selectorContext;
    return selectorContext;
  };

  Rule.prototype.getContextQuery = function() {
    if (!this.query) {
      return this.setupContextQuery();
    }
    return this.query;
  };

  Rule.prototype.setupContextQuery = function() {
    var effectiveSelector, engine;
    effectiveSelector = this.getSelectorContext().join(", ");
    engine = this.engine;
    return this.query = engine.registerDomQuery({
      selector: effectiveSelector,
      isMulti: true,
      isLive: false,
      createNodeList: function() {
        return engine.queryScope.querySelectorAll(effectiveSelector);
      }
    });
  };

  Rule.prototype.gatherCondCommand = function() {
    var command, next, nextIsConditional;
    command = ["cond"];
    next = this;
    nextIsConditional = true;
    while (nextIsConditional) {
      command.push(next.getClauseCommand());
      next = next.nextSibling();
      nextIsConditional = next != null ? next.isConditional : void 0;
    }
    return command;
  };

  Rule.prototype.getClauseCommand = function() {
    return ["clause", this.clause, this.getClauseTracker()];
  };

  Rule.prototype.getClauseTracker = function() {
    return "gss-cond-" + this.cid;
  };

  Rule.prototype.injectChildrenCondtionals = function(conditional) {
    var command, rule, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.boundConditionals.push(conditional);
      if (rule.commands) {
        _ref1 = rule.commands;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          command = _ref1[_j];
          command.push(["where", conditional.getClauseTracker()]);
        }
      }
      rule.isCondtionalBound = true;
      _results.push(rule.injectChildrenCondtionals(conditional));
    }
    return _results;
  };

  Rule.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      return this.styleSheet.setNeedsDumpCSS(true);
    }
  };

  Rule.prototype.dumpCSS = function() {
    var dumpMethod;
    dumpMethod = this.Type.dumpCSS;
    if (!dumpMethod) {
      dumpMethod = this.dumpChildrenCSS;
    }
    return dumpMethod.call(this);
  };

  Rule.prototype.dumpChildrenCSS = function() {
    var css, rule, ruleCSS, _i, _len, _ref;
    css = "";
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      ruleCSS = rule.dumpCSS();
      if (ruleCSS) {
        css = css + ruleCSS;
      }
    }
    return css;
  };

  return Rule;

})();

Rule.types = {
  directive: {
    install: function() {
      if (this.name === 'else' || this.name === 'elseif') {
        this.injectChildrenCondtionals(this);
        return this;
      } else if (this.name === 'if') {
        this.commands = [this.gatherCondCommand()];
        this.injectChildrenCondtionals(this);
        return this.executeCommands();
      } else {
        return this.executeCommands();
      }
    },
    dumpCSS: function() {
      return "";
    }
  },
  constraint: {
    install: function() {
      return this.executeCommands();
    },
    dumpCSS: function() {
      return "";
    }
  },
  style: {
    install: function() {
      return this.setNeedsDumpCSS(true);
    },
    dumpCSS: function() {
      return this.key + ":" + this.val + ";";
    }
  },
  ruleset: {
    install: function() {},
    dumpCSS: function() {
      var css, effectiveSelector, foundSet, foundStyle, innercss, lastChar, outercss, rule, ruleCSS, _i, _len, _ref;
      foundSet = false;
      foundStyle = false;
      css = "";
      innercss = "";
      outercss = "";
      effectiveSelector = null;
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        ruleCSS = rule.dumpCSS();
        lastChar = ruleCSS[ruleCSS.length - 1];
        if (lastChar === ";") {
          innercss = innercss + ruleCSS;
          if (!foundStyle) {
            effectiveSelector = rule.getSelectorContext().join(", ");
            foundStyle = true;
          }
        } else if (lastChar === "}") {
          outercss = outercss + ruleCSS;
          foundSet = true;
        }
      }
      if (foundStyle) {
        css = effectiveSelector + "{" + innercss + "}";
      }
      if (foundSet) {
        css = css + outercss;
      }
      return css;
    }
  }
};

module.exports = Rule;

});
require.register("gss/lib/Engine.js", function(exports, require, module){
var Engine, LOG, TIME, TIME_END, engines, _,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof GSS === "undefined" || GSS === null) {
  throw new Error("GSS object needed for Engine");
}

_ = GSS._;

TIME = function() {
  if (GSS.config.perf) {
    return console.time.apply(console, arguments);
  }
};

TIME_END = function() {
  if (GSS.config.perf) {
    return console.timeEnd.apply(console, arguments);
  }
};

LOG = function() {
  return GSS.deblog.apply(GSS, ["Engine"].concat(__slice.call(arguments)));
};

GSS.engines = engines = [];

engines.byId = {};

engines.root = null;

Engine = (function(_super) {
  __extends(Engine, _super);

  function Engine(o) {
    if (o == null) {
      o = {};
    }
    this.dispatch = __bind(this.dispatch, this);
    this.updateQueries = __bind(this.updateQueries, this);
    this.handleWorkerMessage = __bind(this.handleWorkerMessage, this);
    this.reset = __bind(this.reset, this);
    Engine.__super__.constructor.apply(this, arguments);
    this.scope = o.scope, this.workerURL = o.workerURL, this.vars = o.vars, this.getter = o.getter, this.is_root = o.is_root, this.useWorker = o.useWorker;
    if (!this.vars) {
      this.vars = {};
    }
    this.clauses = null;
    if (!GSS.config.useWorker) {
      this.useWorker = false;
    } else {
      if (this.useWorker == null) {
        this.useWorker = true;
      }
    }
    this.worker = null;
    this.workerCommands = [];
    this.workerMessageHistory = [];
    if (!this.workerURL) {
      this.workerURL = GSS.config.worker;
    }
    if (this.scope) {
      if (this.scope.tagName === "HEAD") {
        this.scope = document;
      }
      this.id = GSS.setupScopeId(this.scope);
      if (this.scope === GSS.Getter.getRootScope()) {
        this.queryScope = document;
      } else {
        this.queryScope = this.scope;
      }
    } else {
      this.id = GSS.uid();
      this.queryScope = document;
    }
    if (!this.getter) {
      this.getter = new GSS.Getter(this.scope);
    }
    this.commander = new GSS.Commander(this);
    this.lastWorkerCommands = null;
    this.cssDump = null;
    GSS.engines.push(this);
    engines.byId[this.id] = this;
    this._Hierarchy_setup();
    this._Queries_setup();
    this._StyleSheets_setup();
    LOG("constructor() @", this);
    this;
  }

  Engine.prototype.getVarsById = function(vars) {
    var varsById;
    if (GSS.config.processBeforeSet) {
      vars = GSS.config.processBeforeSet(vars);
    }
    return varsById = _.varsByViewId(_.filterVarsForDisplay(vars));
  };

  Engine.prototype.getQueryScopeById = function(id) {
    if (id) {
      return GSS.getById(id);
    } else {
      return this.queryScope;
    }
  };

  Engine.prototype.isDescendantOf = function(engine) {
    var parentEngine;
    parentEngine = this.parentEngine;
    while (parentEngine) {
      if (parentEngine === engine) {
        return true;
      }
      parentEngine = parentEngine.parentEngine;
    }
    return false;
  };

  Engine.prototype._Hierarchy_setup = function() {
    var _ref;
    this.childEngines = [];
    this.parentEngine = null;
    if (this.is_root) {
      engines.root = this;
    } else if (this.scope) {
      this.parentEngine = GSS.get.nearestEngine(this.scope, true);
    } else {
      this.parentEngine = engines.root;
    }
    if (!this.parentEngine && !this.is_root) {
      throw new Error("ParentEngine missing, WTF");
    }
    return (_ref = this.parentEngine) != null ? _ref.childEngines.push(this) : void 0;
  };

  Engine.prototype._Hierarchy_destroy = function() {
    this.parentEngine.childEngines.splice(this.parentEngine.childEngines.indexOf(this), 1);
    return this.parentEngine = null;
  };

  Engine.prototype.is_running = false;

  Engine.prototype.run = function(asts) {
    var ast, _i, _len, _results;
    LOG(this.id, ".run(asts)", asts);
    if (asts instanceof Array) {
      _results = [];
      for (_i = 0, _len = asts.length; _i < _len; _i++) {
        ast = asts[_i];
        _results.push(this._run(ast));
      }
      return _results;
    } else {
      return this._run(asts);
    }
  };

  Engine.prototype._run = function(ast) {
    return this.commander.execute(ast);
  };

  Engine.prototype.load = function() {
    var sheet, _i, _len, _ref, _results;
    if (!this.scope) {
      throw new Error("can't load scopeless engine");
    }
    if (this.is_running) {
      this.clean();
    }
    _ref = this.styleSheets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      sheet = _ref[_i];
      _results.push(sheet.execute());
    }
    return _results;
  };

  Engine.prototype.reset = function() {
    var sheet, styleSheets, _i, _len;
    LOG(this.id, ".reset()");
    if (!this.scope) {
      throw new Error("can't reset scopeless engine");
    }
    styleSheets = this.styleSheets;
    if (this.is_running) {
      this.clean();
    }
    this.styleSheets = styleSheets;
    for (_i = 0, _len = styleSheets.length; _i < _len; _i++) {
      sheet = styleSheets[_i];
      sheet.reset();
    }
    this.setNeedsUpdate(true);
    return this;
  };

  Engine.prototype.registerCommands = function(commands) {
    var command, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      _results.push(this.registerCommand(command));
    }
    return _results;
  };

  Engine.prototype.registerCommand = function(command) {
    this.workerCommands.push(command);
    this.setNeedsLayout(true);
    return this;
  };

  Engine.prototype._StyleSheets_setup = function() {
    return this.styleSheets = [];
  };

  Engine.prototype.addStyleSheet = function(sheet) {
    this.setNeedsUpdate(true);
    return this.styleSheets.push(sheet);
  };

  Engine.prototype.needsUpdate = false;

  Engine.prototype.setNeedsUpdate = function(bool) {
    if (bool) {
      GSS.setNeedsUpdate(true);
      return this.needsUpdate = true;
    } else {
      return this.needsUpdate = false;
    }
  };

  Engine.prototype.updateIfNeeded = function() {
    var _this = this;
    if (this.needsUpdate) {
      this._whenReadyForUpdate(function() {
        var sheet, _i, _len, _ref;
        _ref = _this.styleSheets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sheet = _ref[_i];
          sheet.install();
        }
        return _this.updateChildrenIfNeeded();
      });
      return this.setNeedsUpdate(false);
    } else {
      return this.updateChildrenIfNeeded();
    }
  };

  Engine.prototype._whenReadyForUpdate = function(cb) {
    var loadingCount, sheet, _i, _len, _ref,
      _this = this;
    loadingCount = 0;
    _ref = this.styleSheets;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      sheet = _ref[_i];
      if (sheet.isLoading) {
        loadingCount++;
        sheet.once("loaded", function() {
          loadingCount--;
          if (loadingCount === 0) {
            return cb.call(_this);
          }
        });
      }
    }
    if (loadingCount === 0) {
      cb.call(this);
    }
    return this;
  };

  Engine.prototype.updateChildrenIfNeeded = function() {
    var child, _i, _len, _ref, _results;
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(child.updateIfNeeded());
    }
    return _results;
  };

  Engine.prototype.needsLayout = false;

  Engine.prototype.setNeedsLayout = function(bool) {
    if (bool) {
      if (!this.needsLayout) {
        GSS.setNeedsLayout(true);
        return this.needsLayout = true;
      }
    } else {
      return this.needsLayout = false;
    }
  };

  Engine.prototype._beforeLayoutCalls = null;

  Engine.prototype.layout = function() {
    this.hoistedTrigger("beforeLayout", this);
    this.is_running = true;
    TIME("" + this.id + " LAYOUT & DISPLAY");
    this.dumpCSSIfNeeded();
    this.solve();
    return this.setNeedsLayout(false);
  };

  Engine.prototype.layoutIfNeeded = function() {
    if (this.needsLayout) {
      this.layout();
    }
    return this.layoutSubTreeIfNeeded();
  };

  Engine.prototype.waitingToLayoutSubtree = false;

  Engine.prototype.layoutSubTreeIfNeeded = function() {
    var child, _i, _len, _ref, _results;
    this.waitingToLayoutSubtree = false;
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(child.layoutIfNeeded());
    }
    return _results;
  };

  Engine.prototype.needsDisplay = false;

  Engine.prototype.setNeedsDisplay = function(bool) {
    if (bool) {
      GSS.setNeedsDisplay(true);
      return this.needsDisplay = true;
    } else {
      return this.needsDisplay = false;
    }
  };

  /*
  displayIfNeeded: () ->
    LOG @, "displayIfNeeded"
    if @needsDisplay #@workerCommands.length > 0
      @display(@vars)      
      @setNeedsDisplay false
    for child in @childEngines
      child.displayIfNeeded()
  */


  Engine.prototype.display = function(data, forceViewCacheById) {
    var el, id, needsToDisplayViews, obj, vars, varsById, _ref;
    if (forceViewCacheById == null) {
      forceViewCacheById = false;
    }
    vars = data.values;
    LOG(this.id, ".display()");
    this.hoistedTrigger("beforeDisplay", this);
    GSS.unobserve();
    varsById = this.getVarsById(vars);
    needsToDisplayViews = false;
    for (id in varsById) {
      obj = varsById[id];
      needsToDisplayViews = true;
      if (forceViewCacheById) {
        el = document.getElementById(id);
        if (el) {
          GSS.setupId(el);
        }
      }
      if ((_ref = GSS.View.byId[id]) != null) {
        if (typeof _ref.updateValues === "function") {
          _ref.updateValues(obj);
        }
      }
    }
    if (data.clauses) {
      this.updateClauses(data.clauses);
    }
    if (needsToDisplayViews) {
      if (this.scope) {
        GSS.get.view(this.scope).displayIfNeeded();
      }
    }
    if (!this.isMeasuring && this.needsMeasure) {
      this.measureIfNeeded();
      if (!this.needsLayout) {
        this._didDisplay();
      }
    } else {
      this._didDisplay();
    }
    GSS.observe();
    this.dispatchedTrigger("solved", {
      values: vars
    });
    TIME_END("" + this.id + " LAYOUT & DISPLAY");
    return this;
  };

  Engine.prototype._didDisplay = function() {
    this.trigger("display");
    GSS.onDisplay();
    return this.isMeasuring = false;
  };

  Engine.prototype.forceDisplay = function(vars) {};

  Engine.prototype.updateClauses = function(clauses) {
    var clause, html, nue, old, _i, _j, _k, _len, _len1, _len2;
    html = GSS.html;
    old = this.clauses;
    nue = clauses;
    if (old) {
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        clause = old[_i];
        if (nue.indexOf(clause) === -1) {
          html.classList.remove(clause);
        }
      }
      for (_j = 0, _len1 = nue.length; _j < _len1; _j++) {
        clause = nue[_j];
        if (old.indexOf(clause) === -1) {
          html.classList.add(clause);
        }
      }
    } else {
      for (_k = 0, _len2 = nue.length; _k < _len2; _k++) {
        clause = nue[_k];
        html.classList.add(clause);
      }
    }
    return this.clauses = nue;
  };

  Engine.prototype.isMeasuring = false;

  Engine.prototype.needsMeasure = false;

  Engine.prototype.setNeedsMeasure = function(bool) {
    if (bool) {
      return this.needsMeasure = true;
    } else {
      return this.needsMeasure = false;
    }
  };

  Engine.prototype.measureIfNeeded = function() {
    if (this.needsMeasure) {
      this.isMeasuring = true;
      this.needsMeasure = false;
      return this.measure();
    }
  };

  Engine.prototype.measure = function() {
    return this.commander.validateMeasures();
  };

  Engine.prototype.measureByGssId = function(id, prop) {
    var el, val;
    el = GSS.getById(id);
    val = this.getter.measure(el, prop);
    LOG(this.id, ".measureByGssId()", id, prop, val);
    return val;
  };

  Engine.prototype.solve = function() {
    if (this.useWorker) {
      return this.solveWithWorker();
    } else {
      return this.solveWithoutWorker();
    }
  };

  Engine.prototype.solveWithWorker = function() {
    var workerMessage;
    LOG(this.id, ".solveWithWorker()", this.workerCommands);
    workerMessage = {
      commands: this.workerCommands
    };
    this.workerMessageHistory.push(workerMessage);
    if (!this.worker) {
      this.worker = new Worker(this.workerURL);
      this.worker.addEventListener("message", this.handleWorkerMessage, false);
      this.worker.addEventListener("error", this.handleError, false);
      workerMessage.config = {
        defaultStrength: GSS.config.defaultStrength,
        defaultWeight: GSS.config.defaultWeight
      };
    }
    this.worker.postMessage(workerMessage);
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.solveWithoutWorker = function() {
    var workerMessage,
      _this = this;
    LOG(this.id, ".solveWithoutWorker()", this.workerCommands);
    workerMessage = {
      commands: this.workerCommands
    };
    this.workerMessageHistory.push(workerMessage);
    if (!this.worker) {
      this.worker = new GSS.Thread({
        defaultStrength: GSS.config.defaultStrength,
        defaultWeight: GSS.config.defaultWeight
      });
    }
    this.worker.postMessage(_.cloneDeep(workerMessage));
    _.defer(function() {
      if (_this.worker) {
        return _this.handleWorkerMessage({
          data: _this.worker.output()
        });
      }
    });
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.handleWorkerMessage = function(message) {
    LOG(this.id, ".handleWorkerMessage()", this.workerCommands);
    this.vars = message.data.values;
    return this.display(message.data);
  };

  Engine.prototype.handleError = function(event) {
    if (this.onError) {
      return this.onError(event);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype._Worker_destroy = function() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.workerCommands = null;
    this.workerMessageHistory = null;
    return this.lastWorkerCommands = null;
  };

  Engine.prototype._Worker_clean = function() {
    this.workerCommands = [];
    this.lastWorkerCommands = null;
    if (this.worker) {
      this.worker.terminate();
      return this.worker = null;
    }
  };

  Engine.prototype._Queries_setup = function() {
    var _this = this;
    this.querySet = new GSS.Query.Set();
    return this.querySet.on("update", function(o) {
      _this.commander.handleRemoves(o.removes);
      return _this.commander.handleSelectorsWithAdds(o.selectorsWithAdds);
    });
  };

  Engine.prototype.getDomQuery = function(selector) {
    return this.querySet.bySelector[selector];
  };

  Engine.prototype.registerDomQuery = function(o) {
    return this.querySet.add(o);
  };

  Engine.prototype.unregisterDomQuery = function(o) {
    return this.querySet.remove(o);
  };

  Engine.prototype.updateQueries = function() {
    return this.querySet.update();
  };

  Engine.prototype._Queries_destroy = function() {
    return this.querySet.destroy();
  };

  Engine.prototype._Queries_clean = function() {
    return this.querySet.clean();
  };

  Engine.prototype.hoistedTrigger = function(ev, obj) {
    this.trigger(ev, obj);
    return GSS.trigger("engine:" + ev, obj);
  };

  Engine.prototype.dispatchedTrigger = function(e, o, b, c) {
    this.trigger(e, o);
    return this.dispatch(e, o, b, c);
  };

  Engine.prototype.dispatch = function(eName, oDetail, bubbles, cancelable) {
    var e, o;
    if (oDetail == null) {
      oDetail = {};
    }
    if (bubbles == null) {
      bubbles = true;
    }
    if (cancelable == null) {
      cancelable = true;
    }
    if (!this.scope) {
      return;
    }
    oDetail.engine = this;
    o = {
      detail: oDetail,
      bubbles: bubbles,
      cancelable: cancelable
    };
    e = new CustomEvent(eName, o);
    return this.scope.dispatchEvent(e);
  };

  Engine.prototype.cssToDump = null;

  Engine.prototype.cssDump = null;

  Engine.prototype.setupCSSDumpIfNeeded = function() {
    var dumpNode;
    dumpNode = this.scope || document.body;
    if (!this.cssDump) {
      this.cssDump = document.createElement("style");
      this.cssDump.id = "gss-css-dump-" + this.id;
      return dumpNode.appendChild(this.cssDump);
    }
  };

  Engine.prototype.needsDumpCSS = false;

  Engine.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      this.setNeedsLayout(true);
      return this.needsDumpCSS = true;
    } else {
      return this.needsDumpCSS = false;
    }
  };

  Engine.prototype.dumpCSSIfNeeded = function() {
    var css, sheet, sheetCSS, _i, _len, _ref;
    if (this.needsDumpCSS) {
      this.needsDumpCSS = false;
      this.setupCSSDumpIfNeeded();
      css = "";
      _ref = this.styleSheets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sheet = _ref[_i];
        sheetCSS = sheet.dumpCSSIfNeeded();
        if (sheetCSS) {
          css = css + sheetCSS;
        }
      }
      if (css.length > 0) {
        return this.cssDump.innerHTML = css;
      }
    }
  };

  Engine.prototype._CSSDumper_clean = function() {
    var _ref;
    return (_ref = this.cssDump) != null ? _ref.innerHTML = "" : void 0;
  };

  Engine.prototype._CSSDumper_destroy = function() {
    this.needsDumpCSS = false;
    return this.cssDump = null;
  };

  Engine.prototype.clean = function() {
    var key, val, _base, _ref;
    LOG(this.id, ".clean()");
    _ref = this.vars;
    for (key in _ref) {
      val = _ref[key];
      delete this.vars[key];
    }
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.setNeedsMeasure(false);
    this.isMeasuring = false;
    this.waitingToLayoutSubtree = false;
    this.commander.clean();
    if (typeof (_base = this.getter).clean === "function") {
      _base.clean();
    }
    this._CSSDumper_clean();
    this._Worker_clean();
    this._Queries_clean();
    return this;
  };

  Engine.prototype.is_destroyed = false;

  Engine.prototype.destroyChildren = function() {
    var e, _i, _len, _ref, _results;
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      if (!e.is_destroyed) {
        _results.push(e.destroy());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Engine.prototype.destroy = function() {
    var d, descdendants, i, kill, _base, _i, _len;
    LOG(this.id, ".destroy()");
    this.hoistedTrigger("beforeDestroy", this);
    GSS._ids_killed([this.id]);
    if (this.scope) {
      descdendants = GSS.get.descdendantNodes(this.scope);
      for (_i = 0, _len = descdendants.length; _i < _len; _i++) {
        d = descdendants[_i];
        kill = d._gss_id;
        if (kill) {
          GSS._id_killed(kill);
        }
      }
    }
    i = engines.indexOf(this);
    if (i > -1) {
      engines.splice(i, 1);
    }
    delete engines.byId[this.id];
    this.offAll();
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.waitingToLayoutSubtree = false;
    this.commander.destroy();
    if (typeof (_base = this.getter).destroy === "function") {
      _base.destroy();
    }
    this.vars = null;
    this.clauses = null;
    this.ast = null;
    this.getter = null;
    this.scope = null;
    this.commander = null;
    this._Hierarchy_destroy();
    this._CSSDumper_destroy();
    this._Worker_destroy();
    this._Queries_destroy();
    this.is_running = null;
    this.is_destroyed = true;
    return this;
  };

  Engine.prototype.elVar = function(el, key, selector, tracker2) {
    var ast, gid, varid;
    gid = "$" + GSS.getId(el);
    if (key === 'left') {
      key = 'x';
    } else if (key === 'top') {
      key = 'y';
    }
    varid = gid + ("[" + key + "]");
    ast = ['get$', key, gid, selector];
    if (tracker2) {
      ast.push(tracker2);
    }
    return ast;
  };

  Engine.prototype["var"] = function(key) {
    return ['get', key];
  };

  Engine.prototype.varexp = function(key, exp, tracker) {
    return ['get', key];
  };

  Engine.prototype.__e = function(key) {
    if (key instanceof Array) {
      return key;
    }
    if (!!Number(key) || (Number(key) === 0)) {
      return ['number', key];
    }
    return this["var"](key);
  };

  Engine.prototype._addconstraint = function(op, e1, e2, s, w, more) {
    var command, m, _i, _len;
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    command = ['eq', e1, e2];
    if (s) {
      command.push(s);
    }
    if (w) {
      command.push(w);
    }
    if (more) {
      for (_i = 0, _len = more.length; _i < _len; _i++) {
        m = more[_i];
        command.push(m);
      }
    }
    return this.registerCommand(command);
  };

  Engine.prototype.eq = function(e1, e2, s, w, more) {
    return this._addconstraint('eq', e1, e2, s, w, more);
  };

  Engine.prototype.lte = function(e1, e2, s, w, more) {
    return this._addconstraint('lte', e1, e2, s, w, more);
  };

  Engine.prototype.gte = function(e1, e2, s, w, more) {
    return this._addconstraint('gte', e1, e2, s, w, more);
  };

  Engine.prototype.suggest = function(v, val, strength) {
    if (strength == null) {
      strength = 'required';
    }
    v = this.__e(v);
    return this.registerCommand(['suggest', v, ['number', val], strength]);
  };

  Engine.prototype.stay = function(v) {
    v = this.__e(v);
    return this.registerCommand(['stay', v]);
  };

  Engine.prototype.remove = function(tracker) {
    return this.registerCommand(['remove', tracker]);
  };

  Engine.prototype['number'] = function(num) {
    return ['number', num];
  };

  Engine.prototype['plus'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['plus', e1, e2];
  };

  Engine.prototype['minus'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['minus', e1, e2];
  };

  Engine.prototype['multiply'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['multiply', e1, e2];
  };

  Engine.prototype['divide'] = function(e1, e2, s, w) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['divide', e1, e2];
  };

  return Engine;

})(GSS.EventTrigger);

module.exports = Engine;

});
require.register("gss/lib/Commander.js", function(exports, require, module){
/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Commander, bindRoot, bindRootAsContext, bindRootAsMulti, unbindRoot,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

bindRoot = function(root, query) {
  root.isQueryBound = true;
  if (!root.queries) {
    root.queries = [query];
  } else if (root.queries.indexOf(query) === -1) {
    root.queries.push(query);
  }
  return root;
};

unbindRoot = function(root, query) {
  var index;
  if (!root.queries) {
    return;
  }
  index = root.queries.indexOf(query);
  if (index !== -1) {
    root.queries.splice(index, 1);
  }
  if (!root.queries.length) {
    root.isQueryBound = null;
  }
  return root;
};

bindRootAsMulti = function(root, query) {
  bindRoot(root, query);
  /* TODO
  # - throw warning?
  if root.queries.multi and root.queries.multi isnt query     
    throw new Error " #{root.queries.multi.selector} & #{query.selector}"
  */

  return root;
};

bindRootAsContext = function(root, query) {
  bindRoot(root, query);
  return root.isContextBound = true;
};

Commander = (function() {
  function Commander(engine) {
    this.engine = engine;
    this['js'] = __bind(this['js'], this);
    this['for-all'] = __bind(this['for-all'], this);
    this['for-each'] = __bind(this['for-each'], this);
    this._e_for_chain = __bind(this._e_for_chain, this);
    this._chainer_math = __bind(this._chainer_math, this);
    this['divide-chain'] = __bind(this['divide-chain'], this);
    this['multiply-chain'] = __bind(this['multiply-chain'], this);
    this['minus-chain'] = __bind(this['minus-chain'], this);
    this['plus-chain'] = __bind(this['plus-chain'], this);
    this._chainer = __bind(this._chainer, this);
    this['gt-chain'] = __bind(this['gt-chain'], this);
    this['lt-chain'] = __bind(this['lt-chain'], this);
    this['gte-chain'] = __bind(this['gte-chain'], this);
    this['lte-chain'] = __bind(this['lte-chain'], this);
    this['eq-chain'] = __bind(this['eq-chain'], this);
    this['chain'] = __bind(this['chain'], this);
    this['$reserved'] = __bind(this['$reserved'], this);
    this['$id'] = __bind(this['$id'], this);
    this['$all'] = __bind(this['$all'], this);
    this['$tag'] = __bind(this['$tag'], this);
    this['$class'] = __bind(this['$class'], this);
    this['$virtual'] = __bind(this['$virtual'], this);
    this['virtual'] = __bind(this['virtual'], this);
    this['stay'] = __bind(this['stay'], this);
    this['gt'] = __bind(this['gt'], this);
    this['lt'] = __bind(this['lt'], this);
    this['gte'] = __bind(this['gte'], this);
    this['lte'] = __bind(this['lte'], this);
    this['eq'] = __bind(this['eq'], this);
    this['suggest'] = __bind(this['suggest'], this);
    this['strength'] = __bind(this['strength'], this);
    this["||"] = __bind(this["||"], this);
    this["&&"] = __bind(this["&&"], this);
    this["?<"] = __bind(this["?<"], this);
    this["?>"] = __bind(this["?>"], this);
    this["?!="] = __bind(this["?!="], this);
    this["?=="] = __bind(this["?=="], this);
    this["?<="] = __bind(this["?<="], this);
    this["?>="] = __bind(this["?>="], this);
    this["clause"] = __bind(this["clause"], this);
    this["where"] = __bind(this["where"], this);
    this["cond"] = __bind(this["cond"], this);
    this['divide'] = __bind(this['divide'], this);
    this['multiply'] = __bind(this['multiply'], this);
    this['minus'] = __bind(this['minus'], this);
    this['plus'] = __bind(this['plus'], this);
    this['_get$'] = __bind(this['_get$'], this);
    this['get$'] = __bind(this['get$'], this);
    this['get'] = __bind(this['get'], this);
    this.makeCommandScopedToParentRule = __bind(this.makeCommandScopedToParentRule, this);
    this.spawnForWindowSize = __bind(this.spawnForWindowSize, this);
    this._execute = __bind(this._execute, this);
    this.lazySpawnForWindowSize = GSS._.debounce(this.spawnForWindowSize, GSS.config.resizeDebounce, false);
    this.cleanVars();
  }

  Commander.prototype.clean = function() {
    this.cleanVars();
    return this.unlisten();
  };

  Commander.prototype.cleanVars = function() {
    this.spawnableRoots = [];
    this.intrinsicRegistersById = {};
    this.boundWindowProps = [];
    this.get$cache = {};
    return this.queryCommandCache = {};
  };

  Commander.prototype.destroy = function() {
    this.spawnableRoots = null;
    this.intrinsicRegistersById = null;
    this.boundWindowProps = null;
    this.get$cache = null;
    this.queryCommandCache = null;
    return this.unlisten();
  };

  Commander.prototype.execute = function(ast) {
    var command, _i, _len, _ref, _results;
    if (ast.commands != null) {
      _ref = ast.commands;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        if (ast.isRule) {
          command.parentRule = ast;
        }
        _results.push(this._execute(command, command));
      }
      return _results;
    }
  };

  Commander.prototype._execute = function(command, root) {
    var func, i, node, sub, _i, _len, _ref;
    node = command;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Engine Commands broke, couldn't find method: " + node[0]);
    }
    _ref = node.slice(1, +node.length + 1 || 9e9);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      sub = _ref[i];
      if (sub instanceof Array) {
        node.splice(i + 1, 1, this._execute(sub, root));
      }
    }
    return func.call.apply(func, [this.engine, root].concat(__slice.call(node.slice(1, node.length))));
  };

  Commander.prototype.unlisten = function() {
    if (!this._bound_to_window_resize) {
      window.removeEventListener("resize", this.lazySpawnForWindowSize, false);
    }
    return this._bound_to_window_resize = false;
  };

  Commander.prototype._bound_to_window_resize = false;

  Commander.prototype.spawnForWindowWidth = function() {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    if (this.engine.vars["::window[width]"] !== w) {
      return this.engine.registerCommand(['suggest', ['get', "::window[width]"], ['number', w], 'required']);
    }
  };

  Commander.prototype.spawnForWindowHeight = function() {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    if (this.engine.vars["::window[height]"] !== h) {
      return this.engine.registerCommand(['suggest', ['get', "::window[height]"], ['number', h], 'required']);
    }
  };

  Commander.prototype.spawnForWindowSize = function() {
    if (this._bound_to_window_resize) {
      if (this.boundWindowProps.indexOf('width') !== -1) {
        this.spawnForWindowWidth();
      }
      if (this.boundWindowProps.indexOf('height') !== -1) {
        this.spawnForWindowHeight();
      }
      return this.engine.solve();
    }
  };

  Commander.prototype.bindToWindow = function(prop) {
    if (prop === "center-x") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[center-x]'], ['divide', ['get', '::window[width]'], 2], 'required']);
      return null;
    } else if (prop === "right") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[right]'], ['get', '::window[width]'], 'required']);
      return null;
    } else if (prop === "center-y") {
      this.bindToWindow("height");
      this.engine.registerCommand(['eq', ['get', '::window[center-y]'], ['divide', ['get', '::window[height]'], 2], 'required']);
      return null;
    } else if (prop === "bottom") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[bottom]'], ['get', '::window[height]'], 'required']);
      return null;
    }
    if (this.boundWindowProps.indexOf(prop) === -1) {
      this.boundWindowProps.push(prop);
    }
    if (prop === 'width' || prop === 'height') {
      if (prop === 'width') {
        this.spawnForWindowWidth();
      } else {
        this.spawnForWindowHeight();
      }
      if (!this._bound_to_window_resize) {
        window.addEventListener("resize", this.lazySpawnForWindowSize, false);
        return this._bound_to_window_resize = true;
      }
    } else if (prop === 'x') {
      return this.engine.registerCommand(['eq', ['get', '::window[x]'], ['number', 0], 'required']);
    } else if (prop === 'y') {
      return this.engine.registerCommand(['eq', ['get', '::window[y]'], ['number', 0], 'required']);
    }
  };

  Commander.prototype.spawnForScope = function(prop) {
    var key, thisEngine;
    key = "$" + this.engine.id + ("[" + prop + "]");
    thisEngine = this.engine;
    return GSS.on("engine:beforeDisplay", function(engine) {
      var val;
      val = engine.vars[key];
      if (val != null) {
        if (thisEngine.isDescendantOf(engine)) {
          return thisEngine.registerCommand(['suggest', ['get', key], ['number', val], 'required']);
        }
      }
    });
  };

  Commander.prototype.bindToScope = function(prop) {
    return this.spawnForScope(prop);
    /*
    if prop is 'width' or prop is 'height'
      if prop is 'width' then @spawnForScopeWidth() else @spawnForScopeHeight()
    else if prop is 'x'
      @engine.registerCommand ['eq', ['get', '::scope[x]'], ['number', 0], 'required']      
    else if prop is 'y'
      @engine.registerCommand ['eq', ['get', '::scope[y]'], ['number', 0], 'required']
    #else
    #  throw new Error "Not sure how to bind to window prop: #{prop}"
    */

  };

  Commander.prototype.handleRemoves = function(removes) {
    var query, subqueries, subquery, tracker, trackers, varid, _i, _j, _k, _l, _len, _len1, _len2, _len3, _subqueries, _trackers;
    if (removes.length < 1) {
      return this;
    }
    if (_trackers = this.trackersById) {
      for (_i = 0, _len = removes.length; _i < _len; _i++) {
        varid = removes[_i];
        if (trackers = _trackers[varid]) {
          for (_j = 0, _len1 = trackers.length; _j < _len1; _j++) {
            tracker = trackers[_j];
            if (removes.indexOf(tracker) === -1) {
              removes.push(tracker);
            }
          }
          delete _trackers[varid];
        }
      }
    }
    _subqueries = this.subqueriesByTracker;
    for (_k = 0, _len2 = removes.length; _k < _len2; _k++) {
      varid = removes[_k];
      delete this.intrinsicRegistersById[varid];
      if (_subqueries) {
        if (subqueries = _subqueries[varid]) {
          for (_l = 0, _len3 = subqueries.length; _l < _len3; _l++) {
            subquery = subqueries[_l];
            query = subquery.query;
            if (removes.indexOf(query.selector) === -1) {
              removes.push(query.selector);
            }
            delete this.queryCommandCache[query.selector];
            this.engine.unregisterDomQuery(query);
            unbindRoot(subquery.root, query);
          }
          delete _subqueries[varid];
        }
      }
    }
    this.engine.registerCommand(['remove'].concat(__slice.call(removes)));
    return this;
  };

  Commander.prototype.handleSelectorsWithAdds = function(selectorsWithAdds) {
    var query, root, _i, _j, _len, _len1, _ref, _ref1;
    if (selectorsWithAdds.length < 1) {
      return this;
    }
    _ref = this.spawnableRoots;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      root = _ref[_i];
      _ref1 = root.queries;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        query = _ref1[_j];
        if (selectorsWithAdds.indexOf(query.selector) !== -1) {
          this.spawn(root, query);
        }
      }
    }
    return this;
  };

  Commander.prototype.validateMeasures = function() {
    var id, ids;
    ids = [];
    for (id in this.intrinsicRegistersById) {
      ids.push(id);
    }
    return this.handleInvalidMeasures(ids);
  };

  Commander.prototype.handleInvalidMeasures = function(invalidMeasures) {
    var id, prop, register, registersByProp, _i, _len;
    if (invalidMeasures.length < 1) {
      return this;
    }
    for (_i = 0, _len = invalidMeasures.length; _i < _len; _i++) {
      id = invalidMeasures[_i];
      registersByProp = this.intrinsicRegistersById[id];
      if (registersByProp) {
        for (prop in registersByProp) {
          register = registersByProp[prop];
          register.call(this);
        }
      }
    }
    return this;
  };

  Commander.prototype.bindRootSubselector = function(root, o, subselector) {
    var _this = this;
    root.subselector = subselector;
    return root.spawn = function(id, node, originalId, q) {
      var $id, command, contextId, ids, result, subqueries, subtracker, tracker, trackers, _base, _base1, _i, _len;
      $id = "$" + (originalId || id);
      tracker = o.query.selector + $id;
      subtracker = o.selector + " " + subselector + $id;
      command = _this["$all"](root, subselector, id, subtracker);
      command.root = root;
      subqueries = (_base = (_this.trackersById || (_this.trackersById = {})))[$id] || (_base[$id] = []);
      if (subqueries.indexOf(tracker) === -1) {
        subqueries.push(tracker);
      }
      trackers = (_base1 = (_this.subqueriesByTracker || (_this.subqueriesByTracker = {})))[tracker] || (_base1[tracker] = []);
      if (trackers.indexOf(command) === -1) {
        trackers.push(command);
      }
      result = [];
      if (q === command.query) {
        ids = command.query.lastAddedIds;
      } else {
        ids = command.query.ids;
      }
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        contextId = ids[_i];
        result.push.apply(result, _this.expandSpawnable([node], false, contextId, subtracker, 'do_not_recurse'));
      }
      if (result.length) {
        result.isPlural = true;
        return result;
      }
    };
  };

  /*
  getWhereCommandIfNeeded: (rule) ->    
    
    # Condtional Bound`
    if rule
      if rule.isCondtionalBound & !rule.isConditional
        whereCommand = ["where"]
        for cond in rule.boundConditionals
          whereCommand.push cond.getClauseTracker()
        return whereCommand
    else 
      return null
  */


  Commander.prototype.registerSpawn = function(node) {
    var newCommand, part, _i, _len;
    if (!node.isQueryBound) {
      newCommand = [];
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        part = node[_i];
        newCommand.push(part);
      }
      return this.engine.registerCommand(newCommand);
    } else {
      this.spawnableRoots.push(node);
      return this.spawn(node);
    }
  };

  Commander.prototype.spawn = function(node, query) {
    var contextId, contextQuery, q, queries, ready, rule, _i, _j, _len, _len1, _ref, _results;
    queries = node.queries;
    ready = true;
    for (_i = 0, _len = queries.length; _i < _len; _i++) {
      q = queries[_i];
      if ((!query || query === q) && q.lastAddedIds.length <= 0) {
        ready = false;
        break;
      }
    }
    if (ready) {
      rule = node.parentRule;
      if (node.isContextBound) {
        contextQuery = query || rule.getContextQuery();
        _ref = contextQuery.lastAddedIds;
        _results = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          contextId = _ref[_j];
          _results.push(this.engine.registerCommands(this.expandSpawnable(node, true, contextId, null, query)));
        }
        return _results;
      } else {
        return this.engine.registerCommands(this.expandSpawnable(node, true, null, null, query));
      }
    }
  };

  Commander.prototype.expandSpawnable = function(command, isRoot, contextId, tracker, query) {
    var commands, hasPlural, i, j, newCommand, newPart, part, plural, pluralCommand, pluralLength, pluralPartLookup, pluralSelector, _i, _j, _k, _len, _len1, _ref;
    newCommand = [];
    commands = [];
    hasPlural = false;
    pluralPartLookup = {};
    plural = null;
    pluralLength = 0;
    pluralSelector = null;
    for (i = _i = 0, _len = command.length; _i < _len; i = ++_i) {
      part = command[i];
      if (part) {
        if (part.spawn != null) {
          if (newPart = part.spawn(contextId, tracker, query)) {
            newCommand.push(newPart);
            if (part.isPlural || newPart.isPlural) {
              if (hasPlural) {
                if (newPart.length !== pluralLength) {
                  GSS.warn("GSS: trying to constrain 2 plural selectors ('" + pluralSelector + "' & '" + part.query.selector + "') with different number of matching elements");
                  if (newPart.length < pluralLength) {
                    pluralLength = newPart.length;
                  }
                }
              } else {
                pluralLength = newPart.length;
              }
              hasPlural = true;
              pluralSelector = (_ref = part.query) != null ? _ref.selector : void 0;
              pluralPartLookup[i] = newPart;
            }
          }
        } else {
          newCommand.push(part);
        }
      }
    }
    if (isRoot) {
      if (tracker) {
        newCommand.push(tracker);
      }
    }
    if (hasPlural) {
      for (j = _j = 0; 0 <= pluralLength ? _j < pluralLength : _j > pluralLength; j = 0 <= pluralLength ? ++_j : --_j) {
        pluralCommand = [];
        for (i = _k = 0, _len1 = newCommand.length; _k < _len1; i = ++_k) {
          part = newCommand[i];
          if (pluralPartLookup[i]) {
            pluralCommand.push(pluralPartLookup[i][j]);
          } else {
            pluralCommand.push(part);
          }
        }
        commands.push(pluralCommand);
      }
      return commands;
    } else {
      if (isRoot) {
        return [newCommand];
      }
      return newCommand;
    }
  };

  Commander.prototype.makeNonRootSpawnableIfNeeded = function(command) {
    var isPlural, isSpawnable, part, _i, _len,
      _this = this;
    isPlural = false;
    for (_i = 0, _len = command.length; _i < _len; _i++) {
      part = command[_i];
      if (part) {
        if (part.spawn != null) {
          isSpawnable = true;
          if (part.isPlural) {
            isPlural = true;
          }
        }
      }
    }
    if (!isSpawnable) {
      return command;
    }
    return {
      isPlural: isPlural,
      spawn: function(contextId) {
        return _this.expandSpawnable(command, false, contextId);
      }
    };
  };

  Commander.prototype.makeCommandScopedToParentRule = function() {};

  Commander.prototype['get'] = function(root, varId, tracker) {
    var command;
    command = ['get', varId];
    if (tracker) {
      command.push(tracker);
    }
    return command;
  };

  Commander.prototype['get$'] = function(root, prop, queryObject) {
    var key, val;
    key = queryObject.selectorKey;
    if (!key) {
      key = queryObject.selector;
    }
    key += prop;
    val = this.get$cache[key];
    if (!val) {
      val = this._get$(root, prop, queryObject);
      this.get$cache[key] = val;
    }
    return val;
  };

  Commander.prototype['_get$'] = function(root, prop, queryObject) {
    var idProcessor, isContextBound, isMulti, isScopeBound, query, selector,
      _this = this;
    query = queryObject.query;
    selector = queryObject.selector;
    if (selector === 'window') {
      this.bindToWindow(prop);
      return ['get', "::window[" + prop + "]"];
    }
    isMulti = query.isMulti;
    isContextBound = queryObject.isContextBound;
    isScopeBound = queryObject.isScopeBound;
    if (isScopeBound) {
      this.bindToScope(prop);
    }
    if (prop.indexOf("intrinsic-") === 0) {
      query.on('afterChange', function() {
        return _this._processIntrinsics(query, selector, prop);
      });
      this._processIntrinsics(query, selector, prop);
    }
    if (isContextBound) {
      idProcessor = queryObject.idProcessor;
      return {
        isQueryBound: true,
        isPlural: root.isPlural || false,
        query: query,
        spawn: function(id, tracker, q) {
          var originalId;
          if (!q || q === query) {
            if (idProcessor) {
              originalId = id;
              id = idProcessor(id);
            }
            if (root.spawn) {
              return root.spawn(id, this, originalId, q);
            }
          } else if (!tracker) {
            tracker = (q || query).selector;
          }
          return ['get$', prop, '$' + id, tracker || selector];
        }
      };
    }
    return {
      isQueryBound: true,
      isPlural: isMulti,
      query: query,
      spawn: function() {
        var id, nodes, _i, _len, _ref;
        if (!isMulti) {
          id = query.lastAddedIds[query.lastAddedIds.length - 1];
          return ['get$', prop, "$" + id, selector];
        }
        nodes = [];
        _ref = query.lastAddedIds;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          nodes.push(['get$', prop, "$" + id, selector]);
        }
        return nodes;
      }
    };
  };

  Commander.prototype._processIntrinsics = function(query, selector, prop) {
    var _this = this;
    return query.lastAddedIds.forEach(function(id) {
      var elProp, engine, gid, k, register;
      gid = "$" + id;
      if (!_this.intrinsicRegistersById[gid]) {
        _this.intrinsicRegistersById[gid] = {};
      }
      if (!_this.intrinsicRegistersById[gid][prop]) {
        elProp = prop.split("intrinsic-")[1];
        k = "" + gid + "[" + prop + "]";
        engine = _this.engine;
        register = function() {
          var val;
          val = engine.measureByGssId(id, elProp);
          if (engine.vars[k] !== val) {
            engine.registerCommand(['suggest', ['get$', prop, gid, selector], ['number', val], 'required']);
          }
          return engine.setNeedsMeasure(true);
        };
        _this.intrinsicRegistersById[gid][prop] = register;
        return register.call(_this);
      }
    });
  };

  Commander.prototype['number'] = function(root, num) {
    return ['number', num];
  };

  Commander.prototype['plus'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['plus', e1, e2]);
  };

  Commander.prototype['minus'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['minus', e1, e2]);
  };

  Commander.prototype['multiply'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['multiply', e1, e2]);
  };

  Commander.prototype['divide'] = function(root, e1, e2, s, w) {
    return this.makeNonRootSpawnableIfNeeded(['divide', e1, e2]);
  };

  Commander.prototype["cond"] = function(self) {
    return this.registerSpawn(self);
  };

  /*
  "where": (root,name) =>
    return ['where',name]
  
  "clause": (root,cond,label) =>
    return @makeNonRootSpawnableIfNeeded ["clause",cond,label]
  */


  Commander.prototype["where"] = function(root, name) {
    var command;
    if (root.isContextBound) {
      command = [
        "where", name, {
          spawn: function(contextId) {
            return "-context-" + contextId;
          }
        }
      ];
    } else {
      command = ["where", name];
    }
    return this.makeNonRootSpawnableIfNeeded(command);
  };

  Commander.prototype["clause"] = function(root, cond, name) {
    var command;
    if (root.isContextBound) {
      command = [
        "clause", cond, {
          spawn: function(contextId) {
            if (contextId) {
              return name + "-context-" + contextId;
            }
            return name;
          }
        }
      ];
    } else {
      command = ["clause", cond, name];
    }
    return this.makeNonRootSpawnableIfNeeded(command);
  };

  Commander.prototype["?>="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?>=", e1, e2]);
  };

  Commander.prototype["?<="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?<=", e1, e2]);
  };

  Commander.prototype["?=="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?==", e1, e2]);
  };

  Commander.prototype["?!="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?!=", e1, e2]);
  };

  Commander.prototype["?>"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?>", e1, e2]);
  };

  Commander.prototype["?<"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?<", e1, e2]);
  };

  Commander.prototype["&&"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["&&", e1, e2]);
  };

  Commander.prototype["||"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["||", e1, e2]);
  };

  Commander.prototype['strength'] = function(root, s) {
    return ['strength', s];
  };

  Commander.prototype['suggest'] = function() {
    var args;
    args = __slice.call(arguments);
    return this.engine.registerCommand(['suggest'].concat(__slice.call(args.slice(1, args.length))));
  };

  Commander.prototype['eq'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['lte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['gte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['lt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['gt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['stay'] = function(self) {
    return this.registerSpawn(self);
    /*
    if !self._is_bound then return @registerSpawn(self)
    # break up stays to allow multiple plural queries
    args = [arguments...]
    gets = args[1...args.length]    
    for get in gets
      stay = ['stay']
      stay.push get
      cloneBinds self, stay
      @registerSpawn(stay)
    */

  };

  Commander.prototype['virtual'] = function(self, namesssss) {
    /* TODO: register virtuals to DOM elements
    parentRule = self.parentRule
    if !parentRule then throw new 'Error virtual element "#{name}" requires parent rule for context'
    query = parentRule.getContextQuery()
    args = [arguments...]
    names = [args[1...args.length]...]
    query.on 'afterChange', ->
      for id in query.lastAddedIds
        view = GSS.get.view(id)
        view.addVirtuals names 
    for id in query.lastAddedIds
      view = GSS.get.view(id)
      view.addVirtuals names
      
    @registerSpawn(self)
    */

  };

  Commander.prototype['$virtual'] = function(root, name) {
    var o, parentRule, query, selector, selectorKey;
    parentRule = root.parentRule;
    if (!parentRule) {
      throw new 'Error virtual element "#{name}" requires parent rule for context';
    }
    query = parentRule.getContextQuery();
    selector = query.selector;
    selectorKey = query.selector + (" ::virtual(" + name + ")");
    o = this.queryCommandCache[selectorKey];
    if (!o) {
      o = {
        query: query,
        selector: selector,
        selectorKey: selectorKey,
        isContextBound: true,
        idProcessor: function(id) {
          return id + '"' + name + '"';
          /* TODO: allow virtual lookup from down DOM tree
          # 
          console.log id
          nearestWithV = GSS.get.view(id).nearestViewWithVirtual(name)
          if nearestWithV
            id = nearestWithV.id            
            return id + '"' + name + '"'
          else
            console.error "Virtual with name #{name} not found up tree"
          */

        }
      };
      this.queryCommandCache[selectorKey] = o;
    }
    bindRootAsContext(root, query);
    return o;
  };

  Commander.prototype['$class'] = function(root, sel, scopeId) {
    var o, query, selector,
      _this = this;
    selector = "." + sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: true,
        isLive: false,
        createNodeList: function() {
          return _this.engine.getQueryScopeById(scopeId).getElementsByClassName(sel);
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRootAsMulti(root, o.query);
    return o;
  };

  Commander.prototype['$tag'] = function(root, sel, scopeId) {
    var o, query, selector,
      _this = this;
    selector = sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: true,
        isLive: false,
        createNodeList: function() {
          return _this.engine.getQueryScopeById(scopeId).getElementsByTagName(sel);
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRootAsMulti(root, o.query);
    return o;
  };

  Commander.prototype['$all'] = function(root, sel, scopeId, tracker) {
    var o, query,
      _this = this;
    if (!tracker) {
      tracker = sel;
    }
    o = this.queryCommandCache[tracker];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: tracker,
        isMulti: true,
        isLive: false,
        createNodeList: function() {
          return _this.engine.getQueryScopeById(scopeId).querySelectorAll(sel);
        }
      });
      o = {
        query: query,
        selector: tracker
      };
      this.queryCommandCache[tracker] = o;
    }
    bindRootAsMulti(root, o.query);
    return o;
  };

  Commander.prototype['$id'] = function(root, sel) {
    var o, query, selector,
      _this = this;
    selector = "#" + sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: false,
        isLive: false,
        createNodeList: function() {
          var el;
          el = document.getElementById(sel);
          if (el) {
            return [el];
          } else {
            return [];
          }
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRoot(root, o.query);
    return o;
  };

  Commander.prototype['::this'] = function(root, selector, engine, path, key) {
    return {
      isContextBound: true,
      selectorKey: key,
      selector: path
    };
  };

  Commander.prototype['::parent'] = function(root, selector, engine, path, key) {
    return {
      isContextBound: true,
      selector: key,
      idProcessor: function(id) {
        return GSS.setupId(GSS.getById(id).parentElement);
      }
    };
  };

  Commander.prototype['::window'] = function(root, selector, engine) {
    return {
      selector: "window",
      query: null
    };
  };

  Commander.prototype['::scope'] = function(root, selector, engine, path, pathKey) {
    return {
      idProcessor: function() {
        return GSS.getId(engine.scope);
      },
      isContextBound: !!selector,
      isScopeBound: !selector,
      selector: pathKey,
      query: !selector && engine.registerDomQuery({
        selector: "::scope",
        isMulti: false,
        isLive: true,
        createNodeList: function() {
          return [engine.scope];
        }
      })
    };
  };

  Commander.prototype['$reserved'] = function(root, keyword, selector) {
    var o, parentRule, path, pathKey, pseudo, query;
    if (keyword.charAt(0) === ":") {
      pseudo = keyword;
      keyword = keyword.substring(2);
    } else {
      pseudo = "::" + keyword;
    }
    if (keyword === "window") {
      path = pathKey = keyword;
    } else if (keyword === "scope" && !selector) {
      path = pathKey = pseudo;
    } else {
      parentRule = root.parentRule;
      if (!parentRule) {
        throw new Error(pseudo + " query requires parent rule for context");
      }
      query = parentRule.getContextQuery();
      path = query.selector;
      pathKey = path + pseudo;
    }
    o = this.queryCommandCache[pathKey];
    if (!o) {
      o = this[pseudo](root, selector, this.engine, path, pathKey);
      if (o.isContextBound) {
        o.query = query;
      }
      this.queryCommandCache[pathKey] = o;
    }
    if (o.isContextBound) {
      bindRootAsContext(root, o.query);
    } else if (o.query) {
      bindRoot(root, o.query);
    }
    if (selector) {
      this.bindRootSubselector(root, o, selector);
    }
    return o;
  };

  Commander.prototype['chain'] = function(root, queryObject, bridgessssss) {
    var args, bridge, bridges, engine, more, query, _i, _j, _len, _len1;
    query = queryObject.query;
    args = __slice.call(arguments);
    bridges = __slice.call(args.slice(2, args.length));
    engine = this.engine;
    more = null;
    for (_i = 0, _len = bridges.length; _i < _len; _i++) {
      bridge = bridges[_i];
      if (typeof bridge !== "function") {
        if (!more) {
          more = [];
        }
        more.push(bridge);
        bridges.splice(bridges.indexOf(bridge), 1);
      }
    }
    for (_j = 0, _len1 = bridges.length; _j < _len1; _j++) {
      bridge = bridges[_j];
      bridge.call(engine, query, engine, more);
    }
    return query.on('afterChange', function() {
      var _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = bridges.length; _k < _len2; _k++) {
        bridge = bridges[_k];
        _results.push(bridge.call(engine, query, engine, more));
      }
      return _results;
    });
  };

  Commander.prototype['eq-chain'] = function(root, head, tail, s, w) {
    return this._chainer('eq', head, tail, s, w);
  };

  Commander.prototype['lte-chain'] = function(root, head, tail, s, w) {
    return this._chainer('lte', head, tail, s, w);
  };

  Commander.prototype['gte-chain'] = function(root, head, tail, s, w) {
    return this._chainer('gte', head, tail, s, w);
  };

  Commander.prototype['lt-chain'] = function(root, head, tail, s, w) {
    return this._chainer('lt', head, tail, s, w);
  };

  Commander.prototype['gt-chain'] = function(root, head, tail, s, w) {
    return this._chainer('gt', head, tail, s, w);
  };

  Commander.prototype._chainer = function(op, head, tail, s, w) {
    var engine, tracker, _e_for_chain;
    tracker = "eq-chain-" + GSS.uid();
    engine = this.engine;
    _e_for_chain = this._e_for_chain;
    return function(query, e, more) {
      e.remove(tracker);
      return query.forEach(function(el) {
        var e1, e2, nextEl;
        nextEl = query.next(el);
        if (!nextEl) {
          return;
        }
        e1 = _e_for_chain(el, head, query, tracker, el, nextEl);
        e2 = _e_for_chain(nextEl, tail, query, tracker, el, nextEl);
        return e[op](e1, e2, s, w, more);
      });
    };
  };

  Commander.prototype['plus-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'plus');
  };

  Commander.prototype['minus-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'minus');
  };

  Commander.prototype['multiply-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'multiply');
  };

  Commander.prototype['divide-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'divide');
  };

  Commander.prototype._chainer_math = function(head, tail, op) {
    var engine, _e_for_chain;
    engine = this.engine;
    _e_for_chain = this._e_for_chain;
    return function(el, nextEl, query, tracker) {
      var e1, e2;
      e1 = _e_for_chain(el, head, query, tracker);
      e2 = _e_for_chain(nextEl, tail, query, tracker);
      return engine[op](e1, e2);
    };
  };

  Commander.prototype._e_for_chain = function(el, exp, query, tracker, currentEl, nextEl) {
    var e1;
    if (typeof exp === "string") {
      e1 = this.engine.elVar(el, exp, query.selector);
    } else if (typeof exp === "function") {
      e1 = exp.call(this, currentEl, nextEl, query, tracker);
    } else {
      e1 = exp;
    }
    return e1;
  };

  Commander.prototype['for-each'] = function(root, queryObject, callback) {
    var el, query, _i, _len, _ref;
    query = queryObject.query;
    _ref = query.nodeList;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      callback.call(this.engine, el, query, this.engine);
    }
    return query.on('afterChange', function() {
      var _j, _len1, _ref1, _results;
      _ref1 = query.nodeList;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        el = _ref1[_j];
        _results.push(callback.call(this.engine, el, query));
      }
      return _results;
    });
  };

  Commander.prototype['for-all'] = function(root, queryObject, callback) {
    var query,
      _this = this;
    query = queryObject.query;
    callback.call(this.engine, query, this.engine);
    return query.on('afterChange', function() {
      return callback.call(_this.engine, query, _this.engine);
    });
  };

  Commander.prototype['js'] = function(root, js) {
    eval("var callback =" + js);
    return callback;
  };

  return Commander;

})();

module.exports = Commander;

});
require.register("gss/lib/Thread.js", function(exports, require, module){
var Thread, isConstraint, valueOf,
  __slice = [].slice;

valueOf = function(e) {
  var val;
  val = e.value;
  if (val != null) {
    return val;
  }
  val = Number(e);
  if (val != null) {
    return val;
  }
  throw new Error("Thread.valueOf couldn't find value of: " + e);
};

isConstraint = function(root) {
  if (root[0] === 'cond') {
    return false;
  }
  return true;
};

Thread = (function() {
  function Thread(o) {
    var defaultStrength;
    if (o == null) {
      o = {};
    }
    defaultStrength = o.defaultStrength || 'required';
    this.defaultStrength = c.Strength[defaultStrength];
    if (!this.defaultStrength) {
      this.defaultStrength = c.Strength['required'];
    }
    this.defaultWeight = o.defaultWeight || 0;
    this.setupIfNeeded();
    this;
  }

  Thread.prototype.needsSetup = true;

  Thread.prototype.setupIfNeeded = function() {
    if (!this.needsSetup) {
      return this;
    }
    this.needsSetup = false;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    this.cachedVars = {};
    this.elements = {};
    this.constraintsByTracker = {};
    this.varIdsByTracker = {};
    this.conditionals = [];
    this.activeClauses = [];
    this.__editVarNames = [];
    return this;
  };

  Thread.prototype.postMessage = function(message) {
    this.execute(message);
    return this;
  };

  Thread.prototype.terminate = function() {
    this.needsSetup = true;
    this.solver = null;
    this.cachedVars = null;
    this.constraintsByTracker = null;
    this.varIdsByTracker = null;
    this.conditionals = null;
    this.activeClauses = null;
    this.__editVarNames = null;
    return this;
  };

  Thread.prototype.output = function() {
    return {
      values: this.getValues(),
      clauses: this.activeClauses
    };
  };

  Thread.prototype.execute = function(message) {
    var command, uuid, _i, _len, _ref;
    this.setupIfNeeded();
    uuid = null;
    if (message.uuid) {
      uuid = message.uuid;
    }
    _ref = message.commands;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      command = _ref[_i];
      this._trackRootIfNeeded(command, uuid);
      this._execute(command, command);
    }
    return this;
  };

  Thread.prototype._execute = function(command, root) {
    var func, i, node, sub, subResult;
    node = command;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Thread.execute broke - couldn't find method: " + node[0]);
    }
    i = node.length - 1;
    while (i > 0) {
      sub = node[i];
      if (sub instanceof Array) {
        subResult = this._execute(sub, root);
        if (subResult === "IGNORE") {
          node.splice(i, 1);
        } else {
          node.splice(i, 1, subResult);
        }
      }
      i--;
    }
    return func.call.apply(func, [this, root].concat(__slice.call(node.slice(1, node.length))));
  };

  Thread.prototype.getValues = function() {
    var id, o;
    this._solve();
    o = {};
    for (id in this.cachedVars) {
      o[id] = this.cachedVars[id].value;
    }
    return o;
  };

  Thread.prototype._solve = function(recurses) {
    var conditional, _i, _len, _ref;
    if (recurses == null) {
      recurses = 0;
    }
    this.solver.solve();
    if (this.conditionals.length > 0 && recurses === 0) {
      _ref = this.conditionals;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        conditional = _ref[_i];
        conditional.update();
      }
      recurses++;
      return this._solve(recurses);
    }
  };

  Thread.prototype['virtual'] = function(self, id, names) {
    return self;
  };

  Thread.prototype['track'] = function(root, tracker) {
    this._trackRootIfNeeded(root, tracker);
    return 'IGNORE';
  };

  Thread.prototype._trackRootIfNeeded = function(root, tracker) {
    if (tracker) {
      root._is_tracked = true;
      if (!root._trackers) {
        root._trackers = [];
      }
      if (root._trackers.indexOf(tracker) === -1) {
        return root._trackers.push(tracker);
      }
    }
  };

  Thread.prototype['remove'] = function(self, trackersss) {
    var args, tracker, trackers, _i, _len, _results;
    args = __slice.call(arguments);
    trackers = __slice.call(args.slice(1, args.length));
    _results = [];
    for (_i = 0, _len = trackers.length; _i < _len; _i++) {
      tracker = trackers[_i];
      _results.push(this._remove(tracker));
    }
    return _results;
  };

  Thread.prototype._remove = function(tracker) {
    this._removeConstraintByTracker(tracker);
    return this._removeVarByTracker(tracker);
  };

  Thread.prototype._removeVarByTracker = function(tracker) {
    var id, index, _i, _len, _ref;
    if (this.varIdsByTracker[tracker]) {
      _ref = this.varIdsByTracker[tracker];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        delete this.cachedVars[id];
        index = this.__editVarNames.indexOf(id);
        if (index >= 0) {
          this.__editVarNames.splice(index, 1);
        }
      }
      return delete this.varIdsByTracker[tracker];
    }
  };

  Thread.prototype._removeConstraintByTracker = function(tracker, permenant) {
    var constraint, _i, _len, _ref;
    if (permenant == null) {
      permenant = true;
    }
    if (this.constraintsByTracker[tracker]) {
      _ref = this.constraintsByTracker[tracker];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        if (!constraint._gss_removed) {
          this.solver.removeConstraint(constraint);
          constraint._gss_removed = true;
        }
      }
      if (permenant) {
        return this.constraintsByTracker[tracker] = null;
      }
    }
  };

  Thread.prototype._addConstraintByTracker = function(tracker) {
    var constraint, _i, _len, _ref, _results;
    if (this.constraintsByTracker[tracker]) {
      _ref = this.constraintsByTracker[tracker];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        _results.push(this.solver.addConstraint(constraint));
      }
      return _results;
    }
  };

  Thread.prototype['where'] = function(root, label, labelSuffix) {
    root._condition_bound = true;
    this._trackRootIfNeeded(root, label);
    this._trackRootIfNeeded(root, label + labelSuffix);
    return "IGNORE";
  };

  Thread.prototype['cond'] = function(self, ifffff) {
    var args, clause, clauses, that, _i, _len, _ref;
    args = __slice.call(arguments);
    clauses = [];
    _ref = args.slice(1, args.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      clause = _ref[_i];
      clauses.push(clause);
    }
    that = this;
    return this.conditionals.push({
      clauses: clauses,
      activeLabel: null,
      update: function() {
        var found, newLabel, oldLabel, _j, _len1;
        found = false;
        oldLabel = this.activeLabel;
        for (_j = 0, _len1 = clauses.length; _j < _len1; _j++) {
          clause = clauses[_j];
          newLabel = clause.test();
          if (newLabel) {
            found = true;
            break;
          }
        }
        if (found) {
          if (oldLabel !== newLabel) {
            if (oldLabel != null) {
              that.activeClauses.splice(that.activeClauses.indexOf(oldLabel), 1);
              that._removeConstraintByTracker(oldLabel, false);
            }
            that._addConstraintByTracker(newLabel);
            that.activeClauses.push(newLabel);
            return this.activeLabel = newLabel;
          }
        } else {
          if (oldLabel != null) {
            that.activeClauses.splice(that.activeClauses.indexOf(oldLabel), 1);
            return that._removeConstraintByTracker(oldLabel, false);
          }
        }
      }
    });
  };

  Thread.prototype['clause'] = function(root, condition, label) {
    return {
      label: label,
      test: function() {
        if (!label) {
          return condition;
        }
        if (!condition) {
          return label;
        }
        if (condition.call(this)) {
          return label;
        } else {
          return null;
        }
      }
    };
  };

  Thread.prototype['?>='] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) >= valueOf(e2);
    };
  };

  Thread.prototype['?<='] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) <= valueOf(e2);
    };
  };

  Thread.prototype['?=='] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) === valueOf(e2);
    };
  };

  Thread.prototype['?>'] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) > valueOf(e2);
    };
  };

  Thread.prototype['?<'] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) < valueOf(e2);
    };
  };

  Thread.prototype['?!='] = function(root, e1, e2) {
    return function() {
      return valueOf(e1) !== valueOf(e2);
    };
  };

  Thread.prototype['&&'] = function(root, c1, c2) {
    return c1 && c2;
  };

  Thread.prototype['||'] = function(root, c1, c2) {
    return c1 || c2;
  };

  Thread.prototype.number = function(root, num) {
    return Number(num);
  };

  Thread.prototype._trackVarId = function(id, tracker) {
    if (!this.varIdsByTracker[tracker]) {
      this.varIdsByTracker[tracker] = [];
    }
    if (this.varIdsByTracker[tracker].indexOf(id) === -1) {
      return this.varIdsByTracker[tracker].push(id);
    }
  };

  Thread.prototype["var"] = function(self, id, tracker) {
    var v;
    if (this.cachedVars[id]) {
      return this.cachedVars[id];
    }
    v = new c.Variable({
      name: id
    });
    if (tracker) {
      this._trackVarId(id, tracker);
      v._tracker = tracker;
      v._is_tracked = true;
    }
    this.cachedVars[id] = v;
    return v;
  };

  Thread.prototype.varexp = function(self, id, expression, tracker) {
    var cv, that;
    cv = this.cachedVars;
    if (cv[id]) {
      return cv[id];
    }
    if (!(expression instanceof c.Expression)) {
      throw new Error("Thread `varexp` requires an instance of c.Expression");
    }
    that = this;
    Object.defineProperty(cv, id, {
      configurable: true,
      get: function() {
        var clone;
        clone = expression.clone();
        if (tracker) {
          that._trackVarId(id, tracker);
          clone._tracker = tracker;
          clone._is_tracked = true;
        }
        return clone;
      }
    });
    return expression;
  };

  Thread.prototype.get$ = function(root, prop, elId, selector) {
    this._trackRootIfNeeded(root, elId);
    if (selector) {
      this._trackRootIfNeeded(root, selector + elId);
    }
    return this._get$(prop, elId);
  };

  Thread.prototype._get$ = function(prop, elId) {
    var exp, varId,
      _this = this;
    varId = elId + ("[" + prop + "]");
    switch (prop) {
      case "right":
        exp = c.plus(this._get$("x", elId), this._get$("width", elId));
        exp.clone = function() {
          return c.plus(_this._get$("x", elId), _this._get$("width", elId));
        };
        return this.varexp(null, varId, exp, elId);
      case "bottom":
        exp = c.plus(this._get$("y", elId), this._get$("height", elId));
        exp.clone = function() {
          return c.plus(_this._get$("y", elId), _this._get$("height", elId));
        };
        return this.varexp(null, varId, exp, elId);
      case "center-x":
        exp = c.plus(this._get$("x", elId), c.divide(this._get$("width", elId), 2));
        exp.clone = function() {
          return c.plus(_this._get$("x", elId), c.divide(_this._get$("width", elId), 2));
        };
        return this.varexp(null, varId, exp, elId);
      case "center-y":
        exp = c.plus(this._get$("y", elId), c.divide(this._get$("height", elId), 2));
        exp.clone = function() {
          return c.plus(_this._get$("y", elId), c.divide(_this._get$("height", elId), 2));
        };
        return this.varexp(null, varId, exp, elId);
    }
    return this["var"](null, varId, elId);
  };

  Thread.prototype.get = function(root, id, tracker) {
    var v;
    if (tracker) {
      this._trackRootIfNeeded(root, tracker);
    }
    v = this.cachedVars[id];
    if (v) {
      this._trackRootIfNeeded(root, v.tracker);
      return v;
    } else {
      v = this["var"](null, id);
      return v;
    }
    throw new Error("AST method 'get' couldn't find var with id: " + id);
  };

  Thread.prototype.plus = function(root, e1, e2) {
    if (isConstraint(root)) {
      return c.plus(e1, e2);
    }
    return Object.defineProperty({}, 'value', {
      get: function() {
        return valueOf(e1) + valueOf(e2);
      }
    });
  };

  Thread.prototype.minus = function(root, e1, e2) {
    if (isConstraint(root)) {
      return c.minus(e1, e2);
    }
    return Object.defineProperty({}, 'value', {
      get: function() {
        return valueOf(e1) - valueOf(e2);
      }
    });
  };

  Thread.prototype.multiply = function(root, e1, e2) {
    if (isConstraint(root)) {
      return c.times(e1, e2);
    }
    return Object.defineProperty({}, 'value', {
      get: function() {
        return valueOf(e1) * valueOf(e2);
      }
    });
  };

  Thread.prototype.divide = function(root, e1, e2) {
    if (isConstraint(root)) {
      return c.divide(e1, e2);
    }
    return Object.defineProperty({}, 'value', {
      get: function() {
        return valueOf(e1) / valueOf(e2);
      }
    });
  };

  /* Todo
  remainder: (root,e1,e2) ->
  'Math.abs': ->  
  'Math.acos': ->
  'Math.asin': ->
  'Math.atan': ->
  'Math.atan2': ->
  'Math.ceil': ->
  'Math.cos': ->
  'Math.exp': ->
  'Math.floor': ->
  'Math.imul': ->
  'Math.log': ->
  'Math.max': ->
  'Math.min': ->
  'Math.pow': ->
  'Math.random': ->
  'Math.round': ->
  'Math.sin': ->
  'Math.sqrt': ->
  'Math.tan': ->
  */


  Thread.prototype._strength = function(s) {
    var strength;
    if (typeof s === 'string') {
      if (s === 'require') {
        s = 'required';
      }
      strength = c.Strength[s];
      if (strength) {
        return strength;
      }
    }
    return this.defaultStrength;
  };

  Thread.prototype._weight = function(w) {
    if (typeof w === 'number') {
      return w;
    }
    return this.defaultWeight;
  };

  Thread.prototype._addConstraint = function(root, constraint) {
    var tracker, _i, _len, _ref;
    if (!root._condition_bound) {
      this.solver.addConstraint(constraint);
    }
    if (root._is_tracked) {
      _ref = root._trackers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tracker = _ref[_i];
        if (!this.constraintsByTracker[tracker]) {
          this.constraintsByTracker[tracker] = [];
        }
        this.constraintsByTracker[tracker].push(constraint);
      }
    }
    return constraint;
  };

  Thread.prototype.eq = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Equation(e1, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.lte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.gte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.lt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.gt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype._editvar = function(varr, s, w) {
    if (this.__editVarNames.indexOf(varr.name) === -1) {
      this.__editVarNames.push(varr.name);
      this.solver.addEditVar(varr, this._strength(s), this._weight(w));
    }
    return this;
  };

  Thread.prototype.suggest = function(self, varr, val, s, w) {
    if (s == null) {
      s = 'strong';
    }
    if (typeof varr === 'string') {
      varr = this.get(self, varr);
    }
    this.solver.solve();
    this._editvar(varr, s, w);
    this.solver.suggestValue(varr, val);
    return this.solver.resolve();
  };

  Thread.prototype.stay = function(self) {
    var args, s, v, w, _i, _j, _len, _len1, _ref, _ref1;
    args = __slice.call(arguments);
    s = null;
    w = null;
    _ref = args.slice(1, args.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      v = _ref[_i];
      if (typeof v === 'string') {
        args.splice(args.indexOf(v), 1);
        s = v;
      } else if (typeof v === 'number') {
        args.splice(args.indexOf(v), 1);
        w = v;
      }
    }
    this.solver.solve();
    _ref1 = args.slice(1, args.length);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      v = _ref1[_j];
      if (v instanceof c.Variable) {
        this.solver.addStay(v, this._strength(s), this._weight(w));
      }
    }
    this.solver.resolve();
    return this.solver;
  };

  return Thread;

})();

if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
  module.exports = Thread;
}

});
require.register("gss/lib/dom/Getter.js", function(exports, require, module){
var Getter, getScrollbarWidth, scrollbarWidth;

getScrollbarWidth = function() {
  var inner, outer, w1, w2;
  inner = document.createElement("p");
  inner.style.width = "100%";
  inner.style.height = "200px";
  outer = document.createElement("div");
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.style.zoom = "document";
  outer.appendChild(inner);
  document.body.appendChild(outer);
  w1 = inner.offsetWidth;
  outer.style.overflow = "scroll";
  w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }
  document.body.removeChild(outer);
  return w1 - w2;
};

scrollbarWidth = null;

Getter = (function() {
  function Getter(scope) {
    this.scope = scope;
    this.styleNodes = null;
    if (!this.scope) {
      this.scope = document;
    }
  }

  Getter.prototype.clean = function() {};

  Getter.prototype.destroy = function() {
    this.scope = null;
    return this.styleNodes = null;
  };

  Getter.prototype.scrollbarWidth = function() {
    if (!scrollbarWidth) {
      scrollbarWidth = getScrollbarWidth();
    }
    return scrollbarWidth;
  };

  Getter.prototype.get = function(selector) {
    var identifier, method;
    method = selector[0];
    identifier = selector[1];
    switch (method) {
      case "$reserved":
        if (identifier === 'this') {
          return this.scope;
        }
        break;
      case "$id":
        if (identifier[0] === '#') {
          identifier = identifier.substr(1);
        }
        return document.getElementById(identifier);
      case "$class":
        if (identifier[0] === '.') {
          identifier = identifier.substr(1);
        }
        return this.scope.getElementsByClassName(identifier);
      case "$tag":
        return this.scope.getElementsByTagName(identifier);
    }
    return this.scope.querySelectorAll(identifier);
  };

  Getter.prototype.measure = function(node, dimension) {
    var scroll;
    switch (dimension) {
      case 'width':
      case 'w':
        return node.getBoundingClientRect().width;
      case 'height':
      case 'h':
        return node.getBoundingClientRect().height;
      case 'left':
      case 'x':
        scroll = window.scrollX || window.scrollLeft || 0;
        return node.getBoundingClientRect().left + scroll;
      case 'top':
      case 'y':
        scroll = window.scrollY || window.scrollTop || 0;
        return node.getBoundingClientRect().top + scroll;
      case 'bottom':
        return this.measure(node, 'top') + this.measure(node, 'height');
      case 'right':
        return this.measure(node, 'left') + this.measure(node, 'width');
      case 'centerX':
        return this.measure(node, 'left') + this.measure(node, 'width') / 2;
      case 'centerY':
        return this.measure(node, 'top') + this.measure(node, 'height') / 2;
    }
  };

  Getter.prototype.offsets = function(element) {
    var offsets;
    offsets = {
      x: 0,
      y: 0
    };
    if (!element.offsetParent) {
      return offsets;
    }
    element = element.offsetParent;
    while (true) {
      offsets.x += element.offsetLeft;
      offsets.y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets;
  };

  Getter.prototype.view = function(node) {
    if (typeof node === "string") {
      return GSS.View.byId[node];
    }
    return GSS.View.byId[GSS.getId(node)];
  };

  Getter.prototype.getAllStyleNodes = function() {
    return this.scope.getElementsByTagName("style");
  };

  Getter.prototype.readAllASTs = function() {
    var AST, ASTs, node, _i, _len, _ref;
    ASTs = [];
    _ref = this.getAllStyleNodes();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      AST = this.readAST(node);
      if (AST) {
        ASTs.push(AST);
      }
    }
    return ASTs;
  };

  Getter.prototype.scopeFor = function(node) {
    if (this.isStyleNode(node)) {
      return this.scopeForStyleNode(node);
    } else {
      return this.nearestScope(node);
    }
  };

  Getter.prototype.isStyleNode = function(node) {
    var mime, tagName;
    tagName = node != null ? node.tagName : void 0;
    if (tagName === "STYLE" || tagName === "LINK") {
      mime = typeof node.getAttribute === "function" ? node.getAttribute("type") : void 0;
      if (mime) {
        return mime.indexOf("text/gss") === 0;
      }
    }
    return false;
  };

  Getter.prototype.scopeForStyleNode = function(node) {
    var scoped;
    scoped = node.getAttribute('scoped');
    if ((scoped != null) && scoped !== "false") {
      return node.parentElement;
    } else {
      return Getter.getRootScope();
    }
  };

  Getter.prototype.isScope = function(el) {
    return !!(el != null ? el._gss_is_scope : void 0);
  };

  Getter.prototype.nearestScope = function(el, skipSelf) {
    if (skipSelf == null) {
      skipSelf = false;
    }
    if (skipSelf) {
      el = el.parentElement;
    }
    while (el.parentElement) {
      if (this.isScope(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  Getter.prototype.nearestEngine = function(el, skipSelf) {
    var scope;
    if (skipSelf == null) {
      skipSelf = false;
    }
    scope = this.nearestScope(el, skipSelf);
    if (scope) {
      return this.engine(scope);
    }
    return null;
  };

  Getter.prototype.descdendantNodes = function(el) {
    return el.getElementsByTagName("*");
  };

  Getter.prototype.engine = function(el) {
    return GSS.engines.byId[GSS.getId(el)];
  };

  Getter.prototype.readAST = function(node) {
    var mime, reader;
    mime = node.getAttribute("type");
    reader = this["readAST:" + mime];
    if (reader) {
      return reader.call(this, node);
    }
    return null;
  };

  Getter.prototype['readAST:text/gss-ast'] = function(node) {
    var ast, e, source;
    source = node.textContent.trim();
    if (source.length === 0) {
      return {};
    }
    try {
      ast = JSON.parse(source);
    } catch (_error) {
      e = _error;
      console.error("Parsing compiled gss error", console.dir(e));
    }
    return ast;
  };

  Getter.prototype['readAST:text/gss'] = function(node) {
    throw new Error("did not include GSS's compilers");
  };

  return Getter;

})();

Getter.getRootScope = function() {
  if (typeof ShadowDOMPolyfill === "undefined" || ShadowDOMPolyfill === null) {
    return document.body;
  } else {
    return ShadowDOMPolyfill.wrap(document.body);
  }
};

module.exports = Getter;

});
require.register("gss/lib/dom/IdMixin.js", function(exports, require, module){
var IdMixin, boxSizingPrefix;

boxSizingPrefix = GSS._.boxSizingPrefix;

IdMixin = {
  uid: function() {
    return this._id_counter++;
  },
  _id_counter: 1,
  _byIdCache: {},
  _ids_killed: function(ids) {
    var id, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      _results.push(this._id_killed(id));
    }
    return _results;
  },
  _id_killed: function(id) {
    var _ref;
    this._byIdCache[id] = null;
    delete this._byIdCache[id];
    return (_ref = GSS.View.byId[id]) != null ? typeof _ref.recycle === "function" ? _ref.recycle() : void 0 : void 0;
  },
  getById: function(id) {
    var el;
    if (this._byIdCache[id]) {
      return this._byIdCache[id];
    }
    el = document.querySelector('[data-gss-id="' + id + '"]');
    if (el) {
      this._byIdCache[id] = el;
    }
    return el;
  },
  setupScopeId: function(el) {
    el._gss_is_scope = true;
    return this.setupId(el);
  },
  setupId: function(el) {
    var gid, _id;
    if (!el) {
      return null;
    }
    gid = this.getId(el);
    if (gid == null) {
      _id = this.uid();
      gid = String(el.id || _id);
      el.setAttribute('data-gss-id', gid);
      el.style[boxSizingPrefix] = 'border-box';
      el._gss_id = gid;
      GSS.View["new"]({
        el: el,
        id: gid
      });
    }
    this._byIdCache[gid] = el;
    return gid;
  },
  getId: function(el) {
    if (el != null ? el._gss_id : void 0) {
      return el != null ? el._gss_id : void 0;
    }
    return null;
  }
};

module.exports = IdMixin;

});
require.register("gss/vendor/gl-matrix.js", function(exports, require, module){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.0
 */

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


(function(_global) {
  "use strict";

  var shim = {};
  if (typeof(exports) === 'undefined') {
    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      shim.exports = {};
      define(function() {
        return shim.exports;
      });
    } else {
      // gl-matrix lives in a browser, define its namespaces in global
      shim.exports = typeof(window) !== 'undefined' ? window : _global;
    }
  }
  else {
    // gl-matrix lives in commonjs, define its namespaces in exports
    shim.exports = exports;
  }

  (function(exports) {
    /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */

var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */

var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    var z = (GLMAT_RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */

var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x2 Matrix
 * @name mat2
 */

var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a1 * b2;
    out[1] = a0 * b1 + a1 * b3;
    out[2] = a2 * b0 + a3 * b2;
    out[3] = a2 * b1 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a1 * s;
    out[1] = a0 * -s + a1 * c;
    out[2] = a2 *  c + a3 * s;
    out[3] = a2 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v1;
    out[2] = a2 * v0;
    out[3] = a3 * v1;
    return out;
};

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx,ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0
 *  c, d, 0
 *  tx,ty,1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5],
        ba = b[0], bb = b[1], bc = b[2], bd = b[3],
        btx = b[4], bty = b[5];

    out[0] = aa*ba + ab*bc;
    out[1] = aa*bb + ab*bd;
    out[2] = ac*ba + ad*bc;
    out[3] = ac*bb + ad*bd;
    out[4] = ba*atx + bc*aty + btx;
    out[5] = bb*atx + bd*aty + bty;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;


/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3],
        atx = a[4],
        aty = a[5],
        st = Math.sin(rad),
        ct = Math.cos(rad);

    out[0] = aa*ct + ab*st;
    out[1] = -aa*st + ab*ct;
    out[2] = ac*ct + ad*st;
    out[3] = -ac*st + ct*ad;
    out[4] = ct*atx + st*aty;
    out[5] = ct*aty - st*atx;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var vx = v[0], vy = v[1];
    out[0] = a[0] * vx;
    out[1] = a[1] * vy;
    out[2] = a[2] * vx;
    out[3] = a[3] * vy;
    out[4] = a[4] * vx;
    out[5] = a[5] * vy;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4] + v[0];
    out[5] = a[5] + v[1];
    return out;
};

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */

var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4x4 Matrix
 * @name mat4
 */

var mat4 = {};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        a30, a31, a32, a33;

        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
        a30 = a[12]; a31 = a[13]; a32 = a[14]; a33 = a[15];
    
    out[0] = a00 + a03*x;
    out[1] = a01 + a03*y;
    out[2] = a02 + a03*z;
    out[3] = a03;

    out[4] = a10 + a13*x;
    out[5] = a11 + a13*y;
    out[6] = a12 + a13*z;
    out[7] = a13;

    out[8] = a20 + a23*x;
    out[9] = a21 + a23*y;
    out[10] = a22 + a23*z;
    out[11] = a23;
    out[12] = a30 + a33*x;
    out[13] = a31 + a33*y;
    out[14] = a32 + a33*z;
    out[15] = a33;

    return out;
};
/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class Quaternion
 * @name quat
 */

var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[7]-m[5])*fRoot;
        out[1] = (m[2]-m[6])*fRoot;
        out[2] = (m[3]-m[1])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}
;













  })(shim.exports);
})(this);

});
require.register("the-gss-error-reporter/component.json", function(exports, require, module){
module.exports = {
  "name": "error-reporter",
  "description": "Provide source code context when reporting errors.",
  "author": "Paul Young",
  "repo": "the-gss/error-reporter",
  "version": "0.1.3",
  "json": [
    "component.json"
  ],
  "scripts": [
    "lib/error-reporter.js"
  ],
  "main": "lib/error-reporter.js"
}

});
require.register("the-gss-preparser/component.json", function(exports, require, module){
module.exports = {
  "name": "gss-preparser",
  "description": "GSS preparser",
  "author": "Dan Tocchini <d4@thegrid.io>",
  "repo": "the-gss/preparser",
  "version": "1.0.5-beta",
  "json": [
    "component.json"
  ],
  "scripts": [
    "lib/parser.js",
    "lib/preparser.js"
  ],
  "dependencies": {
    "the-gss/error-reporter": "*"
  },
  "main": "lib/preparser.js"
}

});
require.register("the-gss-ccss-compiler/component.json", function(exports, require, module){
module.exports = {
  "name": "ccss-compiler",
  "description": "Constraint Cascading Style Sheets compiler",
  "author": "Dan Tocchini <d4@thegrid.io>",
  "repo": "the-gss/ccss-compiler",
  "version": "1.0.10-beta",
  "json": [
    "component.json"
  ],
  "scripts": [
    "lib/compiler.js",
    "lib/grammar.js",
    "lib/parser.js"
  ],
  "dependencies": {
    "the-gss/error-reporter": "*"
  },
  "main": "lib/compiler.js",
  "license": "MIT"
}

});


require.register("the-gss-compiler/component.json", function(exports, require, module){
module.exports = {
  "name": "gss-compiler",
  "description": "GSS rule compiler",
  "version": "0.8.2",
  "author": "Dan Tocchini <d4@thegrid.io>",
  "repo": "the-gss/compiler",
  "scripts": [
    "lib/gss-compiler.js"
  ],
  "json": [
    "component.json"
  ],
  "dependencies": {
    "the-gss/preparser": "*",
    "the-gss/ccss-compiler": "*",
    "the-gss/vfl-compiler": "*",
    "the-gss/vgl-compiler": "*"
  },
  "main": "lib/gss-compiler.js"
}

});


require.register("gss/component.json", function(exports, require, module){
module.exports = {
  "name": "gss",
  "repo": "the-gss/engine",
  "description": "GSS runtime",
  "version": "1.0.4-beta",
  "author": "Dan Tocchini <d4@thegrid.io>",
  "repo": "the-gss/engine",
  "json": [
    "component.json"
  ],
  "remotes": [
    "https://raw.githubusercontent.com"
  ],
  "scripts": [
    "lib/GSS-with-compiler.js",
    "lib/GSS.js",
    "lib/_.js",
    "lib/EventTrigger.js",
    "lib/dom/Query.js",
    "lib/dom/View.js",
    "lib/dom/Observer.js",
    "lib/gssom/Node.js",
    "lib/gssom/StyleSheet.js",
    "lib/gssom/Rule.js",
    "lib/Engine.js",
    "lib/Commander.js",
    "lib/Thread.js", 
    "lib/dom/Getter.js",
    "lib/dom/IdMixin.js",
    "vendor/gl-matrix.js"
  ],
  "dependencies": {
    "the-gss/compiler": "*",
    "d4tocchini/customevent-polyfill": "*",
    "slightlyoff/cassowary.js": "*"
  },
  "files": [
    "vendor/observe.js",
    "vendor/sidetable.js",
    "vendor/MutationObserver.js"
  ],
  "main": "lib/GSS-with-compiler.js"
}

});






require.alias("the-gss-compiler/lib/gss-compiler.js", "gss/deps/gss-compiler/lib/gss-compiler.js");
require.alias("the-gss-compiler/lib/gss-compiler.js", "gss/deps/gss-compiler/index.js");
require.alias("the-gss-compiler/lib/gss-compiler.js", "gss-compiler/index.js");
require.alias("the-gss-preparser/lib/parser.js", "the-gss-compiler/deps/gss-preparser/lib/parser.js");
require.alias("the-gss-preparser/lib/preparser.js", "the-gss-compiler/deps/gss-preparser/lib/preparser.js");
require.alias("the-gss-preparser/lib/preparser.js", "the-gss-compiler/deps/gss-preparser/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-preparser/deps/error-reporter/lib/error-reporter.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-preparser/deps/error-reporter/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-error-reporter/index.js");
require.alias("the-gss-preparser/lib/preparser.js", "the-gss-preparser/index.js");
require.alias("the-gss-ccss-compiler/lib/compiler.js", "the-gss-compiler/deps/ccss-compiler/lib/compiler.js");
require.alias("the-gss-ccss-compiler/lib/grammar.js", "the-gss-compiler/deps/ccss-compiler/lib/grammar.js");
require.alias("the-gss-ccss-compiler/lib/parser.js", "the-gss-compiler/deps/ccss-compiler/lib/parser.js");
require.alias("the-gss-ccss-compiler/lib/compiler.js", "the-gss-compiler/deps/ccss-compiler/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-ccss-compiler/deps/error-reporter/lib/error-reporter.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-ccss-compiler/deps/error-reporter/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-error-reporter/index.js");
require.alias("the-gss-ccss-compiler/lib/compiler.js", "the-gss-ccss-compiler/index.js");
require.alias("the-gss-vfl-compiler/lib/compiler.js", "the-gss-compiler/deps/vfl-compiler/lib/compiler.js");
require.alias("the-gss-vfl-compiler/lib/parser.js", "the-gss-compiler/deps/vfl-compiler/lib/parser.js");
require.alias("the-gss-vfl-compiler/lib/compiler.js", "the-gss-compiler/deps/vfl-compiler/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-vfl-compiler/deps/error-reporter/lib/error-reporter.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-vfl-compiler/deps/error-reporter/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-error-reporter/index.js");
require.alias("the-gss-vfl-compiler/lib/compiler.js", "the-gss-vfl-compiler/index.js");
require.alias("the-gss-vgl-compiler/lib/compiler.js", "the-gss-compiler/deps/vgl-compiler/lib/compiler.js");
require.alias("the-gss-vgl-compiler/lib/parser.js", "the-gss-compiler/deps/vgl-compiler/lib/parser.js");
require.alias("the-gss-vgl-compiler/lib/compiler.js", "the-gss-compiler/deps/vgl-compiler/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-vgl-compiler/deps/error-reporter/lib/error-reporter.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-vgl-compiler/deps/error-reporter/index.js");
require.alias("the-gss-error-reporter/lib/error-reporter.js", "the-gss-error-reporter/index.js");
require.alias("the-gss-vgl-compiler/lib/compiler.js", "the-gss-vgl-compiler/index.js");
require.alias("the-gss-compiler/lib/gss-compiler.js", "the-gss-compiler/index.js");
require.alias("d4tocchini-customevent-polyfill/CustomEvent.js", "gss/deps/customevent-polyfill/CustomEvent.js");
require.alias("d4tocchini-customevent-polyfill/CustomEvent.js", "gss/deps/customevent-polyfill/index.js");
require.alias("d4tocchini-customevent-polyfill/CustomEvent.js", "customevent-polyfill/index.js");
require.alias("d4tocchini-customevent-polyfill/CustomEvent.js", "d4tocchini-customevent-polyfill/index.js");
require.alias("slightlyoff-cassowary.js/index.js", "gss/deps/cassowary/index.js");
require.alias("slightlyoff-cassowary.js/src/c.js", "gss/deps/cassowary/src/c.js");
require.alias("slightlyoff-cassowary.js/src/HashTable.js", "gss/deps/cassowary/src/HashTable.js");
require.alias("slightlyoff-cassowary.js/src/HashSet.js", "gss/deps/cassowary/src/HashSet.js");
require.alias("slightlyoff-cassowary.js/src/Error.js", "gss/deps/cassowary/src/Error.js");
require.alias("slightlyoff-cassowary.js/src/SymbolicWeight.js", "gss/deps/cassowary/src/SymbolicWeight.js");
require.alias("slightlyoff-cassowary.js/src/Strength.js", "gss/deps/cassowary/src/Strength.js");
require.alias("slightlyoff-cassowary.js/src/Variable.js", "gss/deps/cassowary/src/Variable.js");
require.alias("slightlyoff-cassowary.js/src/Point.js", "gss/deps/cassowary/src/Point.js");
require.alias("slightlyoff-cassowary.js/src/Expression.js", "gss/deps/cassowary/src/Expression.js");
require.alias("slightlyoff-cassowary.js/src/Constraint.js", "gss/deps/cassowary/src/Constraint.js");
require.alias("slightlyoff-cassowary.js/src/EditInfo.js", "gss/deps/cassowary/src/EditInfo.js");
require.alias("slightlyoff-cassowary.js/src/Tableau.js", "gss/deps/cassowary/src/Tableau.js");
require.alias("slightlyoff-cassowary.js/src/SimplexSolver.js", "gss/deps/cassowary/src/SimplexSolver.js");
require.alias("slightlyoff-cassowary.js/src/Timer.js", "gss/deps/cassowary/src/Timer.js");
require.alias("slightlyoff-cassowary.js/src/parser/parser.js", "gss/deps/cassowary/src/parser/parser.js");
require.alias("slightlyoff-cassowary.js/src/parser/api.js", "gss/deps/cassowary/src/parser/api.js");
require.alias("slightlyoff-cassowary.js/index.js", "cassowary/index.js");

require.alias("gss/lib/GSS-with-compiler.js", "gss/index.js");if (typeof exports == "object") {
  module.exports = require("gss");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("gss"); });
} else {
  this["gss"] = require("gss");
}})();