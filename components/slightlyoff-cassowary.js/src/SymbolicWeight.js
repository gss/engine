// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

var multiplier = 1000;

c.SymbolicWeight = c.inherit({
  _t: "c.SymbolicWeight",
  initialize: function(/*w1, w2, w3*/) {
    this.value = 0;
    var factor = 1;
    for (var i = arguments.length - 1; i >= 0; --i) {
      this.value += arguments[i] * factor;
      factor *= multiplier;
    }
  },

  toJSON: function() {
    return {
      _t: this._t,
      value: this.value
    };
  },
});

})(this["c"]||module.parent.exports||{});
