var Engine, Get;

Get = require("./dom/Get.js");

Engine = function(container) {
  this.container = (container ? container : document);
  this.elements = {};
  this.variables = {};
  this.worker = null;
  this.getter = new Get(this.container);
  return this.getter;
};

Engine.prototype.run = function(ast) {
  ast.vars.forEach(this.measure.bind(this));
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
  this.variables[identifier] = this.getter.measure(this.elements[identifier], dimension);
  return this.variables[identifier];
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
    this.worker.addEventListener("message", this.process.bind(this));
  }
  return this.worker.postMessage(constraints);
};

module.exports = Engine;
