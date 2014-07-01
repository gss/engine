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
    subscribe: function(operation, continuation, scope) {
      var id, watchers, _base;
      id = scope._gss_id;
      watchers = (_base = this.queries._watchers)[id] || (_base[id] = []);
      if (!watchers.length || this.values.indexOf(watchers, operation, continuation, scope) === -1) {
        return watchers.push(operation, continuation, scope);
      }
    },
    capture: function(result, operation, continuation, scope) {
      if (operation.index === 1) {
        this.commands.$if.branch.call(this, operation.parent[1], continuation, scope, void 0, result);
        return true;
      } else {
        console.log('kapture', result);
        if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
          this.expressions.push(result);
          return true;
        }
      }
    },
    branch: function(operation, continuation, scope, ascender, ascending) {
      var condition, path, _base, _base1;
      this.commands.$if.subscribe.call(this, operation.parent, continuation, scope);
      (_base = operation.parent).uid || (_base.uid = '@' + (this.commands.uid = ((_base1 = this.commands).uid || (_base1.uid = 0)) + 1));
      condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
      path = continuation + operation.parent.uid;
      if (this.queries[path] === void 0 || (!!this.queries[path] !== !!condition)) {
        console.group(path);
        if (this.queries[path] !== void 0) {
          console.error('clean', [path, continuation]);
          this.queries.clean(path, continuation, operation, scope);
        }
        if (condition) {
          this.expressions.evaluate(operation.parent[2], path, scope);
        } else if (operation.parent[3]) {
          this.expressions.evaluate(operation.parent[3], path, scope);
        }
        console.groupEnd(path);
        return this.queries[path] = condition != null ? condition : null;
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
