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
