// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2014, Alex Russell (slightlyoff@chromium.org)

"use strict";

load("console.js");
load("../src/c.js");

// Command-line argument processing
if (this.arguments) {
  this.arguments.forEach(function(a, idx) {
    if (a.indexOf("=") != -1) {
      var arr = a.split("=", 2);
      if (typeof c[arr[0]] != "undefined") {
        c[arr[0]] = JSON.parse(arr[1]);
      }
    }
  });
}

load("../src/HashTable.js");
load("../src/HashSet.js");
load("../src/Error.js");
load("../src/SymbolicWeight.js");
load("../src/Strength.js");
load("../src/Variable.js");
load("../src/Point.js");
load("../src/Expression.js");
load("../src/Constraint.js");
load("../src/EditInfo.js");
load("../src/Tableau.js");
load("../src/SimplexSolver.js");

load("../src/Timer.js");
load("../tests/PerfTest.js");