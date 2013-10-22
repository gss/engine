var GSS, getTime, getter,
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
  if (o.tagName) {
    engine = GSS.getEngine(o);
    if (engine) {
      return engine;
    }
    return new GSS.Engine({
      container: o
    });
  } else if (o !== null && typeof o === 'object') {
    if (o.container) {
      engine = GSS.getEngine(o.container);
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

GSS.worker = '../browser/gss-engine/worker/gss-solver.js';

GSS.loadAndRun = function(container) {
  var containersToLoad, node, _i, _j, _len, _len1, _ref, _results;
  if (container == null) {
    container = document;
  }
  containersToLoad = [];
  _ref = GSS.getter.getAllStyleNodes();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    if (GSS.getter.hasAST(node)) {
      container = GSS.getter.getEngineForStyleNode(node);
      if (containersToLoad.indexOf(container) === -1) {
        containersToLoad.push(container);
      }
    }
  }
  _results = [];
  for (_j = 0, _len1 = containersToLoad.length; _j < _len1; _j++) {
    container = containersToLoad[_j];
    _results.push(GSS(container).loadAndRun());
  }
  return _results;
};

GSS.config = {
  resizeDebounce: 30
};

GSS.getEngine = function(el) {
  return GSS.engines.byId[this.getId(el)];
};

GSS._id_counter = 1;

GSS._byIdCache = [];

GSS._ids_killed = function(ids) {
  var id, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = ids.length; _i < _len; _i++) {
    id = ids[_i];
    _results.push(delete GSS._byIdCache[id]);
  }
  return _results;
};

GSS.getById = function(id) {
  var el;
  if (GSS._byIdCache[id]) {
    return GSS._byIdCache[id];
  }
  el = document.querySelector('[data-gss-id="' + id + '"]');
  if (el) {
    GSS._byIdCache[id] = el;
  }
  return el;
};

GSS.setupContainerId = function(el) {
  el._gss_is_container = true;
  return GSS.setupId(el);
};

GSS.setupId = function(el) {
  var gid;
  gid = getter.getId(el);
  if (gid == null) {
    gid = String(GSS._id_counter++);
    el.setAttribute('data-gss-id', gid);
  }
  GSS._byIdCache[gid] = el;
  return gid;
};

GSS.getId = function(el) {
  return getter.getId(el);
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

GSS.Getter = require("./dom/Getter.js");

GSS.observer = require("./dom/Observer.js");

GSS.Commander = require("./Commander.js");

GSS.Query = require("./dom/Query.js");

GSS.Setter = require("./dom/Setter.js");

GSS.Engine = require("./Engine.js");

GSS.getter = new GSS.Getter();

getter = GSS.getter;
