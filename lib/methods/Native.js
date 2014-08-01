var Native,
  __hasProp = {}.hasOwnProperty;

Native = (function() {
  function Native() {}

  Native.prototype.camelize = function(string) {
    return string.toLowerCase().replace(/-([a-z])/gi, function(match) {
      return match[1].toUpperCase();
    });
  };

  Native.prototype.dasherize = function(string) {
    return string.replace(/[A-Z]/g, function(match) {
      return '-' + match[0].toLowerCase();
    });
  };

  Native.prototype.indexOfTriplet = function(array, a, b, c) {
    var index, op, _i, _len;
    if (array) {
      for (index = _i = 0, _len = array.length; _i < _len; index = _i += 3) {
        op = array[index];
        if (op === a && array[index + 1] === b && array[index + 2] === c) {
          return index;
        }
      }
    }
    return -1;
  };

  Native.prototype.setImmediate = typeof setImmediate !== "undefined" && setImmediate !== null ? setImmediate : setTimeout;

  Native.prototype.mixin = function(proto) {
    var Context, Mixin, constructor, fn, index, mixin, name, _i, _len, _ref;
    Context = function() {};
    if (proto.prototype) {
      Context.prototype = new proto;
      constructor = proto;
    } else {
      Context.prototype = proto;
    }
    Mixin = function() {
      var ctor, _i, _len;
      if (constructor) {
        if (constructor.push) {
          for (_i = 0, _len = constructor.length; _i < _len; _i++) {
            ctor = constructor[_i];
            ctor.apply(this, arguments);
          }
        } else {
          return constructor.apply(this, arguments);
        }
      }
    };
    Mixin.prototype = new Context;
    for (index = _i = 0, _len = arguments.length; _i < _len; index = ++_i) {
      mixin = arguments[index];
      if (!mixin || index === 0) {
        continue;
      }
      if ((fn = mixin.prototype.constructor) !== Function) {
        if (constructor) {
          if (constructor.push) {
            constructor.push(fn);
          } else {
            constructor = [constructor, fn];
          }
        } else {
          constructor = fn;
        }
      }
      _ref = mixin.prototype;
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        fn = _ref[name];
        Mixin.prototype[name] = fn;
      }
    }
    if (constructor && constructor.push) {
      Mixin.prototype.constructor = Mixin;
    }
    return Mixin;
  };

  Native.prototype.time = function(other, time) {
    time || (time = (typeof performance !== "undefined" && performance !== null ? performance.now() : void 0) || (typeof Date.now === "function" ? Date.now() : void 0) || +(new Date));
    if (time && !other) {
      return time;
    }
    return Math.floor((time - other) * 100) / 100;
  };

  Native.prototype.clone = function(object) {
    if (object && object.map) {
      return object.map(this.clone, this);
    }
    return object;
  };

  return Native;

})();

module.exports = Native;
