/* 

# # Conventions
# 
# Okay what's the deal with those → ↓ ↑ arrows? 
# Open your mind and think beyond this Unicode madness. 
# 
# Dynamic systems need to be able to clean up side effects
# Instead of linking things together, we are use a tracking system
# that generates determenistic unique string keys
# that are used for multiple purposes.

↑  Caching, e.g. to jump to results of dom query,
   or to figure out which element in that collection 
   called this function (↑)

→  Linking, that allows lazy evaluation, by making arguments
   depend on previously resolved arguments,
   e.g. for plural binding or to generate unique argument signature

↓  Nesting, as a way for expressions to own side effects,
   e.g. to remove stylesheet, css rule or conditional branch

# These arrows are delimeters that combined together 
# enable bottom-up evaluation and continuations
# without leaving any state behind. 
# Continuations without explicit state.
# 
# It's a lot easier to clean up stateless systems. 
# Whenever a string key is set to be cleaned up,
# it broadcasts that intent to all subsystems, 
# like constraint solver, dom observer, etc.
# So they can clean up things related to that key
# by triggering more remove commands for known sub-keys.
# 
# This removal cascade allows components to have strict
# and arbitarily deep hierarchy, without knowing of it.

    style$my-stylesheet   # my stylesheet
               ↓ h1$h1    # found heading
               ↑ !+img    # preceeded by image
               → #header  # bound to header element

    <style id="my-stylesheet">
      (h1 !+ img)[width] == #header[width]
    </style>
    <header id="header">
      <img>
      <h1 id="h1"></h1>
    </header>

.
*/

var Conventions;

this.require || (this.require = function(string) {
  var bits;
  if (string === 'cassowary') {
    return c;
  }
  bits = string.replace('', '').split('/');
  return this[bits[bits.length - 1]];
});

this.module || (this.module = {});

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

  Conventions.prototype.forkMarkRegExp = /\$[^↑]+(?:↑|$)/g;

  Conventions.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.getContinuation(continuation).split(this.DOWN);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.split(this.RIGHT).pop().replace(this.forkMarkRegExp, '');
    if (compact) {
      return last;
    }
    return bits.join(this.DOWN);
  };

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

  Conventions.prototype.UP = '↑';

  Conventions.prototype.RIGHT = '→';

  Conventions.prototype.DOWN = '↓';

  return Conventions;

})();

module.exports = Conventions;
