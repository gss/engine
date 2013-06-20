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

  Getter.prototype.measure = function(element, dimension) {
    switch (dimension) {
      case 'width':
      case 'w':
        return element.getBoundingClientRect().width;
      case 'height':
      case 'h':
        return element.getBoundingClientRect().height;
      case 'left':
      case 'x':
        return element.getBoundingClientRect().left;
      case 'top':
      case 'y':
        return element.getBoundingClientRect().top;
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
