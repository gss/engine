var Setter;

Setter = (function() {
  function Setter(container) {
    this.container = container;
    if (!this.container) {
      this.container = document;
    }
  }

  Setter.prototype.set = function(element, dimension, value) {
    switch (dimension) {
      case 'width':
        return this.setWidth(element, value);
      case 'left':
        return this.setLeft(element, value);
    }
  };

  Setter.prototype.makePositioned = function(element) {
    return element.style.position = 'absolute';
  };

  Setter.prototype.setWidth = function(element, value) {
    return element.style.width = "" + value + "px";
  };

  Setter.prototype.setLeft = function(element, value) {
    return this.makePositioned(element);
  };

  return Setter;

})();

module.exports = Setter;
