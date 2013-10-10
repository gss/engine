/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Command, bindCache, bindRoot, checkCache, checkIntrinsics, getSuggestValueCommand, makeTemplateFromVarId, _templateVarIdCache,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

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
    root._boundSelectors = [];
  }
  if (root._binds.indexOf(query) === -1) {
    root._binds.push(query);
    root._boundSelectors.push(query.selector);
    if (query.isMulti) {
      if (root._binds.multi) {
        throw new Error("Multi el queries only allowed once per statement");
      }
      return root._binds.multi = query;
    }
  }
};

getSuggestValueCommand = function(gssId, prop, val, selector) {
  return ['suggest', ['get', "$" + gssId + "[" + prop + "]", "" + selector + "$" + gssId], ['number', val]];
};

checkIntrinsics = function(root, engine, varId, prop, query) {
  var id, val, _i, _len, _ref, _results;
  if (query != null) {
    if (prop.indexOf("intrinsic-") === 0) {
      _ref = query.lastAddedIds;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        val = engine.measureByGssId(id, prop.split("intrinsic-")[1]);
        _results.push(engine.registerCommand(getSuggestValueCommand(id, prop, val, query.selector)));
      }
      return _results;
    }
  }
};

_templateVarIdCache = {
  "::window[width]": "::window[width]",
  "::window[height]": "::window[height]",
  "::window[x]": "::window[x]",
  "::window[y]": "::window[y]",
  "::window[center-x]": "::window[center-x]",
  "::window[center-y]": "::window[center-y]"
};

window._templateVarIdCache = _templateVarIdCache;

