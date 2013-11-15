var getTime, _,
  __slice = [].slice;

getTime = Date.now || function() {
  return new Date().getTime();
};

_ = {
  defer: function(func) {
    return setTimeout(func, 1);
  },
  debounce: function(func, wait, immediate) {
    var args, context, result, timeout, timestamp;
    timeout = void 0;
    args = void 0;
    context = void 0;
    timestamp = void 0;
    result = void 0;
    return function() {
      var callNow, later;
      context = this;
      args = __slice.call(arguments);
      timestamp = getTime();
      later = function() {
        var last;
        last = getTime() - timestamp;
        if (last < wait) {
          return timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            return result = func.apply(context, args);
          }
        }
      };
      callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
      }
      return result;
    };
  },
  filterVarsForDisplay: function(vars) {
    var idx, k, key, keysToKill, obj, val, _i, _len;
    obj = {};
    keysToKill = [];
    for (key in vars) {
      val = vars[key];
      idx = key.indexOf("intrinsic-");
      if (idx !== -1) {
        keysToKill.push(key.replace("intrinsic-", ""));
      } else {
        obj[key] = val;
      }
    }
    for (_i = 0, _len = keysToKill.length; _i < _len; _i++) {
      k = keysToKill[_i];
      delete obj[k];
    }
    return obj;
  },
  varsByViewId: function(vars) {
    var gid, key, prop, val, varsById;
    varsById = {};
    for (key in vars) {
      val = vars[key];
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        if (!varsById[gid]) {
          varsById[gid] = {};
        }
        prop = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        varsById[gid][prop] = val;
      }
    }
    return varsById;
  }
};

module.exports = _;
