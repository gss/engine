/* 

Generate lookup structures to match methods by name and argument type signature

Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Value']['Number']`

A matched signature returns customized class for an operation that can further 
pick a sub-class dynamically. Signatures allows special case optimizations and 
composition to be implemented structurally, instead of branching in runtime.

Signatures are shared between commands. Dispatcher support css-style 
typed optional argument groups, but has no support for keywords or repeating groups yet
*/

var Command, Signatures;

Command = require('../concepts/Command');

Signatures = (function() {
  function Signatures(engine) {
    this.engine = engine;
  }

  Signatures.prototype.sign = function(command, object) {
    var signature, signatures, signed, storage, _i, _len;
    if (signed = command.__super__.signed) {
      return signed;
    }
    command.__super__.signed = storage = [];
    if (signature = object.signature) {
      this.get(command, storage, signature);
    } else if (signatures = object.signatures) {
      for (_i = 0, _len = signatures.length; _i < _len; _i++) {
        signature = signatures[_i];
        this.get(command, storage, signature);
      }
    } else {
      storage.push(['default']);
    }
    return storage;
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

  Signatures.prototype.generate = function(combinations, positions, properties, combination) {
    var i, j, position, props, type, _i, _len, _ref;
    if (combination) {
      i = combination.length;
    } else {
      combination = [];
      combinations.push(combination);
      i = 0;
    }
    while ((props = properties[i]) === void 0 && i < properties.length) {
      i++;
    }
    if (i === properties.length) {
      console.error(properties, positions.slice());
      combination.push(positions);
    } else {
      _ref = properties[i];
      for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
        type = _ref[j];
        if (j === 0) {
          combination.push(type);
        } else {
          position = combinations.indexOf(combination);
          combination = combination.slice(0, i);
          combination.push(type);
          combinations.push(combination);
        }
        this.generate(combinations, positions, properties, combination);
      }
    }
    return combinations;
  };

  Signatures.prototype.write = function(command, storage, combination) {
    var arg, i, _i, _ref;
    for (i = _i = 0, _ref = combination.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if ((arg = combination[i]) === 'default') {
        storage.Default = command;
      } else {
        if (i < combination.length - 1) {
          storage = storage[arg] || (storage[arg] = {});
        } else {
          storage.resolved || (storage.resolved = Command.extend.call(command, {
            permutation: arg
          }));
        }
      }
    }
  };

  Signatures.prototype.set = function(property, command, types) {
    var callback, combination, storage, subcommand, type, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    storage = this[property] || (this[property] = {});
    for (type in types) {
      if (callback = (_ref = command.prototype) != null ? _ref[type] : void 0) {
        subcommand = types[type].extend(command.prototype);
        subcommand.command = callback;
        _ref1 = this.sign(subcommand, subcommand.prototype);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          combination = _ref1[_i];
          this.write(subcommand, storage, combination);
        }
      }
    }
    _ref2 = this.sign(command, command.prototype);
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      combination = _ref2[_j];
      this.write(command, storage, combination);
    }
  };

  Signatures.prototype.get = function(command, storage, signature, args, permutation) {
    var arg, argument, group, i, j, k, keys, obj, property, _i, _j, _k, _len, _len1, _ref;
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
      this.generate(storage, this.getPositions(args), this.getPermutation(args, this.getProperties(signature)));
      return;
    }
    if (keys && (j != null)) {
      permutation || (permutation = []);
      for (i = _k = 0, _ref = keys.length; _k < _ref; i = _k += 1) {
        if (permutation.indexOf(i) === -1) {
          this.get(command, storage, signature, args.concat(args.length - j + i), permutation.concat(i));
        }
      }
      this.get(command, storage, signature, args.concat(null), permutation.concat(null));
      return;
    }
    return this.get(command, storage, signature, args.concat(args.length));
  };

  return Signatures;

})();

module.exports = Signatures;
