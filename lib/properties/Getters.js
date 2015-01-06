var Getters;

Getters = (function() {
  function Getters() {}

  Getters.prototype['::window'] = {
    width: function() {
      return document.documentElement.clientWidth;
    },
    height: function() {
      return Math.min(window.innerHeight, document.documentElement.clientHeight);
    },
    x: 0,
    y: 0
  };

  Getters.prototype['::document'] = {
    height: function() {
      return document.documentElement.clientHeight;
    },
    width: function() {
      return document.documentElement.clientWidth;
    },
    x: 0,
    y: 0,
    scroll: {
      height: function() {
        return document.body.scrollHeight;
      },
      width: function() {
        return document.body.scrollWidth;
      },
      left: function() {
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
      },
      top: function() {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      }
    }
  };

  Getters.prototype.intrinsic = {
    height: function(element) {},
    width: function(element) {},
    y: function(element) {},
    x: function(element) {}
  };

  Getters.prototype.scroll = {
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

  Getters.prototype.client = {
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

  Getters.prototype.offset = {
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

  return Getters;

})();

module.exports = Getters;
