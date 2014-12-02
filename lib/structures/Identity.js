var Identity,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Identity = (function() {
  function Identity() {
    this.set = __bind(this.set, this);
  }

  Identity.uid = 0;

  Identity.prototype.set = function(object, generate) {
    var id, uid;
    if (typeof object === 'string') {
      if (object.charAt(0) !== '$' && object.charAt(0) !== ':') {
        return '$' + object;
      }
      return object;
    }
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        if (uid = object._gss_uid) {
          object._gss_id = uid;
        }
        object._gss_id = id || (id = "$" + (object.id || object._gss_id || ++Identity.uid));
        this[id] = object;
      }
    }
    return id;
  };

  Identity.prototype.get = function(id) {
    return this[id];
  };

  Identity.prototype.solve = function(id) {
    return this[id];
  };

  Identity.prototype.unset = function(object) {
    return delete this[object._gss_id];
  };

  Identity.prototype.find = function(object) {
    return this.set(object, false);
  };

  return Identity;

})();

module.exports = Identity;
