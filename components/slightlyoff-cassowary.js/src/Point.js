// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {

c.Point = c.inherit({
  initialize: function(x, y, suffix) {
    if (x instanceof c.Variable) {
      this._x = x;
    } else {
      var xArgs = { value: x };
      if (suffix) {
        xArgs.name = "x" + suffix;
      }
      this._x = new c.Variable(xArgs);
    }
    if (y instanceof c.Variable) {
      this._y = y;
    } else {
      var yArgs = { value: y };
      if (suffix) {
        yArgs.name = "y" + suffix;
      }
      this._y = new c.Variable(yArgs);
    }
  },

  get x() { return this._x; },
  set x(x) {
    if (x instanceof c.Variable) {
      this._x = x;
    } else {
      this._x.value = x;
    }
  },

  get y() { return this._y; },
  set y(y) {
    if (y instanceof c.Variable) {
      this._y = y;
    } else {
      this._y.value = y;
    }
  },

  toString: function() {
    return "(" + this.x + ", " + this.y + ")";
  },
});

})(this["c"]||module.parent.exports||{});
