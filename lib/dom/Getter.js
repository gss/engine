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
      case "$reserved":
        if (identifier === 'this') {
          return container;
        }
        break;
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
    var scroll;
    switch (dimension) {
      case 'width':
      case 'w':
        return element.getBoundingClientRect().width;
      case 'height':
      case 'h':
        return element.getBoundingClientRect().height;
      case 'left':
      case 'x':
        scroll = window.scrollX || window.scrollLeft || 0;
        return element.getBoundingClientRect().left + scroll;
      case 'top':
      case 'y':
        scroll = window.scrollY || window.scrollTop || 0;
        return element.getBoundingClientRect().top + scroll;
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
