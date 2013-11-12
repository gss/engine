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
  function View() {
    this.recycle = __bind(this.recycle, this);
    this.onEngineDestroy = __bind(this.onEngineDestroy, this);
    this.attach = __bind(this.attach, this);
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
    /*
    @engine = GSS.get.nearestEngine(@el)
    console.log GSS.get.nearestEngine(@el)
    @engine.on "beforeDestroy", @onEngineDestroy
    */

  };

  /*
  setEngineIfNeeded: (engine) ->
    if !@engine
      @engine = engine
      @engine.on "beforeDestroy", @onEngineDestroy
  */


  View.prototype.onEngineDestroy = function() {
    this.engine.off("beforeDestroy", this.onEngineDestroy);
    return GSS._id_killed(this.id);
  };

  View.prototype.recycle = function() {
    this.scope = null;
    this.is_positioned = false;
    this.el = null;
    delete View.byId[this.id];
    this.id = null;
    this.offsets = null;
    this.style = null;
    return View.recycled.push(this);
  };

  View.prototype.is_positioned = false;

  View.prototype.setupForPositioning = function() {
    this.updateOffsets();
    if (!this.is_positioned) {
      this.style.position = 'absolute';
      this.style.margin = '0px';
    }
    return this.is_positioned = true;
  };

  View.prototype.updateOffsets = function() {
    return this.offsets = this.getOffsets();
  };

  View.prototype.getOffsets = function() {
    var el, offsets;
    el = this.el;
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

  View.prototype.display = function() {
    var key, val, _ref, _results;
    _ref = this.style;
    _results = [];
    for (key in _ref) {
      val = _ref[key];
      _results.push(this.el.style[key] = val);
    }
    return _results;
  };

  View.prototype.setCSS = function(o) {
    this.style = {};
    if ((o.x != null) || (o.y != null)) {
      this.setupForPositioning();
      if (o.x) {
        this.style.left = o.x - this.offsets.x + "px";
      }
      if (o.y) {
        this.style.top = o.y - this.offsets.y + "px";
      }
    }
    if (o.width != null) {
      this.style.width = o.width + "px";
    }
    if (o.height != null) {
      this.style.height = o.height + "px";
    }
    return this;
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
