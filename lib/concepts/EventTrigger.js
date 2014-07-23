var EventTrigger;

EventTrigger = (function() {
  function EventTrigger() {}

  EventTrigger.prototype.once = function(type, fn) {
    fn.once = true;
    return this.addEventListener(type, fn);
  };

  EventTrigger.prototype.addEventListener = function(type, fn) {
    var _base;
    return ((_base = this.events)[type] || (_base[type] = [])).push(fn);
  };

  EventTrigger.prototype.removeEventListener = function(type, fn) {
    var group, index;
    if (group = this.events[type]) {
      if ((index = group.indexOf(fn)) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  EventTrigger.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, method, _i;
    if (group = this.events[type]) {
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

  EventTrigger.prototype.dispatchEvent = function(element, type, detail, bubbles, cancelable) {
    if (!this.scope) {
      return;
    }
    (detail || (detail = {})).engine = this;
    return element.dispatchEvent(new CustomEvent(type, {
      detail: detail,
      bubbles: bubbles,
      cancelable: cancelable
    }));
  };

  EventTrigger.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  return EventTrigger;

})();

module.exports = EventTrigger;
