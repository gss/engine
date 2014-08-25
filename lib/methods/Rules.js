var Parser, Rules, fn, property, _ref;

Parser = require('../concepts/Parser');

Rules = (function() {
  function Rules() {}

  Rules.prototype[','] = {
    group: '$query',
    separator: ',',
    serialized: true,
    eager: true,
    command: function(operation, continuation, scope, meta) {
      var contd;
      contd = this.getScopePath(continuation) + operation.path;
      return this.queries.get(contd);
    },
    capture: function(result, operation, continuation, scope, meta) {
      var contd;
      contd = this.getScopePath(continuation) + operation.parent.path;
      this.queries.add(result, contd, operation.parent, scope, true);
      if (meta === this.UP) {
        return contd + this.identity.provide(result);
      }
      return true;
    },
    release: function(result, operation, continuation, scope) {
      var contd;
      contd = this.getScopePath(continuation) + operation.parent.path;
      this.queries.remove(result, contd, operation.parent, scope, true);
      return true;
    }
  };

  Rules.prototype["rule"] = {
    bound: 1,
    solve: function(operation, continuation, scope, meta, ascender, ascending) {
      if (operation.index === 2 && !ascender) {
        this.expressions.solve(operation, continuation, ascending, operation);
        return false;
      }
    },
    capture: function(result, parent, continuation, scope) {
      if (!result.nodeType && !this.isCollection(result)) {
        this.engine.provide(result);
        return true;
      }
    }
  };

  /* Conditional structure 
  
  Evaluates one of two branches
  chosen by truthiness of condition,
  which is stored as dom query
  
  Invisible to solver, 
  it leaves trail in continuation path
  */


  Rules.prototype["if"] = {
    primitive: 1,
    cleaning: 'solved',
    solve: function(operation, continuation, scope, meta, ascender, ascending) {
      var arg, condition, _i, _len, _ref;
      if (this === this.solved) {
        return;
      }
      _ref = operation.parent;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        if (arg[0] === true) {
          arg.shift();
        }
      }
      if (operation.index === 1 && !ascender) {
        if (!(condition = operation.condition)) {
          condition = this.clone(operation);
          condition.parent = operation.parent;
          condition.index = operation.index;
          condition.domain = operation.domain;
        }
        console.error('execute solver blah blah', continuation);
        this.solved.solve(condition, continuation, scope);
        return false;
      }
    },
    subscribe: function(operation, continuation, scope) {
      var id, watchers, _base;
      if (scope == null) {
        scope = this.scope;
      }
      id = scope._gss_id;
      watchers = (_base = this.queries.watchers)[id] || (_base[id] = []);
      if (!watchers.length || this.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        return watchers.push(operation, continuation, scope);
      }
    },
    capture: function(result, operation, continuation, scope, meta) {
      if (operation.index === 1) {
        this.document.methods["if"].branch.call(this.document, operation.parent[1], this.getContinuation(continuation), scope, meta, void 0, result);
        return true;
      } else {
        if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
          this.provide(result);
          return true;
        }
      }
    },
    branch: function(operation, continuation, scope, meta, ascender, ascending) {
      var branch, condition, index, path, query, _base, _base1;
      this.methods["if"].subscribe.call(this, operation.parent, continuation, scope);
      (_base = operation.parent).uid || (_base.uid = '@' + (this.methods.uid = ((_base1 = this.methods).uid || (_base1.uid = 0)) + 1));
      condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
      path = continuation + operation.parent.uid;
      query = this.queries[path];
      if (query === void 0 || (!!query !== !!condition)) {
        index = condition && 2 || 3;
        this.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', this.engine.DOWN, operation.parent[index], 'font-weight: normal; color: #999', continuation);
        console.error(query, condition, 7777, path);
        if (query !== void 0) {
          this.queries.clean(path, continuation, operation.parent, scope);
        }
        if (branch = operation.parent[index]) {
          this.document.solve(branch, path, scope, meta);
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
    return (_ref = Parser.parse(source)) != null ? _ref.commands : void 0;
  };

  Rules.prototype["text/gss-value"] = function() {
    return source({
      parse: function(value) {
        var match, old;
        if ((old = (this.parsed || (this.parsed = {}))[value]) == null) {
          if (typeof value === 'string') {
            if (match = value.match(StaticUnitRegExp)) {
              return this.parsed[value] = this[match[2]](parseFloat(match[1]));
            } else {
              value = 'a: == ' + value + ';';
              return this.parsed[value] = Parser.parse(value).commands[0][2];
            }
          } else {
            return value;
          }
        }
        return old;
      }
    });
  };

  Rules.prototype.StaticUnitRegExp = /^(-?\d+)(px|pt|cm|mm|in)$/i;

  Rules.prototype["eval"] = {
    command: function(operation, continuation, scope, meta, node, type, source, label) {
      var nodeContinuation, nodeType, rules;
      if (type == null) {
        type = 'text/gss';
      }
      if (label == null) {
        label = type;
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
          continuation = node._continuation = this.getContinuation(continuation || '', null, this.engine.DOWN);
        }
        if (node.getAttribute('scoped') != null) {
          scope = node.parentNode;
        }
      }
      rules = this['_' + type](source);
      this.engine.engine.solve(this.clone(rules), continuation, scope, this.engine.DOWN);
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
        if (xhr.readyState === 4 && xhr.status === 200) {
          return _this["eval"].command.call(_this, operation, continuation, scope, meta, node, type, xhr.responseText, src);
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
