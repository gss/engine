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
      var addsBySelector, gid, m, node, query, removesBySelector, removesFromContainer, selector, selectorsWithAdds, trigger, _i, _j, _len, _len1, _ref, _ref1;
      trigger = false;
      removesFromContainer = [];
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        m = mutations[_i];
        if (m.removedNodes.lenght > 0) {
          _ref = m.removedNodes;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            node = _ref[_j];
            gid = GSS.getId(node);
            if (gid != null) {
              if (GSS.getById(gid)) {
                removesFromContainer.push(gid);
                trigger = true;
              }
            }
          }
        }
      }
      GSS._ids_killed(removesFromContainer);
      selectorsWithAdds = [];
      addsBySelector = {};
      removesBySelector = {};
      _ref1 = _this.queryCache;
      for (selector in _ref1) {
        query = _ref1[selector];
        query.update();
        if (query.changedLastUpdate) {
          if (query.lastAddedIds.length > 0) {
            trigger = true;
            selectorsWithAdds.push(selector);
            addsBySelector[selector] = query.lastAddedIds;
          }
          if (query.lastRemovedIds.length > 0) {
            trigger = true;
            removesBySelector[selector] = query.lastRemovedIds;
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

      if (trigger) {
        _this.commander.handleAddsToSelectors(selectorsWithAdds);
        return _this.solve();
      }
    });
    this.observer.observe(this.container, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });
  }

  Engine.prototype.run = function(ast) {
    this.execute(ast.commands);
    return this.solve();
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
    this.observer.disconnect();
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

  Engine.prototype.onElementsAdded = function(nodelist, callback) {
    var newEls;
    newEls = ['TBD...'];
    return callback.apply(this, newEls);
  };

  Engine.prototype.getVarsFromVarId = function(id) {};

  return Engine;

})();

module.exports = Engine;
