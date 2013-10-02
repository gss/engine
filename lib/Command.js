/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Command, bindCache, bindRoot, checkCache, checkIntrinsics, getSuggestValueCommand, makeTemplateFromVarId, spawnCommands,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

bindCache = {};

checkCache = function(root, cacheKey) {
  var bind, binds, _i, _len, _results;
  binds = bindCache[cacheKey];
  if (binds != null) {
    _results = [];
    for (_i = 0, _len = binds.length; _i < _len; _i++) {
      bind = binds[_i];
      _results.push(bindRoot(root, bind));
    }
    return _results;
  }
};

bindRoot = function(root, query) {
  root._is_bound = true;
  if (root._binds == null) {
    root._binds = [];
  }
  if (root._binds.indexOf(query) === -1) {
    root._binds.push(query);
    if (query.isMulti) {
      if (root._binds.multi) {
        throw new Error("Multi el queries only allowed once per statement");
      }
      return root._binds.multi = query;
    }
  }
};

spawnCommands = function(root, engine, cacheKey) {
  var command, id, joiner, multiSplit, q, queries, ready, replaces, splitter, srcString, _i, _j, _len, _len1, _ref, _results;
  if (!root._is_bound) {
    return engine.registerCommand(root);
  } else {
    if (cacheKey) {
      bindCache[cacheKey] = root._binds;
    }
    queries = root._binds;
    srcString = JSON.stringify(root);
    replaces = {};
    ready = true;
    for (_i = 0, _len = queries.length; _i < _len; _i++) {
      q = queries[_i];
      if (q.ids.length < 0) {
        ready = false;
        break;
      }
      if (q !== queries.multi) {
        replaces[q.selector] = q.ids[0];
      }
    }
    if (ready) {
      if (queries.multi) {
        multiSplit = queries.multi.selector;
        _ref = queries.multi.ids;
        _results = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          id = _ref[_j];
          command = srcString.split("%%" + multiSplit + "%%");
          command = command.join("$" + id);
          for (splitter in replaces) {
            joiner = replaces[splitter];
            command = command.split("%%" + splitter + "%%");
            command = command.join("$" + joiner);
          }
          _results.push(engine.registerCommand(eval(command)));
        }
        return _results;
      } else {
        command = srcString;
        for (splitter in replaces) {
          joiner = replaces[splitter];
          command = command.split("%%" + splitter + "%%");
          command = command.join("$" + joiner);
        }
        return engine.registerCommand(eval(command));
      }
    }
  }
};

getSuggestValueCommand = function(gssId, prop, val) {
  return ['suggestvalue', ['get', "$" + gssId + "[" + prop + "]"], ['number', val]];
};

checkIntrinsics = function(root, engine, varId, prop, query) {
  var id, val, _i, _len, _ref, _results;
  if (query != null) {
    if (prop.indexOf("intrinsic-") === 0) {
      _ref = query.ids;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        val = engine.measureByGssId(id, prop.split("intrinsic-")[1]);
        _results.push(engine.registerCommand(getSuggestValueCommand(id, prop, val)));
      }
      return _results;
    }
  }
};

makeTemplateFromVarId = function(varId) {
  var templ, y;
  templ = varId;
  y = varId.split("[");
  if (y[0].length > 1) {
    y[y.length - 2] += "%%";
    templ = "%%" + y.join("[");
  }
  return templ;
};

Command = (function() {
  function Command(engine) {
    this['$id'] = __bind(this['$id'], this);
    this['$reserved'] = __bind(this['$reserved'], this);
    this['$tag'] = __bind(this['$tag'], this);
    this['$class'] = __bind(this['$class'], this);
    this['strength'] = __bind(this['strength'], this);
    this['stay'] = __bind(this['stay'], this);
    this['gt'] = __bind(this['gt'], this);
    this['lt'] = __bind(this['lt'], this);
    this['gte'] = __bind(this['gte'], this);
    this['lte'] = __bind(this['lte'], this);
    this['eq'] = __bind(this['eq'], this);
    this['get'] = __bind(this['get'], this);
    this['varexp'] = __bind(this['varexp'], this);
    this['var'] = __bind(this['var'], this);
    this.engine = engine;
  }

  Command.prototype['var'] = function(self, varId, prop, query) {
    self.splice(2, 10);
    self[1] = makeTemplateFromVarId(varId);
    if (self._is_bound) {
      self.push("%%" + query.selector + "%%");
    }
    spawnCommands(self, this.engine, varId);
    return checkIntrinsics(self, this.engine, varId, prop, query);
  };

  Command.prototype['varexp'] = function(self, varId, expression, zzz) {
    self.splice(3, 10);
    self[1] = makeTemplateFromVarId(varId);
    return spawnCommands(self, this.engine, varId);
  };

  Command.prototype['get'] = function(root, varId) {
    checkCache(root, varId);
    return ['get', makeTemplateFromVarId(varId)];
  };

  Command.prototype['number'] = function(root, num) {
    return ['number', num];
  };

  Command.prototype['plus'] = function(root, e1, e2) {
    return ['plus', e1, e2];
  };

  Command.prototype['minus'] = function(root, e1, e2) {
    return ['minus', e1, e2];
  };

  Command.prototype['multiply'] = function(root, e1, e2) {
    return ['multiply', e1, e2];
  };

  Command.prototype['divide'] = function(root, e1, e2, s, w) {
    return ['divide', e1, e2];
  };

  Command.prototype['eq'] = function(self, e1, e2, s, w) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['lte'] = function(self, e1, e2, s, w) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['gte'] = function(self, e1, e2, s, w) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['lt'] = function(self, e1, e2, s, w) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['gt'] = function(self, e1, e2, s, w) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['stay'] = function(self) {
    return spawnCommands(self, this.engine);
  };

  Command.prototype['strength'] = function(root, s) {
    return ['strength', s];
  };

  Command.prototype['$class'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery("." + sel, true, true, function() {
      return _this.engine.container.getElementsByClassName(sel);
    });
    bindRoot(root, query);
    return query;
  };

  Command.prototype['$tag'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery(sel, true, true, function() {
      return _this.engine.container.getElementsByTagName(sel);
    });
    bindRoot(root, query);
    return query;
  };

  Command.prototype['$reserved'] = function(root, sel) {
    return query;
  };

  Command.prototype['$id'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery("#" + sel, false, false, function() {
      var el;
      el = document.getElementById(sel);
      return [el];
    });
    bindRoot(root, query);
    return query;
  };

  return Command;

})();

module.exports = Command;
