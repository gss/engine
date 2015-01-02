var Command, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('./Command');

Variable = (function(_super) {
  __extends(Variable, _super);

  Variable.prototype.type = 'Variable';

  Variable.prototype.signature = [
    {
      property: ['String']
    }
  ];

  Variable.prototype.log = function() {};

  Variable.prototype.unlog = function() {};

  function Variable() {}

  Variable.prototype.before = function(args, engine, operation, continuation, scope, ascender, ascending) {
    var value, _ref;
    if ((value = ascending != null ? (_ref = ascending.values) != null ? _ref[args[0]] : void 0 : void 0) != null) {
      return value;
    }
  };

  Variable.prototype.declare = function(engine, name) {
    var variable, variables;
    variables = engine.variables;
    if (!(variable = variables[name])) {
      variable = variables[name] = engine.variable(name);
    }
    (engine.declared || (engine.declared = {}))[name] = variable;
    return variable;
  };

  Variable.prototype.undeclare = function(engine, variable, quick) {
    var _ref;
    if (quick) {
      (engine.replaced || (engine.replaced = {}))[variable.name] = variable;
    } else {
      (engine.nullified || (engine.nullified = {}))[variable.name] = variable;
      if ((_ref = engine.declared) != null ? _ref[variable.name] : void 0) {
        delete engine.declared[variable.name];
      }
    }
    delete engine.values[variable.name];
    engine.nullify(variable);
    return engine.unedit(variable);
  };

  return Variable;

})(Command);

Variable.Expression = (function(_super) {
  __extends(Expression, _super);

  function Expression() {
    _ref = Expression.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Expression.prototype.signature = [
    {
      left: ['Variable', 'Number'],
      right: ['Variable', 'Number']
    }
  ];

  return Expression;

})(Variable);

Variable.Expression.algebra = {
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

module.exports = Variable;
