// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c){
  "use strict";

  c.Error = c.inherit({
    // extends: Error,
    initialize: function(s /*String*/) { if (s) { this._description = s; } },
    _name: "c.Error",
    _description: "An error has occured in Cassowary",
    set description(v)   { this._description = v; },
    get description()    { return "(" + this._name + ") " + this._description; },
    get message()        { return this.description; },
    toString: function() { return this.description; },
  });

  var errorType = function(name, error) {
    return c.inherit({
      extends: c.Error,
      initialize: function() { c.Error.apply(this, arguments); },
      _name: name||"", _description: error||""
    });
  };

  c.ConstraintNotFound =
    errorType("c.ConstraintNotFound",
        "Tried to remove a constraint never added to the tableu");

  c.InternalError =
    errorType("c.InternalError");

  c.NonExpression =
    errorType("c.NonExpression",
        "The resulting expression would be non");

  c.NotEnoughStays =
    errorType("c.NotEnoughStays",
        "There are not enough stays to give specific values to every variable");

  c.RequiredFailure =
    errorType("c.RequiredFailure", "A required constraint cannot be satisfied");

  c.TooDifficult =
    errorType("c.TooDifficult", "The constraints are too difficult to solve");

})(this["c"]||module.parent.exports||{});
