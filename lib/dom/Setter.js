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
    return element.style.width = value;
  };

  Setter.prototype.setLeft = function(element, value) {
    this.makePositioned(element);
    return element.style.left = value;
  };

  return Setter;

})();
