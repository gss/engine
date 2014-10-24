var Command;

Command = function() {
  var arg, argument, command, i, _i, _len;
  for (i = _i = 0, _len = operation.length; _i < _len; i = ++_i) {
    argument = operation[i];
    if (argument != null ? argument.push : void 0) {
      arg = this.Command(argument, operation, i);
    }
  }
  if (typeof operation[0] === 'string') {
    command = this.engine.methods[operation[0]];
    if (typeof command === 'function') {
      return command = command.group && Command.wrap(operation) || new command(operation);
    }
  }
};

Command.wrap = function(operation) {
  var argument, i, _i, _ref, _ref1;
  for (i = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
    if (argument = operation[i]) {
      if ((_ref1 = argument.command) != null ? typeof _ref1.push === "function" ? _ref1.push(operation) : void 0 : void 0) {
        return argument.command;
      }
    }
  }
};
