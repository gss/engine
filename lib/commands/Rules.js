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
        return false;
      }
    },
    capture: function(result, parent, continuation, scope) {
      if (!result.nodeType && !this.isCollection(result)) {
        this.expressions.push(result);
        return true;
      }
    }
  };

  Rules.prototype["$if"] = {
    primitive: 1,
    capture: function(result, parent, continuation, scope) {
      if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
        this.expressions.push(result);
        return true;
      }
    },
    evaluate: function(operation, continuation, scope, ascender, ascending) {
      var condition;
      if (operation.index === 1) {
        return 'compute';
      } else if (operation.index === 2 && (!ascender)) {
        condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
        console.group('if', operation.parent[1], condition && 'then' || 'else');
        debugger;
        if (condition) {
          this.expressions.evaluate(operation.parent[2], continuation, scope, void 0, void 0, 'overloaded');
        } else if (operation.parent[3]) {
          this.expressions.evaluate(operation.parent[3], continuation, scope, void 0, void 0, 'overloaded');
        }
        console.groupEnd('if', operation.parent[1], condition && 'then' || 'else');
        return false;
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
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          return 1;
        }
      }
    };
    return xhr.open(node.toUpperCase(), src);
  };

  return Rules;

})();

module.exports = Rules;
