/**
 * Copyright 2011, Alex Russell <slightlyoff@google.com>
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * API compatible re-implementation of jshashset.js, including only what
 * Cassowary needs. Built for speed, not comfort.
 */
(function(c) {
"use strict";

c.HashSet = c.inherit({
  _t: "c.HashSet",

  initialize: function() {
    this.storage = [];
    this.size = 0;
    this.hashCode = c._inc();
  },

  add: function(item) {
    var s = this.storage, io = s.indexOf(item);
    if (s.indexOf(item) == -1) { s[s.length] = item; }
    this.size = this.storage.length;
  },

  values: function() {
    // FIXME(slightlyoff): is it safe to assume we won't be mutated by our caller?
    //                     if not, return this.storage.slice(0);
    return this.storage;
  },

  has: function(item) {
    var s = this.storage;
    return (s.indexOf(item) != -1);
  },

  delete: function(item) {
    var io = this.storage.indexOf(item);
    if (io == -1) { return null; }
    this.storage.splice(io, 1)[0];
    this.size = this.storage.length;
  },

  clear: function() {
    this.storage.length = 0;
  },

  each: function(func, scope) {
    if(this.size)
      this.storage.forEach(func, scope);
  },

  escapingEach: function(func, scope) {
    // FIXME(slightlyoff): actually escape!
    if (this.size)
      this.storage.forEach(func, scope);
  },

  toString: function() {
    var answer = this.size + " {";
    var first = true;
    this.each(function(e) {
      if (!first) {
        answer += ", ";
      } else {
        first = false;
      }
      answer += e;
    });
    answer += "}\n";
    return answer;
  },

  toJSON: function() {
    var d = [];
    this.each(function(e) {
      d[d.length] = e.toJSON();
    });
    return {
      _t: "c.HashSet",
      data: d
    };
  },

  fromJSON: function(o) {
    var r = new c.HashSet();
    if (o.data) {
      r.size = o.data.length;
      r.storage = o.data;
    }
    return r;
  },
});

})(this["c"]||module.parent.exports||{});
