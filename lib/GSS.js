var GSS, LOG_PASS, TIME, TIME_END, key, styleQuery, val, _ref, _scopesToLoad;

require("customevent-polyfill");

if (window.GSS) {
  throw new Error("Only one GSS object per window");
}

GSS = function(o) {
  var engine;
  if (o === document || o === window) {
    return GSS.engines.root;
  }
  if (o.tagName) {
    if (!GSS.config.scoped) {
      return GSS.engines.root;
    }
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
  resizeDebounce: 32,
  observe: true,
  debug: false,
  warn: false,
  perf: false,
  scoped: true,
  roundBeforeSet: false,
  processBeforeSet: null,
  useOffsetParent: true
};

if (typeof GSS_CONFIG !== "undefined" && GSS_CONFIG !== null) {
  for (key in GSS_CONFIG) {
    val = GSS_CONFIG[key];
    GSS.config[key] = val;
  }
}

GSS.deblog = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, arguments);
  }
};

GSS.warn = function() {
  if (GSS.config.warn) {
    return console.warn.apply(console, arguments);
  }
};

window.GSS = GSS;

GSS._ = require("./_.js");

GSS.EventTrigger = require("./EventTrigger.js");

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

GSS.get = new GSS.Getter();

GSS.observer = require("./dom/Observer.js");

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

GSS.boot = function() {
  return GSS({
    scope: GSS.Getter.getRootScope(),
    is_root: true
  });
};

GSS.load = function() {
  GSS.dirtyLoadEngines();
  return GSS.render();
};

GSS.render = function() {
  TIME("RENDER");
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

GSS.needsDisplay = false;

GSS.setNeedsDisplay = function(bool) {
  if (bool) {
    if (!GSS.needsDisplay) {
      GSS._.defer(GSS.displayIfNeeded);
    }
    return GSS.needsDisplay = true;
  } else {
    return GSS.needsDisplay = false;
  }
};

GSS.displayIfNeeded = function() {
  if (GSS.needsDisplay) {
    LOG_PASS("Display Pass", "violet");
    TIME("display pass");
    GSS.engines.root.displayIfNeeded();
    GSS.setNeedsDisplay(false);
    TIME_END("display pass");
    return TIME_END("RENDER");
  }
};

_scopesToLoad = null;

styleQuery = GSS.styleQuery = new GSS.Query({
  selector: "style",
  isLive: true,
  isMulti: true,
  createNodeList: function() {
    return document.getElementsByTagName("style");
  },
  afterChange: function() {
    var engine, id, node, scope, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _results;
    _scopesToLoad = [];
    if (this.changedLastUpdate) {
      _ref1 = this.lastAddedIds;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        id = _ref1[_i];
        node = GSS.getById(id);
        if (GSS.get.isStyleNode(node)) {
          scope = GSS.get.scopeForStyleNode(node);
          if (_scopesToLoad.indexOf(scope) === -1 && scope) {
            _scopesToLoad.push(GSS.get.scopeForStyleNode(node));
          }
        }
      }
      _ref2 = this.lastRemovedIds;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        id = _ref2[_j];
        node = GSS.getById(id);
        if (GSS.get.isStyleNode(node)) {
          scope = GSS.get.scopeForStyleNode(node);
          if (_scopesToLoad.indexOf(scope) === -1 && ((scope != null ? scope.parentNode : void 0) != null)) {
            if (document.contains(scope)) {
              _scopesToLoad.push(scope);
            }
          }
        }
      }
      _results = [];
      for (_k = 0, _len2 = _scopesToLoad.length; _k < _len2; _k++) {
        scope = _scopesToLoad[_k];
        engine = GSS({
          scope: scope
        });
        if (engine) {
          _results.push(engine.load());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  }
});

GSS.dirtyLoadEngines = function() {
  var engine, i;
  i = 0;
  engine = GSS.engines[i];
  while (!!engine) {
    if (i > 0) {
      if (!document.documentElement.contains(engine.scope)) {
        engine.destroyChildren();
        engine.destroy();
      }
    }
    i++;
    engine = GSS.engines[i];
  }
  return styleQuery.update();
};
