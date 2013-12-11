var firstSupportedStylePrefix, getTime, tempDiv, _,
  __slice = [].slice;

getTime = Date.now || function() {
  return new Date().getTime();
};

tempDiv = document.createElement("div");

firstSupportedStylePrefix = function(prefixedPropertyNames) {
  var name, _i, _len;
  for (_i = 0, _len = prefixedPropertyNames.length; _i < _len; _i++) {
    name = prefixedPropertyNames[_i];
    if (typeof tempDiv.style[name] !== 'undefined') {
      return name;
    }
  }
  return null;
};

_ = {
  transformPrefix: firstSupportedStylePrefix(["transform", "WebkitTransform", "MozTransform", "OTransform", "msTransform"]),
  boxSizingPrefix: firstSupportedStylePrefix(["boxSizing", "WebkitBoxSizing", "MozBoxSizing", "OBoxSizing", "msBoxSizing"]),
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
  cloneDeep: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  cloneObject: function(obj) {
    var i, target;
    target = {};
    for (i in obj) {
      if (obj.hasOwnProperty(i)) {
        target[i] = obj[i];
      }
    }
    return target;
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
  },
  mat4ToCSS: function(a) {
    return 'matrix3d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
  },
  mat2dToCSS: function(a) {
    return 'matrix(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ')';
  },
  camelize: function(s) {
    var result;
    result = s.replace(/[-_\s]+(.)?/g, function(match, c) {
      if (c) {
        return c.toUpperCase();
      } else {
        return "";
      }
    });
    return result;
  }
};

module.exports = _;
