var Selector;

Selector = function(operation) {
  if (!(this instanceof Selector)) {
    return this.Command.wrap(operation) || new this.Selector(operation);
  }
};

[
  [
    {
      context: ['Node']
    }
  ], {
    qualifier: ['String']
  }, [
    {
      operation: ['String'],
      query: ['String']
    }
  ]
];

Selector.prototype.push = function(operation) {
  var cmd, command, group, i, _i, _j, _ref, _ref1, _ref2, _ref3;
  if (!(group = this.group)) {
    return;
  }
  if (!(command = this.engine.methods[operation[0]])) {
    return;
  }
  if (command.group !== group) {
    return;
  }
  for (i = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
    if (cmd = (_ref1 = operation[i]) != null ? _ref1.command : void 0) {
      if (cmd.group !== group) {
        return;
      }
    }
  }
  for (i = _j = 1, _ref2 = operation.length; 1 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 1 <= _ref2 ? ++_j : --_j) {
    if (cmd = (_ref3 = operation[i]) != null ? _ref3.command : void 0) {
      this.merge(cmd);
    }
  }
  this.merge(command, operation);
  return this;
};

Selector.prototype.merge = function(command, operation) {
  if (command === this) {
    return;
  }
  if (operation) {
    this.tail = operation;
    return this.key += this.serialize(command, operation);
  } else {
    return this.key += this.separator + command.key;
  }
};

Selector.prototype.serialize = function(command, operation) {
  var argument, index, string, _i, _ref;
  if (command.prefix) {
    string = command.prefix;
  } else {
    string = operation[0];
  }
  for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
    if (argument = operation[index]) {
      if (command = argument.command) {
        string += command.key;
      } else {
        string += argument;
      }
    }
  }
  if (command.suffix) {
    string += suffix;
  }
  return string;
};

Selector.prototype.prepare = function(operation) {
  var group, index, prefix, _base;
  prefix = ((parent && operation.name !== ' ') || (operation[0] !== '$combinator' && typeof operation[1] !== 'object')) && ' ' || '';
  switch (operation[0]) {
    case '$tag':
      if ((!parent || operation === operation.tail) && operation[1][0] !== '$combinator') {
        group = ' ';
        index = (operation[2] || operation[1]).toUpperCase();
      }
      break;
    case '$combinator':
      group = prefix + operation.name;
      index = operation.parent.name === "$tag" && operation.parent[2].toUpperCase() || "*";
      break;
    case '$class':
    case '$pseudo':
    case '$attribute':
    case '$id':
      group = prefix + operation[0];
      index = operation[2] || operation[1];
  }
  if (!group) {
    return;
  }
  return ((_base = (this[group] || (this[group] = {})))[index] || (_base[index] = [])).push(operation);
};

Selector.prototype.separator = ',';

Selector.prototype.scoped = void 0;

Selector.prototype.key = void 0;

Selector.prototype.path = void 0;

Selector.prototype.tail = void 0;

Selector.prototype.head = void 0;

Selector.prototype.singular = void 0;
