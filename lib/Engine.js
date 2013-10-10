var Command, Engine, Get, Query, Set, arrayAddsRemoves,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

require("customevent-polyfill");

require("./GSS-id.js");

Query = require("./Query.js");

Get = require("./dom/Getter.js");

Set = require("./dom/Setter.js");

Command = require("./Command.js");

arrayAddsRemoves = function(old, neu, removesFromContainer) {
  var adds, n, o, removes, _i, _j, _len, _len1;
  adds = [];
  removes = [];
  for (_i = 0, _len = neu.length; _i < _len; _i++) {
    n = neu[_i];
    if (old.indexOf(n) === -1) {
      adds.push(n);
    }
  }
  for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
    o = old[_j];
    if (neu.indexOf(o) === -1) {
      if (removesFromContainer.indexOf(o) !== -1) {
        removes.push(o);
      }
    }
  }
  return {
    adds: adds,
    removes: removes
  };
};

Engine = (function() {
  function Engine(workerPath, container) {
    var _this = this;
    this.workerPath = workerPath;
    this.container = container;
    this.execute = __bind(this.execute, this);
    this.dispatch_solved = __bind(this.dispatch_solved, this);
    this.handleWorkerMessage = __bind(this.handleWorkerMessage, this);
    this.resetCommandsForWorker = __bind(this.resetCommandsForWorker, this);
    this.measure = __bind(this.measure, this);
    if (!this.container) {
      this.container = document;
    }
    this.commander = new Command(this);
    this.worker = null;
    this.getter = new Get(this.container);
    this.setter = new Set(this.container);
    this.commandsForWorker = [];
    this.lastCommandsForWorker = null;
    this.queryCache = {};
    this.observer = new MutationObserver(function(mutations) {
      var addsBySelector, gid, m, node, query, removedIds, removes, removesFromContainer, rid, selector, selectorsWithAdds, trigger, trigger_addsToSelectors, trigger_removes, trigger_removesFromContainer, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      trigger = false;
      trigger_removes = false;
      trigger_removesFromContainer = false;
      trigger_addsToSelectors = false;
      removes = [];
      removesFromContainer = [];
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        m = mutations[_i];
        if (m.removedNodes.length > 0) {
          _ref = m.removedNodes;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            node = _ref[_j];
            gid = GSS.getId(node);
            if (gid != null) {
              if (GSS.getById(gid)) {
                removes.push("$" + gid);
                trigger = true;
                trigger_removesFromContainer = true;
                trigger_removes = true;
              }
            }
          }
        }
      }
      GSS._ids_killed(removes);
      selectorsWithAdds = [];
      addsBySelector = {};
      _ref1 = _this.queryCache;
      for (selector in _ref1) {
        query = _ref1[selector];
        query.update();
        if (query.changedLastUpdate) {
          if (query.lastAddedIds.length > 0) {
            selectorsWithAdds.push(selector);
            addsBySelector[selector] = query.lastAddedIds;
            trigger = true;
            trigger_addsToSelectors = true;
          }
          if (query.lastRemovedIds.length > 0) {
            trigger = true;
            trigger_removes = true;
            removedIds = query.lastRemovedIds;
            for (_k = 0, _len2 = removedIds.length; _k < _len2; _k++) {
              rid = removedIds[_k];
              rid = "$" + rid;
              if (trigger_removesFromContainer) {
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
            removesFromContainer: removesFromContainer
            selectorsWithAdds: selectorsWithAdds
            engine: @
          bubbles: true
          cancelable: true
        @container.dispatchEvent e
      */

      if (trigger_removes) {
        _this.commander.handleRemoves(removes);
      }
      if (trigger_addsToSelectors) {
        _this.commander.handleAddsToSelectors(selectorsWithAdds);
      }
      if (trigger) {
        return _this.solve();
      }
    });
  }

  Engine.prototype._is_observing = false;

  Engine.prototype.observe = function() {
    if (!this._is_observing) {
      this.observer.observe(this.container, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: false
      });
      return this._is_observing = true;
    }
  };

  Engine.prototype.unobserve = function() {
    this._is_observing = false;
    return this.observer.disconnect();
  };

  Engine.prototype.run = function(ast) {
    this.execute(ast.commands);
    this.solve();
    return this.observe();
  };

  Engine.prototype.teardown = function() {};

  Engine.prototype.measure = function(el, prop) {
    return this.getter.measure(el, prop);
  };

  Engine.prototype.measureByGssId = function(id, prop) {
    var el;
    el = GSS.getById(id);
    return this.measure(el, prop);
  };

  Engine.prototype.resetCommandsForWorker = function() {
    this.lastCommandsForWorker = this.commandsForWorker;
    return this.commandsForWorker = [];
  };

  Engine.prototype.handleWorkerMessage = function(message) {
    var dimension, element, gid, key, values;
    this.unobserve();
    values = message.data.values;
    for (key in values) {
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        dimension = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        element = GSS.getById(gid);
        if (element) {
          this.setter.set(element, dimension, values[key]);
        } else {
          console.log("Element wasn't found");
        }
      }
    }
    this.observe();
    return this.dispatch_solved(values);
  };

  Engine.prototype.dispatch_solved = function(values) {
    var e;
    e = new CustomEvent("solved", {
      detail: {
        values: values,
        engine: this
      },
      bubbles: true,
      cancelable: true
    });
    return this.container.dispatchEvent(e);
  };

  Engine.prototype.handleError = function(error) {
    if (this.onError) {
      return this.onError(error);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype.solve = function() {
    var ast;
    ast = {
      commands: this.commandsForWorker
    };
    if (!this.worker) {
      this.worker = new Worker(this.workerPath);
      this.worker.addEventListener("message", this.handleWorkerMessage, false);
      this.worker.addEventListener("error", this.handleError, false);
    }
    this.worker.postMessage({
      ast: ast
    });
    return this.resetCommandsForWorker();
  };

  Engine.prototype.stopped = false;

  Engine.prototype.stop = function() {
    var query, selector, _ref;
    if (this.stopped) {
      return this;
    }
    this.unobserve();
    if (this.worker) {
      this.worker.terminate();
    }
    _ref = this.queryCache;
    for (selector in _ref) {
      query = _ref[selector];
      delete query.nodeList;
      delete query.ids;
      delete this.query;
    }
    return this.stopped = true;
  };

  Engine.prototype.execute = function(commands) {
    return this.commander.execute(commands);
  };

  Engine.prototype._addVarCommandsForElements = function(elements) {
    return this.commandsForWorker.push("var", el.id + prop);
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
    return this.commandsForWorker.push(command);
  };

  Engine.prototype.registerDomQuery = function(o) {
    var query, selector;
    selector = o.selector;
    if (this.queryCache[selector] != null) {
      return this.queryCache[selector];
    } else {
      query = new Query(o);
      this.queryCache[selector] = query;
      return query;
    }
  };

  return Engine;

})();

module.exports = Engine;
