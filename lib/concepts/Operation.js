var Operation,
  __hasProp = {}.hasOwnProperty;

Operation = (function() {
  function Operation(engine) {
    if (!engine) {
      return Array.prototype.slice.call(arguments);
    }
    this.engine = engine;
    this.CleanupSelectorRegExp = new RegExp(this.engine.DESCEND + '::this', 'g');
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
        delete exps[prop];
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

  Operation.prototype.getRoot = function(operation, domain) {
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
        return this.identity.provide(continuation) + ' ' + operation.path;
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
              results[index] = result.substring(0, 11) + parent.uid + this.engine.DESCEND + result.substring(11);
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
              update.push(result.substring(0, 11) + selectors + this.engine.DESCEND + result.substring(11));
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
    return '[matches~="' + selector.replace(/\s+/, this.engine.DESCEND) + '"]';
  };

  return Operation;

})();

module.exports = Operation;
