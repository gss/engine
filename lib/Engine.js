var Engine, LOG, TIME, TIME_END, engines, _,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof GSS === "undefined" || GSS === null) {
  throw new Error("GSS object needed for Engine");
}

_ = GSS._;

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
    if (o == null) {
      o = {};
    }
    this.dispatch = __bind(this.dispatch, this);
    this.updateQueries = __bind(this.updateQueries, this);
    this.handleWorkerMessage = __bind(this.handleWorkerMessage, this);
    this.reset = __bind(this.reset, this);
    Engine.__super__.constructor.apply(this, arguments);
    this.scope = o.scope, this.workerURL = o.workerURL, this.vars = o.vars, this.getter = o.getter, this.is_root = o.is_root, this.useWorker = o.useWorker;
    if (!this.vars) {
      this.vars = {};
    }
    this.clauses = null;
    if (!GSS.config.useWorker) {
      this.useWorker = false;
    } else {
      if (this.useWorker == null) {
        this.useWorker = true;
      }
    }
    this.worker = null;
    this.workerCommands = [];
    this.workerMessageHistory = [];
    if (!this.workerURL) {
      this.workerURL = GSS.config.worker;
    }
    if (this.scope) {
      if (this.scope.tagName === "HEAD") {
        this.scope = document;
      }
      this.id = GSS.setupScopeId(this.scope);
      if (this.scope === GSS.Getter.getRootScope()) {
        this.queryScope = document;
      } else {
        this.queryScope = this.scope;
      }
    } else {
      this.id = GSS.uid();
      this.queryScope = document;
    }
    if (!this.getter) {
      this.getter = new GSS.Getter(this.scope);
    }
    this.commander = new GSS.Commander(this);
    this.lastWorkerCommands = null;
    this.queryCache = {};
    this.cssDump = null;
    GSS.engines.push(this);
    engines.byId[this.id] = this;
    this._Hierarchy_setup();
    this._StyleSheets_setup();
    LOG("constructor() @", this);
    this;
  }

  Engine.prototype.getVarsById = function(vars) {
    var varsById;
    if (GSS.config.processBeforeSet) {
      vars = GSS.config.processBeforeSet(vars);
    }
    return varsById = _.varsByViewId(_.filterVarsForDisplay(vars));
  };

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

  Engine.prototype._Hierarchy_setup = function() {
    var _ref;
    this.childEngines = [];
    this.parentEngine = null;
    if (this.is_root) {
      engines.root = this;
    } else if (this.scope) {
      this.parentEngine = GSS.get.nearestEngine(this.scope, true);
    } else {
      this.parentEngine = engines.root;
    }
    if (!this.parentEngine && !this.is_root) {
      throw new Error("ParentEngine missing, WTF");
    }
    return (_ref = this.parentEngine) != null ? _ref.childEngines.push(this) : void 0;
  };

  Engine.prototype._Hierarchy_destroy = function() {
    this.parentEngine.childEngines.splice(this.parentEngine.childEngines.indexOf(this), 1);
    return this.parentEngine = null;
  };

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
    return this.commander.execute(ast);
  };

  Engine.prototype._StyleSheets_setup = function() {
    return this.styleSheets = [];
  };

  Engine.prototype.load = function() {
    var sheet, _i, _len, _ref, _results;
    if (!this.scope) {
      throw new Error("can't load scopeless engine");
    }
    if (this.is_running) {
      this.clean();
    }
    _ref = this.styleSheets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      sheet = _ref[_i];
      _results.push(sheet.execute());
    }
    return _results;
  };

  Engine.prototype.reset = function() {
    var sheet, styleSheets, _i, _len;
    LOG(this.id, ".reset()");
    if (!this.scope) {
      throw new Error("can't reset scopeless engine");
    }
    styleSheets = this.styleSheets;
    if (this.is_running) {
      this.clean();
    }
    this.styleSheets = styleSheets;
    for (_i = 0, _len = styleSheets.length; _i < _len; _i++) {
      sheet = styleSheets[_i];
      sheet.reset();
    }
    this.setNeedsUpdate(true);
    return this;
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

  Engine.prototype.cssToDump = null;

  Engine.prototype.cssDump = null;

  Engine.prototype.setupCSSDumpIfNeeded = function() {
    var dumpNode;
    dumpNode = this.scope || document.body;
    if (!this.cssDump) {
      this.cssDump = document.createElement("style");
      this.cssDump.id = "gss-css-dump-" + this.id;
      return dumpNode.appendChild(this.cssDump);
    }
  };

  Engine.prototype.needsDumpCSS = false;

  Engine.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      this.setNeedsLayout(true);
      return this.needsDumpCSS = true;
    } else {
      return this.needsDumpCSS = false;
    }
  };

  Engine.prototype.dumpCSSIfNeeded = function() {
    var css, sheet, sheetCSS, _i, _len, _ref;
    if (this.needsDumpCSS) {
      this.needsDumpCSS = false;
      this.setupCSSDumpIfNeeded();
      css = "";
      _ref = this.styleSheets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sheet = _ref[_i];
        sheetCSS = sheet.dumpCSSIfNeeded();
        if (sheetCSS) {
          css = css + sheetCSS;
        }
      }
      if (css.length > 0) {
        return this.cssDump.innerHTML = css;
      }
    }
  };

  Engine.prototype._CSSDumper_clean = function() {
    var _ref;
    return (_ref = this.cssDump) != null ? _ref.innerHTML = "" : void 0;
  };

  Engine.prototype._CSSDumper_destroy = function() {
    this.needsDumpCSS = false;
    return this.cssDump = null;
  };

  Engine.prototype.needsUpdate = false;

  Engine.prototype.setNeedsUpdate = function(bool) {
    if (bool) {
      GSS.setNeedsUpdate(true);
      return this.needsUpdate = true;
    } else {
      return this.needsUpdate = false;
    }
  };

  Engine.prototype.updateIfNeeded = function() {
    var child, _i, _len, _ref, _results;
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
    this.hoistedTrigger("beforeLayout", this);
    this.is_running = true;
    TIME("" + this.id + " LAYOUT & DISPLAY");
    this.solve();
    return this.setNeedsLayout(false);
  };

  Engine.prototype.layoutIfNeeded = function() {
    if (this.needsLayout) {
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
      GSS.setNeedsDisplay(true);
      return this.needsDisplay = true;
    } else {
      return this.needsDisplay = false;
    }
  };

  /*
  displayIfNeeded: () ->
    LOG @, "displayIfNeeded"
    if @needsDisplay #@workerCommands.length > 0
      @display(@vars)      
      @setNeedsDisplay false
    for child in @childEngines
      child.displayIfNeeded()
  */


  Engine.prototype.display = function(data, forceViewCacheById) {
    var el, id, needsToDisplayViews, obj, vars, varsById, _ref;
    if (forceViewCacheById == null) {
      forceViewCacheById = false;
    }
    vars = data.values;
    LOG(this.id, ".display()");
    this.hoistedTrigger("beforeDisplay", this);
    GSS.unobserve();
    varsById = this.getVarsById(vars);
    needsToDisplayViews = false;
    for (id in varsById) {
      obj = varsById[id];
      needsToDisplayViews = true;
      if (forceViewCacheById) {
        el = document.getElementById(id);
        if (el) {
          GSS.setupId(el);
        }
      }
      if ((_ref = GSS.View.byId[id]) != null) {
        if (typeof _ref.updateValues === "function") {
          _ref.updateValues(obj);
        }
      }
    }
    this.dumpCSSIfNeeded();
    if (needsToDisplayViews) {
      if (this.scope) {
        GSS.get.view(this.scope).displayIfNeeded();
      }
    }
    if (!this.isMeasuring && this.needsMeasure) {
      this.measureIfNeeded();
      if (!this.needsLayout) {
        this._didDisplay();
      }
    } else {
      this._didDisplay();
    }
    GSS.observe();
    this.dispatchedTrigger("solved", {
      values: vars
    });
    TIME_END("" + this.id + " LAYOUT & DISPLAY");
    return this;
  };

  Engine.prototype._didDisplay = function() {
    this.trigger("display");
    GSS.onDisplay();
    return this.isMeasuring = false;
  };

  Engine.prototype.forceDisplay = function(vars) {};

  Engine.prototype.updateClauses = function(clauses) {
    var clause, html, nue, old, _i, _j, _k, _len, _len1, _len2;
    html = GSS.html;
    old = this.clauses;
    nue = clauses;
    if (old) {
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        clause = old[_i];
        if (nue.indexOf(clause) === -1) {
          html.classList.remove(clause);
        }
      }
      for (_j = 0, _len1 = nue.length; _j < _len1; _j++) {
        clause = nue[_j];
        if (old.indexOf(clause) === -1) {
          html.classList.add(clause);
        }
      }
    } else {
      for (_k = 0, _len2 = nue.length; _k < _len2; _k++) {
        clause = nue[_k];
        html.classList.add(clause);
      }
    }
    return this.clauses = nue;
  };

  Engine.prototype.isMeasuring = false;

  Engine.prototype.needsMeasure = false;

  Engine.prototype.setNeedsMeasure = function(bool) {
    if (bool) {
      return this.needsMeasure = true;
    } else {
      return this.needsMeasure = false;
    }
  };

  Engine.prototype.measureIfNeeded = function() {
    if (this.needsMeasure) {
      this.isMeasuring = true;
      this.needsMeasure = false;
      return this.measure();
    }
  };

  Engine.prototype.measure = function() {
    return this.commander.validateMeasures();
  };

  Engine.prototype.measureByGssId = function(id, prop) {
    var el, val;
    el = GSS.getById(id);
    val = this.getter.measure(el, prop);
    LOG(this.id, ".measureByGssId()", id, prop, val);
    return val;
  };

  Engine.prototype.solve = function() {
    if (this.useWorker) {
      return this.solveWithWorker();
    } else {
      return this.solveWithoutWorker();
    }
  };

  Engine.prototype.solveWithWorker = function() {
    var workerMessage;
    LOG(this.id, ".solveWithWorker()", this.workerCommands);
    workerMessage = {
      commands: this.workerCommands
    };
    this.workerMessageHistory.push(workerMessage);
    if (!this.worker) {
      this.worker = new Worker(this.workerURL);
      this.worker.addEventListener("message", this.handleWorkerMessage, false);
      this.worker.addEventListener("error", this.handleError, false);
      workerMessage.config = {
        defaultStrength: GSS.config.defaultStrength,
        defaultWeight: GSS.config.defaultWeight
      };
    }
    this.worker.postMessage(workerMessage);
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.solveWithoutWorker = function() {
    var workerMessage,
      _this = this;
    LOG(this.id, ".solveWithoutWorker()", this.workerCommands);
    workerMessage = {
      commands: this.workerCommands
    };
    this.workerMessageHistory.push(workerMessage);
    if (!this.worker) {
      this.worker = new GSS.Thread({
        defaultStrength: GSS.config.defaultStrength,
        defaultWeight: GSS.config.defaultWeight
      });
    }
    this.worker.postMessage(_.cloneDeep(workerMessage));
    _.defer(function() {
      if (_this.worker) {
        return _this.handleWorkerMessage({
          data: _this.worker.output()
        });
      }
    });
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.handleWorkerMessage = function(message) {
    LOG(this.id, ".handleWorkerMessage()", this.workerCommands);
    this.vars = message.data.values;
    return this.display(message.data);
  };

  Engine.prototype.handleError = function(event) {
    if (this.onError) {
      return this.onError(event);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype._Worker_destroy = function() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.workerCommands = null;
    this.workerMessageHistory = null;
    return this.lastWorkerCommands = null;
  };

  Engine.prototype._Worker_clean = function() {
    this.workerCommands = [];
    this.lastWorkerCommands = null;
    if (this.worker) {
      this.worker.terminate();
      return this.worker = null;
    }
  };

  Engine.prototype.getDomQuery = function(selector) {
    return this.queryCache[selector];
  };

  Engine.prototype.registerDomQuery = function(o) {
    var query, selector;
    selector = o.selector;
    query = this.getDomQuery(selector);
    if (!query) {
      query = new GSS.Query(o);
      query.update();
      this.queryCache[selector] = query;
    }
    return query;
  };

  Engine.prototype.updateQueries = function() {
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
    }
    GSS._ids_killed(globalRemoves);
    if (trigger) {
      this.commander.handleRemoves(removes);
      this.commander.handleSelectorsWithAdds(selectorsWithAdds);
    }
    return trigger;
  };

  Engine.prototype._Queries_destroy = function() {
    var query, selector, _ref;
    _ref = this.queryCache;
    for (selector in _ref) {
      query = _ref[selector];
      query.destroy();
      this.queryCache[selector] = null;
    }
    return this.queryCache = null;
  };

  Engine.prototype._Queries_clean = function() {
    var query, selector, _ref;
    _ref = this.queryCache;
    for (selector in _ref) {
      query = _ref[selector];
      query.destroy();
      this.queryCache[selector] = null;
    }
    return this.queryCache = {};
  };

  Engine.prototype.hoistedTrigger = function(ev, obj) {
    this.trigger(ev, obj);
    return GSS.trigger("engine:" + ev, obj);
  };

  Engine.prototype.dispatchedTrigger = function(e, o, b, c) {
    this.trigger(e, o);
    return this.dispatch(e, o, b, c);
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
    if (!this.scope) {
      return;
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

  Engine.prototype.clean = function() {
    var key, val, _base, _ref;
    LOG(this.id, ".clean()");
    _ref = this.vars;
    for (key in _ref) {
      val = _ref[key];
      delete this.vars[key];
    }
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.setNeedsMeasure(false);
    this.isMeasuring = false;
    this.waitingToLayoutSubtree = false;
    this.commander.clean();
    if (typeof (_base = this.getter).clean === "function") {
      _base.clean();
    }
    this._CSSDumper_clean();
    this._Worker_clean();
    this._Queries_clean();
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
    var d, descdendants, i, kill, _base, _i, _len;
    LOG(this.id, ".destroy()");
    this.hoistedTrigger("beforeDestroy", this);
    GSS._ids_killed([this.id]);
    if (this.scope) {
      descdendants = GSS.get.descdendantNodes(this.scope);
      for (_i = 0, _len = descdendants.length; _i < _len; _i++) {
        d = descdendants[_i];
        kill = d._gss_id;
        if (kill) {
          GSS._id_killed(kill);
        }
      }
    }
    i = engines.indexOf(this);
    if (i > -1) {
      engines.splice(i, 1);
    }
    delete engines.byId[this.id];
    this.offAll();
    this.setNeedsLayout(false);
    this.setNeedsDisplay(false);
    this.setNeedsLayout(false);
    this.waitingToLayoutSubtree = false;
    this.commander.destroy();
    if (typeof (_base = this.getter).destroy === "function") {
      _base.destroy();
    }
    this.vars = null;
    this.clauses = null;
    this.ast = null;
    this.getter = null;
    this.scope = null;
    this.commander = null;
    this._Hierarchy_destroy();
    this._CSSDumper_destroy();
    this._Worker_destroy();
    this._Queries_destroy();
    this.is_running = null;
    this.is_destroyed = true;
    return this;
  };

  Engine.prototype.elVar = function(el, key, selector, tracker2) {
    var ast, gid, varid;
    gid = "$" + GSS.getId(el);
    if (key === 'left') {
      key = 'x';
    } else if (key === 'top') {
      key = 'y';
    }
    varid = gid + ("[" + key + "]");
    ast = ['get$', key, gid, selector];
    if (tracker2) {
      ast.push(tracker2);
    }
    return ast;
  };

  Engine.prototype["var"] = function(key) {
    return ['get', key];
  };

  Engine.prototype.varexp = function(key, exp, tracker) {
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

  Engine.prototype._addconstraint = function(op, e1, e2, s, w, more) {
    var command, m, _i, _len;
    e1 = this.__e(e1);
    e2 = this.__e(e2);
    command = ['eq', e1, e2];
    if (s) {
      command.push(s);
    }
    if (w) {
      command.push(w);
    }
    if (more) {
      for (_i = 0, _len = more.length; _i < _len; _i++) {
        m = more[_i];
        command.push(m);
      }
    }
    return this.registerCommand(command);
  };

  Engine.prototype.eq = function(e1, e2, s, w, more) {
    return this._addconstraint('eq', e1, e2, s, w, more);
  };

  Engine.prototype.lte = function(e1, e2, s, w, more) {
    return this._addconstraint('lte', e1, e2, s, w, more);
  };

  Engine.prototype.gte = function(e1, e2, s, w, more) {
    return this._addconstraint('gte', e1, e2, s, w, more);
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
