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
    var group, i, index, j, keys, position, values, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2;
    if ((permutation != null ? permutation.length : void 0) === 2) {
      debugger;
    }
    console.log(arg, permutation, 123);
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

  Signatures.prototype.set = function(command, types, signature, step, index, permutation, shifts) {
    var arg, argument, group, i, j, k, keys, next, obj, permutable, property, proto, type, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2;
    if (!signature) {
      for (type in types) {
        if (proto = (_ref = command[type]) != null ? _ref.prototype : void 0) {
          this.sign(command[type], types, proto, step);
        }
      }
      this.sign(command, types, command.prototype, step);
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
      step.resolved = command;
      return;
    }
    if (keys) {
      if (j != null) {
        permutation || (permutation = []);
        permutable = this.isPermutable(arg, property, keys);
        if (permutable >= 0) {
          for (i = _k = 0, _ref1 = keys.length; _k < _ref1; i = _k += 1) {
            if (permutation.indexOf(i) === -1) {
              if (permutable > 0 || i === index) {
                _ref2 = arg[keys[index]];
                for (_l = 0, _len2 = _ref2.length; _l < _len2; _l++) {
                  type = _ref2[_l];
                  next = step[type] || (step[type] = {});
                  this.set(command, types, signature, next, index + 1, permutation.concat(i), shifts);
                }
              }
            }
          }
        }
        this.set(command, types, signature, step, index + 1, permutation.concat(-1), shifts);
        return;
      }
    }
    for (_m = 0, _len3 = argument.length; _m < _len3; _m++) {
      type = argument[_m];
      next = step[type] || (step[type] = {});
      this.set(command, types, signature, next, index + 1, permutation, shifts);
    }
    return this;
  };

  return Signatures;

})();

module.exports = Signatures;
