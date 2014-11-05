/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Command, Domain, Numeric, Value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Command = require('../concepts/Command');

Value = require('../commands/Value');

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

Numeric.prototype.Value = Value.extend();

Numeric.prototype.Value.Variable = Value.Variable.extend({
  group: 'linear'
}, {
  get: function(path, engine, operation, continuation, scope) {
    return engine.watch(null, path, operation, engine.Continuation(continuation || ""), scope);
  }
});

Numeric.prototype.Value.Expression = Value.Expression.extend();

module.exports = Numeric;
