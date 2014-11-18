var Command, Constraint;

Command = require('../concepts/Command');

Constraint = Command.extend({
  type: 'Constraint',
  signature: [
    {
      left: ['Value', 'Number'],
      right: ['Value', 'Number']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ],
  toHash: function(meta) {
    var hash, property;
    hash = '';
    if (meta.values) {
      for (property in meta.values) {
        hash += property;
      }
    }
    return hash;
  },
  get: function(engine, operation, scope) {
    var _ref, _ref1;
    return (_ref = engine.operations) != null ? (_ref1 = _ref[operation.hash || (operation.hash = this.toExpression(operation))]) != null ? _ref1[this.toHash(scope)] : void 0 : void 0;
  },
  fetch: function(engine, operation) {
    var constraint, operations, signature, _ref, _ref1;
    if (operations = (_ref = engine.operations) != null ? _ref[operation.hash || (operation.hash = this.toExpression(operation))] : void 0) {
      for (signature in operations) {
        constraint = operations[signature];
        if (((_ref1 = engine.constraints) != null ? _ref1.indexOf(constraint) : void 0) > -1) {
          return constraint;
        }
      }
    }
  },
  before: function(args, engine, operation, continuation, scope, ascender, ascending) {
    return this.get(engine, operation, ascending);
  },
  after: function(args, result, engine, operation, continuation, scope, ascender, ascending) {
    var _base, _base1, _name, _name1;
    if (result.hashCode) {
      return (_base = ((_base1 = (engine.operations || (engine.operations = {})))[_name1 = operation.hash || (operation.hash = this.toExpression(operation))] || (_base1[_name1] = {})))[_name = this.toHash(ascending)] || (_base[_name] = result);
    }
    return result;
  }
});

module.exports = Constraint;
