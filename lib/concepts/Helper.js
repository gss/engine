var Helper;

Helper = function(command, scoped, displayName) {
  var func, helper;
  if (displayName === '_get') {
    debugger;
  }
  if (typeof command === 'function') {
    func = command;
  }
  helper = function(scope) {
    var args, context, fn, length, method;
    args = Array.prototype.slice.call(arguments, 0);
    length = arguments.length;
    if (scoped || command.serialized) {
      if (!(scope && scope.nodeType)) {
        scope = this.scope || document;
        if (typeof command[args.length] === 'string') {
          context = scope;
        } else {
          args.unshift(scope);
        }
      } else {
        if (typeof command[args.length - 1] === 'string') {
          context = scope = args.shift();
        }
      }
    }
    if (!(fn = func)) {
      if (typeof (method = command[args.length]) === 'function') {
        fn = method;
      } else {
        if (!(method && (fn = scope[method]))) {
          if (fn = this.commands[method]) {
            context = this;
          } else {
            fn = command.command;
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
