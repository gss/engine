var Wrapper,
  __hasProp = {}.hasOwnProperty;

Wrapper = function(node, args, result, operation, continuation, scope) {
  var arg, index, offset, path, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
  if (this.isConstraint(result) || this.isExpression(result) || this.isVariable(result)) {
    if (!this.isVariable(result)) {
      result.operation = operation;
    }
    result = [result];
    offset = +(typeof operation[0] === 'string');
    for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
      arg = args[index];
      if (((_ref = operation[index + offset]) != null ? _ref[0] : void 0) === 'value') {
        result.push(operation[index + offset]);
      }
      if (this.isVariable(arg)) {
        result.push(arg);
      }
      if (arg.paths) {
        _ref1 = arg.paths;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          path = _ref1[_j];
          if (result.indexOf(path) === -1) {
            result.push(path);
          }
        }
      }
    }
    for (_k = 0, _len2 = args.length; _k < _len2; _k++) {
      arg = args[_k];
      arg.paths = void 0;
    }
  }
  if (result.length > 0) {
    if (result.length > 1) {
      result[0].paths = result.splice(1);
    }
    return result[0];
  }
  return result;
};

Wrapper.compile = function(constraints, engine, methods) {
  var method, property, _results;
  _results = [];
  for (property in constraints) {
    if (!__hasProp.call(constraints, property)) continue;
    method = constraints[property];
    if (method.length > 3) {
      (function(property, method) {
        return constraints[property] = function(left, right, strength, weight) {
          var overloaded, value;
          if (left.push) {
            overloaded = left = this.Wrapper(null, null, left);
          }
          if (right.push) {
            overloaded = right = this.Wrapper(null, null, right);
          }
          value = method.call(this, left, right, strength, weight);
          if (overloaded) {
            return this.Wrapper(null, [left, right], value);
          }
          return value;
        };
      })(property, method);
    } else {
      (methods || (methods = {}))[property] = method;
    }
    _results.push(constraints[property].after = 'Wrapper');
  }
  return _results;
};

module.exports = Wrapper;
