/* 

Generate lookup structures to match methods by name and argument type signature

Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Value']['Number']`

A matched signature returns customized class for an operation that can further 
pick a sub-class dynamically. Signatures allows special case optimizations and 
composition to be coded as a structural composition, instead of branching in runtime.

Signatures are shared between commands. Dispatcher support css-style 
typed optional argument groups, but has no support for keywords yet
*/

var Command, Signatures;

Command = require('../concepts/Command');

Signatures = (function() {
  function Signatures(engine) {
    this.engine = engine;
  }

  Signatures.prototype.sign = function(command, storage, object, step) {
    var signature, signatures, _i, _len, _results;
    if (signature = object.signature) {
      return this.set(command, storage, signature, step);
    } else if (signatures = object.signatures) {
      _results = [];
      for (_i = 0, _len = signatures.length; _i < _len; _i++) {
        signature = signatures[_i];
        _results.push(this.set(command, storage, signature, step));
      }
      return _results;
    }
  };

  Signatures.prototype.permute = function(arg, permutation) {
    var group, i, index, j, keys, position, values, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2;
    keys = Object.keys(arg);
    if (!permutation) {
      return keys;
    }
    values = Object.keys(arg);
    group = [];
    for (index = _i = 0, _len = permutation.length; _i < _len; index = ++_i) {
      position = permutation[index];
      if (position !== null) {
        group[position] = keys[index];
      }
    }
    for (i = _j = _ref = permutation.length, _ref1 = keys.length; _j < _ref1; i = _j += 1) {
      for (j = _k = 0, _ref2 = keys.length; _k < _ref2; j = _k += 1) {
        if (group[j] == null) {
          group[j] = keys[i];
          break;
        }
      }
    }
    for (_l = 0, _len1 = group.length; _l < _len1; _l++) {
      arg = group[_l];
      if (arg === void 0) {
        return;
      }
    }
    return group;
  };

  Signatures.prototype.getPermutation = function(args, properties) {
    var arg, index, result, _i, _j, _len;
    result = [];
    for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
      arg = args[index];
      if (arg !== null) {
        result[arg] = properties[index];
      }
    }
    for (index = _j = result.length - 1; _j >= 0; index = _j += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Signatures.prototype.getPositions = function(args) {
    var arg, index, result, value, _i, _j, _len;
    result = [];
    for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
      value = args[index];
      if (value != null) {
        result[value] = index;
      }
    }
    for (index = _j = result.length - 1; _j >= 0; index = _j += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Signatures.prototype.getProperties = function(signature) {
    var a, arg, definition, properties, property, _i, _j, _len, _len1;
    if (properties = signature.properties) {
      return properties;
    }
    signature.properties = properties = [];
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      if (arg.push) {
        for (_j = 0, _len1 = arg.length; _j < _len1; _j++) {
          a = arg[_j];
          for (property in a) {
            definition = a[property];
            properties.push(definition);
          }
        }
      } else {
        for (property in arg) {
          definition = arg[property];
          properties.push(definition);
        }
      }
    }
    return properties;
  };

  Signatures.prototype.generate = function(combinations, command, storage, positions, properties, i) {
    var props, type, _i, _len, _ref, _results;
    if (i == null) {
      i = 0;
    }
    while ((props = properties[i]) === void 0 && i < properties.length) {
      i++;
    }
    if (i === properties.length) {
      if (storage.resolved) {
        return;
      }
      return storage.resolved = Command.extend.call(command, {
        permutation: positions
      });
    } else {
      _ref = properties[i];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        _results.push(this.generate(combinations, command, storage, positions, properties, i + 1));
      }
      return _results;
    }
  };

  Signatures.prototype.write = function(args, command, storage, positions, properties) {
    var combinations;
    combinations = [];
    this.generate(combinations, command, storage, positions, properties);
  };

  Signatures.prototype.apply = function(storage, signature) {
    var property, value;
    for (property in signature) {
      value = signature[property];
      if (typeof value === 'object') {
        this.apply(storage[property] || (storage[property] = {}), value);
      } else {
        storage[property] = value;
      }
    }
  };

  Signatures.prototype.set = function(command, storage, signature, args, permutation, types) {
    var arg, argument, group, i, j, k, keys, obj, property, proto, type, _i, _j, _k, _len, _len1, _ref, _ref1;
    if (!signature.push) {
      for (type in types) {
        if (proto = (_ref = command[type]) != null ? _ref.prototype : void 0) {
          this.sign(command[type], storage, proto);
        }
      }
      this.sign(command, storage, command.prototype);
      return;
    }
    args || (args = []);
    i = args.length;
    seeker: {;
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      if (arg.push) {
        for (k = _j = 0, _len1 = arg.length; _j < _len1; k = ++_j) {
          obj = arg[k];
          j = 0;
          group = arg;
          for (property in obj) {
            if (!i) {
              arg = obj;
              if (!(keys = this.permute(arg, permutation))) {
                return;
              }
              argument = arg[property];
              break seeker;
            }
            i--;
            j++;
          }
        }
      } else {
        j = void 0;
        for (property in arg) {
          if (!i) {
            argument = arg[property];
            break seeker;
          }
          i--;
        }
      }
    }
    };
    if (!argument) {
      this.write(args, command, storage, this.getPositions(args), this.getPermutation(args, this.getProperties(signature)));
      return;
    }
    if (keys && (j != null)) {
      permutation || (permutation = []);
      for (i = _k = 0, _ref1 = keys.length; _k < _ref1; i = _k += 1) {
        if (permutation.indexOf(i) === -1) {
          this.set(command, storage, signature, args.concat(args.length - j + i), permutation.concat(i));
        }
      }
      this.set(command, storage, signature, args.concat(null), permutation.concat(null));
      return;
    }
    return this.set(command, storage, signature, args.concat(args.length));
  };

  return Signatures;

})();

module.exports = Signatures;
