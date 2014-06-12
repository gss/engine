var Measurements;

Measurements = (function() {
  function Measurements(input) {
    this.input = input;
  }

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

  Measurements.prototype['::window[width]'] = function(context) {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[width]"], ['number', w], 'required'];
  };

  Measurements.prototype['::window[height]'] = function(context) {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[height]"], ['number', w], 'required'];
  };

  Measurements.prototype['::window[x]'] = 0;

  Measurements.prototype['::window[y]'] = 0;

  Measurements.prototype['::scope[x]'] = 0;

  Measurements.prototype['::scope[y]'] = 0;

  Measurements.prototype["[right]"] = function(path, node) {
    return this.plus(this._get(node, "x"), this._get(node, "width"));
  };

  Measurements.prototype["[bottom]"] = function(path, node) {
    return this.plus(this._get(node, "y"), this._get(node, "height"));
  };

  Measurements.prototype["[center-x]"] = function(path, node) {
    return this.plus(this._get(node, "x"), this.divide(this._get(node, "width"), 2));
  };

  Measurements.prototype["[center-y]"] = function(path, node) {
    return this.plus(this._get(node, "y"), this.divide(this._get(node, "height"), 2));
  };

  Measurements.prototype['get$'] = {
    prefix: '[',
    suffix: ']',
    command: function(path, object, property) {
      var id;
      if (object.nodeType) {
        id = GSS.setupId(object);
      } else if (object.absolute === 'window') {
        return ['get', "::window[" + prop + "]", path];
      }
      if (property.indexOf("intrinsic-") === 0) {
        if (this.register("$" + id + "[intrinsic]", context)) {
          if (engine.vars[k] !== val) {
            return ['suggest', ['get', property, id, path], ['number', val], 'required'];
          }
        }
      }
      return ['get', property, '$' + id, path];
    }
  };

  return Measurements;

})();

module.exports = Measurements;
