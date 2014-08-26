var Expressions;

Expressions = (function() {
  Expressions.prototype.displayName = 'Expressions';

  function Expressions(engine) {
    this.engine = engine;
  }

  Expressions.prototype.solve = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, contd, result, solve, solved, _ref, _ref1;
    if (!operation.def) {
      this.analyze(operation);
    }
    if (meta !== operation && (solve = (_ref = operation.parent) != null ? (_ref1 = _ref.def) != null ? _ref1.solve : void 0 : void 0)) {
      solved = solve.call(this.engine, operation, continuation, scope, meta, ascender, ascending);
      if (solved === false) {
        return;
      }
      if (typeof solved === 'string') {
        continuation = solved;
      }
    }
    if (operation.tail) {
      operation = this.skip(operation, ascender);
    }
    if (continuation && operation.path) {
      if ((result = this.reuse(operation.path, continuation)) !== false) {
        return result;
      }
    }
    args = this.descend(operation, continuation, scope, meta, ascender, ascending);
    if (args === false) {
      return;
    }
    if (operation.name && !operation.def.hidden) {
      this.engine.console.row(operation, args, continuation || "");
    }
    if (operation.def.noop) {
      result = args;
    } else {
      result = this.execute(operation, continuation, scope, args);
      contd = continuation;
      continuation = this.engine.getOperationPath(operation, continuation);
    }
    return this.ascend(operation, continuation, result, scope, meta, ascender);
  };

  Expressions.prototype.execute = function(operation, continuation, scope, args) {
    var command, context, func, method, node, onAfter, onBefore, result;
    scope || (scope = this.engine.scope);
    if (operation.def.scoped || !args) {
      node = scope;
      (args || (args = [])).unshift(scope);
    } else {
      node = this.engine.getContext(args, operation, scope, node);
    }
    if (!(func = operation.func)) {
      if (method = operation.method) {
        if (node && (func = node[method])) {
          if (args[0] === node) {
            args.shift();
          }
          context = node;
        }
        if (!func) {
          if (!context && (func = scope[method])) {
            context = scope;
          } else if (command = this.engine.methods[method]) {
            func = this.engine[command.displayName];
          }
        }
      }
    }
    if (!func) {
      throw new Error("Couldn't find method: " + operation.method);
    }
    if (onBefore = operation.def.before) {
      result = this.engine[onBefore](context || node || scope, args, operation, continuation, scope);
    }
    if (result === void 0) {
      result = func.apply(context || this.engine, args);
    }
    if (onAfter = operation.def.after) {
      result = this.engine[onAfter](context || node || scope, args, result, operation, continuation, scope);
    }
    return result;
  };

  Expressions.prototype.reuse = function(path, continuation) {
    var bit, index, key, length, _i, _len, _ref;
    length = path.length;
    _ref = continuation.split(this.engine.RIGHT);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      bit = key;
      if ((index = bit.lastIndexOf(this.engine.DOWN)) > -1) {
        bit = bit.substring(index + 1);
      }
      if (bit === path || bit.substring(0, path.length) === path) {
        if (length < bit.length && bit.charAt(length) === '$') {
          return this.engine.identity.solve(bit.substring(length));
        } else {
          return this.engine.queries[key];
        }
      }
    }
    return false;
  };

  Expressions.prototype.descend = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, argument, contd, index, mark, offset, prev, shift, skip, stopping, _i, _len;
    args = prev = void 0;
    skip = operation.skip;
    shift = 0;
    offset = operation.offset || 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (!offset && index === 0 && !operation.def.noop) {
        args = [operation, continuation || operation.path, scope, meta];
        shift += 3;
        continue;
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        shift--;
        continue;
      } else if (argument instanceof Array) {
        if (ascender != null) {
          mark = operation.def.rule && ascender === 1 && this.engine.DOWN || this.engine.RIGHT;
          if (mark) {
            contd = this.engine.getContinuation(continuation, null, mark);
          } else {
            contd = continuation;
          }
        }
        argument = this.solve(argument, contd || continuation, scope, meta, void 0, prev);
      }
      if (argument === void 0) {
        if (!operation.def.eager || (ascender != null)) {
          if (operation.def.capture && (operation.parent ? operation.def.noop : !operation.name)) {
            stopping = true;
          } else if (!operation.def.noop || operation.name) {
            return false;
          }
        }
        offset += 1;
        continue;
      }
      (args || (args = []))[index - offset + shift] = prev = argument;
    }
    return args;
  };

  Expressions.prototype.ascend = function(operation, continuation, result, scope, meta, ascender) {
    var breadcrumbs, captured, item, parent, pdef, solution, _base, _i, _len, _ref;
    if (result != null) {
      if (parent = operation.parent) {
        pdef = parent.def;
      }
      if (parent && (pdef || operation.def.noop) && (parent.domain === operation.domain || parent.domain === this.engine.document)) {
        if (parent && (typeof (_base = this.engine).isCollection === "function" ? _base.isCollection(result) : void 0)) {
          this.engine.console.group('%s \t\t\t\t%O\t\t\t%c%s', this.engine.UP, operation.parent, 'font-weight: normal; color: #999', continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            breadcrumbs = this.engine.getContinuation(continuation, item, this.engine.UP);
            this.solve(operation.parent, breadcrumbs, scope, meta, operation.index, item);
          }
          this.engine.console.groupEnd();
          return;
        } else {
          captured = pdef != null ? (_ref = pdef.capture) != null ? _ref.call(this.engine, result, operation, continuation, scope, meta) : void 0 : void 0;
          switch (captured) {
            case true:
              return;
            default:
              if (typeof captured === 'string') {
                continuation = captured;
                operation = operation.parent;
                parent = parent.parent;
              }
          }
          if (operation.def.noop && operation.name && result.length === 1) {
            return;
          }
          if (!parent.name) {
            if (result && (!parent || ((!pdef || pdef.noop) && (!parent.parent || parent.length === 1) || (ascender != null)))) {
              if (result.length === 1) {
                result = result[0];
              }
              return this.engine.provide(result);
            }
          } else if (parent && ((ascender != null) || (result.nodeType && (!operation.def.hidden || parent.tail === parent)))) {
            this.solve(parent, continuation, scope, meta, operation.index, result);
            return;
          } else {
            return result;
          }
        }
      } else if (parent && ((typeof parent[0] === 'string' || operation.exported) && (parent.domain !== operation.domain))) {
        solution = ['value', result, continuation || '', operation.toString()];
        this.engine.console.log('solution', solution, this.engine.workflow);
        if (operation.exported) {
          solution.push(true);
        }
        solution.operation = operation;
        solution.parent = operation.parent;
        solution.domain = operation.domain;
        solution.index = operation.index;
        parent[operation.index] = solution;
        this.engine.provide(solution);
        return;
      } else {
        return this.engine.provide(result);
      }
    }
    return result;
  };

  Expressions.prototype.skip = function(operation, ascender) {
    var _base;
    if (operation.tail.path === operation.tail.key || (ascender != null)) {
      return (_base = operation.tail).shortcut || (_base.shortcut = this.engine.methods[operation.def.group].perform.call(this.engine, operation));
    } else {
      return operation.tail[1];
    }
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var child, def, func, index, otherdef, _i, _len, _ref;
    if (typeof operation[0] === 'string') {
      operation.name = operation[0];
    }
    def = this.engine.methods[operation.name];
    if (parent) {
      if (operation.parent == null) {
        operation.parent = parent;
      }
      if (operation.index == null) {
        operation.index = parent.indexOf(operation);
      }
      if (parent.bound || ((_ref = parent.def) != null ? _ref.bound : void 0) === operation.index) {
        operation.bound = true;
      }
    }
    operation.arity = operation.length - 1;
    if (def && def.lookup) {
      if (operation.arity > 1) {
        operation.arity--;
        operation.skip = operation.length - operation.arity;
      } else {
        operation.skip = 1;
      }
      operation.name = (def.prefix || '') + operation[operation.skip] + (def.suffix || '');
      otherdef = def;
      switch (typeof def.lookup) {
        case 'function':
          def = def.lookup.call(this, operation);
          break;
        case 'string':
          def = this.engine.methods[def.lookup + operation.name];
          break;
        default:
          def = this.engine.methods[operation.name];
      }
    }
    operation.def = def || (def = {
      noop: true
    });
    operation.domain = this.engine;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (def.noop) {
      return;
    }
    if (def.serialized) {
      operation.key = this.serialize(operation, otherdef, false);
      operation.path = this.serialize(operation, otherdef);
      if (def.group) {
        operation.groupped = this.serialize(operation, otherdef, def.group);
      }
    }
    if (def.init) {
      this.engine[def.init](operation, false);
    }
    if (typeof def === 'function') {
      func = def;
      operation.offset = 1;
    } else if (func = def[operation.arity]) {
      operation.offset = 1;
    } else {
      func = def.command;
    }
    if (def.offset) {
      if (operation.offset == null) {
        operation.offset = def.offset;
      }
    }
    if (typeof func === 'string') {
      operation.method = func;
    } else {
      operation.func = func;
    }
    return operation;
  };

  Expressions.prototype.serialize = function(operation, otherdef, group) {
    var after, before, def, groupper, index, op, prefix, separator, suffix, tail, _i, _ref;
    def = operation.def;
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.def.noop && operation.name) || '';
    suffix = def.suffix || (otherdef && otherdef.suffix) || '';
    separator = operation.def.separator;
    after = before = '';
    for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
      if (op = operation[index]) {
        if (typeof op !== 'object') {
          after += op;
        } else if (op.key && group !== false) {
          if (group && (groupper = this.engine.methods[group])) {
            if (op.def.group === group) {
              if (tail = op.tail || (op.tail = groupper.condition(op) && op)) {
                operation.groupped = groupper.promise(op, operation);
                tail.head = operation;
                operation.tail = tail;
                before += (before && separator || '') + op.groupped || op.key;
              } else {
                continue;
              }
            } else {
              group = false;
              continue;
            }
          } else if (separator) {
            before += (before && separator || '') + op.path;
          } else {
            before += op.path;
          }
        }
      }
    }
    return before + prefix + after + suffix;
  };

  return Expressions;

})();

this.module || (this.module = {});

module.exports = Expressions;
