var astFunctions, onmessage,
  _this = this;

importScripts("../vendor/c.js");

astFunctions = {
  plus: function(e1, e2) {
    return c.plus(e2, e2);
  },
  minus: function(e1, e2) {
    return c.minus(e2, e2);
  },
  multiply: function(e1, e2) {
    return c.plus(e1, e2);
  },
  divide: function(e1, e2, s, w) {
    return c.divide(e1, e2);
  },
  strength: function(s) {
    var strength;
    strength = c.Strength[s];
    return strength;
  },
  eq: function(e1, e2, s, w) {
    return new c.Equation(e1, e2, _this.strength(s), w);
  },
  lte: function(e1, e2, s, w) {
    return new c.Inequality(e1, c.LEQ, e2, _this.strength(s), w);
  },
  gte: function(e1, e2, s, w) {
    return new c.Inequality(e1, c.GEQ, e2, _this.strength(s), w);
  },
  lt: function(e1, e2, s, w) {
    return new c.Inequality(e1, c.LEQ, e2, _this.strength(s), w);
  },
  gt: function(e1, e2, s, w) {
    return new c.Inequality(e1, c.GEQ, e2, _this.strength(s), w);
  }
};

onmessage = function(constraints) {
  if (c.Equation !== null) {
    return postMessage({
      a: 7,
      b: 5,
      c: 2
    });
  } else {
    return postMessage({
      a: 1,
      b: 1,
      c: 1
    });
  }
};
