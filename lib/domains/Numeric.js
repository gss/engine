/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Domain, Numeric, Selectors, property, value, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Selectors = require('../methods/Selectors');

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

Numeric.prototype.Methods = (function(_super) {
  __extends(Methods, _super);

  function Methods() {
    _ref1 = Methods.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Methods.prototype["&&"] = function(a, b) {
    return a && b;
  };

  Methods.prototype["||"] = function(a, b) {
    return a || b;
  };

  Methods.prototype["+"] = function(a, b) {
    return a + b;
  };

  Methods.prototype["-"] = function(a, b) {
    return a - b;
  };

  Methods.prototype["*"] = function(a, b) {
    return a * b;
  };

  Methods.prototype["/"] = function(a, b) {
    return a / b;
  };

  Methods.prototype['Math'] = Math;

  Methods.prototype['Infinity'] = Infinity;

  Methods.prototype['NaN'] = NaN;

  Methods.prototype.isVariable = function(object) {
    return object[0] === 'get';
  };

  Methods.prototype.isConstraint = function(object) {
    return this.constraints[object[0]];
  };

  Methods.prototype.get = {
    command: function(operation, continuation, scope, meta, object, path, contd, scoped) {
      var clone, domain;
      path = this.Variable.getPath(object, path);
      domain = this.Variable.getDomain(operation, true, true);
      if (!domain || domain.priority < 0) {
        domain = this;
      } else if (domain !== this) {
        if (domain.structured) {
          clone = ['get', null, path, this.getContinuation(continuation || "")];
          if (scope && scope !== this.scope) {
            clone.push(this.identity.provide(scope));
          }
          clone.parent = operation.parent;
          clone.index = operation.index;
          clone.domain = domain;
          this.update([clone]);
          return;
        }
      }
      if (scoped) {
        scoped = this.engine.identity.solve(scoped);
      } else {
        scoped = scope;
      }
      return domain.watch(null, path, operation, this.getContinuation(continuation || contd || ""), scoped);
    }
  };

  return Methods;

})(Domain.prototype.Methods);

_ref2 = Selectors.prototype;
for (property in _ref2) {
  value = _ref2[property];
  Numeric.prototype.Methods.prototype[property] = value;
}

Numeric.prototype.Methods.prototype['*'].linear = false;

Numeric.prototype.Methods.prototype['/'].linear = false;

module.exports = Numeric;
