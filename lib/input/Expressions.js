var Expressions;

Expressions = (function() {
  function Expressions(engine, context, output) {
    this.engine = engine;
    this.context = context;
    this.output = output;
    this.context || (this.context = this.engine && this.engine.context || this);
  }

  Expressions.prototype.pull = function() {
    var buffer, result;
    if (this.buffer === void 0) {
      this.buffer = null;
      buffer = true;
    }
    result = this.evaluate.apply(this, arguments);
    if (buffer) {
      this.flush();
    }
    return result;
  };

  Expressions.prototype.push = function(args, batch) {
    var buffer, last;
    if (args == null) {
      return;
    }
    if ((buffer = this.buffer) !== void 0) {
      if (buffer) {
        if (batch) {
          if (last = buffer[buffer.length - 1]) {
            if (last[0] === args[0]) {
              if (last.indexOf(args[1]) === -1) {
                last.push.apply(last, args.slice(1));
              }
              return buffer;
            }
          }
        }
      } else {
        this.buffer = buffer = [];
      }
      buffer.push(args);
    } else {
      return this.output.pull.apply(this.output, args);
    }
  };

  Expressions.prototype.flush = function() {
    console.log(this.engine.onDOMContentLoaded && 'Document' || 'Worker', 'Output:', this.buffer);
    this.lastOutput = GSS.clone(this.buffer);
    if (this.buffer) {
      this.output.pull(this.buffer);
    }
    return this.buffer = void 0;
  };

  Expressions.prototype.evaluate = function(operation, continuation, scope, ascender, ascending, overloaded) {
    var args, breadcrumbs, overloading, result;
    if (!operation.def) {
      this.analyze(operation);
    }
    if (!overloaded && operation.parent) {
      overloading = this.overload(operation, continuation, scope, ascender, ascending);
      if (overloading !== this) {
        return overloading;
      }
    }
    if (operation.tail) {
      operation = this.skip(operation, ascender);
    }
    if (continuation && operation.path) {
      if ((result = this.reuse(operation.path, continuation)) !== false) {
        debugger;
        return result;
      }
    }
    args = this.resolve(operation, continuation, scope, ascender, ascending);
    if (args === false) {
      return;
    }
    if (operation.def.noop) {
      result = args;
    } else {
      result = this.execute(operation, continuation, scope, args);
    }
    breadcrumbs = this.breadcrumb(operation, continuation);
    if (breadcrumbs && breadcrumbs.indexOf('scope::scope') > -1) {
      debugger;
    }
    return this.ascend(operation, breadcrumbs, result, scope, ascender);
  };

  Expressions.prototype.execute = function(operation, continuation, scope, args) {
    var callback, context, func, method, node, result;
    scope || (scope = this.engine.scope);
    if (operation.def.scoped || !args) {
      (args || (args = [])).unshift(scope);
    }
    if (typeof args[0] === 'object') {
      node = args[0];
    }
    if (!(func = operation.func)) {
      if (method = operation.method) {
        if (node && (func = node[method])) {
          args.shift();
          context = node;
        }
        if (!func) {
          if (!context && (func = scope[method])) {
            context = scope;
          } else {
            func = this[method] || this.context[method];
          }
        }
      }
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(context || this.context, args);
    if (callback = operation.def.callback) {
      result = this.context[callback](context || node || scope, args, result, operation, continuation, scope);
    }
    return result;
  };

  Expressions.prototype.reuse = function(path, continuation) {
    var breaking, id, index, last, separator, start;
    last = -1;
    if (path.indexOf('::scope') > -1 && continuation && continuation.indexOf('::scope') > -1) {
      debugger;
    }
    while ((index = continuation.indexOf('–', last + 1))) {
      if (index === -1) {
        if (last === continuation.length - 1) {
          break;
        }
        index = continuation.length;
        breaking = true;
      }
      start = continuation.substring(last + 1, last + 1 + path.length);
      if (start === path) {
        separator = last + 1 + path.length;
        if (separator < index) {
          if (continuation.charAt(separator) === '$') {
            id = continuation.substring(separator, index);
          }
        }
        if (id) {
          return this.engine[id];
        } else {
          return this.engine.queries[continuation.substring(0, separator)];
        }
      }
      if (breaking) {
        break;
      }
      last = index;
    }
    return false;
  };

  Expressions.prototype.resolve = function(operation, continuation, scope, ascender, ascending) {
    var args, argument, contd, index, offset, prev, skip, _i, _len;
    args = prev = void 0;
    skip = operation.skip;
    offset = operation.offset || 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (index === 0 && (!operation.def.noop && !offset)) {
        argument = continuation || operation;
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        offset += 1;
        continue;
      } else if (argument instanceof Array) {
        if (ascender < index) {
          contd = continuation;
          if (contd.charAt(contd.length - 1) !== '–') {
            contd += '–';
          }
        }
        argument = this.evaluate(argument, contd || continuation, scope, void 0, prev);
      }
      if (argument === void 0) {
        if ((!operation.def.eager || (ascender != null)) && (!operation.def.noop || operation.parent)) {
          return false;
        }
        offset += 1;
        continue;
      }
      (args || (args = []))[index - offset] = prev = argument;
    }
    if (!args && operation.def.noop) {
      return false;
    }
    return args;
  };

  Expressions.prototype.ascend = function(operation, continuation, result, scope, ascender) {
    var breadcrumbs, item, parent, _i, _len;
    if (result != null) {
      if ((parent = operation.parent) || operation.def.noop) {
        if (parent && this.engine.isCollection(result)) {
          console.group(continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            breadcrumbs = this.engine.getPath(continuation, item);
            this.evaluate(operation.parent, breadcrumbs, scope, operation.index, item);
          }
          console.groupEnd(continuation);
          return;
        } else if (parent && parent.def.capture) {
          return parent.def.capture(this.engine, result, parent, continuation, scope);
        } else {
          if (operation.def.noop) {
            if (result && (!parent || (parent.def.noop && parent.length === 1 || (ascender != null)))) {
              if (result.length === 1) {
                return this.push(result[0]);
              } else {
                return this.push(result);
              }
            }
          } else if (parent && ((ascender != null) || result.nodeType)) {
            this.evaluate(parent, continuation, scope, operation.index, result);
            return;
          }
        }
      } else {
        return this.push(result);
      }
    }
    return result;
  };

  Expressions.prototype.skip = function(operation, ascender) {
    var _base;
    if (operation.tail.path === operation.tail.key || (ascender != null)) {
      return (_base = operation.tail).shortcut || (_base.shortcut = this.context[operation.def.group].perform(this, operation));
    } else {
      return operation.tail[1];
    }
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var child, def, func, groupper, index, otherdef, _i, _len;
    operation.name = operation[0];
    def = this.engine.context[operation.name];
    if (parent) {
      operation.parent = parent;
      operation.index = parent.indexOf(operation);
    }
    operation.arity = operation.length - 1;
    if (def && def.lookup) {
      if (operation.arity > 1) {
        operation.arity--;
        operation.skip = operation.length - operation.arity;
      } else {
        operation.skip = 1;
      }
      operation.name = (def.prefix || '') + operation[operation.skip];
      otherdef = def;
      if (typeof def.lookup === 'function') {
        def = def.lookup.call(this, operation);
      } else {
        def = this.context[operation.name];
      }
    }
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (def === void 0) {
      operation.def = {
        noop: true
      };
      return operation;
    }
    operation.def = def;
    if (def.serialized) {
      operation.key = this.serialize(operation, otherdef, false);
      operation.path = this.serialize(operation, otherdef);
      if (def.group) {
        operation.groupped = this.serialize(operation, otherdef, def.group);
        if (groupper = this.context[def.group]) {
          groupper.analyze(operation);
        }
      }
    }
    if (typeof def === 'function') {
      func = def;
      operation.offset = 1;
    } else if (func = def[operation.arity]) {
      operation.offset = 1;
    } else {
      func = def.command;
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
          if (group && (groupper = this.context[group])) {
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

  Expressions.prototype.breadcrumb = function(operation, continuation) {
    if (continuation != null) {
      if (operation.def.serialized && !operation.def.hidden) {
        return continuation + operation.key;
      }
      return continuation;
    } else {
      return operation.path;
    }
  };

  Expressions.prototype.overload = function(operation, continuation, scope, ascender, ascending) {
    var evaluated, parent, pdef;
    parent = operation.parent;
    if ((pdef = parent.def) && pdef.evaluate) {
      evaluated = pdef.evaluate.call(this, operation, continuation, scope, ascender, ascending);
      return evaluated;
    }
    return this;
  };

  return Expressions;

})();

module.exports = Expressions;
