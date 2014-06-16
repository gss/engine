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
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      if (command instanceof Array) {
        for (_j = 0, _len1 = command.length; _j < _len1; _j++) {
          subcommand = command[_j];
          this.add(subcommand);
        }
      } else {
        this.add(command);
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

  Solutions.prototype.remove = function(command) {
    if (command instanceof c.Constraint) {
      return this.solver.removeConstraint(command);
    }
  };

  Solutions.prototype.add = function(command) {
    var path, _i, _len, _ref, _results;
    if (command instanceof c.Constraint) {
      this.solver.addConstraint(command);
      if (command.paths) {
        _ref = command.paths;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          _results.push((this[path] || (this[path] = [])).push(command));
        }
        return _results;
      }
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
