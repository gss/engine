var Solver,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Solver = (function(_super) {
  __extends(Solver, _super);

  Solver.prototype.Observer = require('./dom/Observer.js');

  Solver.prototype.Thread = require('./Thread.js');

  function Solver(scope) {
    this.scope = scope;
    Solver.__super__.constructor.call(this);
    this.commands = new this.DOM;
    this.values = new this.Observer;
  }

  return Solver;

})(Engine);

module.exports = Solver;
