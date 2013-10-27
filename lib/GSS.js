var GSS, getTime, getter, key, val, _ref,
  __slice = [].slice;

require("customevent-polyfill");

if (!window.MutationObserver) {
  window.MutationObserver = window.JsMutationObserver;
}

if (window.GSS) {
  throw new Error("Only one GSS object per window");
}

GSS = function(o) {
  var engine;
  if (o === document || o === window) {
    return GSS.engines.root;
  }
  if (o.tagName) {
    engine = GSS.getEngine(o);
    if (engine) {
      return engine;
    }
    return new GSS.Engine({
      scope: o
    });
  } else if (o !== null && typeof o === 'object') {
    if (o.scope) {
      engine = GSS.getEngine(o.scope);
      if (engine) {
        engine.boot(o);
        return engine;
      }
    }
    return new Engine(o);
  } else {
    throw new Error("");
  }
};

GSS.boot = function() {
  return GSS({
    scope: GSS.Getter.getRootScope(),
    is_root: true
  });
};

GSS.config = {
  resizeDebounce: 30
};

if (GSS_CONFIG) {
  for (key in GSS_CONFIG) {
    val = GSS_CONFIG[key];
    GSS.config[key] = val;
  }
}

GSS.getEngine = function(el) {
  return GSS.engines.byId[this.getId(el)];
};

GSS._ = {};

getTime = Date.now || function() {
  return new Date().getTime();
};

GSS._.debounce = function(func, wait, immediate) {
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
};

window.GSS = GSS;

GSS.workerURL = require("./WorkerBlobUrl.js");

GSS.Getter = require("./dom/Getter.js");

GSS.Commander = require("./Commander.js");

GSS.Query = require("./dom/Query.js");

GSS.Setter = require("./dom/Setter.js");

GSS.Engine = require("./Engine.js");

_ref = require("./dom/IdMixin.js");
for (key in _ref) {
  val = _ref[key];
  if (GSS[key]) {
    throw new Error("IdMixin key clash: " + key);
  }
  GSS[key] = val;
}

GSS.getter = new GSS.Getter();

getter = GSS.getter;

GSS.observer = require("./dom/Observer.js");
