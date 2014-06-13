var View, transformPrefix,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

transformPrefix = GSS._.transformPrefix;

View = (function() {
  function View() {
    this.printCssTree = __bind(this.printCssTree, this);
    this.recycle = __bind(this.recycle, this);
    this.attach = __bind(this.attach, this);
    this.values = {};
    this.is_positioned = false;
    this.el = null;
    this.id = null;
    this.parentOffsets = null;
    this.style = null;
    this.Matrix = null;
    this.matrixType = null;
    this.virtuals = null;
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
    if (this.el.ClassList) {
      this.el.ClassList.patch(this.el);
    }
    View.byId[this.id] = this;
    this.is_positioned = false;
    this.el.gssView = this;
    GSS.trigger('view:attach', this);
    if (!this.matrixType) {
      this.matrixType = GSS.config.defaultMatrixType;
    }
    this.Matrix = GSS.glMatrix[this.matrixType] || (function() {
      throw new Error("View matrixType not found: " + this.matrixType);
    }).call(this);
    if (!this.matrix) {
      this.matrix = this.Matrix.create();
    }
    return this;
  };

  View.prototype.recycle = function() {
    GSS.trigger('view:detach', this);
    if (this.el.ClassList) {
      this.el.ClassList.unpatch(this.el);
    }
    this.is_positioned = false;
    this.el = null;
    delete View.byId[this.id];
    this.id = null;
    this.parentOffsets = null;
    this.style = null;
    this.Matrix.identity(this.matrix);
    this.matrixType = null;
    this.virtuals = null;
    this.values = {};
    return View.recycled.push(this);
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
    var key, o, val, xLocal, yLocal, _ref;
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
      if (o.x != null) {
        xLocal = o.x - offsets.x;
        delete o.x;
      } else {
        xLocal = 0;
      }
      if (o.y != null) {
        yLocal = o.y - offsets.y;
        delete o.y;
      } else {
        yLocal = 0;
      }
      if (!GSS.config.fractionalPixels) {
        xLocal = Math.round(xLocal);
        yLocal = Math.round(yLocal);
      }
      this.values.xLocal = xLocal;
      this.values.yLocal = yLocal;
      this._positionMatrix(xLocal, yLocal);
    }
    if (o['z-index'] != null) {
      this.style['zIndex'] = o['z-index'];
      delete o['z-index'];
    }
    if (o['opacity'] != null) {
      this.style['opacity'] = o['opacity'];
      delete o['opacity'];
    }
    /*   
    if o['line-height']?
      @style['line-height'] = o['line-height']
      delete o['line-height']
    */

    if (!GSS.config.fractionalPixels) {
      if (o.width != null) {
        o.width = Math.round(o.width);
      }
      if (o.height != null) {
        o.height = Math.round(o.height);
      }
    }
    for (key in o) {
      val = o[key];
      key = GSS._.camelize(key);
      this.style[key] = val + "px";
    }
    GSS._.setStyles(this.el, this.style);
    return this;
  };

  /*
  _positionTranslate: (xLocal, yLocal) ->
    @style[transformPrefix] += " translateX(#{@xLocal}px)"
    @style[transformPrefix] += " translateY(#{@yLocal}px)"
  */


  View.prototype.positionIfNeeded = function() {
    if (!this.is_positioned) {
      this.style.position = 'absolute';
      this.style.margin = '0px';
      this.style.top = '0px';
      this.style.left = '0px';
    }
    return this.is_positioned = true;
  };

  View.prototype._positionMatrix = function(xLocal, yLocal) {
    this.Matrix.translate(this.matrix, this.matrix, [xLocal, yLocal, 0]);
    return this.style[transformPrefix] = GSS._[this.matrixType + "ToCSS"](this.matrix);
  };

  View.prototype.printCss = function() {
    var css, found, key, val, _ref;
    css = "";
    if (this.is_positioned) {
      css += 'position:absolute;';
      css += 'margin:0px;';
      css += 'top:0px;';
      css += 'left:0px;';
    }
    found = false;
    _ref = this.style;
    for (key in _ref) {
      val = _ref[key];
      found = true;
      css += "" + (GSS._.dasherize(key)) + ":" + val + ";";
    }
    if (!found) {
      return "";
    }
    return ("#" + this.id + "{") + css + "}";
  };

  View.prototype.printCssTree = function(el, recurseLevel) {
    var child, children, css, view, _i, _len;
    if (recurseLevel == null) {
      recurseLevel = 0;
    }
    if (!el) {
      el = this.el;
      css = this.printCss();
    } else {
      css = "";
    }
    if (recurseLevel > GSS.config.maxDisplayRecursionDepth) {
      return "";
    }
    children = el.children;
    if (!children) {
      return "";
    }
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      view = GSS.get.view(child);
      if (view) {
        css += view.printCssTree();
      } else {
        css += this.printCssTree(child, recurseLevel + 1);
      }
    }
    return css;
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
    var child, children, view, _i, _len, _results;
    if (recurseLevel <= GSS.config.maxDisplayRecursionDepth) {
      children = el.children;
      if (!children) {
        return null;
      }
      _results = [];
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
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
    this.Matrix.identity(this.matrix);
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

  View.prototype.addVirtuals = function(names) {
    var name, _i, _len;
    if (!this.virtuals) {
      return this.virtuals = [].concat(names);
    }
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      name = names[_i];
      this.addVirtual(name);
    }
    return null;
  };

  View.prototype.addVirtual = function(name) {
    if (!this.virtuals) {
      return this.virtuals = [name];
    }
    if (this.virtuals.indexOf(name) === -1) {
      this.virtuals.push(name);
    }
    return null;
  };

  View.prototype.hasVirtual = function(name) {
    if (!this.virtuals) {
      return false;
    } else if (this.virtuals.indexOf(name) === -1) {
      return false;
    }
    return true;
  };

  View.prototype.nearestViewWithVirtual = function(name) {
    var ancestor;
    ancestor = this;
    while (ancestor) {
      if (ancestor.hasVirtual(name)) {
        return ancestor;
      }
      ancestor = ancestor.parentElement;
    }
    return null;
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
