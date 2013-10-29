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
  }
};

module.exports = _;
