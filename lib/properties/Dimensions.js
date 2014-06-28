var Dimensions;

Dimensions = (function() {
  function Dimensions() {}

  Dimensions.prototype['::window'] = {
    'width': function() {
      return window.innerWidth;
    },
    'height': function() {
      return window.innerHeight;
    },
    'scroll-left': function() {
      return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
    },
    'scroll-top': function() {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    },
    'x': 0,
    'y': 0
  };

  Dimensions.prototype["intrinsic-height"] = function(scope) {
    return scope.offsetHeight;
  };

  Dimensions.prototype["intrinsic-width"] = function(scope) {
    return scope.offsetWidth;
  };

  Dimensions.prototype["intrinsic-y"] = function(scope) {
    return scope.offsetTop;
  };

  Dimensions.prototype["intrinsic-x"] = function(scope) {
    return scope.offsetWidth;
  };

  Dimensions.prototype["scroll-left"] = function(scope) {
    return scope.scrollLeft;
  };

  Dimensions.prototype["scroll-top"] = function(scope) {
    return scope.scrollTop;
  };

  Dimensions.prototype["offset-left"] = function(scope) {
    return scope.offsetLeft;
  };

  Dimensions.prototype["offset-top"] = function(scope) {
    return scope.offsetTop;
  };

  return Dimensions;

})();

module.exports = Dimensions;
