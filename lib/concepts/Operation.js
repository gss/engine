var Operation,
  __hasProp = {}.hasOwnProperty;

Operation = (function() {
  function Operation(engine) {
    if (!engine) {
      return Array.prototype.slice.call(arguments);
    } else if (this.engine) {
      return new Operation(engine);
    }
    this.engine = engine;
    this.CleanupSelectorRegExp = new RegExp(this.engine.Continuation.DESCEND + '::this', 'g');
  }

  Operation.prototype.sanitize = function(exps, soft, parent, index) {
    var exp, i, prop, value, _i, _len;
    if (parent == null) {
      parent = exps.parent;
    }
    if (index == null) {
      index = exps.index;
    }
    if (exps[0] === 'value' && exps.operation) {
      return parent[index] = this.sanitize(exps.operation, soft, parent, index);
    }
    for (prop in exps) {
      if (!__hasProp.call(exps, prop)) continue;
      value = exps[prop];
      if (!isFinite(parseInt(prop))) {
        if (prop !== 'variables') {
          delete exps[prop];
        }
      }
    }
    for (i = _i = 0, _len = exps.length; _i < _len; i = ++_i) {
      exp = exps[i];
      if (exp != null ? exp.push : void 0) {
        this.sanitize(exp, soft, exps, i);
      }
    }
    exps.parent = parent;
    exps.index = index;
    return exps;
  };

  Operation.prototype.orphanize = function(operation) {
    var arg, _i, _len;
    if (operation.domain) {
      delete operation.domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg != null ? arg.push : void 0) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Operation.prototype.getContext = function(operation, args, scope, node) {
    var index, _ref;
    index = args[0].def && 4 || 0;
    if (args.length !== index && ((_ref = args[index]) != null ? _ref.nodeType : void 0)) {
      return args[index];
    }
    if (!operation.bound) {
      if (operation.def.serialized && operation[1].def && (args[index] != null)) {
        return args[index];
      }
      return this.engine.scope;
    }
    return scope;
  };

  Operation.prototype.getDomain = function(operation, domain) {
    var arg, _i, _len;
    if (typeof operation[0] === 'string') {
      if (!domain.methods[operation[0]]) {
        return this.engine.linear.maybe();
      }
      for (_i = 0, _len = operation.length; _i < _len; _i++) {
        arg = operation[_i];
        if (arg.domain && arg.domain.priority > domain.priority && arg.domain < 0) {
          return arg.domain;
        }
      }
    }
    return domain;
  };

  Operation.prototype.ascend = function(operation, domain) {
    var parent, _ref;
    if (domain == null) {
      domain = operation.domain;
    }
    parent = operation;
    while (parent.parent && typeof parent.parent[0] === 'string' && (!parent.parent.def || (!parent.parent.def.noop && parent.domain === domain))) {
      parent = parent.parent;
    }
    while (((_ref = parent.parent) != null ? _ref.domain : void 0) === parent.domain) {
      parent = parent.parent;
    }
    return parent;
  };

  Operation.prototype.getRoot = function(operation) {
    while (!operation.def.noop) {
      operation = operation.parent;
    }
    return operation;
  };

  Operation.prototype.getPath = function(operation, continuation, scope) {
    var path;
    if (continuation != null) {
      if (operation.def.serialized && !operation.def.hidden) {
        if (operation.marked && operation.arity === 2) {
          path = continuation + operation.path;
        } else {
          path = continuation + (operation.key || operation.path);
        }
      } else {
        path = continuation;
      }
    } else {
      path = operation.path;
    }
    return path;
  };

  Operation.prototype.getQueryPath = function(operation, continuation) {
    if (continuation) {
      if (continuation.nodeType) {
        return this.engine.identity.provide(continuation) + ' ' + operation.path;
      } else if (operation.marked && operation.arity === 2) {
        return continuation + operation.path;
      } else {
        return continuation + (operation.key || operation.path);
      }
    } else {
      return operation.key;
    }
  };

  Operation.prototype.getSolution = function(operation, continuation, scope) {
    if (operation.def.serialized && (!operation.def.hidden || operation.parent.def.serialized)) {
      return this.engine.pairs.getSolution(operation, continuation, scope);
    }
  };

  Operation.prototype.getSelectors = function(operation) {
    var bit, bits, custom, groups, index, parent, paths, result, results, selectors, update, wrapped, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref,
      _this = this;
    parent = operation;
    results = wrapped = custom = void 0;
    while (parent) {
      if (parent.name === 'if') {
        if (parent.uid) {
          if (results) {
            for (index = _i = 0, _len = results.length; _i < _len; index = ++_i) {
              result = results[index];
              if (result.substring(0, 11) !== '[matches~="') {
                result = this.getCustomSelector(result);
              }
              results[index] = result.substring(0, 11) + parent.uid + this.engine.Continuation.DESCEND + result.substring(11);
            }
          }
        }
      } else if (parent.name === 'rule') {
        selectors = parent[1].path;
        if (parent[1][0] === ',') {
          paths = parent[1].slice(1).map(function(item) {
            return !item.marked && item.groupped || item.path;
          });
        } else {
          paths = [parent[1].path];
        }
        groups = (_ref = parent[1].groupped && parent[1].groupped.split(',')) != null ? _ref : paths;
        if (results != null ? results.length : void 0) {
          bits = selectors.split(',');
          update = [];
          for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
            result = results[_j];
            if (result.substring(0, 11) === '[matches~="') {
              update.push(result.substring(0, 11) + selectors + this.engine.Continuation.DESCEND + result.substring(11));
            } else {
              for (index = _k = 0, _len2 = bits.length; _k < _len2; index = ++_k) {
                bit = bits[index];
                if (groups[index] !== bit && '::this' + groups[index] !== paths[index]) {
                  if (result.substring(0, 6) === '::this') {
                    update.push(this.getCustomSelector(selectors) + result.substring(6));
                  } else {
                    update.push(this.getCustomSelector(selectors) + ' ' + result);
                  }
                } else {
                  if (result.substring(0, 6) === '::this') {
                    update.push(bit + result.substring(6));
                  } else {
                    update.push(bit + ' ' + result);
                  }
                }
              }
            }
          }
          results = update;
        } else {
          results = selectors.split(',').map(function(path, index) {
            if (path !== groups[index] && '::this' + groups[index] !== paths[index]) {
              return _this.getCustomSelector(selectors);
            } else {
              return path;
            }
          });
        }
      }
      parent = parent.parent;
    }
    for (index = _l = 0, _len3 = results.length; _l < _len3; index = ++_l) {
      result = results[index];
      if (result.substring(0, 6) === '::this') {
        results[index] = result.substring(6);
      }
      results[index] = results[index].replace(this.CleanupSelectorRegExp, '');
    }
    return results;
  };

  Operation.prototype.getCustomSelector = function(selector) {
    return '[matches~="' + selector.replace(/\s+/, this.engine.Continuation.DESCEND) + '"]';
  };

  Operation.prototype.infer = function(operation) {};

  Operation.prototype.analyze = function(operation, parent) {
    var child, def, func, index, mark, otherdef, _i, _len, _ref;
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
        operation.bound = parent;
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
    if (typeof def.onAnalyze === "function") {
      def.onAnalyze(operation);
    }
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (parent) {
      if (mark = operation.def.mark || operation.marked) {
        if (parent && !parent.def.capture) {
          parent.marked = mark;
        }
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

  Operation.prototype.toExpressionString = function(operation) {
    var klass, path, _ref;
    if (operation != null ? operation.push : void 0) {
      if (operation[0] === 'get') {
        path = this.engine.Variable.getPath(operation[1], operation[2]);
        if (this.engine.values[path.replace('[', '[intrinsic-')] != null) {
          klass = 'intrinsic';
        } else if (path.indexOf('"') > -1) {
          klass = 'virtual';
        } else if (operation[2] && operation[1]) {
          if (operation[2] === 'x' || operation[2] === 'y') {
            klass = 'position';
          } else if (!((_ref = this.engine.intrinsic.properties[operation[2]]) != null ? _ref.matcher : void 0)) {
            klass = 'local';
          }
        }
        return '<strong class="' + (klass || 'variable') + '" for="' + path + '" title="' + this.engine.values[path] + '">' + path + '</strong>';
      } else if (operation[0] === 'value') {
        return '<em>' + operation[1] + '</em>';
      }
      return this.toExpressionString(operation[1]) + ' <b>' + operation[0] + '</b> ' + this.toExpressionString(operation[2]);
    } else {
      return operation != null ? operation : '';
    }
  };

  Operation.prototype.serialize = function(operation, otherdef, group) {
    var after, before, binary, def, following, groupper, index, next, op, prefix, separator, suffix, tail, _i, _j, _ref, _ref1;
    def = operation.def;
    prefix = def.prefix || (otherdef != null ? otherdef.prefix : void 0) || (operation.def.noop && operation.name) || '';
    suffix = def.suffix || (otherdef != null ? otherdef.suffix : void 0) || '';
    if (separator = operation.def.separator) {
      if (group) {
        for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
          if (op = operation[index]) {
            if (op.path !== op.groupped) {
              return;
            }
          }
        }
      }
    }
    after = before = '';
    for (index = _j = 1, _ref1 = operation.length; 1 <= _ref1 ? _j < _ref1 : _j > _ref1; index = 1 <= _ref1 ? ++_j : --_j) {
      if (op = operation[index]) {
        if (typeof op !== 'object') {
          if (operation.def.binary && after && !binary) {
            after = op + after;
            binary = true;
          } else if (binary) {
            if (operation.def.quote) {
              after += '"' + op + '"';
            }
          } else {
            after += op;
          }
        } else if (op.key && group !== false) {
          if (group && (groupper = this.engine.methods[group])) {
            if (op.def.group === group) {
              following = index;
              next = void 0;
              while (next = operation[++following]) {
                if (next.def && (next.def.group !== group || next.marked !== op.marked)) {
                  group = false;
                  break;
                }
              }
              if (!next) {
                if (tail = op.tail || (op.tail = groupper.condition(op) && op)) {
                  operation.groupped = groupper.promise(op, operation);
                  tail.head = operation;
                  operation.tail = tail;
                  before += (before && separator || '') + op.groupped || op.key;
                } else {
                  continue;
                }
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

  return Operation;

})();

module.exports = Operation;
