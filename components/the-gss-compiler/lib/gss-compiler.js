var ccss, compile, inject, parseRules, preparser, runCompiler, uuid, vfl;

preparser = require('gss-preparser');

ccss = require('ccss-compiler');

vfl = require('vfl-compiler');

uuid = function() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r, v;
    r = Math.random() * 16 | 0;
    v = (c === "x" ? r : r & 0x3 | 0x8);
    return v.toString(16);
  });
};

runCompiler = function(chunk) {
  switch (chunk[0]) {
    case 'ccss':
      return ccss.parse(chunk[1]);
    case 'vfl':
      return vfl.parse(chunk[1]);
    case 'gtl':
      return gtl.parse(chunk[1]);
  }
};

compile = function(gss) {
  var rules;
  rules = preparser.parse(gss);
  rules = parseRules(rules);
  return rules;
};

parseRules = function(rules) {
  var chunk, css, e, key, parsed, val, _i, _len;
  css = "";
  for (_i = 0, _len = rules.length; _i < _len; _i++) {
    chunk = rules[_i];
    parsed = {};
    switch (chunk.type) {
      case 'directive':
        switch (chunk.name) {
          case 'horizontal':
          case 'vertical':
          case '-gss-horizontal':
          case '-gss-vertical':
            try {
              parsed = vfl.parse("@" + chunk.name + " " + chunk.terms);
            } catch (_error) {
              e = _error;
              console.log("VFL Parse Error", e);
            }
            break;
          case 'if':
          case 'elseif':
          case 'else':
            if (chunk.terms.length > 0) {
              try {
                parsed = ccss.parse("?(" + chunk.terms + ");");
              } catch (_error) {
                e = _error;
                console.log("CCSS conditional parse Error", e);
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
          e = _error;
          console.log("Constraint Parse Error", e);
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
