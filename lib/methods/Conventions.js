var Conventions;

Conventions = (function() {
  function Conventions() {}

  Conventions.prototype.UP = '↑';

  Conventions.prototype.RIGHT = '→';

  Conventions.prototype.DOWN = '↓';

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
      path = path.replace(/[→↓↑]$/, '');
    }
    if (!path && !value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return path + (value && this.identity.provide(value) || '') + suffix;
  };

  Conventions.prototype.getPossibleContinuations = function(path) {
    return [path, path + this.UP, path + this.RIGHT, path + this.DOWN];
  };

  Conventions.prototype.getPath = function(id, property) {
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      return id + '[' + property + ']';
    }
  };

  Conventions.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
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
      } else {
        return continuation + operation.key;
      }
    } else {
      return operation.key;
    }
  };

  Conventions.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.getContinuation(continuation).split(this.DOWN);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.split(this.RIGHT).pop().replace(this.CanonicalizeRegExp, '');
    if (compact) {
      return last;
    }
    return bits.join(this.DOWN);
  };

  Conventions.prototype.CanonicalizeRegExp = /\$[^↑]+(?:↑|$)/g;

  Conventions.prototype.getScopePath = function(continuation) {
    var bits;
    bits = continuation.split(this.DOWN);
    bits[bits.length - 1] = "";
    return bits.join(this.DOWN);
  };

  Conventions.prototype.getOperationPath = function(operation, continuation) {
    if (continuation != null) {
      if (operation.def.serialized && !operation.def.hidden) {
        return continuation + (operation.key || operation.path);
      }
      return continuation;
    } else {
      return operation.path;
    }
  };

  Conventions.prototype.getContext = function(args, operation, scope, node) {
    var index, _ref;
    index = args[0].def && 4 || 0;
    if (args.length !== index && ((_ref = args[index]) != null ? _ref.nodeType : void 0)) {
      return args[index];
    }
    if (!operation.bound) {
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

  Conventions.prototype.getVariableDomain = function(operation) {
    var cmd, constraint, d, domain, index, path, prefix, property, scope, variable, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if (operation.domain) {
      return operation.domain;
    }
    _ref = variable = operation, cmd = _ref[0], scope = _ref[1], property = _ref[2];
    path = this.getPath(scope, property);
    if (scope && property && (((_ref1 = this.intrinsic) != null ? _ref1.properties[path] : void 0) != null)) {
      domain = this.intrinsic;
    } else {
      _ref2 = this.domains;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        d = _ref2[_i];
        if (d.values.hasOwnProperty(path)) {
          domain = d;
          break;
        }
        if (d.substituted) {
          _ref3 = d.substituted;
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            constraint = _ref3[_j];
            if ((_ref4 = constraint.substitutions) != null ? _ref4[path] : void 0) {
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
        if (scope && property && ((_ref5 = this.intrinsic) != null ? _ref5.properties[property] : void 0)) {
          domain = this.intrinsic.maybe();
        } else {
          domain = this.linear.maybe();
        }
      }
    }
    if (variable) {
      variable.domain = domain;
    }
    return domain;
  };

  Conventions.prototype.getWorkerURL = (function() {
    var scripts, src;
    if (typeof document !== "undefined" && document !== null) {
      scripts = document.getElementsByTagName('script');
      src = scripts[scripts.length - 1].src;
    }
    return function(url) {
      return typeof url === 'string' && url || src;
    };
  })();

  Conventions.prototype.getRootOperation = function(operation) {
    var parent;
    parent = operation;
    while (parent.parent && typeof parent.parent[0] === 'string' && (!parent.parent.def || (!parent.parent.def.noop && parent.domain === operation.domain))) {
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
