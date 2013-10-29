var GSS, getter, key, val, _ref;

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
    engine = GSS.get.engine(o);
    if (engine) {
      return engine;
    }
    return new GSS.Engine({
      scope: o
    });
  } else if (o !== null && typeof o === 'object') {
    if (o.scope) {
      engine = GSS.get.engine(o.scope);
      if (engine) {
        return engine;
      }
    }
    return new GSS.Engine(o);
  } else {
    throw new Error("");
  }
};

GSS.config = {
  resizeDebounce: 32
};

if (typeof GSS_CONFIG !== "undefined" && GSS_CONFIG !== null) {
  for (key in GSS_CONFIG) {
    val = GSS_CONFIG[key];
    GSS.config[key] = val;
  }
}

window.GSS = GSS;

GSS._ = require("./_.js");

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

GSS.get = GSS.getter;

GSS.observer = require("./dom/Observer.js");

GSS.boot = function() {
  return GSS({
    scope: GSS.Getter.getRootScope(),
    is_root: true
  });
};

GSS.update = function() {};

GSS.updateEngines = function() {};
