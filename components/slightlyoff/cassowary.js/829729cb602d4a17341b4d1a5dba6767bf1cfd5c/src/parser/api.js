// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

(function(c){
"use strict";

var solver = new c.SimplexSolver();
var vars = {};
var exprs = {};

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var _c = function(expr) {
  if (exprs[expr]) {
    return exprs[expr];
  }
  switch(expr.type) {
    case "Inequality":
      var op = (expr.operator == "<=") ? c.LEQ : c.GEQ;
      var i = new c.Inequality(_c(expr.left), op, _c(expr.right), weak);
      solver.addConstraint(i);
      return i;
    case "Equality":
      var i = new c.Equation(_c(expr.left), _c(expr.right), weak);
      solver.addConstraint(i);
      return i;
    case "MultiplicativeExpression":
      var i = c.times(_c(expr.left), _c(expr.right));
      solver.addConstraint(i);
      return i;
    case "AdditiveExpression":
      if (expr.operator == "+") {
        return c.plus(_c(expr.left), _c(expr.right));
      } else {
        return c.minus(_c(expr.left), _c(expr.right));
      }
    case "NumericLiteral":
      return new c.Expression(expr.value);
    case "Variable":
      // console.log(expr);
      if(!vars[expr.name]) {
        vars[expr.name] = new c.Variable({ name: expr.name });
      }
      return vars[expr.name];
    case "UnaryExpression":
      console.log("UnaryExpression...WTF?");
      break;
  }
};

var compile = function(expressions) {
  return expressions.map(_c);
};

// Global API entrypoint
c._api = function() {
  var args = Array.prototype.slice.call(arguments);
  if (args.length == 1) {
    if(typeof args[0] == "string") {
      // Parse and execute it
      var r = c.parser.parse(args[0]);
      return compile(r);
    } else if(typeof args[0] == "function") {
      solver._addCallback(args[0]);
    }
  }
};

})(this["c"]||module.parent.exports||{});
