/* Output: Constraints

Manages constraints, executes solver commands.
Removes dereferenced variables. Outputs solutions. 

State:

  @_variables: - records variables by name
                 and constraints by continuation
*/

var Cassowary, Linear, Provided,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Provided = require('./Provided');

Cassowary = require('cassowary');

Linear = (function(_super) {
  var Commands, method, property, _ref;

  __extends(Linear, _super);

  Commands = (function() {
    function Commands() {}

    Commands.prototype.onConstraint = function(node, args, result, operation, continuation, scope) {
      var arg, _i, _len;
      if (result instanceof c.Constraint || result instanceof c.Expression) {
        result = [result];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          arg = args[_i];
          if (arg instanceof c.Variable) {
            result.push(arg);
          }
          if (arg.paths) {
            result.push.apply(result, arg.paths);
            arg.paths = void 0;
          }
        }
      }
      if (result.length > 0) {
        if (result.length > 1) {
          result[0].paths = result.splice(1);
        }
        return result[0];
      }
      return result;
    };

    Commands.prototype.get = function(scope, property, path) {
      var variable;
      if (typeof this.properties[property] === 'function' && scope) {
        return this.properties[property].call(this, scope, path);
      } else {
        variable = this["var"](this.getPath(scope, property));
      }
      return [variable, path || (property && scope) || ''];
    };

    Commands.prototype.remove = function() {
      var constrain, constraints, path, _i, _j, _len;
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        path = arguments[_i];
        if (constraints = this.solutions.variables[path]) {
          for (_j = constraints.length - 1; _j >= 0; _j += -1) {
            constrain = constraints[_j];
            this.solutions.remove(constrain, path);
          }
        }
      }
      return this;
    };

    Commands.prototype["var"] = function(name) {
      var _base;
      return (_base = this.solutions.variables)[name] || (_base[name] = new c.Variable({
        name: name
      }));
    };

    Commands.prototype.strength = function(strength, deflt) {
      if (deflt == null) {
        deflt = 'medium';
      }
      return strength && c.Strength[strength] || c.Strength[deflt];
    };

    Commands.prototype.weight = function(weight) {
      return weight;
    };

    Commands.prototype.varexp = function(name) {
      return new c.Expression({
        name: name
      });
    };

    Commands.prototype['=='] = function(left, right, strength, weight) {
      return new c.Equation(left, right, this.strength(strength), this.weight(weight));
    };

    Commands.prototype['<='] = function(left, right, strength, weight) {
      return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
    };

    Commands.prototype['>='] = function(left, right, strength, weight) {
      return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
    };

    Commands.prototype['<'] = function(left, right, strength, weight) {
      return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
    };

    Commands.prototype['>'] = function(left, right, strength, weight) {
      return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
    };

    Commands.prototype['+'] = function(left, right, strength, weight) {
      return c.plus(left, right);
    };

    Commands.prototype['-'] = function(left, right, strength, weight) {
      return c.minus(left, right);
    };

    Commands.prototype['*'] = function(left, right, strength, weight) {
      return c.times(left, right);
    };

    Commands.prototype['/'] = function(left, right, strength, weight) {
      return c.divide(left, right);
    };

    return Commands;

  })();

  _ref = Constraints.prototype;
  for (property in _ref) {
    method = _ref[property];
    if (method.length > 3 && property !== 'onConstraint') {
      (function(property, method) {
        return Constraints.prototype[property] = function(left, right, strength, weight) {
          var overloaded, value;
          if (left.push) {
            overloaded = left = this.onConstraint(null, null, left);
          }
          if (right.push) {
            overloaded = right = this.onConstraint(null, null, right);
          }
          value = method.call(this, left, right, strength, weight);
          if (overloaded) {
            return this.onConstraint(null, [left, right], value);
          }
          return value;
        };
      })(property, method);
    }
    Constraints.prototype[property].after = 'onConstraint';
  }

  function Linear(engine, output) {
    this.engine = engine;
    this.output = output;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    c.debug = true;
    this.variables = {};
  }

  Linear.prototype.pull = function(commands) {
    var command, response, startTime, subcommand, value, _i, _j, _len, _len1, _ref1, _ref2;
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
    this.added = this.nullified = void 0;
    this.response = this.lastOutput = response;
    if (startTime = this.engine.expressions.startTime) {
      this.engine.console.row('Result', JSON.parse(JSON.stringify(response)), GSS.time(startTime) + 'ms');
    }
    this.push(response);
  };

  Linear.prototype.perform = function() {
    if (this.constrained) {
      this.constrained = void 0;
      this.solver.solve();
    } else {
      this.solver.resolve();
    }
    return Linear.__super__.perform.apply(this, arguments);
  };

  Linear.prototype.remove = function(constraint, path) {
    if (constraint instanceof c.Constraint) {
      this.solver.removeConstraint(constraint);
      return this.unregister(constraint, path);
    } else if (constraint instanceof c.Variable) {
      if (constraint.editing) {
        return (this.nullified || (this.nullified = {}))[constraint.name] = constraint;
      }
    }
  };

  Linear.prototype.nullify = function(variable) {
    var cei;
    if (variable.editing) {
      if (cei = this.solver._editVarMap.get(variable)) {
        this.solver.removeColumn(cei.editMinus);
        this.solver._editVarMap["delete"](variable);
      }
    }
    return Linear.__super__.nullify.apply(this, arguments);
  };

  Linear.prototype.add = function(command) {
    if (command instanceof c.Constraint) {
      this.constrained = true;
      this.solver.addConstraint(command);
      return this.register(command);
    }
    return Linear.__super__.add.apply(this, arguments);
  };

  Linear.prototype.edit = function(variable, strength, weight, continuation) {
    var constraint;
    strength = this.engine.strength(strength, 'strong');
    weight = this.engine.weight(weight);
    constraint = new c.EditConstraint(variable, strength, weight);
    this.solver.addConstraint(constraint);
    variable.editing = constraint;
    return constraint;
  };

  Linear.prototype.suggest = function(path, value, strength, weight, continuation) {
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

  Linear.prototype.stay = function() {
    var arg, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      this.solver.addStay(arg);
    }
  };

  Linear.prototype.read = function() {
    var response, value, _ref1;
    response = {};
    _ref1 = this.solver._changed;
    for (property in _ref1) {
      value = _ref1[property];
      response[property] = value;
    }
    this.solver._changed = void 0;
    return response;
  };

  return Linear;

})(Provided);

module.exports = Linear;
