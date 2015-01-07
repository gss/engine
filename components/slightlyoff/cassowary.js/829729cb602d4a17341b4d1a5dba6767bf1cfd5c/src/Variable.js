// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.AbstractVariable = c.inherit({
  isDummy:      false,
  isExternal:   false,
  isPivotable:  false,
  isRestricted: false,

  _init: function(args, varNamePrefix) {
    // Common mixin initialization.
    this.hashCode = c._inc();
    this.name = (varNamePrefix||"") + this.hashCode;
    if (args) {
      if (typeof args.name != "undefined") {
        this.name = args.name;
      }
      if (typeof args.value != "undefined") {
        this.value = args.value;
      }
      if (typeof args.prefix != "undefined") {
        this._prefix = args.prefix;
      }
    }
  },

  _prefix: "",
  name: "",
  value: 0,

  valueOf: function() { return this.value; },

  toJSON: function() {
    var o = {};
    if (this._t) {
      o._t = this._t;
    }
    if (this.name) {
      o.name = this.name;
    }
    if (typeof this.value != "undefined") {
      o.value = this.value;
    }
    if (this._prefix) {
      o._prefix = this._prefix;
    }
    if (this._t) {
      o._t = this._t;
    }
    return o;
  },

  fromJSON: function(o, Ctor) {
    var r = new Ctor();
    c.extend(r, o);
    return r;
  },

  toString: function() {
    return this._prefix + "[" + this.name + ":" + this.value + "]";
  },

});

c.Variable = c.inherit({
  _t: "c.Variable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "v");
    var vm = c.Variable._map;
    if (vm) { vm[this.name] = this; }
  },
  isExternal:     true,
});

/* static */
// c.Variable._map = [];

c.DummyVariable = c.inherit({
  _t: "c.DummyVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "d");
  },
  isDummy:        true,
  isRestricted:   true,
  value:         "dummy",
});

c.ObjectiveVariable = c.inherit({
  _t: "c.ObjectiveVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "o");
  },
  value:         "obj",
});

c.SlackVariable = c.inherit({
  _t: "c.SlackVariable",
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "s");
  },
  isPivotable:    true,
  isRestricted:   true,
  value:         "slack",
});

})(this["c"]||module.parent.exports||{});
