var Wrapper;

Wrapper = function(node, args, result, operation, continuation, scope) {
  var arg, _i, _len;
  if (result instanceof c.Constraint || result instanceof c.Expression) {
    result = [result];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (arg instanceof c.Variable) {
        result.push(arg);
      }
      if (arg.paths) {
        result.push.apply(result, arg.paths);
        arg.paths = void 0;
      }
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
    method = constraints[property];
    if (method.length > 3) {
      (function(property, method) {
        return constraints[property] = function(left, right, strength, weight) {
          var overloaded, value;
          if (left.push) {
            overloaded = left = Wrapper(null, null, left);
          }
          if (right.push) {
            overloaded = right = Wrapper(null, null, right);
          }
          value = method.call(this, left, right, strength, weight);
          if (overloaded) {
            return Wrapper(null, [left, right], value);
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
