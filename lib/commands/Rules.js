var Rules, compiler;

compiler = require('gss-compiler');

Rules = (function() {
  function Rules() {}

  Rules.prototype[';'] = {
    prefix: '',
    noop: true,
    evaluate: function(arg, evaluated) {
      var value;
      if (arg.index === 0) {
        return arg;
      }
      if (arg.index === 1 || (evaluated[1] && arg.index === 2)) {
        value = this.evaluate(arg);
        if (value === void 0) {
          value = null;
        }
        return value;
      }
    }
  };

  Rules.prototype["$rule"] = {
    evaluate: function(operation, continuation, scope, ascender, ascending) {
      if (operation.index === 2 && !ascender) {
        this.expressions.evaluate(operation, continuation, ascending, void 0, void 0, operation.parent);
      } else {
        return this;
      }
    },
    capture: function(result, parent, continuation, scope) {
      return this.expressions.push(result);
    },
    command: function(path, condition, positive, negative) {
      if (condition) {
        return positive;
      } else {
        return negative;
      }
    }
  };

  Rules.prototype["$if"] = {
    prefix: "@if",
    evaluate: function(arg, i, evaluated) {
      var _ref;
      if (i === 0) {
        return arg;
      }
      if (i === 1 || ((_ref = evaluated[1]) != null ? _ref : i === {
        2: i === 3
      })) {
        return this.evaluate(arg);
      }
    }
  };

  Rules.prototype["$eval"] = function(node, type) {
    var rules, scope, _ref, _ref1;
    if (type == null) {
      type = 'text/gss';
    }
    if ((node.type || type) === 'text/gss-ast') {
      rules = JSON.parse((_ref = node.textContent) != null ? _ref : node);
    } else {
      rules = compiler.compile((_ref1 = node.textContent) != null ? _ref1 : node);
    }
    scope = node.nodeType && (node.getAttribute('scoped') != null) && node.parentNode || this.scope;
    this.run(rules, void 0, scope);
  };

  Rules.prototype["$load"] = function(node, type, method) {
    var src, xhr;
    if (method == null) {
      method = 'GET';
    }
    src = node.href || node.src || node;
    type || (type = node.type || 'text/gss');
    xhr = new XMLHttpRequest();
    xhr.onstatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 20) {
        return 1;
      }
    };
    return xhr.open(node.toUpperCase(), src);
  };

  return Rules;

})();

module.exports = Rules;
