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
        return element.getBoundingClientRect().width;
      case 'height':
        return element.getBoundingClientRect().height;
    }
  };

  return Getter;

})();

module.exports = Getter;
