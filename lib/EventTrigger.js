var EventTrigger;

EventTrigger = (function() {
  function EventTrigger() {
    this._listenersByType = {};
    this;
  }

  EventTrigger.prototype._getListeners = function(type) {
    if (this._listenersByType[type]) {
      return this._listenersByType[type];
    }
    this._listenersByType[type] = [];
    return this._listenersByType[type];
  };

  EventTrigger.prototype.on = function(type, listener) {
    var listeners;
    listeners = this._getListeners(type);
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
    return this;
  };

  EventTrigger.prototype.off = function(type, listener) {
    var i, listeners;
    listeners = this._getListeners(type);
    i = listeners.indexOf(listener);
    if (i !== -1) {
      listeners.slice(i, 1);
    }
    return this;
  };

  EventTrigger.prototype.offAll = function(type) {
    if (type) {
      this._listenersByType[type] = [];
    } else {
      this._listenersByType = {};
    }
    return this;
  };

  EventTrigger.prototype.trigger = function(type, o) {
    var listener, _i, _len, _ref;
    _ref = this._getListeners(type);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      listener = _ref[_i];
      listener.call(this, o);
    }
    return this;
  };

  return EventTrigger;

})();

EventTrigger.make = function(obj) {
  var key, val, _ref;
  if (obj == null) {
    obj = {};
  }
  EventTrigger.prototype.constructor.call(obj);
  _ref = EventTrigger.prototype;
  for (key in _ref) {
    val = _ref[key];
    if (key === "constructor") {
      val.call(obj);
    } else {
      obj[key] = val;
    }
  }
  return obj;
};

module.exports = EventTrigger;
