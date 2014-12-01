/* Output: DOM element styles
  
Applies style changes in bulk, separates reflows & positions.
Revalidates intrinsic measurements, optionally schedules 
another solver pass
*/

var Positions;

Positions = (function() {
  function Positions(engine) {
    this.engine = engine;
  }

  Positions.prototype["yield"] = function(id, property, value, positioning) {
    var element, last, path;
    if (id == null) {
      path = property;
      last = path.lastIndexOf('[');
      if (last === -1) {
        return;
      }
      property = path.substring(last + 1, path.length - 1);
      id = path.substring(0, last);
    }
    if (id.charAt(0) === ':') {
      return;
    }
    if (!(element = this.engine.identity[id])) {
      if (id.indexOf('"') > -1) {
        return;
      }
      if (!(element = document.getElementById(id.substring(1)))) {
        return;
      }
    }
    if (positioning && (property === 'x' || property === 'y')) {
      return (positioning[id] || (positioning[id] = {}))[property] = value;
    } else {
      return this.engine.intrinsic.restyle(element, property, value);
    }
  };

  Positions.prototype.solve = function(data, node) {
    var id, path, positioning, prop, styles, value, _ref, _ref1;
    node || (node = this.reflown || this.engine.scope);
    if ((_ref = this.engine.mutations) != null) {
      _ref.disconnect(true);
    }
    positioning = {};
    if (data) {
      for (path in data) {
        value = data[path];
        if (value !== void 0) {
          this["yield"](null, path, value, positioning);
        }
      }
    }
    this.engine.intrinsic.each(node, this.placehold, null, null, null, positioning, !!data);
    for (id in positioning) {
      styles = positioning[id];
      for (prop in styles) {
        value = styles[prop];
        this["yield"](id, prop, value);
      }
    }
    if ((_ref1 = this.engine.mutations) != null) {
      _ref1.connect(true);
    }
    return data;
  };

  Positions.prototype.placehold = function(element, x, y, positioning, full) {
    var left, offsets, property, styles, top, uid, value, values;
    offsets = void 0;
    if (uid = element._gss_id) {
      styles = positioning != null ? positioning[uid] : void 0;
      if (values = this.engine.values) {
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

  return Positions;

})();

module.exports = Positions;
