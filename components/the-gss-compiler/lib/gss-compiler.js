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
  var e, rules;
  try {
    rules = preparser.parse(gss.trim());
  } catch (_error) {
    e = _error;
    console.log("Preparse Error", e);
  }
  rules = parseRules(rules);
  return rules;
};

parseRules = function(rules) {
  var ccssRule, ccssRules, chunk, css, e, key, parsed, subParsed, subrules, val, vflRule, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1;
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
              e = _error;
              console.log("VGL Parse Error: @" + chunk.name + " " + chunk.terms, e);
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
                e = _error;
                console.log("VGL generated CCSS parse Error", e);
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
                e = _error;
                console.log("VGL generated VFL parse Error", e);
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
              e = _error;
              console.log("VFL Parse Error: @" + chunk.name + " " + chunk.terms, e);
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
                e = _error;
                console.log("VFL generated CCSS parse Error", e);
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
