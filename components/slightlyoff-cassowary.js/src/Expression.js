// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {
"use strict";

var checkNumber = function(value, otherwise){
  // if(isNaN(value)) { debugger; }
  return (typeof value === "number") ? value : otherwise;
};

c.Expression = c.inherit({

  initialize: function(cvar /*c.AbstractVariable*/,
                       value /*double*/,
                       constant /*double*/) {
    this.constant = checkNumber(constant, 0);
    this.terms = new c.HashTable();
    if (cvar instanceof c.AbstractVariable) {
      value = checkNumber(value, 1);
      this.setVariable(cvar, value);
    } else if (typeof cvar == "number") {
      if (!isNaN(cvar)) {
        this.constant = cvar;
      } else {
        console.trace();
      }
    }
  },

  initializeFromHash: function(constant /*ClDouble*/, terms /*c.Hashtable*/) {
    if (c.verbose) {
      console.log("*******************************");
      console.log("clone c.initializeFromHash");
      console.log("*******************************");
    }

    if (c.GC) console.log("clone c.Expression");
    this.constant = constant;
    this.terms = terms.clone();
    return this;
  },

  multiplyMe: function(x /*double*/) {
    this.constant *= x;
    var t = this.terms;
    t.each(function(clv, coeff) { t.set(clv, coeff * x); });
    return this;
  },

  clone: function() {
    if (c.verbose) {
      console.log("*******************************");
      console.log("clone c.Expression");
      console.log("*******************************");
    }

    var e = c.Expression.empty();
    e.initializeFromHash(this.constant, this.terms);
    return e;
  },

  times: function(x) {
    if (typeof x == 'number') {
      return (this.clone()).multiplyMe(x);
    } else {
      if (this.isConstant) {
        return x.times(this.constant);
      } else if (x.isConstant) {
        return this.times(x.constant);
      } else {
        throw new c.NonExpression();
      }
    }
  },

  plus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, 1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, 1);
    }
  },

  minus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, -1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, -1);
    }
  },

  divide: function(x) {
    if (typeof x == 'number') {
      if (c.approx(x, 0)) {
        throw new c.NonExpression();
      }
      return this.times(1 / x);
    } else if (x instanceof c.Expression) {
      if (!x.isConstant) {
        throw new c.NonExpression();
      }
      return this.times(1 / x.constant);
    }
  },

  addExpression: function(expr /*c.Expression*/,
                          n /*double*/,
                          subject /*c.AbstractVariable*/,
                          solver /*c.Tableau*/) {

    // console.log("c.Expression::addExpression()", expr, n);
    // console.trace();
    if (expr instanceof c.AbstractVariable) {
      expr = c.Expression.fromVariable(expr);
      // if(c.trace) console.log("addExpression: Had to cast a var to an expression");
    }
    n = checkNumber(n, 1);
    this.constant += (n * expr.constant);
    expr.terms.each(function(clv, coeff) {
      // console.log("clv:", clv, "coeff:", coeff, "subject:", subject);
      this.addVariable(clv, coeff * n, subject, solver);
    }, this);
    return this;
  },

  addVariable: function(v /*c.AbstractVariable*/, cd /*double*/, subject, solver) {
    if (cd == null) {
      cd = 1;
    }

    /*
    if (c.trace) console.log("c.Expression::addVariable():", v , cd);
    */
    var coeff = this.terms.get(v);
    if (coeff) {
      var newCoefficient = coeff + cd;
      if (newCoefficient == 0 || c.approx(newCoefficient, 0)) {
        if (solver) {
          solver.noteRemovedVariable(v, subject);
        }
        this.terms.delete(v);
      } else {
        this.setVariable(v, newCoefficient);
      }
    } else {
      if (!c.approx(cd, 0)) {
        this.setVariable(v, cd);
        if (solver) {
          solver.noteAddedVariable(v, subject);
        }
      }
    }
    return this;
  },

  setVariable: function(v /*c.AbstractVariable*/, c /*double*/) {
    // console.log("terms.set(", v, c, ")");
    this.terms.set(v, c);
    return this;
  },

  anyPivotableVariable: function() {
    if (this.isConstant) {
      throw new c.InternalError("anyPivotableVariable called on a constant");
    }

    var rv = this.terms.escapingEach(function(clv, c) {
      if (clv.isPivotable) return { retval: clv };
    });

    if (rv && rv.retval !== undefined) {
      return rv.retval;
    }

    return null;
  },

  substituteOut: function(outvar  /*c.AbstractVariable*/,
                          expr    /*c.Expression*/,
                          subject /*c.AbstractVariable*/,
                          solver  /*ClTableau*/) {

    /*
    if (c.trace) {
      c.fnenterprint("CLE:substituteOut: " + outvar + ", " + expr + ", " + subject + ", ...");
      c.traceprint("this = " + this);
    }
    */
    var setVariable = this.setVariable.bind(this);
    var terms = this.terms;
    var multiplier = terms.get(outvar);
    terms.delete(outvar);
    this.constant += (multiplier * expr.constant);
    /*
    console.log("substituteOut:",
                "\n\toutvar:", outvar,
                "\n\texpr:", expr.toString(),
                "\n\tmultiplier:", multiplier,
                "\n\tterms:", terms);
    */
    expr.terms.each(function(clv, coeff) {
      var oldCoefficient = terms.get(clv);
      if (oldCoefficient) {
        var newCoefficient = oldCoefficient + multiplier * coeff;
        if (c.approx(newCoefficient, 0)) {
          solver.noteRemovedVariable(clv, subject);
          terms.delete(clv);
        } else {
          terms.set(clv, newCoefficient);
        }
      } else {
        terms.set(clv, multiplier * coeff);
        if (solver) {
          solver.noteAddedVariable(clv, subject);
        }
      }
    });
    // if (c.trace) c.traceprint("Now this is " + this);
  },

  changeSubject: function(old_subject /*c.AbstractVariable*/,
                          new_subject /*c.AbstractVariable*/) {
    this.setVariable(old_subject, this.newSubject(new_subject));
  },

  newSubject: function(subject /*c.AbstractVariable*/) {
    // if (c.trace) c.fnenterprint("newSubject:" + subject);

    var reciprocal = 1 / this.terms.get(subject);
    this.terms.delete(subject);
    this.multiplyMe(-reciprocal);
    return reciprocal;
  },

  // Return the coefficient corresponding to variable var, i.e.,
  // the 'ci' corresponding to the 'vi' that var is:
  //     v1*c1 + v2*c2 + .. + vn*cn + c
  coefficientFor: function(clv /*c.AbstractVariable*/) {
    return this.terms.get(clv) || 0;
  },

  get isConstant() {
    return this.terms.size == 0;
  },

  toString: function() {
    var bstr = ''; // answer
    var needsplus = false;
    if (!c.approx(this.constant, 0) || this.isConstant) {
      bstr += this.constant;
      if (this.isConstant) {
        return bstr;
      } else {
        needsplus = true;
      }
    }
    this.terms.each( function(clv, coeff) {
      if (needsplus) {
        bstr += " + ";
      }
      bstr += coeff + "*" + clv;
      needsplus = true;
    });
    return bstr;
  },

  equals: function(other) {
    if (other === this) {
      return true;
    }

    return other instanceof c.Expression &&
           other.constant === this.constant &&
           other.terms.equals(this.terms);
  },

  Plus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.plus(e2);
  },

  Minus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.minus(e2);
  },

  Times: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.times(e2);
  },

  Divide: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.divide(e2);
  },
});

c.Expression.empty = function() {
  return new c.Expression(undefined, 1, 0);
};

c.Expression.fromConstant = function(cons) {
  return new c.Expression(cons);
};

c.Expression.fromValue = function(v) {
  v = +(v);
  return new c.Expression(undefined, v, 0);
};

c.Expression.fromVariable = function(v) {
  return new c.Expression(v, 1, 0);
}

})(this["c"]||module.parent.exports||{});
