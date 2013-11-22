var View, firstSupportedStylePrefix, transformPrefix,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

firstSupportedStylePrefix = function(prefixedPropertyNames) {
  var name, tempDiv, _i, _len;
  tempDiv = document.createElement("div");
  for (_i = 0, _len = prefixedPropertyNames.length; _i < _len; _i++) {
    name = prefixedPropertyNames[_i];
    if (typeof tempDiv.style[name] !== 'undefined') {
      return name;
    }
  }
  return null;
};

transformPrefix = firstSupportedStylePrefix(["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform"]);

View = (function() {
  View.transformPrefix = transformPrefix;

  function View() {
    this.recycle = __bind(this.recycle, this);
    this.attach = __bind(this.attach, this);
    this.values = {};
    this;
  }

  View.prototype.attach = function(el, id) {
    this.el = el;
    this.id = id;
    if (!this.el) {
      throw new Error("View needs el");
    }
    if (!this.id) {
      throw new Error("View needs id");
    }
    View.byId[this.id] = this;
    return this.is_positioned = false;
  };

  View.prototype.recycle = function() {
    this.scope = null;
    this.is_positioned = false;
    this.el = null;
    delete View.byId[this.id];
    this.id = null;
    this.parentOffsets = null;
    this.style = null;
    this.values = {};
    return View.recycled.push(this);
  };

  View.prototype.is_positioned = false;

  View.prototype.positionIfNeeded = function() {
    if (!this.is_positioned) {
      this.style.position = 'absolute';
      this.style.margin = '0px';
      this.style.top = '0px';
      this.style.left = '0px';
    }
    return this.is_positioned = true;
  };

  View.prototype.updateParentOffsets = function() {
    return this.parentOffsets = this.getParentOffsets();
  };

  View.prototype.getParentOffsets = function() {
    var box;
    box = this.el.getBoundingClientRect();
    return {
      y: box.top + (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
      x: box.left + (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0)
    };
  };

  View.prototype.getParentOffsets__ = function() {
    var el, offsets;
    el = this.el;
    /*
    if !GSS.config.useOffsetParent 
      return { 
        x:0
        y:0
      }
    */

    offsets = {
      x: 0,
      y: 0
    };
    if (!el.offsetParent) {
      return offsets;
    }
    el = el.offsetParent;
    while (true) {
      offsets.x += el.offsetLeft;
      offsets.y += el.offsetTop;
      if (!el.offsetParent) {
        break;
      }
      el = el.offsetParent;
    }
    return offsets;
  };

  View.prototype.needsDisplay = false;

  View.prototype.display = function(offsets) {
    var key, o, val, _ref, _ref1;
    if (!this.values) {
      return;
    }
    o = {};
    _ref = this.values;
    for (key in _ref) {
      val = _ref[key];
      o[key] = val;
    }
    if ((o.x != null) || (o.y != null)) {
      if (this.parentOffsets) {
        offsets.x += this.parentOffsets.x;
        offsets.y += this.parentOffsets.y;
      }
      this.style[transformPrefix] = "";
      if (o.x != null) {
        this.style[transformPrefix] += " translateX(" + (o.x - offsets.x) + "px)";
        delete o.x;
      }
      if (o.y != null) {
        this.style[transformPrefix] += " translateY(" + (o.y - offsets.y) + "px)";
        delete o.y;
      }
    }
    if (o['z-index'] != null) {
      this.style['z-index'] = o['z-index'];
      delete o['z-index'];
    }
    /*   
    if o['line-height']?
      @style['line-height'] = o['line-height']
      delete o['line-height']
    */

    /*
    if o.width?
      @style.width = o.width + "px"
      delete o.width
    if o.height?
      @style.height = o.height + "px"
      delete o.height
    */

    for (key in o) {
      val = o[key];
      this.style[key] = val + "px";
    }
    _ref1 = this.style;
    for (key in _ref1) {
      val = _ref1[key];
      this.el.style[key] = val;
    }
    return this;
  };

  View.prototype.displayIfNeeded = function(offsets, pass_to_children) {
    if (offsets == null) {
      offsets = {
        x: 0,
        y: 0
      };
    }
    if (pass_to_children == null) {
      pass_to_children = true;
    }
    if (this.needsDisplay) {
      this.display(offsets);
      this.setNeedsDisplay(false);
    }
    offsets = {
      x: 0,
      y: 0
    };
    if (this.values.x) {
      offsets.x += this.values.x;
    }
    if (this.values.y) {
      offsets.y += this.values.y;
    }
    if (pass_to_children) {
      return this.displayChildrenIfNeeded(offsets);
    }
  };

  View.prototype.setNeedsDisplay = function(bool) {
    if (bool) {
      return this.needsDisplay = true;
    } else {
      return this.needsDisplay = false;
    }
  };

  View.prototype.displayChildrenIfNeeded = function(offsets) {
    return this._displayChildrenIfNeeded(this.el, offsets, 0);
  };

  View.prototype._displayChildrenIfNeeded = function(el, offsets, recurseLevel) {
    var child, view, _i, _len, _ref, _results;
    if (recurseLevel <= GSS.config.maxDisplayRecursionDepth) {
      _ref = el.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        view = GSS.get.view(child);
        if (view) {
          _results.push(view.displayIfNeeded(offsets));
        } else {
          _results.push(this._displayChildrenIfNeeded(child, offsets, recurseLevel + 1));
        }
      }
      return _results;
    }
  };

  View.prototype.updateValues = function(o) {
    this.values = o;
    this.style = {};
    if (this.el.getAttribute('gss-parent-offsets') != null) {
      this.updateParentOffsets();
    }
    if ((o.x != null) || (o.y != null)) {
      this.positionIfNeeded();
    }
    this.setNeedsDisplay(true);
    return this;
  };

  View.prototype.getParentView = function() {
    var el, gid;
    el = this.el.parentElement;
    while (true) {
      gid = el._gss_id;
      if (gid) {
        return View.byId[gid];
      }
      if (!el.parentElement) {
        break;
      }
      el = el.parentElement;
    }
  };

  return View;

})();

View.byId = {};

View.recycled = [];

View.count = 0;

View["new"] = function(_arg) {
  var el, id, view;
  el = _arg.el, id = _arg.id;
  View.count++;
  if (View.recycled.length > 0) {
    view = View.recycled.pop();
  } else {
    view = new View();
  }
  return view.attach(el, id);
};

module.exports = View;
