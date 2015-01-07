// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.AbstractConstraint = c.inherit({
  initialize: function(strength /*c.Strength*/, weight /*double*/) {
    this.hashCode = c._inc();
    this.strength = strength || c.Strength.required;
    this.weight = weight || 1;
  },

  isEditConstraint: false,
  isInequality:     false,
  isStayConstraint: false,
  get required() { return (this.strength === c.Strength.required); },

  toString: function() {
    // this is abstract -- it intentionally leaves the parens unbalanced for
    // the subclasses to complete (e.g., with ' = 0', etc.
    return this.strength + " {" + this.weight + "} (" + this.expression +")";
  },
});

var ts = c.AbstractConstraint.prototype.toString;

var EditOrStayCtor = function(cv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
  c.AbstractConstraint.call(this, strength || c.Strength.strong, weight);
  this.variable = cv;
  this.expression = new c.Expression(cv, -1, cv.value);
};

c.EditConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isEditConstraint: true,
  toString: function() { return "edit:" + ts.call(this); },
});

c.StayConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isStayConstraint: true,
  toString: function() { return "stay:" + ts.call(this); },
});

var lc =
c.Constraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function(cle /*c.Expression*/,
                       strength /*c.Strength*/,
                       weight /*double*/) {
    c.AbstractConstraint.call(this, strength, weight);
    this.expression = cle;
  },
});

c.Inequality = c.inherit({
  extends: c.Constraint,

  _cloneOrNewCle: function(cle) {
    // FIXME(D4): move somewhere else?
    if (cle.clone)  {
      return cle.clone();
    } else {
      return new c.Expression(cle);
    }
  },

  initialize: function(a1, a2, a3, a4, a5) {
    // FIXME(slightlyoff): what a disgusting mess. Should at least add docs.
    // console.log("c.Inequality.initialize(", a1, a2, a3, a4, a5, ")");

    var a1IsExp = a1 instanceof c.Expression,
        a3IsExp = a3 instanceof c.Expression,
        a1IsVar = a1 instanceof c.AbstractVariable,
        a3IsVar = a3 instanceof c.AbstractVariable,
        a1IsNum = typeof(a1) == 'number',
        a3IsNum = typeof(a3) == 'number';

    // (cle || number), op, cv
    if ((a1IsExp || a1IsNum) && a3IsVar) {
      var cle = a1, op = a2, cv = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(cv);
      } else if (op == c.GEQ) {
        this.expression.addVariable(cv, -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cv, op, (cle || number)
    } else if (a1IsVar && (a3IsExp || a3IsNum)) {
      var cle = a3, op = a2, cv = a1, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(cv);
      } else if (op == c.LEQ) {
        this.expression.addVariable(cv, -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cle, op, num
    } else if (a1IsExp && a3IsNum) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle1), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.GEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
      return this
    // num, op, cle
    } else if (a1IsNum && a3IsExp) {
      var cle1 = a3, op = a2, cle2 = a1, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle1), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
      return this
    // cle op cle
    } else if (a1IsExp && a3IsExp) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      lc.call(this, this._cloneOrNewCle(cle2), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle1));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle1), -1);
      } else {
        throw new c.InternalError("Invalid operator in c.Inequality constructor");
      }
    // cle
    } else if (a1IsExp) {
      return lc.call(this, a1, a2, a3);
    // >=
    } else if (a2 == c.GEQ) {
      lc.call(this, new c.Expression(a3), a4, a5);
      this.expression.multiplyMe(-1);
      this.expression.addVariable(a1);
    // <=
    } else if (a2 == c.LEQ) {
      lc.call(this, new c.Expression(a3), a4, a5);
      this.expression.addVariable(a1,-1);
    // error
    } else {
      throw new c.InternalError("Invalid operator in c.Inequality constructor");
    }
  },

  isInequality: true,

  toString: function() {
    // return "c.Inequality: " + this.hashCode;
    return lc.prototype.toString.call(this) + " >= 0) id: " + this.hashCode;
  },
});

c.Equation = c.inherit({
  extends: c.Constraint,
  initialize: function(a1, a2, a3, a4) {
    // FIXME(slightlyoff): this is just a huge mess.
    if (a1 instanceof c.Expression && !a2 || a2 instanceof c.Strength) {
      lc.call(this, a1, a2, a3);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (a2 instanceof c.Expression)) {

      var cv = a1, cle = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if ((a1 instanceof c.AbstractVariable) &&
               (typeof(a2) == 'number')) {

      var cv = a1, val = a2, strength = a3, weight = a4;
      lc.call(this, new c.Expression(val), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if ((a1 instanceof c.Expression) &&
               (a2 instanceof c.AbstractVariable)) {

      var cle = a1, cv = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(cv, -1);

    } else if (((a1 instanceof c.Expression) || (a1 instanceof c.AbstractVariable) ||
                (typeof(a1) == 'number')) &&
               ((a2 instanceof c.Expression) || (a2 instanceof c.AbstractVariable) ||
                (typeof(a2) == 'number'))) {

      if (a1 instanceof c.Expression) {
        a1 = a1.clone();
      } else {
        a1 = new c.Expression(a1);
      }

      if (a2 instanceof c.Expression) {
        a2 = a2.clone();
      } else {
        a2 = new c.Expression(a2);
      }

      lc.call(this, a1, a3, a4);
      this.expression.addExpression(a2, -1);

    } else {
      throw "Bad initializer to c.Equation";
    }
    c.assert(this.strength instanceof c.Strength, "_strength not set");
  },

  toString: function() {
    return lc.prototype.toString.call(this) + " = 0)";
  },
});

})(this["c"]||module.parent.exports||{});
