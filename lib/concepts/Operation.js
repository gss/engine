var Operation,
  __hasProp = {}.hasOwnProperty;

Operation = (function() {
  function Operation(engine) {
    if (!engine) {
      return Array.prototype.slice.call(arguments);
    } else if (this.engine) {
      return new Operation(engine);
    }
    this.engine = engine;
  }

  Operation.prototype.sanitize = function(exps, soft, parent, index) {
    var exp, i, prop, value, _i, _len;
    if (parent == null) {
      parent = exps.parent;
    }
    if (index == null) {
      index = exps.index;
    }
    if (exps[0] === 'value' && exps.operation) {
      return parent[index] = this.sanitize(exps.operation, soft, parent, index);
    }
    for (prop in exps) {
      if (!__hasProp.call(exps, prop)) continue;
      value = exps[prop];
      if (!isFinite(parseInt(prop))) {
        if (prop !== 'variables') {
          delete exps[prop];
        }
      }
    }
    for (i = _i = 0, _len = exps.length; _i < _len; i = ++_i) {
      exp = exps[i];
      if (exp != null ? exp.push : void 0) {
        this.sanitize(exp, soft, exps, i);
      }
    }
    exps.parent = parent;
    exps.index = index;
    return exps;
  };

  Operation.prototype.orphanize = function(operation) {
    var arg, _i, _len;
    if (operation.domain) {
      delete operation.domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg != null ? arg.push : void 0) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Operation.prototype.getContext = function(operation, args, scope, node) {
    var index, _ref;
    index = args[0].def && 4 || 0;
    if (args.length !== index && ((_ref = args[index]) != null ? _ref.nodeType : void 0)) {
      return args[index];
    }
    if (!operation.bound) {
      if (operation.def.serialized && operation[1].def && (args[index] != null)) {
        return args[index];
      }
      return this.engine.scope;
    }
    return scope;
  };

  Operation.prototype.getDomain = function(operation, domain) {
    var arg, _i, _len;
    if (typeof operation[0] === 'string') {
      if (!domain.methods[operation[0]]) {
        return this.engine.linear.maybe();
      }
      for (_i = 0, _len = operation.length; _i < _len; _i++) {
        arg = operation[_i];
        if (arg.domain && arg.domain.priority > domain.priority && arg.domain < 0) {
          return arg.domain;
        }
      }
    }
    return domain;
  };

  Operation.prototype.ascend = function(operation, domain) {
    var parent, _ref;
    if (domain == null) {
      domain = operation.domain;
    }
    parent = operation;
    while (parent.parent && typeof parent.parent[0] === 'string' && (!this.engine.Command(parent.parent) || parent.domain === domain)) {
      parent = parent.parent;
    }
    while (((_ref = parent.parent) != null ? _ref.domain : void 0) === parent.domain) {
      parent = parent.parent;
    }
    return parent;
  };

  Operation.prototype.getRoot = function(operation) {
    while (!operation.def.noop) {
      operation = operation.parent;
    }
    return operation;
  };

  Operation.prototype.getQueryPath = function(operation, continuation) {
    if (continuation) {
      if (continuation.nodeType) {
        return this.engine.identity.provide(continuation) + ' ' + operation.path;
      } else if (operation.marked && operation.arity === 2) {
        return continuation + operation.path;
      } else {
        return continuation + (operation.key || operation.path);
      }
    } else {
      return operation.key;
    }
  };

  return Operation;

})();

module.exports = Operation;
