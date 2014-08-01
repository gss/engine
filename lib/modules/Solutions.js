/* Output: Constraints

Manages constraints, executes solver commands.
Removes dereferenced variables. Outputs solutions. 

State:

  @_variables: - records variables by name
                 and constraints by continuation
*/

var Solutions, Space,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

require('cassowary');

Space = require('../concepts/Space');

Solutions = (function(_super) {
  __extends(Solutions, _super);

  function Solutions(engine, output) {
    this.engine = engine;
    this.output = output;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    c.debug = true;
    this.variables = {};
  }

  Solutions.prototype.pull = function(commands) {
    var command, property, response, startTime, subcommand, value, _i, _j, _len, _len1, _ref, _ref1;
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
    response = this.perform();
    if (this.nullified) {
      _ref = this.nullified;
      for (property in _ref) {
        value = _ref[property];
        if (!this.added || !(this.added[property] != null)) {
          this.nullify(value);
          response[property] = null;
        }
      }
    }
    if (this.added) {
      _ref1 = this.added;
      for (property in _ref1) {
        value = _ref1[property];
        if (!response[property] && (!this.nullified || !this.nullified[property])) {
          response[property] = 0;
        }
      }
    }
    this.added = this.nullified = void 0;
    this.response = this.lastOutput = response;
    if (startTime = this.engine.expressions.startTime) {
      this.engine.console.row('Result', JSON.parse(JSON.stringify(response)), GSS.time(startTime) + 'ms');
    }
    this.push(response);
  };

  Solutions.prototype.perform = function() {
    if (this.constrained) {
      this.constrained = void 0;
      this.solver.solve();
    } else {
      this.solver.resolve();
    }
    return Solutions.__super__.perform.apply(this, arguments);
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
    } else if (constrain instanceof c.Variable) {
      if (constrain.editing) {
        return (this.nullified || (this.nullified = {}))[constrain.name] = constrain;
      }
    }
  };

  Solutions.prototype.nullify = function(variable) {
    var cei;
    if (variable.editing) {
      if (cei = this.solver._editVarMap.get(variable)) {
        this.solver.removeColumn(cei.editMinus);
        this.solver._editVarMap["delete"](variable);
      }
    }
    return Solutions.__super__.nullify.apply(this, arguments);
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
    } else {
      return Solutions.__super__.add.apply(this, arguments);
    }
  };

  Solutions.prototype.edit = function(variable, strength, weight, continuation) {
    var constraint;
    strength = this.engine.strength(strength, 'strong');
    weight = this.engine.weight(weight);
    constraint = new c.EditConstraint(variable, strength, weight);
    this.solver.addConstraint(constraint);
    variable.editing = constraint;
    return constraint;
  };

  Solutions.prototype.suggest = function(path, value, strength, weight, continuation) {
    var variable, variables, _base;
    if (typeof path === 'string') {
      if (!(variable = this.variables[path])) {
        if (continuation) {
          variable = this.engine["var"](path);
          variables = ((_base = this.variables)[continuation] || (_base[continuation] = []));
          if (variables.indexOf(variable) === -1) {
            variables.push(variable);
          }
        } else {
          return this.response[path] = value;
        }
      }
    } else {
      variable = path;
    }
    if (!variable.editing) {
      this.edit(variable, strength, weight, continuation);
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

})(Space);

module.exports = Solutions;
