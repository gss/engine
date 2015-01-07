var analyze, mutate, _analyze, _mutate,
  _this = this;

module.exports = function(ast) {
  var buffer;
  buffer = [
    {
      _parentScope: void 0,
      _childScopes: [],
      _unscopedVars: []
    }
  ];
  analyze(ast, buffer);
  mutate(buffer);
  return ast;
};

analyze = function(ast, buffer) {
  var node, _i, _len, _ref, _results;
  if (ast.commands != null) {
    _ref = ast.commands;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      _results.push(_analyze(node, buffer));
    }
    return _results;
  }
};

_analyze = function(node, buffer, bufferLengthMinus) {
  var currScope, i, isScope, name, parent, scope, sub, _i, _len, _ref;
  if (bufferLengthMinus == null) {
    bufferLengthMinus = 1;
  }
  isScope = false;
  name = node[0];
  if (name === 'rule') {
    node._isScope = true;
    scope = node;
    parent = buffer[buffer.length - 1];
    parent._childScopes.push(scope);
    scope._parentScope = parent;
    scope._childScopes = [];
    scope._unscopedVars = [];
    buffer.push(scope);
  } else if (name === 'get' || name === 'virtual') {
    currScope = buffer[buffer.length - bufferLengthMinus];
    if (currScope) {
      if (node.length === 2) {
        node._varKey = node.toString();
        currScope._unscopedVars.push(node);
      }
    }
  }
  _ref = node.slice(0, +node.length + 1 || 9e9);
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    sub = _ref[i];
    if (sub instanceof Array) {
      if (name === 'rule' && i === 1) {
        _analyze(sub, buffer, 2);
      } else {
        _analyze(sub, buffer, bufferLengthMinus);
      }
    }
  }
  if (node._isScope) {
    return buffer.pop();
  }
};

mutate = function(buffer) {
  var node, _i, _len, _ref, _results;
  _ref = buffer[0]._childScopes;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    _results.push(_mutate(node));
  }
  return _results;
};

_mutate = function(node) {
  var child, hoistLevel, hoister, level, parent, unscoped, upper_unscoped, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _results;
  _ref = node._childScopes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    child = _ref[_i];
    _mutate(child);
  }
  if (((_ref1 = node._unscopedVars) != null ? _ref1.length : void 0) > 0) {
    _ref2 = node._unscopedVars;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      unscoped = _ref2[_j];
      level = 0;
      hoistLevel = 0;
      parent = node._parentScope;
      while (parent) {
        level++;
        _ref3 = parent._unscopedVars;
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          upper_unscoped = _ref3[_k];
          if (upper_unscoped._varKey === unscoped._varKey) {
            hoistLevel = level;
          }
        }
        parent = parent._parentScope;
      }
      if (hoistLevel > 0) {
        if (unscoped[1][0] !== '^') {
          hoister = ['^'];
          if (hoistLevel > 1) {
            hoister.push(hoistLevel);
          }
          _results.push(unscoped.splice(1, 0, hoister));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  }
};
