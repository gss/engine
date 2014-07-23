var Command;

Command = function(command, reference) {
  var helper, key, value;
  if (typeof command === 'object') {
    helper = this.Helper(command, false, reference);
    for (key in command) {
      value = command[key];
      helper[key] = value;
    }
    return helper;
  }
  command.displayName = reference;
  return command;
};

module.exports = Command;
