var Engine, LOG, cleanAndSnatch, engines,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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

LOG = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, ["Engine::"].concat(__slice.call(arguments)));
  }
};

GSS.engines = engines = [];

engines.byId = {};

engines.root = null;

Engine = (function() {
  function Engine(o) {
    this.dispatch = __bind(this.dispatch, this);
    this.handleWorkerMessage = __bind(this.handleWorkerMessage, this);
    this.resetWorkerCommands = __bind(this.resetWorkerCommands, this);
    this._handleMutations = __bind(this._handleMutations, this);
    this.execute = __bind(this.execute, this);
    this.scope = o.scope, this.workerURL = o.workerURL, this.vars = o.vars, this.getter = o.getter, this.setter = o.setter, this.is_root = o.is_root;
    if (!this.vars) {
      this.vars = {};
    }
    if (!this.scope) {
      this.scope = GSS.getter.getRootScope();
    }
    if (this.scope.tagName === "HEAD") {
      this.scope = document;
    }
    if (!this.getter) {
      this.getter = new GSS.Getter(this.scope);
    }
    if (!this.setter) {
      this.setter = new GSS.Setter(this.scope);
    }
    if (!this.workerURL) {
      this.workerURL = GSS.workerURL;
    }
    this.id = GSS.setupScopeId(this.scope);
    this.commander = new GSS.Commander(this);
    this.worker = null;
    this.workerCommands = [];
    this.workerMessageHistory = [];
    this.lastWorkerCommands = null;
    this.queryCache = {};
    this.observer = new MutationObserver(this._handleMutations);
    GSS.engines.push(this);
    engines.byId[this.id] = this;
    this.cssDump = null;
    LOG("constructor() @", this);
    if (this.is_root) {
      engines.root = this;
    }
    if (this.scope === GSS.Getter.getRootScope()) {
      this.queryScope = document;
    } else {
      this.queryScope = this.scope;
    }
    this;
  }

  Engine.prototype.is_running = false;

  /*
  run: (ast) ->
    if ast.commands
      @is_running = true
      # digest
      @execute ast.commands      
      #debounced = () =>
      @solve()
      #setTimeout debounced, 1
      @observe()
    @
  */


  Engine.prototype.run = function(asts) {
    var ast, _i, _len;
    LOG(this.id, ".run(asts)", asts);
    if (asts instanceof Array) {
      for (_i = 0, _len = asts.length; _i < _len; _i++) {
        ast = asts[_i];
        this._run(ast);
      }
    } else {
      this._run(asts);
    }
    if (this.workerCommands.length > 0) {
      this.is_running = true;
      return this.solve();
    }
  };

  Engine.prototype._run = function(ast) {
    if (ast.css) {
      this.unobserve();
      this.setupCSSDumpIfNeeded();
      this.cssDump.insertAdjacentHTML("beforeend", ast.css);
      this.observe();
    }
    if (ast.commands) {
      return this.execute(ast.commands);
    }
  };

  Engine.prototype.setupCSSDumpIfNeeded = function() {
    if (!this.cssDump) {
      this.cssDump = document.createElement("style");
      this.cssDump.id = "gss-css-dump-" + this.id;
      return this.scope.appendChild(this.cssDump);
    }
  };

  Engine.prototype.execute = function(commands) {
    return this.commander.execute(commands);
  };

  Engine.prototype.loadAndRun = function() {
    var AST, ASTs, node, _i, _len, _ref;
    LOG(this.id, ".loadAndRun()");
    if (this.is_running) {
      this.clean();
    }
    ASTs = [];
    _ref = this.getter.getAllStyleNodes();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      AST = this.getter.readAST(node);
      if (AST) {
        ASTs.push(AST);
      }
      /*
      if node.isContentEditable and !node._isFixingSelfFromBullShit
        node._isFixingSelfFromBullShit = true
        node.addEventListener "input", @onEditableStyleInput
      */

    }
    this.run(ASTs);
    return this;
  };

  /*
  onEditableStyleInput: (e) =>
    @unobserve()
    e.target.innerHTML = e.target.innerText
    @observe()
    @loadAndRun()
  */


  Engine.prototype.clean = function() {
    var key, query, selector, val, _base, _base1, _ref, _ref1, _ref2;
    LOG(this.id, ".clean()");
    this.commander.clean();
    if (typeof (_base = this.getter).clean === "function") {
      _base.clean();
    }
    if (typeof (_base1 = this.setter).clean === "function") {
      _base1.clean();
    }
    if ((_ref = this.cssDump) != null) {
      _ref.innerHTML = "";
    }
    this.workerCommands = [];
    this.lastWorkerCommands = null;
    _ref1 = this.vars;
    for (key in _ref1) {
      val = _ref1[key];
      delete this.vars[key];
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    _ref2 = this.queryCache;
    for (selector in _ref2) {
      query = _ref2[selector];
      query.destroy();
      this.queryCache[selector] = null;
    }
    this.queryCache = {};
    return this;
  };

  Engine.prototype.stopped = false;

  Engine.prototype.stop = function() {
    console.warn("Stop deprecated for destroyed");
    this.destroy();
    /*
    if @stopped then return @
    @stopped = true
    @unobserve()
    if @worker
      @worker.terminate()
      delete @worker
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = {}
    */

    return this;
  };

  Engine.prototype.is_destroyed = false;

  Engine.prototype.destroy = function() {
    var i, query, selector, _base, _base1, _ref;
    this.is_destroyed = true;
    this.is_running = null;
    this.commander.destroy();
    if (typeof (_base = this.getter).destroy === "function") {
      _base.destroy();
    }
    if (typeof (_base1 = this.setter).destroy === "function") {
      _base1.destroy();
    }
    this.unobserve();
    this.observer = null;
    this.cssDump = null;
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
    i = engines.indexOf(this);
    if (i > -1) {
      engines.splice(i, 1);
    }
    delete engines.byId[this.id];
    return this;
  };

  Engine.prototype.is_observing = false;

  Engine.prototype.observe = function() {
    if (!this.is_observing) {
      this.observer.observe(this.scope, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
      this.is_observing = true;
    }
    return this;
  };

  Engine.prototype.unobserve = function() {
    this.is_observing = false;
    this.observer.disconnect();
    return this;
  };

  Engine.prototype.solve = function() {
    var workerMessage;
    LOG(this.id, ".solve()", this.workerCommands);
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
    return this.resetWorkerCommands();
  };

  Engine.prototype._handleMutations = function(mutations) {
    var gid, invalidMeasures, m, node, query, removedIds, removes, rid, selector, selectorsWithAdds, target, trigger, trigger_removes, trigger_removesFromScope, trigger_scopeRemoved, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    if (mutations == null) {
      mutations = [];
    }
    LOG(this.id, "._handleMutations(m)", m);
    trigger = false;
    trigger_scopeRemoved = false;
    trigger_removes = false;
    trigger_removesFromScope = false;
    removes = [];
    invalidMeasures = [];
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      m = mutations[_i];
      if (m.type === "characterData") {
        if (this.getter.isStyleNode(m.target.parentElement)) {
          return this.loadAndRun();
        }
      }
      if (m.removedNodes.length > 0) {
        _ref = m.removedNodes;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          node = _ref[_j];
          if (node === this.scope) {
            console.log("handle engine scope removed");
          }
          gid = GSS.getId(node);
          if (gid != null) {
            if (GSS.getById(gid)) {
              removes.push("$" + gid);
              trigger = true;
              trigger_removesFromScope = true;
            }
          }
        }
      }
      if (m.type === "characterData" || m.type === "attributes" || m.type === "childList") {
        if (m.type === "characterData") {
          target = m.target.parentElement;
          gid = "$" + GSS.getId(m.target.parentElement);
        } else {
          gid = "$" + GSS.getId(m.target);
        }
        if (gid != null) {
          if (invalidMeasures.indexOf(gid) === -1) {
            trigger = true;
            invalidMeasures.push(gid);
          }
        }
      }
    }
    GSS._ids_killed(removes);
    selectorsWithAdds = [];
    _ref1 = this.queryCache;
    for (selector in _ref1) {
      query = _ref1[selector];
      query.update();
      if (query.changedLastUpdate) {
        if (query.lastAddedIds.length > 0) {
          selectorsWithAdds.push(selector);
          trigger = true;
        }
        if (query.lastRemovedIds.length > 0) {
          trigger = true;
          removedIds = query.lastRemovedIds;
          for (_k = 0, _len2 = removedIds.length; _k < _len2; _k++) {
            rid = removedIds[_k];
            rid = "$" + rid;
            if (trigger_removesFromScope) {
              if (removes.indexOf(rid) === -1) {
                removes.push(selector + rid);
              }
            } else {
              removes.push(selector + rid);
            }
          }
        }
      }
    }
    /*
    if trigger
      e = new CustomEvent "solverinvalidated",
        detail:
          addsBySelector: addsBySelector
          removesBySelector: removesBySelector
          removesFromScope: removesFromScope
          selectorsWithAdds: selectorsWithAdds
          engine: @
        bubbles: true
        cancelable: true
      @scope.dispatchEvent e
    */

    if (trigger) {
      this.commander.handleRemoves(removes);
      this.commander.handleSelectorsWithAdds(selectorsWithAdds);
      this.commander.handleInvalidMeasures(invalidMeasures);
      return this.solve();
    }
  };

  Engine.prototype.measureByGssId = function(id, prop) {
    var el;
    LOG(this.id, ".measureByGssId()", this.workerCommands);
    el = GSS.getById(id);
    return this.getter.measure(el, prop);
  };

  Engine.prototype.resetWorkerCommands = function() {
    this.lastWorkerCommands = this.workerCommands;
    return this.workerCommands = [];
  };

  Engine.prototype.handleWorkerMessage = function(message) {
    LOG(this.id, ".handleWorkerMessage()", this.workerCommands);
    this.unobserve();
    cleanAndSnatch(message.data.values, this.vars);
    this.setter.set(this.vars);
    this.observe();
    return this.dispatch("solved", {
      values: this.vars
    });
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

  Engine.prototype.handleError = function(error) {
    if (this.onError) {
      return this.onError(error);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype._addVarCommandsForElements = function(elements) {
    return this.workerCommands.push("var", el.id + prop);
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
    return this.workerCommands.push(command);
  };

  Engine.prototype.registerDomQuery = function(o) {
    var query, selector;
    selector = o.selector;
    if (this.queryCache[selector] != null) {
      return this.queryCache[selector];
    } else {
      this.observe();
      query = new GSS.Query(o);
      query.update();
      this.queryCache[selector] = query;
      return query;
    }
  };

  return Engine;

})();

/*
Engine::loadAllASTs = () ->
  @ASTs = @getter.readAllASTs()

Engine::addAST = (ast) ->
  @ASTs.push ast
  @run ast  

Engine::removeAST = (ast) ->  
  @clean()
  @ASTs.splice @ASTs.indexOf(ast), 1
  @run @ASTs
*/


module.exports = Engine;
