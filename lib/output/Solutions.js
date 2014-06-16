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
    var command, property, response, subcommand, value, _i, _j, _len, _len1, _ref;
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
    response = {};
    _ref = this.solver._changed;
    for (property in _ref) {
      value = _ref[property];
      if (value === 0) {
        console.log('got zero', value, property, this[property], this);
        if (this[property] === 0) {
          delete this[property];
          value = null;
        }
      }
      response[property] = value;
    }
    this.write(response);
  };

  Solutions.prototype.write = function(results) {
    if (this.output) {
      return this.output.read(results);
    }
  };

  Solutions.prototype.remove = function(constrain, path) {
    var group, index, other, prop, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (constrain instanceof c.Constraint) {
      this.solver.removeConstraint(constrain);
      _ref = constrain.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        other = _ref[_i];
        if (other !== path) {
          if (group = solutions[path]) {
            if (index = group.indexOf(constrain) > -1) {
              group.splice(index, 1);
            }
            if (!group.length) {
              delete solutions[path];
            }
          }
        }
      }
      debugger;
      _ref1 = constrain.props;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        prop = _ref1[_j];
        _results.push(this[prop]--);
      }
      return _results;
    }
  };

  Solutions.prototype.add = function(command) {
    var path, prop, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (command instanceof c.Constraint) {
      this.solver.addConstraint(command);
      if (command.paths) {
        _ref = command.paths;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          (this[path] || (this[path] = [])).push(command);
        }
        _ref1 = command.props;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          prop = _ref1[_j];
          _results.push(this[prop] = (this[prop] || 0) + 1);
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
