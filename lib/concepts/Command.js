var Command;

Command = function(command, reference) {
  var helper, key, value;
  if (typeof command === 'object' && !command.exec) {
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

Command.compile = function(commands, engine) {
  var command, key, subkey, _results;
  commands.engine || (commands.engine = engine);
  _results = [];
  for (key in commands) {
    command = commands[key];
    if (command === engine || !commands.hasOwnProperty(key)) {
      continue;
    }
    if (key.charAt(0) !== '_') {
      subkey = '_' + key;
      command = this(command, subkey);
      if (engine[subkey] == null) {
        engine[subkey] = command;
      }
    }
    _results.push(engine[key] != null ? engine[key] : engine[key] = command);
  }
  return _results;
};

module.exports = Command;
