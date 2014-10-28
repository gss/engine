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

  Variable.getDomain = function(engine, operation, force, quick) {
    var cmd, constraint, d, domain, index, intrinsic, path, prefix, property, scope, variable, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;
    if (operation.domain && !force) {
      return operation.domain;
    }
    _ref1 = variable = operation, cmd = _ref1[0], scope = _ref1[1], property = _ref1[2];
    path = this.getPath(scope, property);
    intrinsic = engine.intrinsic;
    if ((scope || path.indexOf('[') > -1) && property && ((intrinsic != null ? intrinsic.properties[path] : void 0) != null)) {
      domain = intrinsic;
    } else if (scope && property && (intrinsic != null ? intrinsic.properties[property] : void 0) && !intrinsic.properties[property].matcher) {
      domain = intrinsic;
    } else {
      _ref2 = engine.domains;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        d = _ref2[_i];
        if (d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path]) && d.displayName !== 'Solved') {
          domain = d;
          break;
        }
        if (d.substituted) {
          _ref3 = d.substituted;
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            constraint = _ref3[_j];
            if ((_ref4 = constraint.substitutions) != null ? _ref4[path] : void 0) {
              domain = d;
              break;
            }
          }
        }
      }
    }
    if (!domain) {
      if (property && (index = property.indexOf('-')) > -1) {
        prefix = property.substring(0, index);
        if ((domain = engine[prefix])) {
          if (!(domain instanceof engine.Domain)) {
            domain = void 0;
          }
        }
      }
      if (!domain) {
        if (!quick) {
          domain = this.engine.linear.maybe();
        }
      }
    }
    if (variable && !force) {
      variable.domain = domain;
    }
    return domain;
  };

  Variable.getPath = function(id, property) {
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      if (typeof id !== 'string') {
        if (id.nodeType) {
          id = this.engine.identity.provide(id);
        } else {
          id = id.path;
        }
      }
      return id + '[' + property + ']';
    }
  };

  Variable.prototype.getPath = Variable.getPath;

  Variable.prototype.getDomain = Variable.getDomain;

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
