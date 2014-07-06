var Rules, fn, property, _ref;

GSS.Parser = require('ccss-compiler');

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

  Rules.prototype[','] = {
    group: '$query',
    separator: ',',
    serialized: true,
    eager: true,
    serialize: function(operation, scope) {
      if (scope && scope !== this.scope) {
        return this.recognize(scope) + operation.path;
      } else {
        return operation.path;
      }
    },
    command: function(operation, continuation, scope) {
      continuation = this.commands[','].serialize.call(this, operation, scope);
      return this.queries.get(continuation);
    },
    capture: function(result, operation, continuation, scope) {
      continuation = this.commands[','].serialize.call(this, operation.parent, scope);
      this.queries.add(result, continuation, operation.parent, scope, ',');
      return true;
    },
    release: function(result, operation, continuation, scope) {
      continuation = this.commands[','].serialize.call(this, operation.parent, scope);
      this.queries.remove(result, continuation, operation.parent, scope, ',');
      return true;
    }
  };

  Rules.prototype["rule"] = {
    bound: 1,
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

  Rules.prototype["if"] = {
    primitive: 1,
    cleaning: true,
    subscribe: function(operation, continuation, scope) {
      var id, watchers, _base;
      id = scope._gss_id;
      watchers = (_base = this.queries._watchers)[id] || (_base[id] = []);
      if (!watchers.length || this.values.indexOf(watchers, operation, continuation, scope) === -1) {
        return watchers.push(operation, continuation, scope);
      }
    },
    capture: function(result, operation, continuation, scope) {
      debugger;
      if (operation.index === 1) {
        this.commands["if"].branch.call(this, operation.parent[1], continuation, scope, void 0, result);
        return true;
      } else {
        if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
          this.expressions.push(result);
          return true;
        }
      }
    },
    branch: function(operation, continuation, scope, ascender, ascending) {
      var condition, path, query, _base, _base1;
      this.commands["if"].subscribe.call(this, operation.parent, continuation, scope);
      (_base = operation.parent).uid || (_base.uid = '@' + (this.commands.uid = ((_base1 = this.commands).uid || (_base1.uid = 0)) + 1));
      condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
      path = continuation + operation.parent.uid;
      query = this.queries[path];
      if (query === void 0 || (!!query !== !!condition)) {
        console.group(path);
        if (query !== void 0) {
          this.queries.clean(path, continuation, operation.parent, scope);
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

  Rules.prototype["text/gss-ast"] = function(source) {
    return JSON.parse(source);
  };

  Rules.prototype["text/gss"] = function(source) {
    var _ref;
    return (_ref = GSS.Parser.parse(source)) != null ? _ref.commands : void 0;
  };

  Rules.prototype["eval"] = {
    command: function(operation, continuation, scope, node, type, source) {
      var nodeContinuation, nodeType, rules;
      if (type == null) {
        type = 'text/gss';
      }
      if (node.nodeType) {
        if (nodeType = node.getAttribute('type')) {
          type = nodeType;
        }
        source || (source = node.textContent || node);
        if ((nodeContinuation = node._continuation) != null) {
          this.queries.clean(nodeContinuation);
          continuation = nodeContinuation;
        } else if (!operation) {
          continuation = this.getContinuation(node.tagName.toLowerCase(), node);
        } else {
          continuation = node._continuation = this.getContinuation(continuation || '', null, '↓');
        }
        if (node.getAttribute('scoped') != null) {
          scope = node.parentNode;
        }
      }
      rules = this['_' + type](source);
      console.log('Eval', rules, continuation);
      rules = GSS.clone(rules);
      this.run(rules, continuation, scope);
    }
  };

  Rules.prototype["load"] = {
    command: function(operation, continuation, scope, node, type, method) {
      var src, xhr,
        _this = this;
      if (method == null) {
        method = 'GET';
      }
      src = node.href || node.src || node;
      type || (type = node.type || 'text/gss');
      xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            return _this._eval.command.call(_this, operation, continuation, scope, node, type, xhr.responseText);
          }
        }
      };
      xhr.open(method.toUpperCase(), src);
      return xhr.send();
    }
  };

  return Rules;

})();

_ref = Rules.prototype;
for (property in _ref) {
  fn = _ref[property];
  fn.rule = true;
}

module.exports = Rules;
