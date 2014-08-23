var Identity;

Identity = (function() {
  function Identity() {}

  Identity.uid = 0;

  Identity.prototype.provide = function(object, generate) {
    var id;
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        object._gss_id = id || (id = "$" + (object.id || (this.uid || (this.uid = (this.uid || 0) + 1))));
      }
      this[id] = object;
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
    return delete this[id];
  };

  Identity.prototype.find = function(object) {
    return this.provide(object, false);
  };

  return Identity;

})();

module.exports = Identity;
