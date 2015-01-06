var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype['::window'] = {
    width: function() {
      return window.innerWidth;
    },
    height: function() {
      return window.innerHeight;
    },
    scroll: {
      left: function() {
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
      },
      top: function() {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      }
    },
    x: 0,
    y: 0
  };

  Measurements.prototype['::document'] = {
    scroll: {
      left: '::window[scroll-left]',
      top: '::window[scroll-top]'
    },
    x: '::window[x]',
    y: '::window[y]'
  };

  Measurements.prototype.intrinsic = {
    height: function(element) {},
    width: function(element) {},
    y: function(element) {},
    x: function(element) {}
  };

  Measurements.prototype.scroll = {
    left: function(element) {
      return element.scrollLeft;
    },
    top: function(element) {
      return element.scrollTop;
    },
    height: function(element) {
      return element.scrollHeight;
    },
    width: function(element) {
      return element.scrollWidth;
    }
  };

  Measurements.prototype.client = {
    left: function(element) {
      return element.clientLeft;
    },
    top: function(element) {
      return element.clientTop;
    },
    height: function(element) {
      return element.clientHeight;
    },
    width: function(element) {
      return element.clientWidth;
    }
  };

  Measurements.prototype.offset = {
    left: function(element) {
      return element.offsetLeft;
    },
    top: function(element) {
      return element.offsetTop;
    },
    height: function(element) {
      return element.offsetHeight;
    },
    width: function(element) {
      return element.offsetWidth;
    }
  };

  return Measurements;

})();

module.exports = Dimensions;
