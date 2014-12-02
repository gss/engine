/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Block, Command, Domain, Numeric, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Block = require('../commands/Block');

Numeric = (function(_super) {
  __extends(Numeric, _super);

  function Numeric() {
    _ref = Numeric.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Numeric.prototype.priority = 10;

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

Numeric.prototype.Variable.Expression = Variable.Expression.extend();

Numeric.prototype.Variable.Expression.define(Variable.Expression.algebra);

Numeric.prototype.Block = Block.extend();

Numeric.prototype.Block.Meta = Block.Meta.extend({
  signature: [
    {
      body: ['Any']
    }
  ]
}, {
  'object': {
    execute: function(result) {
      return result;
    },
    descend: function(engine, operation) {
      var meta, scope;
      meta = operation[0];
      scope = meta.scope && engine.identity[meta.scope] || engine.scope;
      return [operation[1].command.solve(engine, operation[1], meta.key, scope, void 0, operation[0])];
    }
  }
});

module.exports = Numeric;
