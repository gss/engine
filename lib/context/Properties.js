var Properties;

Properties = (function() {
  function Properties() {}

  Properties.prototype['::window[width]'] = function(context) {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[width]"], w, 'required'];
  };

  Properties.prototype['::window[height]'] = function(context) {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    return ['suggest', ['get', "::window[height]"], w, 'required'];
  };

  Properties.prototype['::window[x]'] = 0;

  Properties.prototype['::window[y]'] = 0;

  Properties.prototype['::scope[x]'] = 0;

  Properties.prototype['::scope[y]'] = 0;

  Properties.prototype["[right]"] = function(scope) {
    return this.plus(this.get("[x]", scope), this.get("[width]", scope));
  };

  Properties.prototype["[bottom]"] = function(scope) {
    return this.plus(this.get("[y]", scope), this.get("[height]", scope));
  };

  Properties.prototype["[center-x]"] = function(scope) {
    return this.plus(this.get("[x]", scope), this.divide(this.get("[width]", scope), 2));
  };

  Properties.prototype["[center-y]"] = function(scope) {
    return this.plus(this.get("[y]", scope), this.divide(this.get("[height]", scope), 2));
  };

  Properties.prototype['get$'] = {
    prefix: '[',
    suffix: ']',
    command: function(path, object, property) {
      var id;
      if (object.nodeType) {
        id = this.engine.references.acquire(object);
      } else if (object.absolute === 'window') {
        return ['get', "::window[" + prop + "]", path];
      }
      if (property.indexOf("intrinsic-") === 0) {
        if (this.register("$" + id + "[intrinsic]", context)) {
          if (engine.vars[k] !== val) {
            return ['suggest', ['get', property, id, path], val, 'required'];
          }
        }
      }
      return ['get', property, '$' + id, path];
    }
  };

  return Properties;

})();

module.exports = Properties;
