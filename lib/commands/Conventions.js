var Conventions;

Conventions = (function() {
  function Conventions() {}

  Conventions.prototype.getContinuation = function(path, value, suffix) {
    if (suffix == null) {
      suffix = '';
    }
    if (path) {
      path = path.replace(/[→↓↑]$/, '');
    }
    if (typeof value === 'string') {
      return value;
    }
    return path + (value && this.identify(value) || '') + suffix;
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
        return this.identify(continuation) + ' ' + operation.path;
      } else {
        return continuation + operation.key;
      }
    } else {
      return operation.key;
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
    var index, property;
    index = path.indexOf('[intrinsic-');
    if (index > -1) {
      return property = path.substring(index + 11, path.length - 1);
    }
  };

  Conventions.prototype.UP = '↑';

  Conventions.prototype.RIGHT = '→';

  Conventions.prototype.DOWN = '↓';

  return Conventions;

})();

module.exports = Conventions;
