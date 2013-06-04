var Get = require('./dom/Get.js');

var Engine = function (container) {
  this.container = container ? container : document;
  this.elements = {};
  this.variables = {};
  this.worker = null;
  this.getter = new Get(this.container); 
};

Engine.prototype.run = function (ast) {
  // Get elements for variables
  ast.vars.forEach(this.measure.bind(this));

  for (var identifier in this.variables) {
    // Add constraints to AST
  }

  this.solve(ast.constraints);
};

Engine.prototype.measure = function (variable) {
  var identifier = variable[1];
  var dimension = variable[2];
  var selector = variable[3];
  if (!selector) {
    // Skip variables that are not on DOM
    return;
  }
  if (!this.elements[identifier]) {
    // Read element from DOM
    this.elements[identifier] = this.getter.get(selector);
  }
  // Measure the element
  this.variables[identifier] = this.getter.measure(this.elements[identifier], dimension);
};

Engine.prototype.process = function (values) {
  // Something
  for (var identifier in values) {
    var dimension = '';
    var element = this.elements(identifier);
    this.setter.set(element, dimension, values[identifier]);
  }
};

Engine.prototype.solve = function (constraints) {
  if (!this.worker) {
    this.worker = new Worker('some-file');
    this.worker.addEventListener('message', this.process.bind(this));
  }
  this.worker.postMessage(constraints);
};

module.exports = Engine;
