var Identity, Negotiator, Solution;

Identity = (function() {
  function Identity() {}

  Identity.uid = 0;

  Identity.prototype.provide = function(object, generate) {
    var id;
    if (typeof object === 'string') {
      if (object.charAt(0) !== '$') {
        return '$' + object;
      } else {
        return object;
      }
    }
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        object._gss_id = id || (id = "$" + (object._gss_uid || object.id || ++Identity.uid));
        this[id] = object;
      }
    }
    return id;
  };

  return Identity;

})();

Solution = (function() {
  function Solution(values, scope) {
    if (scope == null) {
      scope = document;
    }
    if (!this.preimport) {
      return new Solution(values, scope);
    }
    this.scope = scope;
    this.identity = new Identity;
    this.preimport();
    this.apply(values, this.scope);
  }

  Solution.prototype.preimport = function() {
    var element, _i, _len, _ref, _results;
    this.identity.provide(document.body);
    this.all = document.body.getElementsByTagName('*');
    _ref = this.all;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push(this.identity.provide(element));
    }
    return _results;
  };

  Solution.prototype.each = function(parent, callback, x, y, offsetParent, a, r, g, s) {
    var child, index, measure, offsets, scope;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    scope = this.scope;
    parent || (parent = scope);
    if (offsets = callback.call(this, parent, x, y, a, r, g, s)) {
      x += offsets.x || 0;
      y += offsets.y || 0;
    }
    if (parent.offsetParent === scope) {
      x -= scope.offsetLeft;
      y -= scope.offsetTop;
    } else if (parent !== scope) {
      if (!offsets) {
        measure = true;
      }
    }
    if (parent === document) {
      parent = document.body;
    }
    child = parent.firstChild;
    index = 0;
    while (child) {
      if (child.nodeType === 1) {
        if (measure && index === 0 && child.offsetParent === parent) {
          x += parent.offsetLeft + parent.clientLeft;
          y += parent.offsetTop + parent.clientTop;
          offsetParent = parent;
        }
        if (child.style.position === 'relative') {
          this.each(child, callback, 0, 0, offsetParent, a, r, g, s);
        } else {
          this.each(child, callback, x, y, offsetParent, a, r, g, s);
        }
        index++;
      }
      child = child.nextSibling;
    }
    return a;
  };

  Solution.prototype.getPath = function(id, property) {
    return id + '[' + property + ']';
  };

  Solution.prototype.provide = function(id, property, value, positioning) {
    var element, last, path;
    if (id == null) {
      path = property;
      last = path.lastIndexOf('[');
      if (last === -1) {
        return;
      }
      property = path.substring(last + 1, path.length - 1);
      id = path.substring(0, last);
    } else {
      path = this.getPath(id, property);
    }
    if (id.charAt(0) === ':') {
      return;
    }
    if (!(element = this.identity[id])) {
      if (id.indexOf('"') > -1) {
        return;
      }
      if (!(element = this.scope.getElementById(id.substring(1)))) {
        return;
      }
    }
    if (positioning && (property === 'x' || property === 'y')) {
      return (positioning[id] || (positioning[id] = {}))[property] = value;
    } else {
      return this.restyle(element, property, value);
    }
  };

  Solution.prototype.camelize = function(string) {
    return string.toLowerCase().replace(/-([a-z])/gi, function(match) {
      return match[1].toUpperCase();
    });
  };

  Solution.prototype.restyle = function(element, property, value, continuation, operation) {
    var camel, position;
    if (value == null) {
      value = '';
    }
    switch (property) {
      case "x":
        property = "left";
        break;
      case "y":
        property = "top";
    }
    camel = this.camelize(property);
    if (typeof value !== 'string') {
      if (property !== 'z-index' && property !== 'opacity') {
        value = value + 'px';
      }
    }
    if (property === 'left' || property === 'top') {
      position = element.style.position;
      if (element.positioned === void 0) {
        element.positioned = +(!!position);
      }
      if (position && position !== 'absolute') {
        return;
      }
      if (element.style[camel] === '') {
        if ((value != null) && value !== '') {
          element.positioned = (element.positioned || 0) + 1;
        }
      } else {
        if ((value == null) || value === '') {
          element.positioned = (element.positioned || 0) - 1;
        }
      }
      if (element.positioned === 1) {
        element.style.position = 'absolute';
      } else if (element.positioned === 0) {
        element.style.position = '';
      }
    }
    return element.style[camel] = value;
  };

  Solution.prototype.apply = function(object, node) {
    var data, id, path, positioning, prop, property, styles, value, _ref;
    data = {};
    for (property in object) {
      value = object[property];
      data[property] = value;
    }
    if (data.stylesheets) {
      if (!this.sheet) {
        this.sheet = document.createElement('style');
        document.body.appendChild(this.sheet);
      }
      this.sheet.textContent = this.sheet.innerText = data.stylesheets;
      delete data.stylesheets;
    }
    if (this.values) {
      _ref = this.values;
      for (property in _ref) {
        value = _ref[property];
        if (data[property] == null) {
          data[property] = null;
        }
      }
    }
    positioning = {};
    if (data) {
      for (path in data) {
        value = data[path];
        if (value !== void 0) {
          this.provide(null, path, value, positioning);
        }
      }
    }
    this.each(node, this.placehold, null, null, null, positioning, !!data);
    for (id in positioning) {
      styles = positioning[id];
      for (prop in styles) {
        value = styles[prop];
        this.provide(id, prop, value);
      }
    }
    for (property in data) {
      value = data[property];
      if (value == null) {
        delete data[property];
      }
    }
    if (!this.values) {
      document.body.parentNode.className += ' gss-ready';
    }
    return this.values = data;
  };

  Solution.prototype.placehold = function(element, x, y, positioning, full) {
    var left, offsets, property, styles, top, uid, value, values;
    offsets = void 0;
    if (uid = element._gss_id) {
      styles = positioning != null ? positioning[uid] : void 0;
      if (values = this.values) {
        if ((styles != null ? styles.x : void 0) === void 0) {
          if ((left = values[uid + '[x]']) != null) {
            (styles || (styles = (positioning[uid] || (positioning[uid] = {})))).x = left;
          }
        }
        if ((styles != null ? styles.y : void 0) === void 0) {
          if ((top = values[uid + '[y]']) != null) {
            (styles || (styles = (positioning[uid] || (positioning[uid] = {})))).y = top;
          }
        }
      }
      if (styles) {
        for (property in styles) {
          value = styles[property];
          if (value !== null) {
            switch (property) {
              case "x":
                styles.x = value - x;
                (offsets || (offsets = {})).x = value - x;
                break;
              case "y":
                styles.y = value - y;
                (offsets || (offsets = {})).y = value - y;
            }
          }
        }
      }
    }
    return offsets;
  };

  return Solution;

})();

