var Parser, Rules, fn, property, _ref;

Parser = require('../concepts/Parser');

Rules = (function() {
  function Rules() {}

  Rules.prototype[','] = {
    group: '$query',
    separator: ',',
    serialized: true,
    eager: true,
    before: 'onBeforeQuery',
    after: 'onQuery',
    init: 'onSelector',
    command: function(operation, continuation, scope, meta) {
      var contd, index;
      contd = this.getScopePath(scope, continuation) + operation.path;
      if (this.queries.ascending) {
        index = this.engine.indexOfTriplet(this.queries.ascending, operation, contd, scope) === -1;
        if (index > -1) {
          this.queries.ascending.splice(index, 3);
        }
      }
      return this.queries[contd];
    },
    capture: function(result, operation, continuation, scope, meta, ascender) {
      var contd, _base;
      contd = this.getScopePath(scope, continuation) + operation.parent.path;
      this.queries.add(result, contd, operation.parent, scope, operation, continuation);
      (_base = this.queries).ascending || (_base.ascending = []);
      if (this.engine.indexOfTriplet(this.queries.ascending, operation.parent, contd, scope) === -1) {
        this.queries.ascending.push(operation.parent, contd, scope);
      }
      return true;
    },
    release: function(result, operation, continuation, scope) {
      var contd;
      contd = this.getScopePath(scope, continuation) + operation.parent.path;
      this.queries.remove(result, contd, operation.parent, scope, operation, void 0, continuation);
      return true;
    }
  };

  Rules.prototype["rule"] = {
    bound: 1,
    solve: function(operation, continuation, scope, meta, ascender, ascending) {
      if (operation.index === 2 && !ascender && (ascending != null)) {
        this.expressions.solve(operation, continuation, ascending, operation);
        return false;
      }
    },
    capture: function(result, parent, continuation, scope) {
      if (!result.nodeType && !this.isCollection(result) && typeof result !== 'string') {
        this.engine.provide(result);
        return true;
      }
    },
    onAnalyze: function(operation) {
      var parent;
      parent = operation.parent || operation;
      while (parent != null ? parent.parent : void 0) {
        parent = parent.parent;
      }
      return operation.sourceIndex = parent.rules = (parent.rules || 0) + 1;
    }
  };

  Rules.prototype["scoped"] = {
    solve: function(operation, continuation, scope, meta, ascender, ascending) {
      if (operation.index === 2 && !ascender && (ascending != null)) {
        this.expressions.solve(operation, continuation, ascending, operation);
        return false;
      }
    }
  };

  /* Conditional structure 
  
  Evaluates one of two branches
  chosen by truthiness of condition.
  
  Structurally invisible to solver, 
  it leaves trail in continuation path
  */


  Rules.prototype['if'] = {
    primitive: 1,
    cleaning: true,
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
          operation.condition = condition = this.clone(operation);
          condition.parent = operation.parent;
          condition.index = operation.index;
          condition.domain = operation.domain;
        }
        this.solved.solve(condition, continuation, scope);
        return false;
      }
    },
    update: function(operation, continuation, scope, meta, ascender, ascending) {
      var branch, condition, d, id, index, old, path, result, watchers, _base, _base1, _base2, _ref, _ref1;
      (_base = operation.parent).uid || (_base.uid = '@' + (this.engine.methods.uid = ((_base1 = this.engine.methods).uid || (_base1.uid = 0)) + 1));
      path = continuation + operation.parent.uid;
      id = scope._gss_id;
      watchers = (_base2 = this.queries.watchers)[id] || (_base2[id] = []);
      if (!watchers.length || this.indexOfTriplet(watchers, operation.parent, continuation, scope) === -1) {
        watchers.push(operation.parent, continuation, scope);
      }
      condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
      index = condition && 2 || 3;
      old = this.queries[path];
      if (!!old !== !!condition || (old === void 0 && old !== condition)) {
        d = this.pairs.dirty;
        if (old !== void 0) {
          this.queries.clean(this.getContinuation(path), continuation, operation.parent, scope);
        }
        this.queries[path] = condition;
        if (!d && (d = this.pairs.dirty)) {
          this.pairs.onBeforeSolve();
          this.updating.reset();
        }
        this.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', (condition && 'if' || 'else') + this.engine.DESCEND, operation.parent[index], 'font-weight: normal; color: #999', continuation);
        if (branch = operation.parent[index]) {
          result = this.document.solve(branch, this.getContinuation(path, null, this.DESCEND), scope, meta);
          this.updating.paired = void 0;
          if ((_ref = this.pairs) != null) {
            _ref.onBeforeSolve();
          }
          if ((_ref1 = this.queries) != null) {
            _ref1.onBeforeSolve();
          }
        }
        return this.console.groupEnd(path);
      }
    },
    capture: function(result, operation, continuation, scope, meta) {
      if (operation.index === 1) {
        if (continuation != null) {
          this.document.methods["if"].update.call(this.document, operation.parent[1], this.getContinuation(continuation, null, this.DESCEND), scope, meta, void 0, result);
        }
        return true;
      } else {
        if (typeof result === 'object' && !result.nodeType && !this.isCollection(result)) {
          this.provide(result);
          return true;
        }
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
          continuation = node._continuation = this.getContinuation(continuation || '', null, this.engine.DESCEND);
        }
        if (node.getAttribute('scoped') != null) {
          scope = node.parentNode;
        }
      }
      rules = this.clone(this['_' + type](source));
      this.console.row('rules', rules);
      this.engine.engine.solve(rules, continuation, scope);
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
