var CustomEvent, Events;

CustomEvent = function(event, params) {
  var evt;
  if (params == null) {
    params = {
      bubbles: false,
      cancelable: false,
      detail: void 0
    };
  }
  evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

if (typeof window !== "undefined" && window !== null) {
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}

Events = (function() {
  function Events() {
    this.listeners || (this.listeners = {});
    this.eventHandler = this.handleEvent.bind(this);
    if (this.events) {
      this.addListeners(this.events);
    }
  }

  Events.prototype.destroy = function() {
    this.triggerEvent('destroy');
    if (this.scope) {
      this.dispatchEvent(this.scope, 'destroy');
    }
    if (this.events) {
      return this.removeListeners(this.events);
    }
  };

  Events.prototype.addListeners = function(listeners) {
    var callback, name, _results;
    _results = [];
    for (name in listeners) {
      callback = listeners[name];
      _results.push(this.addEventListener(name, callback));
    }
    return _results;
  };

  Events.prototype.removeListeners = function(listeners) {
    var callback, name, _results;
    _results = [];
    for (name in listeners) {
      callback = listeners[name];
      _results.push(this.removeEventListener(name, callback));
    }
    return _results;
  };

  Events.prototype.once = function(type, fn) {
    fn.once = true;
    return this.addEventListener(type, fn);
  };

  Events.prototype.addEventListener = function(type, fn) {
    var _base;
    return ((_base = this.listeners)[type] || (_base[type] = [])).push(fn);
  };

  Events.prototype.removeEventListener = function(type, fn) {
    var group, index;
    if (group = this.listeners[type]) {
      if ((index = group.indexOf(fn)) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  Events.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, method, _i, _ref;
    if (group = (_ref = this.listeners) != null ? _ref[type] : void 0) {
      for (index = _i = group.length - 1; _i >= 0; index = _i += -1) {
        fn = group[index];
        if (fn.once) {
          group.splice(index, 1);
        }
        fn.call(this, a, b, c);
      }
    }
    if (this[method = 'on' + type]) {
      return this[method](a, b, c);
    }
  };

  Events.prototype.dispatchEvent = function(element, type, data, bubbles, cancelable) {
    var detail, prop, value;
    if (!this.scope) {
      return;
    }
    detail = {
      engine: this
    };
    for (prop in data) {
      value = data[prop];
      detail[prop] = value;
    }
    return element.dispatchEvent(new CustomEvent(type, {
      detail: detail,
      bubbles: bubbles,
      cancelable: cancelable
    }));
  };

  Events.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Events.prototype.then = function(callback) {
    return this.once(this.DONE, callback);
  };

  return Events;

})();

module.exports = Events;
