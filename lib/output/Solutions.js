var Solutions;

Solutions = (function() {
  function Solutions(input, output) {
    this.input = input;
    this.output = output;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    c.debug = true;
  }

  Solutions.prototype.read = function(commands) {
    var command, subcommand, _i, _j, _len, _len1;
    this.lastInput = commands;
    console.log("Solver input:", commands);
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      if (command instanceof Array) {
        for (_j = 0, _len1 = command.length; _j < _len1; _j++) {
          subcommand = command[_j];
          this.process(subcommand);
        }
      } else {
        this.process(command);
      }
    }
    this.solver.solve();
    console.log("Solver output", this.solver._changed);
    this.write(this.solver._changed);
  };

  Solutions.prototype.write = function(results) {
    if (this.output) {
      return this.output.read(results);
    }
  };

  Solutions.prototype.clean = function(id) {};

  Solutions.prototype.process = function(command) {
    if (command instanceof c.Constraint) {
      return this.solver.addConstraint(command);
    } else if (this[command[0]]) {
      return this[command[0]].apply(this, Array.prototype.slice.call(command));
    }
  };

  Solutions.prototype.edit = function(variable) {
    return this.solver.addEditVar(variable);
  };

  Solutions.prototype.suggest = function(variable, value, strength, weight) {
    this.solver.solve();
    this.edit(variable, this.strength(strength), this.weight(weight));
    this.solver.suggestValue(variable, value);
    return this.solver.resolve();
  };

  Solutions.prototype.stay = function(path, v) {
    var i, _i, _ref;
    for (i = _i = 1, _ref = arguments.length; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      this.solver.addStay(v);
    }
  };

  return Solutions;

})();

module.exports = Solutions;