makeTemplateFromVarId = function(varId) {
  var templ, y;
  if (_templateVarIdCache[varId]) {
    return _templateVarIdCache[varId];
  }
  templ = varId;
  y = varId.split("[");
  if (y[0].length > 1) {
    y[y.length - 2] += "%%";
    templ = "%%" + y.join("[");
    _templateVarIdCache[varId] = templ;
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
    this._execute = __bind(this._execute, this);
    this.spawnableRoots = [];
    this.boundWindowProps = [];
    this.engine = engine;
  }

  Command.prototype.execute = function(commands) {
    var command, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      _results.push(this._execute(command, command));
    }
    return _results;
  };

  Command.prototype._execute = function(command, root) {
    var func, i, node, sub, _i, _len, _ref;
    node = command;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Engine Commands broke, couldn't find method: " + node[0]);
    }
    _ref = node.slice(1, +node.length + 1 || 9e9);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      sub = _ref[i];
      if (sub instanceof Array) {
        node.splice(i + 1, 1, this._execute(sub, root));
      }
    }
    return func.call.apply(func, [this.engine, root].concat(__slice.call(node.slice(1, node.length))));
  };

  Command.prototype.teardown = function() {
    if (!this._bound_to_window_resize) {
      return window.removeEventListener("resize", this.spawnForWindowSize, false);
    }
  };

  Command.prototype._bound_to_window_resize = false;

  Command.prototype.spawnForWindowWidth = function() {
    return this.engine.registerCommand(['suggest', ['get', "::window[width]"], ['number', window.outerWidth]]);
  };

  Command.prototype.spawnForWindowHeight = function() {
    return this.engine.registerCommand(['suggest', ['get', "::window[height]"], ['number', window.outerHeight]]);
  };

  Command.prototype.spawnForWindowSize = function() {
    if (this._bound_to_window_resize) {
      if (this.boundWindowProps.indexOf('width') !== -1) {
        this.spawnForWindowWidth();
      }
      if (this.boundWindowProps.indexOf('height') !== -1) {
        return this.spawnForWindowHeight();
      }
    }
  };

  Command.prototype.bindToWindow = function(prop) {
    if (this.boundWindowProps.indexOf(prop) === -1) {
      this.boundWindowProps.push(prop);
    }
    if (prop === 'width' || prop === 'height') {
      if (prop === 'width') {
        this.spawnForWindowWidth();
      } else {
        this.spawnForWindowHeight();
      }
      if (!this._bound_to_window_resize) {
        window.addEventListener("resize", this.spawnForWindowSize, false);
        return this._bound_to_window_resize = true;
      }
    } else if (prop === 'x') {
      return this.engine.registerCommand(['eq', ['get', '::window[x]'], ['number', 0], 'required']);
    } else if (prop === 'y') {
      return this.engine.registerCommand(['eq', ['get', '::window[y]'], ['number', 0], 'required']);
    }
  };

  Command.prototype.registerSpawn = function(root, varid, prop, intrinsicQuery, checkInstrinsics) {
    if (!root._is_bound) {
      return this.engine.registerCommand(root);
    } else {
      if (varid) {
        bindCache[varid] = root._binds;
      }
      root._template = JSON.stringify(root);
      root._varid = varid;
      root._prop = prop;
      root._checkInstrinsics = checkInstrinsics;
      root._intrinsicQuery = intrinsicQuery;
      this.spawnableRoots.push(root);
      return this.spawn(root);
    }
  };

  Command.prototype.handleRemoves = function(removes) {
    this.engine.registerCommand(['remove'].concat(__slice.call(removes)));
    return this;
  };

  Command.prototype.handleAddsToSelectors = function(selectorsWithAdds) {
    var boundSelector, root, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.spawnableRoots;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      root = _ref[_i];
      _ref1 = root._boundSelectors;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        boundSelector = _ref1[_j];
        if (selectorsWithAdds.indexOf(boundSelector) !== -1) {
          this.spawn(root);
          break;
        }
      }
    }
    return this;
  };

  Command.prototype.spawn = function(root) {
    var command, id, joiner, prop, q, queries, ready, replaces, rootString, splitter, template, val, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
    queries = root._binds;
    rootString = root._template;
    replaces = {};
    ready = true;
    for (_i = 0, _len = queries.length; _i < _len; _i++) {
      q = queries[_i];
      if (q.lastAddedIds.length < 0) {
        ready = false;
        break;
      }
      if (q !== queries.multi) {
        replaces[q.selector] = q.lastAddedIds[0];
      }
    }
    if (ready) {
      if (queries.multi) {
        template = rootString.split("%%" + queries.multi.selector + "%%");
        _ref = queries.multi.lastAddedIds;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          id = _ref[_j];
          command = template.join("$" + id);
          for (splitter in replaces) {
            joiner = replaces[splitter];
            command = command.split("%%" + splitter + "%%");
            command = command.join("$" + joiner);
          }
          this.engine.registerCommand(eval(command));
        }
      } else {
        command = rootString;
        for (splitter in replaces) {
          joiner = replaces[splitter];
          command = command.split("%%" + splitter + "%%");
          command = command.join("$" + joiner);
        }
        this.engine.registerCommand(eval(command));
      }
    }
    if (root._checkInstrinsics && (root._intrinsicQuery != null)) {
      prop = root._prop;
      if (prop.indexOf("intrinsic-") === 0) {
        _ref1 = root._intrinsicQuery.lastAddedIds;
        _results = [];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          id = _ref1[_k];
          val = this.engine.measureByGssId(id, prop.split("intrinsic-")[1]);
          _results.push(this.engine.registerCommand(getSuggestValueCommand(id, prop, val, root._intrinsicQuery.selector)));
        }
        return _results;
      }
    }
  };

  Command.prototype['var'] = function(self, varId, prop, query) {
    self.splice(2, 10);
    if (self._is_bound) {
      self[1] = makeTemplateFromVarId(varId);
      self.push("%%" + query.selector + "%%");
    }
    this.registerSpawn(self, varId, prop, query, true);
    if (query === 'window') {
      this.bindToWindow(prop);
      return query = null;
    }
  };

  Command.prototype['varexp'] = function(self, varId, expression, zzz) {
    self.splice(3, 10);
    self[1] = makeTemplateFromVarId(varId);
    return this.registerSpawn(self, varId);
  };

  Command.prototype['get'] = function(root, varId, tracker) {
    checkCache(root, varId);
    if (tracker && tracker !== "::window") {
      return ['get', makeTemplateFromVarId(varId), tracker + "%%" + tracker + "%%"];
    } else {
      return ['get', makeTemplateFromVarId(varId)];
    }
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
    return this.registerSpawn(self);
  };

  Command.prototype['lte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Command.prototype['gte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Command.prototype['lt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Command.prototype['gt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Command.prototype['stay'] = function(self) {
    return this.registerSpawn(self);
  };

  Command.prototype['strength'] = function(root, s) {
    return ['strength', s];
  };

  Command.prototype['$class'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery({
      selector: "." + sel,
      isMulti: true,
      isLive: true,
      createNodeList: function() {
        return _this.engine.container.getElementsByClassName(sel);
      }
    });
    bindRoot(root, query);
    return query;
  };

  Command.prototype['$tag'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery({
      selector: sel,
      isMulti: true,
      isLive: true,
      createNodeList: function() {
        return _this.engine.container.getElementsByTagName(sel);
      }
    });
    bindRoot(root, query);
    return query;
  };

  Command.prototype['$reserved'] = function(root, sel) {
    var query;
    query = null;
    if (sel === 'window') {
      return 'window';
    } else {
      throw new Error("$reserved selectors not yet handled: " + sel);
    }
    return query;
  };

  Command.prototype['$id'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery({
      selector: "#" + sel,
      isMulti: false,
      isLive: false,
      createNodeList: function() {
        var el;
        el = document.getElementById(sel);
        return [el];
      }
    });
    bindRoot(root, query);
    return query;
  };

  return Command;

})();

module.exports = Command;
