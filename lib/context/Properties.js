var Properties, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Properties = (function(_super) {
  __extends(Properties, _super);

  function Properties() {
    _ref = Properties.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Properties.prototype.plus = function(a, b) {
    return a + b;
  };

  Properties.prototype.minus = function(a, b) {
    return a - b;
  };

  Properties.prototype.multiply = function(a, b) {
    return a * b;
  };

  Properties.prototype.divide = function(a, b) {
    return a / b;
  };

  Properties.prototype['::window[width]'] = function(context) {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[width]"], ['number', w], 'required'];
  };

  Properties.prototype['::window[height]'] = function(context) {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[height]"], ['number', w], 'required'];
  };

  Properties.prototype['::window[x]'] = 0;

  Properties.prototype['::window[y]'] = 0;

  Properties.prototype['::scope[x]'] = 0;

  Properties.prototype['::scope[y]'] = 0;

  Properties.prototype["[right]"] = function(path, node) {
    return this.plus(this._get(node, "x"), this._get(node, "width"));
  };

  Properties.prototype["[bottom]"] = function(path, node) {
    return this.plus(this._get(node, "y"), this._get(node, "height"));
  };

  Properties.prototype["[center-x]"] = function(path, node) {
    return this.plus(this._get(node, "x"), this.divide(this._get(node, "width"), 2));
  };

  Properties.prototype["[center-y]"] = function(path, node) {
    return this.plus(this._get(node, "y"), this.divide(this._get(node, "height"), 2));
  };

  Properties.prototype['get$'] = {
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

  return Properties;

})(Engine.Pipe);

module.exports = Properties;
