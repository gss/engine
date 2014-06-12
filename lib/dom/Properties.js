var Properties;

Properties = (function() {
  function Properties() {}

  Properties.prototype["$rule"] = {
    prefix: "{",
    scope: true,
    evaluate: function(arg, i, evaluated) {
      if (i === 0) {
        return arg;
      }
      if (i === 1 || (evaluated[1] && i === 2)) {
        return this.evaluate(arg);
      }
    }
  };

  Properties.prototype["$if"] = {
    prefix: "@if",
    evaluate: function(arg, i, evaluated) {
      var _ref;
      if (i === 0) {
        return arg;
      }
      if (i === 1 || ((_ref = evaluated[1]) != null ? _ref : i === {
        2: i === 3
      })) {
        return this.evaluate(arg);
      }
    }
  };

  Properties.prototype['get$'] = {
    prefix: '[',
    suffix: ']',
    command: function(path, object, property) {
      var id, val;
      if (object.nodeType) {
        id = GSS.setupId(object);
      } else if (object.absolute === 'window') {
        return ['get', "::window[" + prop + "]", path];
      }
      if (property.indexOf("intrinsic-") === 0) {
        if (this.register("$" + id + "[intrinsic]", context)) {
          val = this.engine.measureByGssId(id, property);
          engine.setNeedsMeasure(true);
          if (engine.vars[k] !== val) {
            return ['suggest', ['get', property, id, path], ['number', val], 'required'];
          }
        }
      }
      return ['get', property, '$' + id, path];
    }
  };

  Properties.prototype['::window[width]'] = function(context) {
    var w;
    if (this.register("::window[size]", context)) {
      w = window.innerWidth;
      if (GSS.config.verticalScroll) {
        w = w - GSS.get.scrollbarWidth();
      }
      if (this.set(context, w)) {
        return ['suggest', ['get', "::window[width]"], ['number', w], 'required'];
      }
    }
  };

  Properties.prototype['::window[height]'] = function(context) {
    var h;
    if (this.register("::window[size]", context)) {
      h = window.innerHeight;
      if (GSS.config.horizontalScroll) {
        h = h - GSS.get.scrollbarWidth();
      }
      if (this.set(context, h)) {
        return ['suggest', ['get', "::window[height]"], ['number', w], 'required'];
      }
    }
  };

  Properties.prototype['::window[center-x]'] = function(context) {
    if (this.register("::window[width]", context)) {
      return ['eq', ['get', '::window[center-x]'], ['divide', ['get', '::window[width]'], 2], 'required'];
    }
  };

  Properties.prototype['::window[right]'] = function(context) {
    if (this.register("::window[width]", context)) {
      return ['eq', ['get', '::window[right]'], ['get', '::window[width]'], 'required'];
    }
  };

  Properties.prototype['::window[center-y]'] = function(context) {
    if (this.register("::window[height]", context)) {
      return ['eq', ['get', '::window[center-y]'], ['divide', ['get', '::window[height]'], 2], 'required'];
    }
  };

  Properties.prototype['::window[bottom]'] = function(context) {
    if (this.register("::window[height]", context)) {
      return ['eq', ['get', '::window[bottom]'], ['get', '::window[height]'], 'required'];
    }
  };

  Properties.prototype['::window[size]'] = {
    watch: 'onresize',
    context: function() {
      return window;
    }
  };

  Properties.prototype['::window[x]'] = 0;

  Properties.prototype['::window[y]'] = 0;

  Properties.prototype['::scope[x]'] = 0;

  Properties.prototype['::scope[y]'] = 0;

  return Properties;

})();

module.exports = Properties;
