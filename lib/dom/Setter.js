var Setter;

Setter = (function() {
  function Setter(scope) {
    this.scope = scope;
    if (!this.scope) {
      this.scope = document;
    }
  }

  Setter.prototype.clean = function() {};

  Setter.prototype.destroy = function() {};

  Setter.prototype.setOLD = function(vars) {
    var dimension, element, gid, key, val, _results;
    if (GSS.config.processBeforeSet) {
      vars = GSS.config.processBeforeSet(vars);
    }
    vars = this.cleanVarsForDisplay(vars);
    _results = [];
    for (key in vars) {
      val = vars[key];
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        dimension = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        element = GSS.getById(gid);
        if (element) {
          if (GSS.config.roundBeforeSet) {
            val = Math.round(val);
          }
          _results.push(this.elementSet(element, dimension, val));
        } else {
          _results.push(console.log("Element wasn't found"));
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Setter.prototype.set = function(vars) {
    var id, obj, varsById, _ref, _ref1, _results;
    if (GSS.config.processBeforeSet) {
      vars = GSS.config.processBeforeSet(vars);
    }
    varsById = this.varsByViewId(this.cleanVarsForDisplay(vars));
    for (id in varsById) {
      obj = varsById[id];
      if ((_ref = GSS.View.byId[id]) != null) {
        if (typeof _ref.setCSS === "function") {
          _ref.setCSS(obj);
        }
      }
    }
    _results = [];
    for (id in varsById) {
      obj = varsById[id];
      _results.push((_ref1 = GSS.View.byId[id]) != null ? typeof _ref1.display === "function" ? _ref1.display() : void 0 : void 0);
    }
    return _results;
  };

  Setter.prototype.varsByViewId = function(vars) {
    var gid, key, prop, val, varsById;
    varsById = {};
    for (key in vars) {
      val = vars[key];
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        if (!varsById[gid]) {
          varsById[gid] = {};
        }
        prop = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        varsById[gid][prop] = val;
      }
    }
    return varsById;
  };

  Setter.prototype.cleanVarsForDisplay = function(vars) {
    var idx, k, key, keysToKill, obj, val, _i, _len;
    obj = {};
    keysToKill = [];
    for (key in vars) {
      val = vars[key];
      idx = key.indexOf("intrinsic-");
      if (idx !== -1) {
        keysToKill.push(key.replace("intrinsic-", ""));
      } else {
        obj[key] = val;
      }
    }
    for (_i = 0, _len = keysToKill.length; _i < _len; _i++) {
      k = keysToKill[_i];
      delete obj[k];
    }
    return obj;
  };

  Setter.prototype.elementSet = function(element, dimension, value) {
    var offsets;
    offsets = null;
    switch (dimension) {
      case 'width':
      case 'w':
        return this.setWidth(element, value);
      case 'height':
      case 'h':
        return this.setHeight(element, value);
      case 'left':
      case 'x':
        return this.setLeft(element, value);
      case 'top':
      case 'y':
        return this.setTop(element, value);
    }
  };

  Setter.prototype.makePositioned = function(element) {
    if (element._gss_posititioned) {
      return;
    }
    element._gss_posititioned = true;
    element.style.position = 'absolute';
    return element.style.margin = '0px';
  };

  Setter.prototype.getOffsets = function(element) {
    var offsets;
    if (!GSS.config.useOffsetParent) {
      return {
        x: 0,
        y: 0
      };
    }
    offsets = {
      x: 0,
      y: 0
    };
    if (!element.offsetParent) {
      return offsets;
    }
    element = element.offsetParent;
    while (true) {
      offsets.x += element.offsetLeft;
      offsets.y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets;
  };

  Setter.prototype.setWidth = function(element, value) {
    return element.style.width = "" + value + "px";
  };

  Setter.prototype.setHeight = function(element, value) {
    return element.style.height = "" + value + "px";
  };

  Setter.prototype.setLeft = function(element, value, offsets) {
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.left = "" + (value - offsets.x) + "px";
  };

  Setter.prototype.setTop = function(element, value, offsets) {
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.top = "" + (value - offsets.y) + "px";
  };

  /*
  setwithStyleTag: (vars) =>
    if !@_has_setVars_styleTag
      @_has_setVars_styleTag = true
      @scope.insertAdjacentHTML('afterbegin','<style data-gss-generated></style>')
      @generatedStyle = @scope.childNodes[0]
    html = ""
    for key of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        html += "[data-gss-id=\"#{gid}\"]{#{dimension}:#{vars[key]}px !important;}"
    #@generatedStyle.textContent = html
    @generatedStyle.innerHTML = html
    #console.log @scope.childNodes
    #@scope.insertAdjacentHTML 'afterbegin', html
  */


  return Setter;

})();

module.exports = Setter;
