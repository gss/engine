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
        return element.style.width = value;
      case 'left':
        element.style.position = 'absolute';
        return element.style.left = value;
    }
  };

  return Setter;

})();
