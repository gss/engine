var Dimensions;

Dimensions = (function() {
  function Dimensions() {}

  Dimensions.prototype['::window'] = {
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

  Dimensions.prototype.intrinsic = {
    height: function(scope) {
      return scope.offsetHeight;
    },
    width: function(scope) {
      return scope.offsetWidth;
    },
    y: function(scope) {
      debugger;
      return scope.offsetTop;
    },
    x: function(scope) {
      return scope.offsetWidth;
    }
  };

  Dimensions.prototype.scroll = {
    left: function(scope) {
      return scope.scrollLeft;
    },
    top: function(scope) {
      return scope.scrollTop;
    }
  };

  Dimensions.prototype.client = {
    left: function(scope) {
      return scope.clientLeft;
    },
    top: function(scope) {
      return scope.clientTop;
    }
  };

  Dimensions.prototype.offset = {
    left: function(scope) {
      return scope.offsetLeft;
    },
    top: function(scope) {
      return scope.offsetTop;
    }
  };

  return Dimensions;

})();

module.exports = Dimensions;
