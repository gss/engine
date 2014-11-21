var Command, Constraint;

Command = require('../concepts/Command');

Constraint = Command.extend({
  type: 'Constraint',
  signature: [
    {
      left: ['Variable', 'Number'],
      right: ['Variable', 'Number']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ],
  toHash: function(meta) {
    var hash, property;
    hash = '';
    if (meta.values) {
      for (property in meta.values) {
        hash += property;
      }
    }
    return hash;
  },
  fetch: function(engine, operation) {
    var constraint, operations, signature, _ref, _ref1;
    if (operations = (_ref = engine.operations) != null ? _ref[operation.hash || (operation.hash = this.toExpression(operation))] : void 0) {
      for (signature in operations) {
        constraint = operations[signature];
        if (((_ref1 = engine.constraints) != null ? _ref1.indexOf(constraint) : void 0) > -1) {
          return constraint;
        }
      }
    }
  },
  declare: function(engine, constraint) {
    var constraints, definition, op, path, _ref, _ref1, _ref2, _ref3;
    _ref = constraint.operations[0].variables;
    for (path in _ref) {
      op = _ref[path];
      if (definition = engine.variables[path]) {
        constraints = definition.constraints || (definition.constraints = []);
        if (((_ref1 = constraints[0]) != null ? (_ref2 = _ref1.operations[0]) != null ? (_ref3 = _ref2.parent.values) != null ? _ref3[path] : void 0 : void 0 : void 0) == null) {
          if (constraints.indexOf(constraint) === -1) {
            constraints.push(constraint);
          }
        }
      }
    }
  },
  undeclare: function(engine, constraint, quick) {
    var i, object, op, path, _ref, _ref1;
    _ref = constraint.operations[0].variables;
    for (path in _ref) {
      op = _ref[path];
      if (object = engine.variables[path]) {
        if ((i = (_ref1 = object.constraints) != null ? _ref1.indexOf(constraint) : void 0) > -1) {
          object.constraints.splice(i, 1);
          if (object.constraints.length === 0) {
            op.command.undeclare(engine, object, quick);
          }
        }
      }
    }
  },
  add: function(constraint, engine, operation, continuation) {
    var i, op, operations, other, _i;
    other = this.fetch(engine, operation);
    operations = constraint.operations || (constraint.operations = (other != null ? other.operations : void 0) || []);
    if (operations.indexOf(operation) === -1) {
      for (i = _i = operations.length - 1; _i >= 0; i = _i += -1) {
        op = operations[i];
        if (op.hash === operation.hash && op.parent[0].key === continuation) {
          operations.splice(i, 1);
          this.unwatch(engine, op, continuation);
        }
      }
      operations.push(operation);
    }
    engine.add(continuation, operation);
    if (other !== constraint) {
      if (other) {
        this.undeclare(engine, other, true);
        this.unset(engine, other);
        other.operations = void 0;
      }
      this.declare(engine, constraint);
      this.set(engine, constraint);
    }
  },
  set: function(engine, constraint) {
    if ((engine.constraints || (engine.constraints = [])).indexOf(constraint) === -1) {
      engine.constraints.push(constraint);
      return (engine.constrained || (engine.constrained = [])).push(constraint);
    }
  },
  unset: function(engine, constraint) {
    var index, operation, path, _i, _len, _ref, _ref1;
    if ((index = engine.constraints.indexOf(constraint)) > -1) {
      engine.constraints.splice(index, 1);
    }
    if ((index = (_ref = engine.constrained) != null ? _ref.indexOf(constraint) : void 0) > -1) {
      engine.constrained.splice(index, 1);
    } else {
      if ((engine.unconstrained || (engine.unconstrained = [])).indexOf(constraint) === -1) {
        engine.unconstrained.push(constraint);
      }
    }
    _ref1 = constraint.operations;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      operation = _ref1[_i];
      if ((path = operation.parent[0].key) != null) {
        this.unwatch(engine, operation, path);
      }
    }
  },
  unwatch: function(engine, operation, path) {
    var i, paths;
    if (paths = engine.paths[path]) {
      if ((i = paths.indexOf(operation)) > -1) {
        paths.splice(i, 1);
        if (paths.length === 0) {
          return delete engine.paths[path];
        }
      }
    }
  },
  remove: function(engine, operation, continuation) {
    var constraint, index, operations;
    constraint = this.fetch(engine, operation);
    operations = constraint.operations;
    if ((index = operations.indexOf(operation)) > -1) {
      if (operations.length === 1) {
        this.undeclare(engine, constraint);
        this.unset(engine, constraint);
      }
      return operations.splice(index, 1);
    }
  },
  find: function(engine, variable) {
    var other, _i, _len, _ref;
    _ref = variable.constraints;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      other = _ref[_i];
      if (other.operations[0].variables[variable.name].domain === engine) {
        if (engine.constraints.indexOf(other) > -1) {
          return true;
        }
      }
    }
  },
  split: function(constraints) {
    var constraint, group, groupped, groups, other, others, path, vars, _i, _j, _k, _len, _len1;
    groups = [];
    for (_i = 0, _len = constraints.length; _i < _len; _i++) {
      constraint = constraints[_i];
      groupped = void 0;
      vars = constraint.operations[0].variables;
      for (_j = groups.length - 1; _j >= 0; _j += -1) {
        group = groups[_j];
        for (_k = 0, _len1 = group.length; _k < _len1; _k++) {
          other = group[_k];
          others = other.operations[0].variables;
          for (path in vars) {
            if (others[path]) {
              if (groupped && groupped !== group) {
                groupped.push.apply(groupped, group);
                groups.splice(groups.indexOf(group), 1);
              } else {
                groupped = group;
              }
              break;
            }
          }
          if (groups.indexOf(group) === -1) {
            break;
          }
        }
      }
      if (!groupped) {
        groups.push(groupped = []);
      }
      groupped.push(constraint);
    }
    return groups;
  },
  validate: function(engine) {
    var arg, args, commands, constraint, equal, group, groups, i, index, operation, separated, shift, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
    groups = this.split(engine.constraints).sort(function(a, b) {
      var al, bl;
      al = a.length;
      bl = b.length;
      return bl - al;
    });
    separated = groups.splice(1);
    commands = [];
    if (separated.length) {
      shift = 0;
      for (index = _i = 0, _len = separated.length; _i < _len; index = ++_i) {
        group = separated[index];
        for (index = _j = 0, _len1 = group.length; _j < _len1; index = ++_j) {
          constraint = group[index];
          this.unset(engine, constraint);
          _ref = constraint.operations;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            operation = _ref[_k];
            commands.push(operation.parent);
          }
        }
      }
    }
    if (commands != null ? commands.length : void 0) {
      if (commands.length === 1) {
        commands = commands[0];
      }
      args = arguments;
      if (args.length === 1) {
        args = args[0];
      }
      if (commands.length === args.length) {
        equal = true;
        for (i = _l = 0, _len3 = args.length; _l < _len3; i = ++_l) {
          arg = args[i];
          if (commands.indexOf(arg) === -1) {
            equal = false;
            break;
          }
        }
        if (equal) {
          throw new Error('Trying to separate what was just added. Means loop. ');
        }
      }
      return engine.Command.orphanize(commands);
    }
  }
});

module.exports = Constraint;
