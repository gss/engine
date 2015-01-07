// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Tableau = c.inherit({
  initialize: function() {
    // columns is a mapping from variables which occur in expressions to the
    // set of basic variables whose expressions contain them
    // i.e., it's a mapping from variables in expressions (a column) to the
    // set of rows that contain them
    this.columns = new c.HashTable(); // values are sets

    // _rows maps basic variables to the expressions for that row in the tableau
    this.rows = new c.HashTable();    // values are c.Expressions

    // the collection of basic variables that have infeasible rows
    // (used when reoptimizing)
    this._infeasibleRows = new c.HashSet();

    // the set of rows where the basic variable is external this was added to
    // the C++ version to reduce time in setExternalVariables()
    this._externalRows = new c.HashSet();

    // the set of external variables which are parametric this was added to the
    // C++ version to reduce time in setExternalVariables()
    this._externalParametricVars = new c.HashSet();
  },

  // Variable v has been removed from an Expression.  If the Expression is in a
  // tableau the corresponding basic variable is subject (or if subject is nil
  // then it's in the objective function). Update the column cross-indices.
  noteRemovedVariable: function(v /*c.AbstractVariable*/,
                                subject /*c.AbstractVariable*/) {
    c.trace && console.log("c.Tableau::noteRemovedVariable: ", v, subject);
    var column = this.columns.get(v);
    if (subject && column) {
      column.delete(subject);
    }
  },

  noteAddedVariable: function(v /*c.AbstractVariable*/, subject /*c.AbstractVariable*/) {
    // if (c.trace) console.log("c.Tableau::noteAddedVariable:", v, subject);
    if (subject) {
      this.insertColVar(v, subject);
    }
  },

  getInternalInfo: function() {
    var retstr = "Tableau Information:\n";
    retstr += "Rows: " + this.rows.size;
    retstr += " (= " + (this.rows.size - 1) + " constraints)";
    retstr += "\nColumns: " + this.columns.size;
    retstr += "\nInfeasible Rows: " + this._infeasibleRows.size;
    retstr += "\nExternal basic variables: " + this._externalRows.size;
    retstr += "\nExternal parametric variables: ";
    retstr += this._externalParametricVars.size;
    retstr += "\n";
    return retstr;
  },

  toString: function() {
    var bstr = "Tableau:\n";
    this.rows.each(function(clv, expr) {
      bstr += clv;
      bstr += " <==> ";
      bstr += expr;
      bstr += "\n";
    });
    bstr += "\nColumns:\n";
    bstr += this.columns;
    bstr += "\nInfeasible rows: ";
    bstr += this._infeasibleRows;
    bstr += "External basic variables: ";
    bstr += this._externalRows;
    bstr += "External parametric variables: ";
    bstr += this._externalParametricVars;
    return bstr;
  },

  /*
  toJSON: function() {
    // Creates an object representation of the Tableau.
  },
  */

  // Convenience function to insert a variable into
  // the set of rows stored at columns[param_var],
  // creating a new set if needed
  insertColVar: function(param_var /*c.Variable*/,
                         rowvar /*c.Variable*/) {
    var rowset = /* Set */ this.columns.get(param_var);
    if (!rowset) {
      rowset = new c.HashSet();
      this.columns.set(param_var, rowset);
    }
    rowset.add(rowvar);
  },

  addRow: function(aVar /*c.AbstractVariable*/,
                   expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("addRow: " + aVar + ", " + expr);
    this.rows.set(aVar, expr);
    expr.terms.each(function(clv, coeff) {
      this.insertColVar(clv, aVar);
      if (clv.isExternal) {
        this._externalParametricVars.add(clv);
      }
    }, this);
    if (aVar.isExternal) {
      this._externalRows.add(aVar);
    }
    if (c.trace) c.traceprint(this.toString());
  },

  removeColumn: function(aVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeColumn:" + aVar);
    var rows = /* Set */ this.columns.get(aVar);
    if (rows) {
      this.columns.delete(aVar);
      rows.each(function(clv) {
        var expr = /* c.Expression */this.rows.get(clv);
        expr.terms.delete(aVar);
      }, this);
    } else {
      if (c.trace) console.log("Could not find var", aVar, "in columns");
    }
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
      this._externalParametricVars.delete(aVar);
    }
  },

  removeRow: function(aVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeRow:" + aVar);
    var expr = /* c.Expression */this.rows.get(aVar);
    c.assert(expr != null);
    expr.terms.each(function(clv, coeff) {
      var varset = this.columns.get(clv);
      if (varset != null) {
        if (c.trace) console.log("removing from varset:", aVar);
        varset.delete(aVar);
      }
    }, this);
    this._infeasibleRows.delete(aVar);
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
    }
    this.rows.delete(aVar);
    if (c.trace) c.fnexitprint("returning " + expr);
    return expr;
  },

  substituteOut: function(oldVar /*c.AbstractVariable*/,
                          expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("substituteOut:" + oldVar + ", " + expr);
    if (c.trace) c.traceprint(this.toString());

    var varset = this.columns.get(oldVar);
    varset.each(function(v) {
      var row = this.rows.get(v);
      row.substituteOut(oldVar, expr, v, this);
      if (v.isRestricted && row.constant < 0) {
        this._infeasibleRows.add(v);
      }
    }, this);

    if (oldVar.isExternal) {
      this._externalRows.add(oldVar);
      this._externalParametricVars.delete(oldVar);
    }

    this.columns.delete(oldVar);
  },

  columnsHasKey: function(subject /*c.AbstractVariable*/) {
    return !!this.columns.get(subject);
  },
});

})(this["c"]||module.parent.exports||{});
