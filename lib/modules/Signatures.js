/* 

Generate lookup structures to match methods by name and argument type signature

Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Value']['Number']`

Dispatcher support css-style typed optional argument groups, but has no support for keywords yet
*/

var Signatures;

Signatures = (function() {
  function Signatures(engine) {
    this.engine = engine;
  }

  Signatures.prototype.sign = function(command, types, object, step) {
    var signature, signatures, _i, _len, _results;
    if (signature = object.signature) {
      return this.set(command, types, signature, step, 0);
    } else if (signatures = object.signatures) {
      _results = [];
      for (_i = 0, _len = signatures.length; _i < _len; _i++) {
        signature = signatures[_i];
        _results.push(this.set(command, types, signature, step, 0));
      }
      return _results;
    }
  };

  Signatures.prototype.permute = function(arg, permutation) {
    var group, i, index, j, keys, position, values, _i, _j, _k, _l, _len, _len1, _name, _ref, _ref1, _ref2;
    keys = Object.keys(arg);
    if (!permutation) {
      return keys;
    }
    values = Object.keys(arg);
    group = [];
    for (index = _i = 0, _len = permutation.length; _i < _len; index = ++_i) {
      position = permutation[index];
      if (position !== -1) {
        group[position] = keys[index];
      }
    }
    for (i = _j = _ref = permutation.length, _ref1 = keys.length; _j < _ref1; i = _j += 1) {
      for (j = _k = 0, _ref2 = keys.length; _k < _ref2; j = _k += 1) {
        group[_name = keys[j]] || (group[_name] = keys[j]);
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

  Signatures.prototype.isPermutable = function(group, property, keys) {
    var prop, type, types, value, _i, _len;
    types = group[property];
    for (prop in group) {
      value = group[prop];
      if (property === prop) {
        break;
      }
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        type = value[_i];
        if (types.indexOf(type) > -1) {
          if (keys.indexOf(prop) === -1) {
            return -1;
          } else {
            return 0;
          }
        }
      }
    }
    return 1;
  };

  Signatures.prototype.set = function(command, types, signature, method, index, permutation, shifts) {
    var arg, argument, group, i, j, k, keys, next, obj, permutable, property, type, _i, _j, _k, _l, _len, _len1, _len2, _ref, _results;
    if (!signature) {
      for (type in types) {
        if (command[type]) {
          this.sign(command, types, typed[type].prototype, method);
        }
      }
      this.sign(command, types, command, method);
      return;
    }
    i = index;
    seeker: {;
    for (_i = 0, _len = signature.length; _i < _len; _i++) {
      arg = signature[_i];
      if (arg.push) {
        for (k = _j = 0, _len1 = arg.length; _j < _len1; k = ++_j) {
          obj = arg[k];
          j = 0;
          group = arg;
          for (property in obj) {
            if (!--i) {
              if (!(keys = this.permute(arg, permutation))) {
                return;
              }
              arg = obj;
              argument = arg[property];
              break seeker;
            }
            j++;
          }
        }
      } else {
        j = void 0;
        for (property in arg) {
          if (!--i) {
            argument = arg[property];
            break seeker;
          }
        }
      }
    }
    };
    if (!argument) {
      step.resolved = command;
      return;
    }
    if (keys) {
      if (j != null) {
        permutation || (permutation = []);
        permutable = this.isPermutable(arg, property, keys);
        if (permutable > 0) {
          for (i = _k = 0, _ref = keys.length; _k < _ref; i = _k += 1) {
            if (i !== j && permutation.indexOf(i) === -1) {
              this.set(command, types, signature, step, index + 1, permutation.concat(i), shifts);
            }
          }
        }
        this.set(command, types, signature, step, index + 1, permutation.concat(-1), shifts);
        if (permutable < 0) {
          return;
        }
      } else {

      }
    }
    _results = [];
    for (_l = 0, _len2 = argument.length; _l < _len2; _l++) {
      type = argument[_l];
      next = step[type] = {};
      _results.push(this.set(command, types, signature, next, index + 1, permutation, shifts));
    }
    return _results;
  };

  return Signatures;

})();

module.exports = Signatures;
