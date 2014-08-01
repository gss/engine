var Method,
  __hasProp = {}.hasOwnProperty;

Method = function(method, reference) {
  var helper, key, value;
  if (!method) {
    return;
  }
  if (typeof method === 'object' && !method.exec) {
    helper = Method.Helper(method, false, reference);
    for (key in method) {
      value = method[key];
      helper[key] = value;
    }
    return helper;
  }
  method.displayName = reference;
  return method;
};

Method.Helper = function(method, scoped, displayName) {
  var func, helper;
  if (typeof method === 'function') {
    func = method;
  }
  helper = function(scope) {
    var args, context, fn, length;
    args = Array.prototype.slice.call(arguments, 0);
    length = arguments.length;
    if (scoped || method.serialized) {
      if (!(scope && scope.nodeType)) {
        scope = this.scope || document;
        if (typeof method[args.length] === 'string') {
          context = scope;
        } else {
          args.unshift(scope);
        }
      } else {
        if (typeof method[args.length - 1] === 'string') {
          context = scope = args.shift();
        }
      }
    }
    if (!(fn = func)) {
      if (typeof (func = method[args.length]) === 'function') {
        fn = func;
      } else {
        if (!(func && (fn = scope[func]))) {
          if (fn = this.methods[func]) {
            context = this;
          } else {
            fn = method.command;
            args = [null, args[2], null, null, args[0], args[1]];
          }
        }
      }
    }
    return fn.apply(context || this, args);
  };
  if (displayName) {
    helper.displayName = displayName;
  }
  return helper;
};

Method.compile = function(methods, engine) {
  var key, method, subkey;
  methods.engine || (methods.engine = engine);
  for (key in methods) {
    if (!__hasProp.call(methods, key)) continue;
    method = methods[key];
    if (method === engine) {
      continue;
    }
    if (key.charAt(0) !== '_') {
      subkey = '_' + key;
      method = this(method, subkey);
      if (engine[subkey] == null) {
        engine[subkey] = method;
      }
    }
    if (engine[key] == null) {
      engine[key] = method;
    }
  }
  return methods;
};

module.exports = Method;
