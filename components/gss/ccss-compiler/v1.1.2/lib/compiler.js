var ErrorReporter, parse, parser, scoper, vfl, vflHook, vgl, vglHook;

if (typeof window !== "undefined" && window !== null) {
  parser = require('./parser');
  scoper = require('./scoper');
} else {
  parser = require('../lib/parser');
  scoper = require('../lib/scoper');
}

vfl = require('vfl-compiler');

vgl = require('vgl-compiler');

ErrorReporter = require('error-reporter');

parse = function(source) {
  var columnNumber, error, errorReporter, lineNumber, message, results;
  results = null;
  try {
    results = parser.parse(source);
  } catch (_error) {
    error = _error;
    errorReporter = new ErrorReporter(source);
    message = error.message, lineNumber = error.line, columnNumber = error.column;
    errorReporter.reportError(message, lineNumber, columnNumber);
  }
  return scoper(results);
};

vflHook = function(name, terms, commands) {
  var i, nestedCommand, newCommands, o, ruleSet, s, selector, _i, _j, _len, _len1, _ref, _ref1, _ref2;
  if (commands == null) {
    commands = [];
  }
  newCommands = [];
  o = vfl.parse("@" + name + " " + terms);
  _ref = o.statements;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    s = _ref[_i];
    newCommands = newCommands.concat(parse(s).commands);
  }
  if (commands.length > 0 && o.selectors.length > 0) {
    ruleSet = "";
    _ref1 = o.selectors;
    for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
      selector = _ref1[i];
      /* to prepend ::scope inside parans
      prefix = ''
      if selector[0] is "("
        prefix = "("
        selector = selector.substr(1,selector.length-1)
      
      # prepend selector with ::scope unless
      if selector.indexOf("&") isnt 0
        if selector.indexOf("::") isnt 0
          if selector.indexOf('"') isnt 0
            prefix += "::scope "
      
      ruleSet += prefix + selector
      */

      ruleSet += selector;
      if (i !== o.selectors.length - 1) {
        ruleSet += ", ";
      }
    }
    ruleSet += " {}";
    nestedCommand = parse(ruleSet).commands[0];
    nestedCommand[2] = commands;
    newCommands.push(nestedCommand);
    if (typeof window !== "undefined" && window !== null ? (_ref2 = window.GSS) != null ? _ref2.console : void 0 : void 0) {
      window.GSS.console.row('@' + name, o.statements.concat([ruleSet]), terms);
    }
  }
  return {
    commands: newCommands
  };
};

vglHook = function(name, terms, commands) {
  var newCommands, s, statements, _i, _len;
  if (commands == null) {
    commands = [];
  }
  newCommands = [];
  statements = vgl.parse("@" + name + " " + terms);
  for (_i = 0, _len = statements.length; _i < _len; _i++) {
    s = statements[_i];
    newCommands = newCommands.concat(parse(s).commands);
  }
  return {
    commands: commands.concat(newCommands)
  };
};

parser.hooks = {
  directives: {
    'h': vflHook,
    'v': vflHook,
    'horizontal': vflHook,
    'vertical': vflHook,
    'grid-template': vglHook,
    'grid-rows': vglHook,
    'grid-cols': vglHook
  }
};

module.exports = {
  parse: parse,
  scope: scoper
};
