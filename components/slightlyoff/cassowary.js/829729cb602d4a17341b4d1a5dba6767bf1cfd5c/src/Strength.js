// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {

c.Strength = c.inherit({
  initialize: function(name /*String*/, symbolicWeight, w2, w3) {
    this.name = name;
    if (symbolicWeight instanceof c.SymbolicWeight) {
      this.symbolicWeight = symbolicWeight;
    } else {
      this.symbolicWeight = new c.SymbolicWeight(symbolicWeight, w2, w3);
    }
  },

  get required() {
    return (this === c.Strength.required);
  },

  toString: function() {
    return this.name + (!this.isRequired ? (":" + this.symbolicWeight) : "");
  },
});

/* public static final */
c.Strength.required = new c.Strength("<Required>", 1000, 1000, 1000);
/* public static final  */
c.Strength.strong = new c.Strength("strong", 1, 0, 0);
/* public static final  */
c.Strength.medium = new c.Strength("medium", 0, 1, 0);
/* public static final  */
c.Strength.weak = new c.Strength("weak", 0, 0, 1);

})(this["c"]||((typeof module != "undefined") ? module.parent.exports.c : {}));
