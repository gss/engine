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

  Constraint.prototype.toHash = function(meta) {
    var hash, property;
    hash = '';
    if (meta.values) {
      for (property in meta.values) {
        hash += property;
      }
    }
    return hash;
  };

  Constraint.prototype.get = function(engine, operation, scope) {
    var _ref1, _ref2;
    return (_ref1 = engine.operations) != null ? (_ref2 = _ref1[operation.hash || (operation.hash = this.toExpression(operation))]) != null ? _ref2[this.toHash(scope)] : void 0 : void 0;
  };

  Constraint.prototype.fetch = function(engine, operation) {
    var constraint, operations, signature, _ref1, _ref2;
    if (operations = (_ref1 = engine.operations) != null ? _ref1[operation.hash || (operation.hash = this.toExpression(operation))] : void 0) {
      for (signature in operations) {
        constraint = operations[signature];
        if (((_ref2 = engine.constraints) != null ? _ref2.indexOf(constraint) : void 0) > -1) {
          return constraint;
        }
      }
    }
  };

  Constraint.prototype.before = function(args, engine, operation, continuation, scope) {
    return this.get(engine, operation, scope);
  };

  Constraint.prototype.after = function(args, result, engine, operation, continuation, scope) {
    var _base, _base1, _name, _name1;
    if (result.hashCode) {
      return (_base = ((_base1 = (engine.operations || (engine.operations = {})))[_name1 = operation.hash || (operation.hash = this.toExpression(operation))] || (_base1[_name1] = {})))[_name = this.toHash(scope)] || (_base[_name] = result);
    }
    return result;
  };

  return Constraint;

})(Command);

module.exports = Constraint;
