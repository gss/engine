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
      property: ['String']
    }
  ];

  function Variable() {}

  Variable.prototype.before = function(args, engine, operation, continuation, scope) {
    var value, _ref1;
    if ((value = scope != null ? (_ref1 = scope.values) != null ? _ref1[args[0]] : void 0 : void 0) != null) {
      return value;
    }
  };

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

Value.Expression.algebra = {
  '+': function(left, right) {
    return left + right;
  },
  '-': function(left, right) {
    return left - right;
  },
  '*': function(left, right) {
    return left * right;
  },
  '/': function(left, right) {
    return left / right;
  }
};

Value.Expression.Constant = (function(_super) {
  __extends(Constant, _super);

  function Constant() {
    _ref2 = Constant.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  Constant.prototype.signature = [
    {
      left: ['Number'],
      right: ['Number']
    }
  ];

  return Constant;

})(Value.Expression);

Value.Expression.Constant.define(Value.Expression.algebra);

module.exports = Value;
