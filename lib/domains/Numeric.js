/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Command, Domain, Numeric, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Numeric = (function(_super) {
  __extends(Numeric, _super);

  function Numeric() {
    _ref = Numeric.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Numeric.prototype.priority = 200;

  Numeric.prototype.Units = require('../commands/Unit');

  Numeric.prototype.url = null;

  return Numeric;

})(Domain);

Numeric.prototype.Variable = Variable.extend({}, {
  get: function(path, engine, operation, continuation, scope) {
    var meta;
    if (meta = this.getMeta(operation)) {
      continuation = meta.key;
      scope || (scope = meta.scope && engine.identity[meta.scope] || engine.scope);
    }
    return engine.watch(null, path, operation, this.delimit(continuation || ''), scope);
  }
});

Numeric.prototype.Variable.Expression = Variable.Expression.extend({
  before: function(args, engine) {
    var arg, _i, _len;
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if ((arg == null) || arg !== arg) {
        return NaN;
      }
    }
  }
});

Numeric.prototype.Variable.Expression.define(Variable.Expression.algebra);

Numeric.prototype.Meta = Command.Meta.extend({}, {
  'object': {
    execute: function(result) {
      return result;
    },
    descend: function(engine, operation, continuation, scope, ascender, ascending) {
      var meta;
      if (ascender != null) {
        return [ascending];
      }
      meta = operation[0];
      scope = meta.scope && engine.identity[meta.scope] || engine.scope;
      return [operation[1].command.solve(engine, operation[1], meta.key, scope, void 0, operation[0])];
    }
  }
});

module.exports = Numeric;
