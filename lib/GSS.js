var GSS, LOG_PASS, TIME, TIME_END, key, val, _ref, _ref1;

require("customevent-polyfill");

require("cassowary");

if (window.GSS) {
  throw new Error("Only one GSS object per window");
}

GSS = window.GSS = function(o) {
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
  defaultStrength: 'weak',
  defaultWeight: 0,
  verticalScroll: true,
  horizontalScroll: false,
  resizeDebounce: 32,
  defaultMatrixType: 'mat4',
  observe: true,
  observerOptions: {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  },
  debug: false,
  warn: true,
  perf: false,
  fractionalPixels: true,
  readyClass: true,
  processBeforeSet: null,
  maxDisplayRecursionDepth: 30,
  useWorker: !!window.Worker,
  worker: '../dist/worker.js',
  useOffsetParent: true
};

if (typeof GSS_CONFIG !== "undefined" && GSS_CONFIG !== null) {
  for (key in GSS_CONFIG) {
    val = GSS_CONFIG[key];
    GSS.config[key] = val;
  }
}

if (((_ref = location.search) != null ? _ref.substring(1) : void 0) === 'noworker') {
  GSS.config.useWorker = false;
}

GSS.deblog = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, arguments);
  }
};

GSS.warn = function() {};

GSS.error = function(message) {
  GSS.trigger('error', message);
  throw new Error(message);
};

GSS.warn = function(message) {
  GSS.trigger('warn', message);
  if (GSS.config.warn) {
    return typeof console.warn === "function" ? console.warn.apply(console, arguments) : void 0;
  }
};

LOG_PASS = function(pass, bg) {
  if (bg == null) {
    bg = "green";
  }
  return GSS.deblog("%c" + pass, "color:white; padding:2px; font-size:14px; background:" + bg + ";");
};

TIME = function() {
  if (GSS.config.perf) {
    return console.time.apply(console, arguments);
  }
};

TIME_END = function() {
  if (GSS.config.perf) {
    return console.timeEnd.apply(console, arguments);
  }
};

GSS._ = require("./_.js");

GSS.glMatrix = require('../vendor/gl-matrix');

GSS.EventTrigger = require("./EventTrigger.js");

GSS.Getter = require("./dom/Getter.js");

GSS.Commander = require("./Commander.js");

GSS.Query = require("./dom/Query.js");

GSS.Thread = require("./Thread.js");

GSS.Engine = require("./Engine.js");

GSS.View = require("./dom/View.js");

GSS.Rule = require("./gssom/Rule.js");

require("./gssom/StyleSheet.js");

_ref1 = require("./dom/IdMixin.js");
for (key in _ref1) {
  val = _ref1[key];
  if (GSS[key]) {
    throw new Error("IdMixin key clash: " + key);
  }
  GSS[key] = val;
}

GSS.EventTrigger.make(GSS);

GSS.get = new GSS.Getter();

GSS.observer = require("./dom/Observer.js");

GSS.boot = function() {
  var html;
  GSS.body = document.body || GSS.getElementsByTagName('body')[0];
  GSS.html = html = GSS.body.parentNode;
  GSS({
    scope: GSS.Getter.getRootScope(),
    is_root: true
  });
  document.dispatchEvent(new CustomEvent('GSS', {
    detail: GSS,
    bubbles: false,
    cancelable: false
  }));
  GSS.setupObserver();
  GSS.update();
  GSS.observe();
  return GSS.trigger("afterLoaded");
};

GSS.update = function() {
  GSS.styleSheets.find();
  GSS.updateIfNeeded();
  return GSS.layoutIfNeeded();
};

GSS.needsUpdate = false;

GSS.setNeedsUpdate = function(bool) {
  if (bool) {
    if (!GSS.needsUpdate) {
      GSS._.defer(GSS.updateIfNeeded);
    }
    return GSS.needsUpdate = true;
  } else {
    return GSS.needsUpdate = false;
  }
};

GSS.updateIfNeeded = function() {
  if (GSS.needsUpdate) {
    LOG_PASS("Update Pass", "orange");
    TIME("update pass");
    GSS.engines.root.updateIfNeeded();
    GSS.setNeedsUpdate(false);
    return TIME_END("update pass");
  }
};

GSS.needsLayout = false;

GSS.setNeedsLayout = function(bool) {
  if (bool) {
    if (!GSS.needsLayout) {
      GSS._.defer(GSS.layoutIfNeeded);
    }
    return GSS.needsLayout = true;
  } else {
    return GSS.needsLayout = false;
  }
};

GSS.layoutIfNeeded = function() {
  if (GSS.needsLayout) {
    LOG_PASS("Layout Pass", "green");
    TIME("layout pass");
    GSS.engines.root.layoutIfNeeded();
    GSS.setNeedsLayout(false);
    return TIME_END("layout pass");
  }
};

/*
GSS.needsDisplay = false

GSS.setNeedsDisplay = (bool) ->
  if bool
    if !GSS.needsDisplay
      GSS._.defer GSS.displayIfNeeded
    GSS.needsDisplay = true        
  else
    GSS.needsDisplay = false

GSS.displayIfNeeded = () ->
  if GSS.needsDisplay
    LOG_PASS "Display Pass", "violet"
    TIME "display pass"
    GSS.engines.root.displayIfNeeded()
    GSS.setNeedsDisplay false
    TIME_END "display pass"
    TIME_END "RENDER"
*/


GSS.printCss = function() {
  return GSS.get.view(GSS.engines.root.scope).printCssTree();
};
