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

Numeric.Value = Value.extend();

Numeric.Value.Solution = Value.Solution.extend();

Numeric.Value.Variable = Value.Variable.extend({
  group: 'linear'
}, {
  get: function(path, tracker, scoped, engine, operation, continuation, scope) {
    var clone, domain;
    domain = engine.Variable.getDomain(operation, true, true);
    if (!domain || domain.priority < 0) {
      domain = engine;
    } else if (domain !== engine) {
      if (domain.structured) {
        clone = ['get', null, path, engine.Continuation(continuation || "")];
        if (scope && scope !== engine.scope) {
          clone.push(engine.identity.provide(scope));
        }
        clone.parent = operation.parent;
        clone.index = operation.index;
        clone.domain = domain;
        engine.update([clone]);
        return;
      }
    }
    if (scoped) {
      scoped = engine.identity.solve(scoped);
    } else {
      scoped = scope;
    }
    return domain.watch(null, path, operation, engine.Continuation(continuation || contd || ""), scoped);
  }
});

Numeric.Value.Expression = Value.Expression.extend({
  group: 'linear'
}, {
  "+": function(left, right) {
    return left + right;
  },
  "-": function(left, right) {
    return left - right;
  },
  "*": function(left, right) {
    return left * right;
  },
  "/": function(left, right) {
    return left / right;
  }
});

module.exports = Numeric;
