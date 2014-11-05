var Command, Constraint, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Constraint = (function(_super) {
  __extends(Constraint, _super);

  function Constraint() {
    _ref = Constraint.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Constraint.prototype.type = 'Constraint';

  Constraint.prototype.signature = [
    {
      left: ['Value', 'Number'],
      right: ['Value', 'Number']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ];

  Constraint.prototype.descend = function(engine, operation, continuation, scope) {
    var name, result, _ref1, _ref2;
    if (!(((_ref1 = operation.parent.parent) != null ? _ref1.length : void 0) > 1)) {
      if (!(((_ref2 = engine.constraints) != null ? _ref2.length : void 0) > 0)) {
        if (name = this.getConstantName(engine, operation, continuation, scope)) {
          if (result = engine.bypass(name, operation, continuation, scope)) {
            return result;
          }
        }
      }
    }
    return Constraint.__super__.descend.apply(this, arguments);
  };

  Constraint.prototype.before = function(args) {
    if (!args.push) {
      return args;
    }
  };

  Constraint.prototype.getConstantName = function(engine, operation) {
    var name, prop, variable, _ref1;
    _ref1 = operation.variables;
    for (prop in _ref1) {
      variable = _ref1[prop];
      if (variable.domain.displayName === engine.displayName) {
        if (name) {
          return;
        }
        name = prop;
      }
    }
    return name;
  };

  return Constraint;

})(Command);

module.exports = Constraint;
