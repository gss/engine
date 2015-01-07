// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
var t = c.Tableau;
var tp = t.prototype;
var epsilon = 1e-8;
var weak = c.Strength.weak;

c.SimplexSolver = c.inherit({
  extends: c.Tableau,
  initialize: function(){

    c.Tableau.call(this);
    this._stayMinusErrorVars = [];
    this._stayPlusErrorVars = [];

    this._errorVars = new c.HashTable(); // cn -> Set of cv

    this._markerVars = new c.HashTable(); // cn -> Set of cv

    // this._resolve_pair = [0, 0];
    this._objective = new c.ObjectiveVariable({ name: "Z" });

    this._editVarMap = new c.HashTable(); // cv -> c.EditInfo
    this._editVarList = [];

    this._slackCounter = 0;
    this._artificialCounter = 0;
    this._dummyCounter = 0;
    this.autoSolve = true;
    this._needsSolving = false;

    this._optimizeCount = 0;

    this.rows.set(this._objective, c.Expression.empty());
    this._editVariableStack = [0]; // Stack
    if (c.trace)
      c.traceprint("objective expr == " + this.rows.get(this._objective));
  },

  add: function(/*c.Constraint, ...*/) {
    for (var x = 0; x < arguments.length; x++) {
      this.addConstraint(arguments[x]);
    }
    return this;
  },

  _addEditConstraint: function(cn, eplus_eminus, prevEConstant) {
      var i = this._editVarMap.size;
      var cvEplus = /* c.SlackVariable */eplus_eminus[0];
      var cvEminus = /* c.SlackVariable */eplus_eminus[1];
      /*
      if (!cvEplus instanceof c.SlackVariable) {
        console.warn("cvEplus not a slack variable =", cvEplus);
      }
      if (!cvEminus instanceof c.SlackVariable) {
        console.warn("cvEminus not a slack variable =", cvEminus);
      }
      c.debug && console.log("new c.EditInfo(" + cn + ", " + cvEplus + ", " +
                                  cvEminus + ", " + prevEConstant + ", " +
                                  i +")");
      */
      var ei = new c.EditInfo(cn, cvEplus, cvEminus, prevEConstant, i)
      this._editVarMap.set(cn.variable, ei);
      this._editVarList[i] = { v: cn.variable, info: ei };
  },

  addConstraint: function(cn /*c.Constraint*/) {
    c.trace && c.fnenterprint("addConstraint: " + cn);
    var eplus_eminus = new Array(2);
    var prevEConstant = new Array(1); // so it can be output to
    var expr = this.newExpression(cn, /*output to*/ eplus_eminus, prevEConstant);
    prevEConstant = prevEConstant[0];

    if (!this.tryAddingDirectly(expr)) {
      this.addWithArtificialVariable(expr);
    }


    this._needsSolving = true;
    if (cn.isEditConstraint) {
      this._addEditConstraint(cn, eplus_eminus, prevEConstant);
    }
    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  addConstraintNoException: function(cn /*c.Constraint*/) {
    c.trace && c.fnenterprint("addConstraintNoException: " + cn);
    // FIXME(slightlyoff): change this to enable chaining
    try {
      this.addConstraint(cn);
      return true;
    } catch (e /*c.RequiredFailure*/){
      return false;
    }
  },

  addEditVar: function(v /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    c.trace && c.fnenterprint("addEditVar: " + v + " @ " + strength + " {" + weight + "}");
    return this.addConstraint(
        new c.EditConstraint(v, strength || c.Strength.strong, weight));
  },

  beginEdit: function() {
    // FIXME(slightlyoff): we shouldn't throw here. Log instead
    c.assert(this._editVarMap.size > 0, "_editVarMap.size > 0");
    this._infeasibleRows.clear();
    this._resetStayConstants();
    this._editVariableStack[this._editVariableStack.length] = this._editVarMap.size;
    return this;
  },

  endEdit: function() {
    // FIXME(slightlyoff): we shouldn't throw here. Log instead
    c.assert(this._editVarMap.size > 0, "_editVarMap.size > 0");
    this.resolve();
    this._editVariableStack.pop();
    this.removeEditVarsTo(
      this._editVariableStack[this._editVariableStack.length - 1]
    );
    return this;
  },

  removeAllEditVars: function() {
    return this.removeEditVarsTo(0);
  },

  removeEditVarsTo: function(n /*int*/) {
    try {
      var evll = this._editVarList.length;
      // only remove the variable if it's not in the set of variable
      // from a previous nested outer edit
      // e.g., if I do:
      // Edit x,y
      // Edit w,h,x,y
      // EndEdit
      // The end edit needs to only get rid of the edits on w,h
      // not the ones on x,y
      for(var x = n; x < evll; x++) {
        if (this._editVarList[x]) {
          this.removeConstraint(
            this._editVarMap.get(this._editVarList[x].v).constraint
          );
        }
      }
      this._editVarList.length = n;
      c.assert(this._editVarMap.size == n, "_editVarMap.size == n");
      return this;
    } catch (e /*ConstraintNotFound*/){
      throw new c.InternalError("Constraint not found in removeEditVarsTo");
    }
  },

  // Add weak stays to the x and y parts of each point. These have
  // increasing weights so that the solver will try to satisfy the x
  // and y stays on the same point, rather than the x stay on one and
  // the y stay on another.
  addPointStays: function(points /*[{ x: .., y: ..}, ...]*/) {
    c.trace && console.log("addPointStays", points);
    points.forEach(function(p, idx) {
      this.addStay(p.x, weak, Math.pow(2, idx));
      this.addStay(p.y, weak, Math.pow(2, idx));
    }, this);
    return this;
  },

  addStay: function(v /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    var cn = new c.StayConstraint(v,
                                  strength || weak,
                                  weight   || 1);
    return this.addConstraint(cn);
  },

  // FIXME(slightlyoff): add a removeStay

  removeConstraint: function(cn /*c.Constraint*/) {
    // console.log("removeConstraint('", cn, "')");
    c.trace && c.fnenterprint("removeConstraintInternal: " + cn);
    c.trace && c.traceprint(this.toString());
    this._needsSolving = true;
    this._resetStayConstants();
    var zRow = this.rows.get(this._objective);
    var eVars = /* Set */this._errorVars.get(cn);
    c.trace && c.traceprint("eVars == " + eVars);
    if (eVars != null) {
      eVars.each(function(cv) {
        var expr = this.rows.get(cv);
        if (expr == null) {
          zRow.addVariable(cv,
                           -cn.weight * cn.strength.symbolicWeight.value,
                           this._objective,
                           this);
        } else {
          zRow.addExpression(expr,
                             -cn.weight * cn.strength.symbolicWeight.value,
                             this._objective,
                             this);
        }
        c.trace && c.traceprint("now eVars == " + eVars);
      }, this);
    }
    var marker = this._markerVars.get(cn);
    this._markerVars.delete(cn);
    if (marker == null) {
      throw new c.InternalError("Constraint not found in removeConstraintInternal");
    }
    c.trace && c.traceprint("Looking to remove var " + marker);
    if (this.rows.get(marker) == null) {
      var col = this.columns.get(marker);
      // console.log("col is:", col, "from marker:", marker);
      c.trace && c.traceprint("Must pivot -- columns are " + col);
      var exitVar = null;
      var minRatio = 0;
      col.each(function(v) {
        if (v.isRestricted) {
          var expr = this.rows.get(v);
          var coeff = expr.coefficientFor(marker);
          c.trace && c.traceprint("Marker " + marker + "'s coefficient in " + expr + " is " + coeff);
          if (coeff < 0) {
            var r = -expr.constant / coeff;
            if (
              exitVar == null ||
              r < minRatio    ||
              (c.approx(r, minRatio) && v.hashCode < exitVar.hashCode)
            ) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);
      if (exitVar == null) {
        c.trace && c.traceprint("exitVar is still null");
        col.each(function(v) {
          if (v.isRestricted) {
            var expr = this.rows.get(v);
            var coeff = expr.coefficientFor(marker);
            var r = expr.constant / coeff;
            if (exitVar == null || r < minRatio) {
              minRatio = r;
              exitVar = v;
            }
          }
        }, this);
      }
      if (exitVar == null) {
        if (col.size == 0) {
          this.removeColumn(marker);
        } else {
          col.escapingEach(function(v) {
            if (v != this._objective) {
              exitVar = v;
              return { brk: true };
            }
          }, this);
        }
      }
      if (exitVar != null) {
        this.pivot(marker, exitVar);
      }
    }
    if (this.rows.get(marker) != null) {
      var expr = this.removeRow(marker);
    }

    if (eVars != null) {
      eVars.each(function(v) {
        if (v != marker) { this.removeColumn(v); }
      }, this);
    }

    if (cn.isStayConstraint) {
      if (eVars != null) {
        for (var i = 0; i < this._stayPlusErrorVars.length; i++) {
          eVars.delete(this._stayPlusErrorVars[i]);
          eVars.delete(this._stayMinusErrorVars[i]);
        }
      }
    } else if (cn.isEditConstraint) {
      c.assert(eVars != null, "eVars != null");
      var cei = this._editVarMap.get(cn.variable);
      this.removeColumn(cei.editMinus);
      this._editVarMap.delete(cn.variable);
    }

    if (eVars != null) {
      this._errorVars.delete(eVars);
    }

    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }

    return this;
  },

  reset: function() {
    c.trace && c.fnenterprint("reset");
    throw new c.InternalError("reset not implemented");
  },

  resolveArray: function(newEditConstants) {
    c.trace && c.fnenterprint("resolveArray" + newEditConstants);
    var l = newEditConstants.length
    this._editVarMap.each(function(v, cei) {
      var i = cei.index;
      if (i < l)
        this.suggestValue(v, newEditConstants[i]);
    }, this);
    this.resolve();
  },

  resolvePair: function(x /*double*/, y /*double*/) {
    this.suggestValue(this._editVarList[0].v, x);
    this.suggestValue(this._editVarList[1].v, y);
    this.resolve();
  },

  resolve: function() {
    c.trace && c.fnenterprint("resolve()");
    this.dualOptimize();
    this._setExternalVariables();
    this._infeasibleRows.clear();
    this._resetStayConstants();
  },

  suggestValue: function(v /*c.Variable*/, x /*double*/) {
    c.trace && console.log("suggestValue(" + v + ", " + x + ")");
    var cei = this._editVarMap.get(v);
    if (!cei) {
      throw new c.Error("suggestValue for variable " + v + ", but var is not an edit variable");
    }
    var delta = x - cei.prevEditConstant;
    cei.prevEditConstant = x;
    this.deltaEditConstant(delta, cei.editPlus, cei.editMinus);
    return this;
  },

  solve: function() {
    if (this._needsSolving) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  setEditedValue: function(v /*c.Variable*/, n /*double*/) {
    if (!(this.columnsHasKey(v) || (this.rows.get(v) != null))) {
      v.value = n;
      return this;
    }

    if (!c.approx(n, v.value)) {
      this.addEditVar(v);
      this.beginEdit();

      try {
        this.suggestValue(v, n);
      } catch (e) {
        throw new c.InternalError("Error in setEditedValue");
      }

      this.endEdit();
    }
    return this;
  },

  addVar: function(v /*c.Variable*/) {
    if (!(this.columnsHasKey(v) || (this.rows.get(v) != null))) {
      try {
        this.addStay(v);
      } catch (e /*c.RequiredFailure*/){
        throw new c.InternalError("Error in addVar -- required failure is impossible");
      }

      c.trace && c.traceprint("added initial stay on " + v);
    }
    return this;
  },

  getInternalInfo: function() {
    var retstr = tp.getInternalInfo.call(this);
    retstr += "\nSolver info:\n";
    retstr += "Stay Error Variables: ";
    retstr += this._stayPlusErrorVars.length + this._stayMinusErrorVars.length;
    retstr += " (" + this._stayPlusErrorVars.length + " +, ";
    retstr += this._stayMinusErrorVars.length + " -)\n";
    retstr += "Edit Variables: " + this._editVarMap.size;
    retstr += "\n";
    return retstr;
  },

  getDebugInfo: function() {
    return this.toString() + this.getInternalInfo() + "\n";
  },

  toString: function() {
    var bstr = tp.getInternalInfo.call(this);
    bstr += "\n_stayPlusErrorVars: ";
    bstr += '[' + this._stayPlusErrorVars + ']';
    bstr += "\n_stayMinusErrorVars: ";
    bstr += '[' + this._stayMinusErrorVars + ']';
    bstr += "\n";
    bstr += "_editVarMap:\n" + this._editVarMap;
    bstr += "\n";
    return bstr;
  },

  addWithArtificialVariable: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("addWithArtificialVariable: " + expr);
    var av = new c.SlackVariable({
      value: ++this._artificialCounter,
      prefix: "a"
    });
    var az = new c.ObjectiveVariable({ name: "az" });
    var azRow = /* c.Expression */expr.clone();
    c.trace && c.traceprint("before addRows:\n" + this);
    this.addRow(az, azRow);
    this.addRow(av, expr);
    c.trace && c.traceprint("after addRows:\n" + this);
    this.optimize(az);
    var azTableauRow = this.rows.get(az);
    c.trace && c.traceprint("azTableauRow.constant == " + azTableauRow.constant);
    if (!c.approx(azTableauRow.constant, 0)) {
      this.removeRow(az);
      this.removeColumn(av);
      throw new c.RequiredFailure();
    }
    var e = this.rows.get(av);
    if (e != null) {
      if (e.isConstant) {
        this.removeRow(av);
        this.removeRow(az);
        return;
      }
      var entryVar = e.anyPivotableVariable();
      this.pivot(entryVar, av);
    }
    c.assert(this.rows.get(av) == null, "rowExpression(av) == null");
    this.removeColumn(av);
    this.removeRow(az);
  },

  tryAddingDirectly: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("tryAddingDirectly: " + expr);
    var subject = this.chooseSubject(expr);
    if (subject == null) {
      c.trace && c.fnexitprint("returning false");
      return false;
    }
    expr.newSubject(subject);
    if (this.columnsHasKey(subject)) {
      this.substituteOut(subject, expr);
    }
    this.addRow(subject, expr);
    c.trace && c.fnexitprint("returning true");
    return true;
  },

  chooseSubject: function(expr /*c.Expression*/) {
    c.trace && c.fnenterprint("chooseSubject: " + expr);
    var subject = null;
    var foundUnrestricted = false;
    var foundNewRestricted = false;
    var terms = expr.terms;
    var rv = terms.escapingEach(function(v, c) {
      if (foundUnrestricted) {
        if (!v.isRestricted) {
          if (!this.columnsHasKey(v)) {
            return { retval: v };
          }
        }
      } else {
        if (v.isRestricted) {
          if (!foundNewRestricted && !v.isDummy && c < 0) {
            var col = this.columns.get(v);
            if (col == null ||
                (col.size == 1 && this.columnsHasKey(this._objective))
            ) {
              subject = v;
              foundNewRestricted = true;
            }
          }
        } else {
          subject = v;
          foundUnrestricted = true;
        }
      }
    }, this);
    if (rv && rv.retval !== undefined) {
      return rv.retval;
    }

    if (subject != null) {
      return subject;
    }

    var coeff = 0;

    // subject is nil.
    // Make one last check -- if all of the variables in expr are dummy
    // variables, then we can pick a dummy variable as the subject
    var rv = terms.escapingEach(function(v,c) {
      if (!v.isDummy)  {
        return {retval:null};
      }
      if (!this.columnsHasKey(v)) {
        subject = v;
        coeff = c;
      }
    }, this);
    if (rv && rv.retval !== undefined) return rv.retval;

    if (!c.approx(expr.constant, 0)) {
      throw new c.RequiredFailure();
    }
    if (coeff > 0) {
      expr.multiplyMe(-1);
    }
    return subject;
  },

  deltaEditConstant: function(delta /*double*/,
                              plusErrorVar /*c.AbstractVariable*/,
                              minusErrorVar /*c.AbstractVariable*/) {
    if (c.trace)
      c.fnenterprint("deltaEditConstant :" + delta + ", " + plusErrorVar + ", " + minusErrorVar);

    var exprPlus = this.rows.get(plusErrorVar);
    if (exprPlus != null) {
      exprPlus.constant += delta;
      if (exprPlus.constant < 0) {
        this._infeasibleRows.add(plusErrorVar);
      }
      return;
    }
    var exprMinus = this.rows.get(minusErrorVar);
    if (exprMinus != null) {
      exprMinus.constant += -delta;
      if (exprMinus.constant < 0) {
        this._infeasibleRows.add(minusErrorVar);
      }
      return;
    }
    var columnVars = this.columns.get(minusErrorVar);
    if (!columnVars) {
      console.log("columnVars is null -- tableau is:\n" + this);
    }
    columnVars.each(function(basicVar) {
      var expr = this.rows.get(basicVar);
      var c = expr.coefficientFor(minusErrorVar);
      expr.constant += (c * delta);
      if (basicVar.isRestricted && expr.constant < 0) {
        this._infeasibleRows.add(basicVar);
      }
    }, this);
  },

  // We have set new values for the constants in the edit constraints.
  // Re-Optimize using the dual simplex algorithm.
  dualOptimize: function() {
    c.trace && c.fnenterprint("dualOptimize:");
    var zRow = this.rows.get(this._objective);
    // need to handle infeasible rows
    while (this._infeasibleRows.size) {
      var exitVar = this._infeasibleRows.values()[0];
      this._infeasibleRows.delete(exitVar);
      var entryVar = null;
      var expr = this.rows.get(exitVar);
      // exitVar might have become basic after some other pivoting
      // so allow for the case of its not being there any longer
      if (expr) {
        if (expr.constant < 0) {
          var ratio = Number.MAX_VALUE;
          var r;
          var terms = expr.terms;
          terms.each(function(v, cd) {
            if (cd > 0 && v.isPivotable) {
              var zc = zRow.coefficientFor(v);
              r = zc / cd;
              if (r < ratio ||
                  (c.approx(r, ratio) && v.hashCode < entryVar.hashCode)
              ) {
                entryVar = v;
                ratio = r;
              }
            }
          });
          if (ratio == Number.MAX_VALUE) {
            throw new c.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");
          }
          this.pivot(entryVar, exitVar);
        }
      }
    }
  },

  // Make a new linear Expression representing the constraint cn,
  // replacing any basic variables with their defining expressions.
  // Normalize if necessary so that the Constant is non-negative.  If
  // the constraint is non-required give its error variables an
  // appropriate weight in the objective function.
  newExpression: function(cn /*c.Constraint*/,
                          /** outputs to **/ eplus_eminus /*Array*/,
                          prevEConstant) {
    if (c.trace) {
      c.fnenterprint("newExpression: " + cn);
      c.traceprint("cn.isInequality == " + cn.isInequality);
      c.traceprint("cn.required == " + cn.required);
    }

    var cnExpr = cn.expression;
    var expr = c.Expression.fromConstant(cnExpr.constant);
    var slackVar = new c.SlackVariable();
    var dummyVar = new c.DummyVariable();
    var eminus = new c.SlackVariable();
    var eplus = new c.SlackVariable();
    var cnTerms = cnExpr.terms;
    // console.log(cnTerms.size);

    cnTerms.each(function(v, c) {
      var e = this.rows.get(v);
      if (!e) {
        expr.addVariable(v, c);
      } else {
        expr.addExpression(e, c);
      }
    }, this);

    if (cn.isInequality) {
      // cn is an inequality, so Add a slack variable. The original constraint
      // is expr>=0, so that the resulting equality is expr-slackVar=0. If cn is
      // also non-required Add a negative error variable, giving:
      //
      //    expr - slackVar = -errorVar
      //
      // in other words:
      //
      //    expr - slackVar + errorVar = 0
      //
      // Since both of these variables are newly created we can just Add
      // them to the Expression (they can't be basic).
      c.trace && c.traceprint("Inequality, adding slack");
      ++this._slackCounter;
      slackVar = new c.SlackVariable({
        value: this._slackCounter,
        prefix: "s"
      });
      expr.setVariable(slackVar, -1);

      this._markerVars.set(cn, slackVar);
      if (!cn.required) {
        ++this._slackCounter;
        eminus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "em"
        });
        expr.setVariable(eminus, 1);
        var zRow = this.rows.get(this._objective);
        zRow.setVariable(eminus, cn.strength.symbolicWeight.value * cn.weight);
        this.insertErrorVar(cn, eminus);
        this.noteAddedVariable(eminus, this._objective);
      }
    } else {
      if (cn.required) {
        c.trace && c.traceprint("Equality, required");
        // Add a dummy variable to the Expression to serve as a marker for this
        // constraint.  The dummy variable is never allowed to enter the basis
        // when pivoting.
        ++this._dummyCounter;
        dummyVar = new c.DummyVariable({
          value: this._dummyCounter,
          prefix: "d"
        });
        eplus_eminus[0] = dummyVar;
        eplus_eminus[1] = dummyVar;
        prevEConstant[0] = cnExpr.constant;
        expr.setVariable(dummyVar, 1);
        this._markerVars.set(cn, dummyVar);
        c.trace && c.traceprint("Adding dummyVar == d" + this._dummyCounter);
      } else {
        // cn is a non-required equality. Add a positive and a negative error
        // variable, making the resulting constraint
        //       expr = eplus - eminus
        // in other words:
        //       expr - eplus + eminus = 0
        c.trace && c.traceprint("Equality, not required");
        ++this._slackCounter;
        eplus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "ep"
        });
        eminus = new c.SlackVariable({
          value: this._slackCounter,
          prefix: "em"
        });
        expr.setVariable(eplus, -1);
        expr.setVariable(eminus, 1);
        this._markerVars.set(cn, eplus);
        var zRow = this.rows.get(this._objective);
        c.trace && console.log(zRow);
        var swCoeff = cn.strength.symbolicWeight.value * cn.weight;
        if (swCoeff == 0) {
          c.trace && c.traceprint("cn == " + cn);
          c.trace && c.traceprint("adding " + eplus + " and " + eminus + " with swCoeff == " + swCoeff);
        }
        zRow.setVariable(eplus, swCoeff);
        this.noteAddedVariable(eplus, this._objective);
        zRow.setVariable(eminus, swCoeff);
        this.noteAddedVariable(eminus, this._objective);

        this.insertErrorVar(cn, eminus);
        this.insertErrorVar(cn, eplus);

        if (cn.isStayConstraint) {
          this._stayPlusErrorVars[this._stayPlusErrorVars.length] = eplus;
          this._stayMinusErrorVars[this._stayMinusErrorVars.length] = eminus;
        } else if (cn.isEditConstraint) {
          eplus_eminus[0] = eplus;
          eplus_eminus[1] = eminus;
          prevEConstant[0] = cnExpr.constant;
        }
      }
    }
    // the Constant in the Expression should be non-negative. If necessary
    // normalize the Expression by multiplying by -1
    if (expr.constant < 0) expr.multiplyMe(-1);
    c.trace && c.fnexitprint("returning " + expr);
    return expr;
  },

  // Minimize the value of the objective.  (The tableau should already be
  // feasible.)
  optimize: function(zVar /*c.ObjectiveVariable*/) {
    c.trace && c.fnenterprint("optimize: " + zVar);
    c.trace && c.traceprint(this.toString());
    this._optimizeCount++;

    var zRow = this.rows.get(zVar);
    c.assert(zRow != null, "zRow != null");
    var entryVar = null;
    var exitVar = null;
    var objectiveCoeff, terms;

    while (true) {
      objectiveCoeff = 0;
      terms = zRow.terms;

      // Find the most negative coefficient in the objective function (ignoring
      // the non-pivotable dummy variables). If all coefficients are positive
      // we're done
      terms.escapingEach(function(v, c) {
        if (v.isPivotable && c < objectiveCoeff) {
          objectiveCoeff = c;
          entryVar = v;
          // Break on success
          return { brk: 1 };
        }
      }, this);

      if (objectiveCoeff >= -epsilon)
        return;

      c.trace && console.log("entryVar:", entryVar,
                             "objectiveCoeff:", objectiveCoeff);

      // choose which variable to move out of the basis
      // Only consider pivotable basic variables
      // (i.e. restricted, non-dummy variables)
      var minRatio = Number.MAX_VALUE;
      var columnVars = this.columns.get(entryVar);
      var r = 0;

      columnVars.each(function(v) {
        c.trace && c.traceprint("Checking " + v);
        if (v.isPivotable) {
          var expr = this.rows.get(v);
          var coeff = expr.coefficientFor(entryVar);
          c.trace && c.traceprint("pivotable, coeff = " + coeff);
          // only consider negative coefficients
          if (coeff < 0) {
            r = -expr.constant / coeff;
            // Bland's anti-cycling rule:
            // if multiple variables are about the same,
            // always pick the lowest via some total
            // ordering -- I use their addresses in memory
            //    if (r < minRatio ||
            //              (c.approx(r, minRatio) &&
            //               v.get_pclv() < exitVar.get_pclv()))
            if (r < minRatio ||
                (c.approx(r, minRatio) &&
                 v.hashCode < exitVar.hashCode)
            ) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);

      // If minRatio is still nil at this point, it means that the
      // objective function is unbounded, i.e. it can become
      // arbitrarily negative.  This should never happen in this
      // application.
      if (minRatio == Number.MAX_VALUE) {
        throw new c.InternalError("Objective function is unbounded in optimize");
      }

      // console.time("SimplexSolver::optimize pivot()");
      this.pivot(entryVar, exitVar);
      // console.timeEnd("SimplexSolver::optimize pivot()");

      c.trace && c.traceprint(this.toString());
    }
  },

  // Do a Pivot.  Move entryVar into the basis (i.e. make it a basic variable),
  // and move exitVar out of the basis (i.e., make it a parametric variable)
  pivot: function(entryVar /*c.AbstractVariable*/, exitVar /*c.AbstractVariable*/) {
    c.trace && console.log("pivot: ", entryVar, exitVar);
    var time = false;

    time && console.time(" SimplexSolver::pivot");

    // the entryVar might be non-pivotable if we're doing a RemoveConstraint --
    // otherwise it should be a pivotable variable -- enforced at call sites,
    // hopefully
    if (entryVar == null) {
      console.warn("pivot: entryVar == null");
    }

    if (exitVar == null) {
      console.warn("pivot: exitVar == null");
    }
    // console.log("SimplexSolver::pivot(", entryVar, exitVar, ")")

    // expr is the Expression for the exit variable (about to leave the basis) --
    // so that the old tableau includes the equation:
    //   exitVar = expr
    time && console.time("  removeRow");
    var expr = this.removeRow(exitVar);
    time && console.timeEnd("  removeRow");

    // Compute an Expression for the entry variable.  Since expr has
    // been deleted from the tableau we can destructively modify it to
    // build this Expression.
    time && console.time("  changeSubject");
    expr.changeSubject(exitVar, entryVar);
    time && console.timeEnd("  changeSubject");

    time && console.time("  substituteOut");
    this.substituteOut(entryVar, expr);
    time && console.timeEnd("  substituteOut");
    /*
    if (entryVar.isExternal) {
      // entry var is no longer a parametric variable since we're moving
      // it into the basis
      console.log("entryVar is external!");
      this._externalParametricVars.delete(entryVar);
    }
    */

    time && console.time("  addRow")
    this.addRow(entryVar, expr);
    time && console.timeEnd("  addRow")

    time && console.timeEnd(" SimplexSolver::pivot");
  },

  // Each of the non-required stays will be represented by an equation
  // of the form
  //     v = c + eplus - eminus
  // where v is the variable with the stay, c is the previous value of
  // v, and eplus and eminus are slack variables that hold the error
  // in satisfying the stay constraint.  We are about to change
  // something, and we want to fix the constants in the equations
  // representing the stays.  If both eplus and eminus are nonbasic
  // they have value 0 in the current solution, meaning the previous
  // stay was exactly satisfied.  In this case nothing needs to be
  // changed.  Otherwise one of them is basic, and the other must
  // occur only in the Expression for that basic error variable.
  // Reset the Constant in this Expression to 0.
  _resetStayConstants: function() {
    c.trace && console.log("_resetStayConstants");
    var spev = this._stayPlusErrorVars;
    var l = spev.length;
    for (var i = 0; i < l; i++) {
      var expr = this.rows.get(spev[i]);
      if (expr === null) {
        expr = this.rows.get(this._stayMinusErrorVars[i]);
      }
      if (expr != null) {
        expr.constant = 0;
      }
    }
  },

  _setExternalVariables: function() {
    c.trace && c.fnenterprint("_setExternalVariables:");
    c.trace && c.traceprint(this.toString());
    var changed = {};

    // console.log("this._externalParametricVars:", this._externalParametricVars);
    this._externalParametricVars.each(function(v) {
      if (this.rows.get(v) != null) {
        if (c.trace)
          console.log("Error: variable" + v + " in _externalParametricVars is basic");
      } else {
        v.value = 0;
        changed[v.name] = 0;
      }
    }, this);
    // console.log("this._externalRows:", this._externalRows);
    this._externalRows.each(function(v) {
      var expr = this.rows.get(v);
      if (v.value != expr.constant) {
        // console.log(v.toString(), v.value, expr.constant);
        v.value = expr.constant;
        changed[v.name] = expr.constant;
      }
      // c.trace && console.log("v == " + v);
      // c.trace && console.log("expr == " + expr);
    }, this);
    this._changed = changed;
    this._needsSolving = false;
    this._informCallbacks();
    this.onsolved();
  },

  onsolved: function() {
    // Lifecycle stub. Here for dirty, dirty monkey patching.
  },

  _informCallbacks: function() {
    if(!this._callbacks) return;

    var changed = this._changed;
    this._callbacks.forEach(function(fn) {
      fn(changed);
    });
  },

  _addCallback: function(fn) {
    var a = (this._callbacks || (this._callbacks = []));
    a[a.length] = fn;
  },

  insertErrorVar: function(cn /*c.Constraint*/, aVar /*c.AbstractVariable*/) {
    c.trace && c.fnenterprint("insertErrorVar:" + cn + ", " + aVar);
    var constraintSet = /* Set */this._errorVars.get(aVar);
    if (!constraintSet) {
      constraintSet = new c.HashSet();
      this._errorVars.set(cn, constraintSet);
    }
    constraintSet.add(aVar);
  },
});
})(this["c"]||module.parent.exports||{});
