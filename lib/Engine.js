var Engine, Get, Set,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Get = require("./dom/Getter.js");

Set = require("./dom/Setter.js");

Engine = (function() {
  function Engine(container) {
    this.process = __bind(this.process, this);
    this.measure = __bind(this.measure, this);
    this.container = (container ? container : document);
    this.elements = {};
    this.variables = {};
    this.worker = null;
    this.getter = new Get(this.container);
    this.setter = new Set(this.container);
  }

  Engine.prototype.run = function(ast) {
    ast.vars.forEach(this.measure);
    return this.solve(ast.constraints);
  };

  Engine.prototype.measure = function(variable) {
    var dimension, identifier, selector;
    identifier = variable[1];
    dimension = variable[2];
    selector = variable[3];
    if (!selector) {
      return;
    }
    if (!this.elements[identifier]) {
      this.elements[identifier] = this.getter.get(selector);
    }
    return this.variables[identifier] = this.getter.measure(this.elements[identifier], dimension);
  };

  Engine.prototype.process = function(values) {
    var dimension, element, identifier, _results;
    _results = [];
    for (identifier in values) {
      dimension = "";
      element = this.elements(identifier);
      _results.push(this.setter.set(element, dimension, values[identifier]));
    }
    return _results;
  };

  Engine.prototype.solve = function(constraints) {
    if (!this.worker) {
      this.worker = new Worker("some-file");
      this.worker.addEventListener("message", this.process);
    }
    return this.worker.postMessage(constraints);
  };

  return Engine;

})();

module.exports = Engine;
