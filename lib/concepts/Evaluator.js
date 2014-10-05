var Evaluator;

Evaluator = (function() {
  Evaluator.prototype.displayName = 'Expressions';

  function Evaluator(engine) {
    this.engine = engine;
  }

  Evaluator.prototype.solve = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, result, solve, solved, _ref, _ref1;
    if (scope == null) {
      scope = this.engine.scope;
    }
    if (!operation.def) {
      this.engine.Operation.analyze(operation);
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
      operation = this.skip(operation, ascender, continuation);
    }
    if (continuation && operation.path && operation.def.serialized) {
      result = this.engine.Operation.getSolution(operation, continuation, scope);
      switch (typeof result) {
        case 'string':
          if (operation.def.virtual && result.charAt(0) !== this.engine.PAIR) {
            return result;
          } else {
            continuation = result;
            result = void 0;
          }
          break;
        case 'object':
          return result;
        case 'boolean':
          return;
      }
    }
    if (result === void 0) {
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
        continuation = this.engine.Operation.getPath(operation, continuation, scope);
      }
    }
    return this.ascend(operation, continuation, result, scope, meta, ascender);
  };

  Evaluator.prototype.execute = function(operation, continuation, scope, args) {
    var command, context, func, method, node, onAfter, onBefore, result;
    scope || (scope = this.engine.scope);
    if (!args) {
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
            if (operation.def.scoped && operation.bound) {
              args.unshift(scope);
            }
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

  Evaluator.prototype.descend = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, argument, contd, index, offset, prev, shift, skip, stopping, _i, _len;
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
          contd = this.engine.getDescendingContinuation(operation, continuation, ascender);
        } else {
          contd = continuation;
        }
        argument = this.solve(argument, contd, scope, meta, void 0, prev);
      }
      if (argument === void 0) {
        if ((!this.engine.eager && !operation.def.eager) || (ascender != null)) {
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

  Evaluator.prototype.ascend = function(operation, continuation, result, scope, meta, ascender) {
    var contd, item, parent, pdef, scoped, solution, _i, _len, _ref, _ref1;
    if (result != null) {
      if (parent = operation.parent) {
        pdef = parent.def;
      }
      if (parent && (pdef || operation.def.noop) && (parent.domain === operation.domain || parent.domain === this.engine.document || parent.domain === this.engine)) {
        if (parent && this.engine.isCollection(result)) {
          this.engine.console.group('%s \t\t\t\t%O\t\t\t%c%s', this.engine.ASCEND, operation.parent, 'font-weight: normal; color: #999', continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            contd = this.engine.getAscendingContinuation(continuation, item);
            this.ascend(operation, contd, item, scope, meta, operation.index);
          }
          this.engine.console.groupEnd();
          return;
        } else {
          if (pdef != null ? (_ref = pdef.capture) != null ? _ref.call(this.engine, result, operation, continuation, scope, meta, ascender) : void 0 : void 0) {
            return;
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
          } else if (parent && ((ascender != null) || ((result.nodeType || operation.def.serialized) && (!operation.def.hidden || parent.tail === parent)))) {
            this.solve(parent, continuation, scope, meta, operation.index, result);
            return;
          }
          return result;
        }
      } else if (parent && ((typeof parent[0] === 'string' || operation.exported) && (parent.domain !== operation.domain))) {
        if (!continuation && operation[0] === 'get') {
          continuation = operation[3];
        }
        solution = ['value', result, continuation || '', operation.toString()];
        if (!(scoped = scope !== this.engine.scope && scope)) {
          if (operation[0] === 'get' && operation[4]) {
            scoped = this.engine.identity.solve(operation[4]);
          }
        }
        if (operation.exported || scoped) {
          solution.push((_ref1 = operation.exported) != null ? _ref1 : null);
        }
        if (scoped) {
          solution.push(this.engine.identity.provide(scoped));
        }
        solution.operation = operation;
        solution.parent = operation.parent;
        solution.domain = operation.domain;
        solution.index = operation.index;
        parent[operation.index] = solution;
        this.engine.engine.provide(solution);
        return;
      } else {
        return this.engine.provide(result);
      }
    }
    return result;
  };

  Evaluator.prototype.skip = function(operation, ascender, continuation) {
    var _base;
    if (operation.tail.path === operation.tail.key || (ascender != null) || (continuation && continuation.lastIndexOf(this.engine.PAIR) !== continuation.indexOf(this.engine.PAIR))) {
      return (_base = operation.tail).shortcut || (_base.shortcut = this.engine.methods[operation.def.group].perform.call(this.engine, operation));
    } else {
      return operation.tail[1];
    }
  };

  return Evaluator;

})();

this.module || (this.module = {});

module.exports = Evaluator;
