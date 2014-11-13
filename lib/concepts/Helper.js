var Helper;

Helper = function(method, scoped, displayName) {
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

module.exports = Helper;
