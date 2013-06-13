var Engine, Get, Set,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Get = require("./dom/Getter.js");

Set = require("./dom/Setter.js");

Engine = (function() {
  function Engine(workerPath, container) {
    this.workerPath = workerPath;
    this.container = container;
    this.process = __bind(this.process, this);
    this.measure = __bind(this.measure, this);
    if (!this.container) {
      this.container = document;
    }
    this.elements = {};
    this.variables = {};
    this.dimensions = {};
    this.worker = null;
    this.getter = new Get(this.container);
    this.setter = new Set(this.container);
    this.onSolved = null;
  }

  Engine.prototype.run = function(ast) {
    var identifier, index, value, variable, _i, _len, _ref, _ref1;
    ast.vars.forEach(this.measure);
    _ref = ast.vars;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      variable = _ref[index];
      ast.vars[index] = ['var', variable[1]];
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
      this.worker.addEventListener("message", this.process);
      this.worker.addEventListener("error", this.handleError);
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

  return Engine;

})();

module.exports = Engine;
