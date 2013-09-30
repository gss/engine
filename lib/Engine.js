var Command, Engine, Get, Set,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Get = require("./dom/Getter.js");

Set = require("./dom/Setter.js");

Command = require("./Command.js");

Engine = (function() {
  function Engine(workerPath, container) {
    this.workerPath = workerPath;
    this.container = container;
    this._execute = __bind(this._execute, this);
    this.execute = __bind(this.execute, this);
    this.process = __bind(this.process, this);
    this.measure = __bind(this.measure, this);
    if (!this.container) {
      this.container = document;
    }
    this.commands = new Command(this);
    this.elements = {};
    this.variables = {};
    this.dimensions = {};
    this.worker = null;
    this.getter = new Get(this.container);
    this.setter = new Set(this.container);
    this.onSolved = null;
    this.commandsForWorker = [];
  }

  Engine.prototype.run = function(ast) {
    var identifier, index, value, variable, _i, _len, _ref, _ref1;
    if (ast.vars) {
      ast.vars.forEach(this.measure);
      _ref = ast.vars;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        variable = _ref[index];
        ast.vars[index] = ['var', variable[1]];
      }
    }
    _ref1 = this.variables;
    for (identifier in _ref1) {
      value = _ref1[identifier];
      ast.constraints.unshift(['gte', ['get', identifier], ['number', value]]);
    }
    return this.solve(ast);
  };

  Engine.prototype.measure = function(variable) {
    var dimension, identifier, selector;
    identifier = variable[1];
    dimension = variable[2];
    selector = variable[3];
    if (!selector) {
      return;
    }
    this.dimensions[identifier] = dimension;
    if (!this.elements[identifier]) {
      this.elements[identifier] = this.getter.get(selector);
    }
    if (!this.elements[identifier]) {
      return;
    }
    return this.variables[identifier] = this.getter.measure(this.elements[identifier], dimension);
  };

  Engine.prototype.process = function(message) {
    var dimension, element, identifier, values;
    values = message.data.values;
    for (identifier in values) {
      dimension = this.dimensions[identifier];
      element = this.elements[identifier];
      this.setter.set(element, dimension, values[identifier]);
    }
    if (this.onSolved) {
      return this.onSolved(values);
    }
  };

  Engine.prototype.handleError = function(error) {
    if (this.onError) {
      return this.onError(error);
    }
    throw new Error("" + event.message + " (" + event.filename + ":" + event.lineno + ")");
  };

  Engine.prototype.solve = function(ast) {
    if (!this.worker) {
      this.worker = new Worker(this.workerPath);
      this.worker.addEventListener("message", this.process, false);
      this.worker.addEventListener("error", this.handleError, false);
    }
    return this.worker.postMessage({
      ast: ast
    });
  };

  Engine.prototype.stop = function() {
    if (!this.worker) {
      return;
    }
    return this.worker.terminate();
  };

  Engine.prototype._current_gid = 1;

  Engine.prototype._registerGssId = function(el) {
    var gid;
    gid = this._current_gid++;
    el.setAttribute('data-gss-id', gid);
    return gid;
  };

  Engine.prototype.execute = function(commands) {
    var command, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      _results.push(this._execute(command));
    }
    return _results;
  };

  Engine.prototype._execute = function(command) {
    var func, i, node, sub, _i, _len, _ref;
    node = command;
    func = this.command[node[0]];
    if (func == null) {
      throw new Error("Thread unparse broke, couldn't find method: " + node[0]);
    }
    _ref = node.slice(1, +node.length + 1 || 9e9);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      sub = _ref[i];
      if (sub instanceof Array) {
        node.splice(i + 1, 1, this._execute(sub));
      }
    }
    return func.apply(this, node.slice(1, node.length));
  };

  Engine.prototype._addVarCommandsForElements = function(elements) {
    return this.commandsForWorker.push("var", el.id + prop);
  };

  Engine.prototype.registerCommand = function(command, args) {
    return this.commandsForWorker.push(command, args);
  };

  Engine.prototype._registerLiveNodeList = function(selector, createNodeList) {
    var el, id, nodeList, query, _i, _len;
    if (this.queryCache[selector] != null) {
      return this.queryCache[selector];
    } else {
      query = {};
      nodeList = createNodeList();
      query.nodeList = nodeList;
      query.ids = [];
      for (_i = 0, _len = nodeList.length; _i < _len; _i++) {
        el = nodeList[_i];
        id = this._registerGssId(el);
        if (query.ids.indexOf(id) !== -1) {
          query.ids.push[id];
        }
      }
      query.observer = new PathObserver(nodeList, 'length', function(newval, oldval) {
        return alert('handle nodelist change');
      });
      this.queryCache[selector] = query;
      return nodeList;
    }
  };

  return Engine;

})();

module.exports = Engine;
