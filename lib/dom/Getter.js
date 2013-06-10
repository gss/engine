var Getter;

Getter = (function() {
  function Getter(container) {
    this.container = container;
    if (!this.container) {
      this.container = document;
    }
  }

  Getter.prototype.get = function(selector) {
    var identifier, method;
    method = selector[0];
    identifier = selector[1];
    switch (method) {
      case "$id":
        if (identifier[0] === '#') {
          identifier = identifier.substr(1);
        }
        return document.getElementById(identifier);
      case "$class":
        if (identifier[0] === '.') {
          identifier = identifier.substr(1);
        }
        return this.container.getElementsByClassName(identifier);
      case "$tag":
        return this.container.getElementsByTagName(identifier);
    }
    return this.container.querySelectorAll(identifier);
  };

  Getter.prototype.getPosition = function(element) {
    var offsets, x, y;
    x = 0;
    y = 0;
    while (true) {
      x += element.offsetLeft;
      y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets = {
      left: x,
      top: y
    };
  };

  Getter.prototype.measure = function(element, dimension) {
    switch (dimension) {
      case 'width':
        return element.getBoundingClientRect().width;
      case 'height':
        return element.getBoundingClientRect().height;
      case 'left':
      case 'x':
        return this.getPosition(element).left;
      case 'top':
      case 'y':
        return this.getPosition(element).top;
      case 'bottom':
        return this.measure(element, 'top') + this.measure(element, 'height');
      case 'right':
        return this.measure(element, 'left') + this.measure(element, 'width');
      case 'centerX':
        return this.measure(element, 'left') + this.measure(element, 'width') / 2;
      case 'centerY':
        return this.measure(element, 'top') + this.measure(element, 'height') / 2;
    }
  };

  return Getter;

})();

module.exports = Getter;
