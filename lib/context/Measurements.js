var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.plus = function(a, b) {
    return a + b;
  };

  Measurements.prototype.minus = function(a, b) {
    return a - b;
  };

  Measurements.prototype.multiply = function(a, b) {
    return a * b;
  };

  Measurements.prototype.divide = function(a, b) {
    return a / b;
  };

  Measurements.prototype["[intrinsic-height]"] = function(scope) {
    return scope.offsetHeight;
  };

  Measurements.prototype["[intrinsic-width]"] = function(scope) {
    return scope.offsetWidth;
  };

  Measurements.prototype["[scroll-left]"] = function(scope) {
    return scope.scrollLeft;
  };

  Measurements.prototype["[scroll-top]"] = function(scope) {
    return scope.scrollTop;
  };

  Measurements.prototype["[left]"] = function(scope) {
    return this.get("[offsets]", scope).left;
  };

  Measurements.prototype["[top]"] = function(scope) {
    return this.get("[offsets]", scope).top;
  };

  Measurements.prototype["[offsets]"] = function(scope) {
    var offsets;
    offsets = {
      left: 0,
      top: 0
    };
    while (scope) {
      offsets.left += element.offsetLeft + element.clientLeft;
      offsets.top += element.offsetTop + element.clientTop;
      scope = scope.offsetParent;
    }
    return offsets;
  };

  Measurements.prototype['get'] = {
    prefix: '[',
    suffix: ']',
    command: function(path, object, property) {
      var id;
      if (!property) {
        return ['get', object, null, path];
      }
      if (object.absolute === 'window' || object === document) {
        return ['get', "::window[" + prop + "]", null, path];
      }
      if (object.nodeType) {
        id = this.engine.identify(object);
      }
      if (typeof this[property] === 'function') {
        return this[property](scope);
      }
      return ['get', property, id, path];
    }
  };

  return Measurements;

})();

module.exports = Measurements;
