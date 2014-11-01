var Command, Value, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Value = (function(_super) {
  __extends(Value, _super);

  function Value() {
    _ref = Value.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Value.prototype.type = 'Value';

  return Value;

})(Command);

Value.Variable = (function(_super) {
  __extends(Variable, _super);

  Variable.prototype.signature = [
    {
      property: ['String'],
      tracker: ['String'],
      scoped: ['String']
    }
  ];

  function Variable() {}

  Variable.prototype.after = function(engine, node, args, result, operation, continuation, scope) {
    if (result.length > 0) {
      if (result.length > 1) {
        this.paths = result.splice(1);
      }
      return result[0];
    }
  };

  Variable.prototype.isVariable = true;

  Variable.prototype.continuations = void 0;

  Variable.prototype.variables = void 0;

  Variable.prototype.paths = void 0;

  return Variable;

})(Value);

Value.Expression = (function(_super) {
  __extends(Expression, _super);

  function Expression() {
    _ref1 = Expression.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Expression.prototype.signature = [
    {
      left: ['Value', 'Number'],
      right: ['Value', 'Number']
    }
  ];

  return Expression;

})(Value);

Value.Solution = (function(_super) {
  __extends(Solution, _super);

  function Solution() {
    _ref2 = Solution.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  Solution.prototype.signature = [
    {
      property: ['String'],
      contd: ['String'],
      value: ['Number']
    }
  ];

  return Solution;

})(Value);

Value.Solution.define({
  got: function(property, contd, value, engine, operation, continuation, scope) {
    var uid, variable, _base, _base1, _base2, _name;
    if (engine.suggest && engine.solver) {
      variable = ((_base = operation.parent).suggestions || (_base.suggestions = {}))[operation.index];
      if (!variable) {
        (_base1 = Domain.prototype.Methods).uids || (_base1.uids = 0);
        uid = ++Domain.prototype.Methods.uids;
        variable = (_base2 = operation.parent.suggestions)[_name = operation.index] || (_base2[_name] = engine.declare(null, operation));
        variable.suggest = value;
        variable.operation = operation;
        this.constrained || (this.constrained = []);
      }
      return variable;
    }
    if (!continuation && contd) {
      return engine.solve(operation.parent, contd, engine.identity.solve(scoped), operation.index, value);
    }
    return value;
  }
});

module.exports = Value;
