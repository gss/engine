var Values;

Values = (function() {
  function Values(engine) {
    this.engine = engine;
  }

  Values.prototype.get = function(id, property) {
    var path;
    if (property === null) {
      property = id;
      id = null;
    }
    if (id) {
      path = id + '[' + property + ']';
    } else {
      path = property;
    }
    return this[path];
  };

  Values.prototype.merge = function(object) {
    var old, prop, value;
    for (prop in object) {
      value = object[prop];
      old = this[prop];
      if (old === value) {
        continue;
      }
      if (this.engine._onChange) {
        this.engine._onChange(prop, value, old);
      }
      if (value != null) {
        this[prop] = value;
      } else {
        delete this[prop];
      }
    }
    return this;
  };

  Values.prototype["export"] = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      value = this[property];
      if (this.hasOwnProperty(property)) {
        if (property !== 'engine') {
          object[property] = value;
        }
      }
    }
    return object;
  };

  return Values;

})();

module.exports = Values;
