var Rules, fn, property, _ref;

GSS.Parser = require('ccss-compiler');

Rules = (function() {
  function Rules() {}

  Rules.prototype[','] = {
    group: '$query',
    separator: ',',
    serialized: true,
    eager: true,
    command: function(operation, continuation, scope, meta) {
      var contd;
      contd = this.queries.getScopePath(continuation) + operation.path;
      return this.queries.get(contd);
    },
    capture: function(result, operation, continuation, scope, meta) {
      var contd;
      contd = this.queries.getScopePath(continuation) + operation.parent.path;
      this.queries.add(result, contd, operation.parent, scope, true);
      if (meta === GSS.UP) {
        return contd + this.identify(result);
      }
      return true;
    },
    release: function(result, operation, continuation, scope) {
      var contd;
      contd = this.queries.getScopePath(continuation) + operation.parent.path;
      this.queries.remove(result, contd, operation.parent, scope, true);
      return true;
    }
  };

  Rules.prototype["rule"] = {
    bound: 1,
    evaluate: function(operation, continuation, scope, meta, ascender, ascending) {
      if (operation.index === 2 && !ascender) {
        this.expressions.evaluate(operation, continuation, ascending, operation);
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
      if (scope == null) {
        scope = this.scope;
      }
      id = scope._gss_id;
      watchers = (_base = this.queries._watchers)[id] || (_base[id] = []);
      if (!watchers.length || this.values.indexOf(watchers, operation, continuation, scope) === -1) {
        return watchers.push(operation, continuation, scope);
      }
    },
    capture: function(result, operation, continuation, scope, meta) {
      if (operation.index === 1) {
        this.commands["if"].branch.call(this, operation.parent[1], continuation, scope, meta, void 0, result);
        return true;
      } else {
        if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
          this.expressions.push(result);
          return true;
        }
      }
    },
    branch: function(operation, continuation, scope, meta, ascender, ascending) {
      var branch, condition, index, path, query, _base, _base1;
      this.commands["if"].subscribe.call(this, operation.parent, continuation, scope);
      (_base = operation.parent).uid || (_base.uid = '@' + (this.commands.uid = ((_base1 = this.commands).uid || (_base1.uid = 0)) + 1));
      condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
      path = continuation + operation.parent.uid;
      query = this.queries[path];
      if (query === void 0 || (!!query !== !!condition)) {
        index = condition && 2 || 3;
        this.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', GSS.DOWN, operation.parent[index], 'font-weight: normal; color: #999', continuation);
        if (query !== void 0) {
          this.queries.clean(path, continuation, operation.parent, scope);
        }
        if (branch = operation.parent[index]) {
          this.expressions.evaluate(branch, path, scope, meta);
        }
        this.console.groupEnd(path);
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
    command: function(operation, continuation, scope, meta, node, type, source) {
      var capture, nodeContinuation, nodeType, rules;
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
          continuation = node._continuation = this.getContinuation(continuation || '', null, GSS.DOWN);
        }
        if (node.getAttribute('scoped') != null) {
          scope = node.parentNode;
        }
      }
      rules = this['_' + type](source);
      rules = GSS.clone(rules);
      capture = this.expressions.capture(type);
      this.run(rules, continuation, scope, GSS.DOWN);
      if (capture) {
        this.expressions.release();
      }
    }
  };

  Rules.prototype["load"] = {
    command: function(operation, continuation, scope, meta, node, type, method) {
      var src, xhr,
        _this = this;
      if (method == null) {
        method = 'GET';
      }
      src = node.href || node.src || node;
      type || (type = node.type || 'text/gss');
      xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        var capture;
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            capture = _this.expressions.capture(src);
            _this._eval.command.call(_this, operation, continuation, scope, meta, node, type, xhr.responseText);
            if (capture) {
              return _this.expressions.release();
            }
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