Negotiator = (function() {
  function Negotiator(sizes, storage, baseline, callback, offset, prefix) {
    var group, height, size, width, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
    if (baseline == null) {
      baseline = 72;
    }
    if (!this.match) {
      return Negotiator.instance || (Negotiator.instance = new Negotiator(sizes, storage, baseline, callback, offset, prefix));
    }
    this.sizes = [];
    this.callback = callback;
    if (prefix) {
      this.prefix = prefix + ' ';
    } else {
      this.prefix = '';
    }
    this.storage = storage || localStorage;
    this.offset = offset || 0;
    for (_i = 0, _len = sizes.length; _i < _len; _i++) {
      group = sizes[_i];
      _ref = group[0];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        width = _ref[_j];
        _ref1 = group[1];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          height = _ref1[_k];
          this.sizes.push(width + 'x' + height);
        }
      }
    }
    this.widths = [];
    this.heights = [];
    _ref2 = this.sizes;
    for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
      size = _ref2[_l];
      if (!this.storage[this.prefix + size]) {
        continue;
      }
      _ref3 = size.split('x'), width = _ref3[0], height = _ref3[1];
      this.widths.push(parseInt(width) * baseline);
      this.heights.push(parseInt(height) * baseline);
    }
    window.addEventListener('resize', (function(_this) {
      return function() {
        return _this.match();
      };
    })(this));
    window.addEventListener('orientationchange', (function(_this) {
      return function() {
        return setTimeout(function() {
          return _this.match();
        }, 50);
      };
    })(this));
    this.match();
  }

  Negotiator.prototype.match = function(width, height) {
    var h, i, values, w, x, y, _i, _j, _len, _len1, _ref, _ref1;
    if (width == null) {
      width = window.innerWidth + this.offset;
    }
    if (height == null) {
      height = window.innerHeight;
    }
    x = y = 0;
    _ref = this.widths;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      w = _ref[i];
      if (this.storage[this.prefix + this.sizes[i]]) {
        if ((width - w) > 0 && (width - w) < (width - x)) {
          x = w;
        }
      }
    }
    _ref1 = this.heights;
    for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
      h = _ref1[i];
      if (this.storage[this.prefix + this.sizes[i]]) {
        if (this.widths[i] === x) {
          if (!y || (Math.abs(height - h) < Math.abs(height - y))) {
            y = h;
          }
        }
      }
    }
    if (!y || !h) {
      return;
    }
    values = this.storage[this.prefix + x / 72 + 'x' + y / 72];
    if (typeof values === 'string') {
      values = JSON.parse(values);
    }
    if (this.solution) {
      this.solution.apply(values);
    } else {
      this.solution = Solution(values);
    }
    return this.callback(x, y, values);
  };

  return Negotiator;

})();