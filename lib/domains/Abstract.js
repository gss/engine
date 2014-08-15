var Abstract, Domain, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Abstract = (function(_super) {
  __extends(Abstract, _super);

  function Abstract() {
    _ref = Abstract.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return Abstract;

})(Domain);

Abstract.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property, contd) {
      var id;
      if (typeof object === 'string') {
        id = object;
      } else if (object.absolute === 'window' || object === document) {
        id = '::window';
      } else if (object.nodeType) {
        id = this.identity.provide(object);
      }
      if (!property) {
        id = '';
        property = object;
        object = void 0;
      }
      return ['get', id, property, this.getContinuation(continuation || contd || '')];
    }
  };

  Methods.prototype.set = {
    command: function() {
      var object;
      object = this.intrinsic || this.assumed;
      return object.set.apply(object, arguments);
    }
  };

  Methods.prototype.suggest = {
    command: function() {
      return this.assumed.set.apply(this.assumed, arguments);
    }
  };

  Methods.prototype.value = function(value, continuation, string, exported) {
    var op, property, scope;
    console.info(Array.prototype.slice.call(arguments));
    if (exported) {
      op = string.split(',');
      scope = op[1];
      property = op[2];
      this.engine.values[this.engine.getPath(scope, property)] = value;
    }
    return value;
  };

  return Methods;

})();

module.exports = Abstract;
