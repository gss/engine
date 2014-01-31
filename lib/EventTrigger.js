var EventTrigger;

EventTrigger = (function() {
  function EventTrigger() {
    this._listenersByType = {};
    this;
  }

  EventTrigger.prototype._getListeners = function(type) {
    var byType;
    if (this._listenersByType[type]) {
      byType = this._listenersByType[type];
    } else {
      byType = [];
      this._listenersByType[type] = byType;
    }
    return byType;
  };

  EventTrigger.prototype.on = function(type, listener) {
    var listeners;
    listeners = this._getListeners(type);
    if (listeners.indexOf(listener) === -1) {
      listeners.push(listener);
    }
    return this;
  };

  EventTrigger.prototype.once = function(type, listener) {
    var that, wrap;
    wrap = null;
    that = this;
    wrap = function(o) {
      listener.call(that, o);
      return that.off(type, wrap);
    };
    this.on(type, wrap);
    return this;
  };

  EventTrigger.prototype.off = function(type, listener) {
    var i, listeners;
    listeners = this._getListeners(type);
    i = listeners.indexOf(listener);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
    return this;
  };

  EventTrigger.prototype.offAll = function(target) {
    var i, listeners, type, _ref;
    if (typeof target === "string") {
      if (target) {
        this._listenersByType[target] = [];
      }
    } else if (typeof target === "function") {
      _ref = this._listenersByType;
      for (type in _ref) {
        listeners = _ref[type];
        i = listeners.indexOf(target);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
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
