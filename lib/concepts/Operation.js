var Operation;

Operation = (function() {
  function Operation(engine) {
    if (!engine) {
      return Array.prototype.slice.call(arguments);
    } else if (this.engine) {
      return new Operation(engine);
    }
    this.engine = engine;
  }

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
      if (!domain.linear.signatures[operation[0]]) {
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
    while (!(operation.command instanceof this.engine.Command.Default)) {
      operation = operation.parent;
    }
    return operation;
  };

  return Operation;

})();

module.exports = Operation;
