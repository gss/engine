var Variables;

Variables = (function() {
  function Variables() {}

  Variables.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property) {
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
      return ['get', id, property, this.getContinuation(continuation || '')];
    }
  };

  Variables.prototype.set = {
    command: function() {
      var object;
      object = this.intrinsic || this.assumed;
      return object.set.apply(object, arguments);
    }
  };

  Variables.prototype.suggest = {
    command: function() {
      return this.assumed.set.apply(this.assumed, arguments);
    }
  };

  Variables.prototype.got = function(value) {
    return value;
  };

  Variables.prototype.value = function(value) {
    return value;
  };

  return Variables;

})();

Variables.prototype.got.hidden = true;

module.exports = Variables;
