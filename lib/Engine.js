var Engine, LOG, TIME, TIME_END, cleanAndSnatch, engines,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof GSS === "undefined" || GSS === null) {
  throw new Error("GSS object needed for Engine");
}

cleanAndSnatch = function(frm, to) {
  var key, val;
  for (key in to) {
    val = to[key];
    if (frm[key] == null) {
      delete to[key];
    } else {
      to[key] = frm[key];
      delete frm[key];
    }
  }
  for (key in frm) {
    val = frm[key];
    to[key] = frm[key];
  }
  frm = void 0;
  return to;
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

LOG = function() {
  return GSS.deblog.apply(GSS, ["Engine"].concat(__slice.call(arguments)));
};

GSS.engines = engines = [];

engines.byId = {};

engines.root = null;

Engine = (function(_super) {
  __extends(Engine, _super);

  function Engine(o) {
    this.dispatch = __bind(this.dispatch, this);
    this.handleWorkerMessage = __bind(this.handleWorkerMessage, this);
    this.updateChildList = __bind(this.updateChildList, this);
    this.load = __bind(this.load, this);
    this.execute = __bind(this.execute, this);
    Engine.__super__.constructor.apply(this, arguments);
    this.scope = o.scope, this.workerURL = o.workerURL, this.vars = o.vars, this.getter = o.getter, this.setter = o.setter, this.is_root = o.is_root;
    if (!this.vars) {
      this.vars = {};
    }
    if (!this.scope) {
      new Error("Scope required for Engine");
    }
    if (this.scope.tagName === "HEAD") {
      this.scope = document;
    }
    if (!this.workerURL) {
      this.workerURL = GSS.config.workerURL;
    }
    this.id = GSS.setupScopeId(this.scope);
    this.commander = new GSS.Commander(this);
    this.worker = null;
    this.workerCommands = [];
    this.workerMessageHistory = [];
    this.lastWorkerCommands = null;
    this.queryCache = {};
    this.cssDump = null;
    LOG("constructor() @", this);
    if (this.scope === GSS.Getter.getRootScope()) {
      this.queryScope = document;
    } else {
      this.queryScope = this.scope;
    }
    if (!this.getter) {
      this.getter = new GSS.Getter(this.scope);
    }
    if (!this.setter) {
      this.setter = new GSS.Setter(this.scope);
    }
    this.childEngines = [];
    this.parentEngine = null;
    if (this.is_root) {
      engines.root = this;
    } else {
      this.parentEngine = GSS.get.nearestEngine(this.scope, true);
      if (!this.parentEngine) {
        throw new Error("ParentEngine missing, WTF");
      }
      this.parentEngine.childEngines.push(this);
    }
    GSS.engines.push(this);
    engines.byId[this.id] = this;
    this;
  }

  Engine.prototype.isDescendantOf = function(engine) {
    var parentEngine;
    parentEngine = this.parentEngine;
    while (parentEngine) {
      if (parentEngine === engine) {
        return true;
      }
      parentEngine = parentEngine.parentEngine;
    }
    return false;
  };

  Engine.prototype.isAscendantOf = function(engine) {};

  Engine.prototype.is_running = false;

  Engine.prototype.run = function(asts) {
    var ast, _i, _len, _results;
    LOG(this.id, ".run(asts)", asts);
    if (asts instanceof Array) {
      _results = [];
      for (_i = 0, _len = asts.length; _i < _len; _i++) {
        ast = asts[_i];
        _results.push(this._run(ast));
      }
      return _results;
    } else {
      return this._run(asts);
    }
  };

  Engine.prototype._run = function(ast) {
    if (ast.commands) {
      this.execute(ast.commands);
    }
    if (ast.css) {
      this.cssToDump = ast.css;
      return this.dumpCSSIfNeeded();
    }
  };

  Engine.prototype.execute = function(commands) {
    return this.commander.execute(commands);
  };

  Engine.prototype.cssToDump = null;

  Engine.prototype.cssDump = null;

  Engine.prototype.setupCSSDumpIfNeeded = function() {
    if (!this.cssDump) {
      this.cssDump = document.createElement("style");
      this.cssDump.id = "gss-css-dump-" + this.id;
      return this.scope.appendChild(this.cssDump);
    }
  };

  Engine.prototype.dumpCSSIfNeeded = function() {
    if (this.cssToDump) {
      this.setupCSSDumpIfNeeded();
      this.cssDump.insertAdjacentHTML("beforeend", this.cssToDump);
      return this.cssToDump = null;
    }
  };

  Engine.prototype.CSSDumper_clean = function() {
    var _ref;
    this.cssToDump = null;
    return (_ref = this.cssDump) != null ? _ref.innerHTML = "" : void 0;
  };

  Engine.prototype.CSSDumper_destroy = function() {
    this.cssToDump = null;
    return this.cssDump = null;
  };

  Engine.prototype.hoistedTrigger = function(ev, obj) {
    this.trigger(ev, obj);
    return GSS.trigger("engine:" + ev, obj);
  };

  Engine.prototype.needsUpdate = false;

  Engine.prototype.setNeedsUpdate = function(bool) {
    LOG(this.id, ".setNeedsUpdate( " + bool + " )");
    if (bool) {
      GSS.setNeedsUpdate(true);
      return this.needsUpdate = true;
    } else {
      return this.needsUpdate = false;
    }
  };

  Engine.prototype.updateIfNeeded = function() {
    var child, _i, _len, _ref, _results;
    LOG(this.id, ".updateIfNeeded()");
    if (this.needsUpdate) {
      if (this.ASTs) {
        this.run(this.ASTs);
        this.ASTs = null;
      }
      this.setNeedsUpdate(false);
    }
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(child.updateIfNeeded());
    }
    return _results;
  };

  Engine.prototype.needsLayout = false;

  Engine.prototype.setNeedsLayout = function(bool) {
    LOG(this.id, ".setNeedsLayout( " + bool + " )");
    if (bool) {
      if (!this.needsLayout) {
        GSS.setNeedsLayout(true);
        return this.needsLayout = true;
      }
    } else {
      return this.needsLayout = false;
    }
  };

  Engine.prototype._beforeLayoutCalls = null;

  Engine.prototype.layout = function() {
    LOG(this.id, ".layout()");
    this.hoistedTrigger("beforeLayout", this);
    this.is_running = true;
    this.solve();
    return this.setNeedsLayout(false);
  };

  Engine.prototype.layoutIfNeeded = function() {
    LOG(this.id, ".layoutIfNeeded()");
    if (this.needsLayout) {
      this.waitingToLayoutSubtree = true;
      this.layout();
    }
    return this.layoutSubTreeIfNeeded();
  };

  Engine.prototype.waitingToLayoutSubtree = false;

  Engine.prototype.layoutSubTreeIfNeeded = function() {
    var child, _i, _len, _ref, _results;
    this.waitingToLayoutSubtree = false;
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(child.layoutIfNeeded());
    }
    return _results;
  };

  Engine.prototype.needsDisplay = false;

  Engine.prototype.setNeedsDisplay = function(bool) {
    if (bool) {
      LOG(this.id, ".setNeedsDisplay( " + bool + " )");
      GSS.setNeedsDisplay(true);
      return this.needsDisplay = true;
    } else {
      LOG(this.id, ".setNeedsDisplay( " + bool + " )");
      return this.needsDisplay = false;
    }
  };

  Engine.prototype.displayIfNeeded = function() {
    var child, _i, _len, _ref, _results;
    if (this.needsDisplay) {
      this.display();
      this.setNeedsDisplay(false);
    }
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(child.displayIfNeeded());
    }
    return _results;
  };

  Engine.prototype.display = function() {
    LOG(this.id, ".display()");
    this.hoistedTrigger("beforeDisplay", this);
    GSS.unobserve();
    this.setter.set(this.vars);
    this.validate();
    GSS.observe();
    this.dispatch("solved", {
      values: this.vars
    });
    return TIME_END("" + this.id + " DISPLAY PASS");
  };

  Engine.prototype.validate = function() {
    return this.commander.validateMeasures();
  };

  Engine.prototype.load = function() {
    var AST, ASTs, node, _i, _len, _ref;
    LOG(this.id, ".loadASTs()");
    if (this.is_running) {
      this.clean();
    }
    ASTs = [];
    _ref = this.getter.getAllStyleNodes();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (this.scope === GSS.get.scopeForStyleNode(node)) {
        AST = this.getter.readAST(node);
        if (AST) {
          ASTs.push(AST);
        }
      }
    }
    this.ASTs = ASTs;
    this.setNeedsUpdate(true);
    return this;
  };

  Engine.prototype.clean = function() {
    var key, query, selector, val, _base, _base1, _ref, _ref1;
    LOG(this.id, ".clean()");
    this.offAll();
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.waitingToLayoutSubtree = false;
    this.commander.clean();
    if (typeof (_base = this.getter).clean === "function") {
      _base.clean();
    }
    if (typeof (_base1 = this.setter).clean === "function") {
      _base1.clean();
    }
    this.CSSDumper_clean();
    this.workerCommands = [];
    this.lastWorkerCommands = null;
    _ref = this.vars;
    for (key in _ref) {
      val = _ref[key];
      delete this.vars[key];
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    _ref1 = this.queryCache;
    for (selector in _ref1) {
      query = _ref1[selector];
      query.destroy();
      this.queryCache[selector] = null;
    }
    this.queryCache = {};
    return this;
  };

  Engine.prototype.stopped = false;

  Engine.prototype.stop = function() {
    console.warn("Stop deprecated for destroy");
    this.destroy();
    return this;
  };

  Engine.prototype.is_destroyed = false;

  Engine.prototype.destroyChildren = function() {
    var e, _i, _len, _ref, _results;
    _ref = this.childEngines;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      if (!e.is_destroyed) {
        _results.push(e.destroy());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Engine.prototype.destroy = function() {
    var d, descdendants, i, kill, query, selector, _base, _base1, _i, _len, _ref;
    LOG(this.id, ".destroy()");
    this.hoistedTrigger("beforeDestroy", this);
    descdendants = GSS.get.descdendantNodes(this.scope);
    for (_i = 0, _len = descdendants.length; _i < _len; _i++) {
      d = descdendants[_i];
      kill = d._gss_id;
      if (kill) {
        GSS._id_killed(kill);
      }
    }
    this.offAll();
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.waitingToLayoutSubtree = false;
    this.is_destroyed = true;
    this.is_running = null;
    this.commander.destroy();
    if (typeof (_base = this.getter).destroy === "function") {
      _base.destroy();
    }
    if (typeof (_base1 = this.setter).destroy === "function") {
      _base1.destroy();
    }
    this.parentEngine.childEngines.splice(this.parentEngine.childEngines.indexOf(this), 1);
    this.parentEngine = null;
    i = engines.indexOf(this);
    if (i > -1) {
      engines.splice(i, 1);
    }
    delete engines.byId[this.id];
    GSS._ids_killed([this.id]);
    this.CSSDumper_destroy();
    this.ast = null;
    this.getter = null;
    this.setter = null;
    this.scope = null;
    this.commander = null;
    this.workerCommands = null;
    this.workerMessageHistory = null;
    this.lastWorkerCommands = null;
    this.vars = null;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    _ref = this.queryCache;
    for (selector in _ref) {
      query = _ref[selector];
      query.destroy();
      this.queryCache[selector] = null;
    }
    this.queryCache = null;
    return this;
  };

  Engine.prototype.is_observing = false;

  Engine.prototype.solve = function() {
    var workerMessage;
    LOG(this.id, ".solve()", this.workerCommands);
    TIME("" + this.id + " DISPLAY PASS");
    workerMessage = {
      commands: this.workerCommands
    };
    this.workerMessageHistory.push(workerMessage);
    if (!this.worker) {
      this.worker = new Worker(this.workerURL);
      this.worker.addEventListener("message", this.handleWorkerMessage, false);
      this.worker.addEventListener("error", this.handleError, false);
    }
    this.worker.postMessage(workerMessage);
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.updateChildList = function() {
    var el, globalRemoves, query, removedIds, removes, rid, selector, selectorsWithAdds, trigger, _i, _len, _ref;
    selectorsWithAdds = [];
    removes = [];
    globalRemoves = [];
    trigger = false;
    _ref = this.queryCache;
    for (selector in _ref) {
      query = _ref[selector];
      query.update();
      if (query.changedLastUpdate) {
        if (query.lastAddedIds.length > 0) {
          selectorsWithAdds.push(selector);
          trigger = true;
        }
        if (query.lastRemovedIds.length > 0) {
          trigger = true;
          removedIds = query.lastRemovedIds;
          for (_i = 0, _len = removedIds.length; _i < _len; _i++) {
            rid = removedIds[_i];
            if (globalRemoves.indexOf(rid) === -1) {
              el = GSS.getById(rid);
              if (document.documentElement.contains(el)) {
                globalRemoves.push(rid);
                removes.push(selector + "$" + rid);
              } else {
                removes.push("$" + rid);
              }
            }
          }
        }
      }
      GSS._ids_killed(globalRemoves);
      if (trigger) {
        this.commander.handleRemoves(removes);
        this.commander.handleSelectorsWithAdds(selectorsWithAdds);
      }
      return trigger;
    }
  };

  Engine.prototype.measureByGssId = function(id, prop) {
    var el, val;
    el = GSS.getById(id);
    val = this.getter.measure(el, prop);
    LOG(this.id, ".measureByGssId()", id, prop, val);
    return val;
  };

  Engine.prototype.handleWorkerMessage = function(message) {
    LOG(this.id, ".handleWorkerMessage()", this.workerCommands);
    this.vars = message.data.values;
    return this.display();
  };

  Engine.prototype.dispatch = function(eName, oDetail, bubbles, cancelable) {
    var e, o;
    if (oDetail == null) {
      oDetail = {};
    }
    if (bubbles == null) {
      bubbles = true;
    }
    if (cancelable == null) {
      cancelable = true;
    }
    oDetail.engine = this;
    o = {
      detail: oDetail,
      bubbles: bubbles,
      cancelable: cancelable
    };
    e = new CustomEvent(eName, o);
    return this.scope.dispatchEvent(e);
  };

  Engine.prototype.handleError = function(event) {
    if (this.onError) {
      return this.onError(event);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype.registerCommands = function(commands) {
    var command, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      _results.push(this.registerCommand(command));
    }
    return _results;
  };

  Engine.prototype.registerCommand = function(command) {
    this.workerCommands.push(command);
    this.setNeedsLayout(true);
    return this;
  };

  Engine.prototype.registerDomQuery = function(o) {
    var query, selector;
    selector = o.selector;
    if (this.queryCache[selector] != null) {
      return this.queryCache[selector];
    } else {
      query = new GSS.Query(o);
      query.update();
      this.queryCache[selector] = query;
      return query;
    }
  };

  Engine.prototype.elVar = function(el, key, selector, tracker2) {
    var ast, gid, varid;
    gid = GSS.getId(el);
    if (key === 'left') {
      key = 'x';
    } else if (key === 'top') {
      key = 'y';
    }
    varid = "$" + gid + ("[" + key + "]");
    if (key === 'bottom') {
      this.registerCommand(['varexp', varid, this.plus(this.elVar(el, 'y', selector), this.elVar(el, 'height', selector))]);
    } else if (key === 'right') {
      this.registerCommand(['varexp', varid, this.plus(this.elVar(el, 'x', selector), this.elVar(el, 'width', selector))]);
    } else if (key === 'center-y') {
      this.registerCommand(['varexp', varid, this.plus(this.elVar(el, 'y', selector), this.divide(this.elVar(el, 'height', selector), 2))]);
    } else if (key === 'center-x') {
      this.registerCommand(['varexp', varid, this.plus(this.elVar(el, 'x', selector), this.divide(this.elVar(el, 'width', selector), 2))]);
    } else {
      this.registerCommand(['var', varid, "$" + gid]);
    }
    ast = ['get', varid];
    if (selector) {
      ast.push(selector + "$" + gid);
    }
    if (tracker2) {
      ast.push(tracker2);
    }
    return ast;
  };

  Engine.prototype["var"] = function(key) {
    this.registerCommand(['var', key]);
    return ['get', key];
  };

  Engine.prototype.varexp = function(key, exp, tracker) {
    this.registerCommand(['varexp', exp, tracker]);
    return ['get', key];
  };

  Engine.prototype.__e = function(key) {
    if (key instanceof Array) {
      return key;
    }
    if (!!Number(key) || (Number(key) === 0)) {
      return ['number', key];
    }
    return this["var"](key);
  };

  Engine.prototype.eq = function(e1, e2, s, w) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return this.registerCommand(['eq', e1, e2, s, w]);
  };

  Engine.prototype.lte = function(e1, e2, s, w) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return this.registerCommand(['lte', e1, e2, s, w]);
  };

  Engine.prototype.gte = function(e1, e2, s, w) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return this.registerCommand(['gte', e1, e2, s, w]);
  };

  Engine.prototype.suggest = function(v, val, strength) {
    if (strength == null) {
      strength = 'required';
    }
    v = this.__e(v);
    return this.registerCommand(['suggest', v, ['number', val], strength]);
  };

  Engine.prototype.stay = function(v) {
    v = this.__e(v);
    return this.registerCommand(['stay', v]);
  };

  Engine.prototype.remove = function(tracker) {
    return this.registerCommand(['remove', tracker]);
  };

  Engine.prototype['number'] = function(num) {
    return ['number', num];
  };

  Engine.prototype['plus'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['plus', e1, e2];
  };

  Engine.prototype['minus'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['minus', e1, e2];
  };

  Engine.prototype['multiply'] = function(e1, e2) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['multiply', e1, e2];
  };

  Engine.prototype['divide'] = function(e1, e2, s, w) {
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    return ['divide', e1, e2];
  };

  return Engine;

})(GSS.EventTrigger);

module.exports = Engine;
