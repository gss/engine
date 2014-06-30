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
      var y;
      y = 0;
      while (scope) {
        y = scope.offsetTop;
        scope = scope.offsetParent;
        if (scope === this.scope) {
          break;
        }
        if (scope === this.scope.offsetParent) {
          y -= this.scope.offsetTop;
        }
      }
      return y;
    },
    x: function(scope) {
      var x;
      x = 0;
      while (scope) {
        x = scope.offsetLeft;
        scope = scope.offsetParent;
        if (scope === this.scope) {
          break;
        }
        if (scope === this.scope.offsetParent) {
          x -= this.scope.offsetLeft;
        }
      }
      return x;
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
