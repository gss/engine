var Engine = function (container) {
  this.container = container ? container : document;
  this.elements = {};
  this.worker = null;
};

module.exports = Engine;
