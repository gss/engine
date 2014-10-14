var Conventions;

Conventions = (function() {
  function Conventions() {}

  Conventions.prototype.ASCEND = String.fromCharCode(8593);

  Conventions.prototype.PAIR = String.fromCharCode(8594);

  Conventions.prototype.DESCEND = String.fromCharCode(8595);

  /* 
    <!-- Example of document -->
    <style id="my-stylesheet">
      (h1 !+ img)[width] == #header[width]
    </style>
    <header id="header">
      <img>
      <h1 id="h1"></h1>
    </header>
  
    <!-- Generated constraint key -->
    style$my-stylesheet   # my stylesheet
               ↓ h1$h1    # found heading
               ↑ !+img    # preceeded by image
               → #header  # bound to header element
  */


  Conventions.prototype.getContinuation = function(path, value, suffix) {
    if (suffix == null) {
      suffix = '';
    }
    if (path) {
      path = path.replace(this.TrimContinuationRegExp, '');
    }
    if (!path && !value) {
      return '';
    }
    return path + (value && this.identity.provide(value) || '') + suffix;
  };

  Conventions.prototype.TrimContinuationRegExp = new RegExp("[" + Conventions.prototype.ASCEND + Conventions.prototype.DESCEND + Conventions.prototype.PAIR + "]$");

  Conventions.prototype.getPossibleContinuations = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND];
  };

  Conventions.prototype.getPath = function(id, property) {
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      if (typeof id !== 'string') {
        if (id.nodeType) {
          id = this.identity.provide(id);
        } else {
          id = id.path;
        }
      }
      return id + '[' + property + ']';
    }
  };

  Conventions.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      if (object.isCollection) {
        return true;
      }
      switch (typeof object[0]) {
        case "object":
          return object[0].nodeType;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Conventions.prototype.getQueryPath = function(operation, continuation) {
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

  Conventions.prototype.getOperationSelectors = function(operation) {
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
              results[index] = result.substring(0, 11) + parent.uid + this.DESCEND + result.substring(11);
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
              update.push(result.substring(0, 11) + selectors + this.DESCEND + result.substring(11));
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

  Conventions.prototype.CleanupSelectorRegExp = new RegExp(Conventions.prototype.DESCEND + '::this', 'g');

  Conventions.prototype.getCustomSelector = function(selector) {
    return '[matches~="' + selector.replace(this.CustomizeRegExp, this.DESCEND) + '"]';
  };

  Conventions.prototype.CustomizeRegExp = /\s+/g;

  Conventions.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.getContinuation(continuation).split(this.DESCEND);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.replace(this.CanonicalizeRegExp, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Conventions.prototype.CanonicalizeRegExp = new RegExp("" + "([^" + Conventions.prototype.PAIR + "])" + "\\$[^" + Conventions.prototype.ASCEND + "]+" + "(?:" + Conventions.prototype.ASCEND + "|$)", "g");

  Conventions.prototype.getCanonicalSelector = function(selector) {
    selector = selector.trim();
    selector = selector.replace(this.CanonicalizeSelectorRegExp, ' ').replace(/\s+/g, this.engine.DESCEND).replace(this.CleanupSelectorRegExp, '');
    return selector;
  };

  Conventions.prototype.CanonicalizeSelectorRegExp = new RegExp("" + "[$][a-z0-9]+[" + Conventions.prototype.DESCEND + "]\s*", "gi");

  Conventions.prototype.getScopePath = function(scope, continuation) {
    var bits, id, index, last, path, prev;
    if (!continuation) {
      return '';
    }
    bits = continuation.split(this.DESCEND);
    if (scope && this.scope !== scope) {
      id = this.identity.provide(scope);
      prev = bits[bits.length - 2];
      if (prev && prev.substring(prev.length - id.length) !== id) {
        last = bits[bits.length - 1];
        if ((index = last.indexOf(id + this.ASCEND)) > -1) {
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length));
        }
      }
    }
    bits[bits.length - 1] = "";
    path = bits.join(this.DESCEND);
    if (continuation.charAt(0) === this.PAIR) {
      path = this.PAIR + path;
    }
    return path;
  };

  Conventions.prototype.getOperationSolution = function(operation, continuation, scope) {
    if (operation.def.serialized && (!operation.def.hidden || operation.parent.def.serialized)) {
      return this.pairs.getSolution(operation, continuation, scope);
    }
  };

  Conventions.prototype.getAscendingContinuation = function(continuation, item) {
    return this.engine.getContinuation(continuation, item, this.engine.ASCEND);
  };

  Conventions.prototype.getDescendingContinuation = function(operation, continuation, ascender) {
    var mark;
    if (ascender != null) {
      mark = operation.def.rule && ascender === 1 && this.engine.DESCEND || this.engine.PAIR;
      if (mark) {
        return this.engine.getContinuation(continuation, null, mark);
      } else {
        return continuation;
      }
    }
  };

  Conventions.prototype.getOperationPath = function(operation, continuation, scope) {
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

  Conventions.prototype.getContext = function(args, operation, scope, node) {
    var index, _ref;
    index = args[0].def && 4 || 0;
    if (args.length !== index && ((_ref = args[index]) != null ? _ref.nodeType : void 0)) {
      return args[index];
    }
    if (!operation.bound) {
      if (operation.def.serialized && operation[1].def && (args[index] != null)) {
        return args[index];
      }
      return this.scope;
    }
    return scope;
  };

  Conventions.prototype.getIntrinsicProperty = function(path) {
    var index, last, property;
    index = path.indexOf('intrinsic-');
    if (index > -1) {
      if ((last = path.indexOf(']', index)) === -1) {
        last = void 0;
      }
      return property = path.substring(index + 10, last);
    }
  };

  Conventions.prototype.isPrimitive = function(object) {
    if (typeof object === 'object') {
      return object.valueOf !== Object.prototype.valueOf;
    }
    return true;
  };

  Conventions.prototype.getOperationDomain = function(operation, domain) {
    var arg, _i, _len;
    if (typeof operation[0] === 'string') {
      if (!domain.methods[operation[0]]) {
        return this.linear.maybe();
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

  Conventions.prototype.getVariableDomain = function(operation, force, quick) {
    var cmd, constraint, d, domain, index, path, prefix, property, scope, variable, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if (operation.domain && !force) {
      return operation.domain;
    }
    _ref = variable = operation, cmd = _ref[0], scope = _ref[1], property = _ref[2];
    path = this.getPath(scope, property);
    if ((scope || path.indexOf('[') > -1) && property && (((_ref1 = this.intrinsic) != null ? _ref1.properties[path] : void 0) != null)) {
      domain = this.intrinsic;
    } else if (scope && property && ((_ref2 = this.intrinsic) != null ? _ref2.properties[property] : void 0) && !this.intrinsic.properties[property].matcher) {
      domain = this.intrinsic;
    } else {
      _ref3 = this.domains;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        d = _ref3[_i];
        if (d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path])) {
          domain = d;
          break;
        }
        if (d.substituted) {
          _ref4 = d.substituted;
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            constraint = _ref4[_j];
            if ((_ref5 = constraint.substitutions) != null ? _ref5[path] : void 0) {
              domain = d;
              break;
            }
          }
        }
      }
    }
    if (!domain) {
      if (property && (index = property.indexOf('-')) > -1) {
        prefix = property.substring(0, index);
        if ((domain = this[prefix])) {
          if (!(domain instanceof this.Domain)) {
            domain = void 0;
          }
        }
      }
      if (!domain) {
        if (!quick) {
          domain = this.linear.maybe();
        }
      }
    }
    if (variable && !force) {
      variable.domain = domain;
    }
    return domain;
  };

  Conventions.prototype.getWorkerURL = (function() {
    var scripts, src, _ref;
    if (typeof document !== "undefined" && document !== null) {
      scripts = document.getElementsByTagName('script');
      src = scripts[scripts.length - 1].src;
      if (((_ref = location.search) != null ? _ref.indexOf('log=0') : void 0) > -1) {
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0';
      }
    }
    return function(url) {
      return typeof url === 'string' && url || src;
    };
  })();

  Conventions.prototype.getRootOperation = function(operation, domain) {
    var parent, _ref, _ref1, _ref2;
    if (domain == null) {
      domain = operation.domain;
    }
    parent = operation;
    while (parent.parent && typeof parent.parent[0] === 'string' && (!parent.parent.def || (!parent.parent.def.noop && !parent.parent.def.capture && parent.domain === domain))) {
      parent = parent.parent;
    }
    while (!((_ref = parent.parent) != null ? (_ref1 = _ref.def) != null ? _ref1.capture : void 0 : void 0) && ((_ref2 = parent.parent) != null ? _ref2.domain : void 0) === parent.domain) {
      parent = parent.parent;
    }
    return parent;
  };

  return Conventions;

})();

this.require || (this.require = function(string) {
  var bits;
  if (string === 'cassowary') {
    return c;
  }
  bits = string.replace('', '').split('/');
  return this[bits[bits.length - 1]];
});

this.module || (this.module = {});

module.exports = Conventions;
