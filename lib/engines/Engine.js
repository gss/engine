var Engine;

Engine = (function() {
  Engine.prototype.Expressions = require('./Expressions.js');

  Engine.prototype.References = require('./References.js');

  function Engine() {
    this.expressions = new this.Expressions(this);
    this.references = new this.References(this);
    this.thread = new this.Thread(this);
  }

  Engine.prototype.execute = function(ast) {
    var command, _i, _len, _ref, _results;
    if (ast.commands != null) {
      _ref = ast.commands;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        if (ast.isRule) {
          command.parentRule = ast;
        }
        _results.push(this.evaluate(command));
      }
      return _results;
    }
  };

  Engine.prototype["return"] = function(command) {
    this.engine.registerCommand(command);
    return console.error('Command', command);
  };

  Engine.prototype.onRemove = function(continuation, value, id) {
    var child, index, path, result, watcher, watchers, _i, _j, _len, _len1;
    if (watchers = this.observer._watchers[id]) {
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 2) {
        watcher = watchers[index];
        if (!watcher) {
          continue;
        }
        path = (watchers[index + 1] || '') + watcher.path;
        watchers[index] = null;
        console.log('clean', id, '@', continuation);
        if (result = this.observer[path]) {
          delete this.observer[path];
          if (result.length !== void 0) {
            for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
              child = result[_j];
              this.references.remove(path, child, child._gss_id);
            }
          } else {
            this.references.remove(path, result, result._gss_id);
          }
        }
      }
      delete this.observer._watchers[id];
    }
    return this;
  };

  Engine.prototype.getObjectPath = function(continuation, object) {
    if (typeof object === 'string') {
      return object;
    }
    return continuation + this.getId(object);
  };

  return Engine;

})();

module.exports = Engine;
