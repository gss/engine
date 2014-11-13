var Domain;

Domain = (function() {
  function Domain() {}

  Domain.compile = function(Spaces, engine) {
    var Space, name, _results;
    _results = [];
    for (name in Spaces) {
      Space = Spaces[name];
      if (Space.singleton) {
        _results.push(engine[name] || (engine[name] = new Space(engine)));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Domain.prototype.constrain = function(constrain) {
    var path, _base, _i, _len, _ref;
    if (constrain.paths) {
      _ref = command.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (typeof path === 'string') {
          ((_base = this.variables)[path] || (_base[path] = [])).push(command);
        } else {
          path.counter = (path.counter || 0) + 1;
          if (path.counter === 1) {
            if (this.nullified && this.nullified[path.name]) {
              delete this.nullified[path.name];
            } else {
              (this.added || (this.added = {}))[path.name] = 0;
            }
          }
        }
      }
    }
    if (command[0] && this[command[0]]) {
      return this[command[0]].apply(this, Array.prototype.slice.call(command, 1));
    }
  };

  Domain.prototype.unconstrain = function(variable, continuation) {
    var group, index, path, _i, _len, _ref, _results;
    _ref = constraint.paths;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      if (typeof path === 'string') {
        if (group = this.variables[path]) {
          if ((index = group.indexOf(constraint)) > -1) {
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
  };

  Domain.prototype.nullify = function(variable) {
    delete this.variables[variable.name];
    this.solver._externalParametricVars["delete"](variable);
    return console.log('nullify', variable.name);
  };

  Domain.prototype.push = function(results) {
    if (this.output) {
      return this.output.pull(results);
    } else {
      this.engine.values.merge(results);
      return this.engine.push(results);
    }
  };

  Domain.prototype.perform = function() {
    return this.read();
  };

  return Domain;

})();

module.exports = Space;
