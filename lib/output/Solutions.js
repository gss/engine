var Solutions;

Solutions = (function() {
  function Solutions(engine, output) {
    this.engine = engine;
    this.output = output;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    c.debug = true;
    this.variables = {};
  }

  Solutions.prototype.pull = function(commands) {
    var command, property, response, subcommand, value, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    this.response = response = {};
    this.lastInput = commands;
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      if (command instanceof Array && typeof command[0] === 'object') {
        for (_j = 0, _len1 = command.length; _j < _len1; _j++) {
          subcommand = command[_j];
          this.add(subcommand);
        }
      } else {
        this.add(command);
      }
    }
    if (this.constrained) {
      this.constrained = void 0;
      this.solver.solve();
    } else {
      this.solver.resolve();
    }
    console.log(JSON.parse(JSON.stringify(this.solver._changed)));
    _ref = this.solver._changed;
    for (property in _ref) {
      value = _ref[property];
      response[property] = value;
    }
    this.solver._changed = void 0;
    if (this.nullified) {
      _ref1 = this.nullified;
      for (property in _ref1) {
        value = _ref1[property];
        if (!this.added || !(this.added[property] != null)) {
          this.nullify(value);
          response[property] = null;
        }
      }
    }
    if (this.added) {
      _ref2 = this.added;
      for (property in _ref2) {
        value = _ref2[property];
        if (!response[property] && (!this.nullified || !this.nullified[property])) {
          response[property] = 0;
        }
      }
    }
    console.error(this.added, this.nullified);
    this.added = this.nullified = void 0;
    this.lastOutput = response;
    console.log('Solutions output', JSON.parse(JSON.stringify(response)));
    this.push(response);
  };

  Solutions.prototype.push = function(results) {
    if (this.output) {
      return this.output.pull(results);
    } else {
      this.engine.values.merge(results);
      return this.engine.push(results);
    }
  };

  Solutions.prototype.remove = function(constrain, path) {
    var group, index, _i, _len, _ref, _results;
    if (constrain instanceof c.Constraint) {
      this.solver.removeConstraint(constrain);
      _ref = constrain.paths;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (typeof path === 'string') {
          if (group = this.variables[path]) {
            if ((index = group.indexOf(constrain)) > -1) {
              group.splice(index, 1);
            }
            if (!group.length) {
              _results.push(delete this.variables[path]);
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else {
          if (!--path.counter) {
            _results.push((this.nullified || (this.nullified = {}))[path.name] = path);
          } else {
            _results.push(void 0);
          }
        }
      }
      return _results;
    }
  };

  Solutions.prototype.nullify = function(path) {
    var cei, variable;
    variable = this.variables[path.name];
    if (variable.editing) {
      cei = this.solver._editVarMap.get(variable);
      this.solver.removeColumn(cei.editMinus);
      this.solver._editVarMap["delete"](variable);
    }
    delete this.variables[path.name];
    return this.solver._externalParametricVars["delete"](path);
  };

  Solutions.prototype.add = function(command) {
    var path, _base, _i, _len, _ref, _results;
    if (command instanceof c.Constraint) {
      this.constrained = true;
      this.solver.addConstraint(command);
      if (command.paths) {
        _ref = command.paths;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          if (typeof path === 'string') {
            _results.push(((_base = this.variables)[path] || (_base[path] = [])).push(command));
          } else {
            path.counter = (path.counter || 0) + 1;
            if (path.counter === 1) {
              if (this.nullified && this.nullified[path.name]) {
                _results.push(delete this.nullified[path.name]);
              } else {
                _results.push((this.added || (this.added = {}))[path.name] = 0);
              }
            } else {
              _results.push(void 0);
            }
          }
        }
        return _results;
      }
    } else if (this[command[0]]) {
      return this[command[0]].apply(this, Array.prototype.slice.call(command, 1));
    }
  };

  Solutions.prototype.edit = function(variable, strength, weight) {
    var constraint;
    strength = this.engine._strength(strength);
    weight = this.engine._weight(weight);
    c.trace && c.fnenterprint("addEditVar: " + constraint + " @ " + strength + " {" + weight + "}");
    constraint = new c.EditConstraint(variable, strength || c.Strength.strong, weight);
    this.solver.addConstraint(constraint);
    variable.editing = constraint;
    return constraint;
  };

  Solutions.prototype.suggest = function(path, value, strength, weight) {
    var variable;
    console.error('sugges', path, value, strength, weight, this.variables[path]);
    if (typeof path === 'string') {
      if (!(variable = this.variables[path])) {
        return this.response[path] = value;
      }
    } else {
      variable = path;
    }
    if (!variable.editing) {
      this.edit(variable, strength, weight);
    }
    this.solver.suggestValue(variable, value);
    return variable;
  };

  Solutions.prototype.stay = function() {
    var arg, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      this.solver.addStay(arg);
    }
  };

  return Solutions;

})();

module.exports = Solutions;
