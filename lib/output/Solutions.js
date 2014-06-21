var Solutions;

Solutions = (function() {
  function Solutions(input, output) {
    this.input = input;
    this.output = output;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    c.debug = true;
  }

  Solutions.prototype.pull = function(commands) {
    var command, property, response, subcommand, value, _i, _j, _len, _len1, _ref, _ref1;
    this.response = response = {};
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
    _ref = this.solver._changed;
    for (property in _ref) {
      value = _ref[property];
      response[property] = value;
    }
    if (this.nullified) {
      _ref1 = this.nullified;
      for (property in _ref1) {
        value = _ref1[property];
        response[property] = null;
      }
      delete this.nullified;
    }
    console.log("Solutions output", JSON.parse(JSON.stringify(this.response)));
    this.push(response);
  };

  Solutions.prototype.push = function(results) {
    if (this.output) {
      return this.output.pull(results);
    }
  };

  Solutions.prototype.remove = function(constrain, path) {
    var group, index, variable, _i, _len, _ref, _results;
    if (constrain instanceof c.Constraint) {
      console.info('removed constraint', path, constrain);
      this.solver.removeConstraint(constrain);
      _ref = constrain.variables;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        variable = _ref[_i];
        if (group = this[variable.path]) {
          if ((index = group.indexOf(constrain)) > -1) {
            group.splice(index, 1);
          }
          if (!group.length) {
            delete this[variable.path];
          }
        }
        if (!--this[variable.name]) {
          delete this[variable.name];
          this.solver._externalParametricVars["delete"](variable);
          _results.push((this.nullified || (this.nullified = {}))[variable.name] = null);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Solutions.prototype.add = function(command) {
    var variable, _i, _len, _name, _ref, _results;
    if (command instanceof c.Constraint) {
      this.solver.addConstraint(command);
      if (command.variables) {
        _ref = command.variables;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          variable = _ref[_i];
          (this[_name = variable.path] || (this[_name] = [])).push(command);
          _results.push(this[variable.name] = (this[variable.name] || 0) + 1);
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
