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
      case 'w':
        return this.setWidth(element, value);
      case 'height':
      case 'h':
        return this.setHeight(element, value);
      case 'left':
      case 'x':
        return this.setLeft(element, value);
      case 'top':
      case 'y':
        return this.setTop(element, value);
    }
  };

  Setter.prototype.makePositioned = function(element) {
    return element.style.position = 'absolute';
  };

  Setter.prototype.getOffsets = function(element) {
    var offsets;
    offsets = {
      x: 0,
      y: 0
    };
    if (!element.offsetParent) {
      return offsets;
    }
    element = element.offsetParent;
    while (true) {
      offsets.x += element.offsetLeft;
      offsets.y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets;
  };

  Setter.prototype.setWidth = function(element, value) {
    return element.style.width = "" + value + "px";
  };

  Setter.prototype.setHeight = function(element, value) {
    return element.style.height = "" + value + "px";
  };

  Setter.prototype.setLeft = function(element, value) {
    var offsets;
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.left = "" + (value - offsets.x) + "px";
  };

  Setter.prototype.setTop = function(element, value) {
    var offsets;
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.top = "" + (value - offsets.y) + "px";
  };

  return Setter;

})();

module.exports = Setter;
