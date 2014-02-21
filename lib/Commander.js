/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Commander, bindRoot, bindRootAsContext, bindRootAsMulti,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

bindRoot = function(root, query) {
  root.isQueryBound = true;
  if (!root.queries) {
    root.queries = [query];
  } else if (root.queries.indexOf(query) === -1) {
    root.queries.push(query);
  }
  return root;
};

bindRootAsMulti = function(root, query) {
  bindRoot(root, query);
  if (root.queries.multi && root.queries.multi !== query) {
    throw new Error("bindRoot:: only one multiquery per statement");
  }
  return root.queries.multi = query;
};

bindRootAsContext = function(root, query) {
  bindRoot(root, query);
  return root.isContextBound = true;
};

Commander = (function() {
  function Commander(engine) {
    this.engine = engine;
    this['js'] = __bind(this['js'], this);
    this['for-all'] = __bind(this['for-all'], this);
    this['for-each'] = __bind(this['for-each'], this);
    this._e_for_chain = __bind(this._e_for_chain, this);
    this._chainer_math = __bind(this._chainer_math, this);
    this['divide-chain'] = __bind(this['divide-chain'], this);
    this['multiply-chain'] = __bind(this['multiply-chain'], this);
    this['minus-chain'] = __bind(this['minus-chain'], this);
    this['plus-chain'] = __bind(this['plus-chain'], this);
    this._chainer = __bind(this._chainer, this);
    this['gt-chain'] = __bind(this['gt-chain'], this);
    this['lt-chain'] = __bind(this['lt-chain'], this);
    this['gte-chain'] = __bind(this['gte-chain'], this);
    this['lte-chain'] = __bind(this['lte-chain'], this);
    this['eq-chain'] = __bind(this['eq-chain'], this);
    this['chain'] = __bind(this['chain'], this);
    this['$reserved'] = __bind(this['$reserved'], this);
    this['$id'] = __bind(this['$id'], this);
    this['$tag'] = __bind(this['$tag'], this);
    this['$class'] = __bind(this['$class'], this);
    this['stay'] = __bind(this['stay'], this);
    this['gt'] = __bind(this['gt'], this);
    this['lt'] = __bind(this['lt'], this);
    this['gte'] = __bind(this['gte'], this);
    this['lte'] = __bind(this['lte'], this);
    this['eq'] = __bind(this['eq'], this);
    this['suggest'] = __bind(this['suggest'], this);
    this['strength'] = __bind(this['strength'], this);
    this["||"] = __bind(this["||"], this);
    this["&&"] = __bind(this["&&"], this);
    this["?<"] = __bind(this["?<"], this);
    this["?>"] = __bind(this["?>"], this);
    this["?!="] = __bind(this["?!="], this);
    this["?=="] = __bind(this["?=="], this);
    this["?<="] = __bind(this["?<="], this);
    this["?>="] = __bind(this["?>="], this);
    this["clause"] = __bind(this["clause"], this);
    this["where"] = __bind(this["where"], this);
    this["cond"] = __bind(this["cond"], this);
    this['divide'] = __bind(this['divide'], this);
    this['multiply'] = __bind(this['multiply'], this);
    this['minus'] = __bind(this['minus'], this);
    this['plus'] = __bind(this['plus'], this);
    this['_get$'] = __bind(this['_get$'], this);
    this['get$'] = __bind(this['get$'], this);
    this['get'] = __bind(this['get'], this);
    this.spawnForWindowSize = __bind(this.spawnForWindowSize, this);
    this._execute = __bind(this._execute, this);
    this.lazySpawnForWindowSize = GSS._.debounce(this.spawnForWindowSize, GSS.config.resizeDebounce, false);
    this.cleanVars();
  }

  Commander.prototype.clean = function() {
    this.cleanVars();
    return this.unlisten();
  };

  Commander.prototype.cleanVars = function() {
    this.spawnableRoots = [];
    this.intrinsicRegistersById = {};
    this.boundWindowProps = [];
    this.get$cache = {};
    return this.queryCommandCache = {};
  };

  Commander.prototype.destroy = function() {
    this.spawnableRoots = null;
    this.intrinsicRegistersById = null;
    this.boundWindowProps = null;
    this.get$cache = null;
    this.queryCommandCache = null;
    return this.unlisten();
  };

  Commander.prototype.execute = function(ast) {
    var command, _i, _len, _ref, _results;
    if (ast.commands != null) {
      _ref = ast.commands;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        if (ast.isRule) {
          command.parentRule = ast;
        }
        _results.push(this._execute(command, command));
      }
      return _results;
    }
    /*
    if ast.rules?
      for rule in ast.rules
        @execute rule
    */

  };

  Commander.prototype._execute = function(command, root) {
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

  Commander.prototype.unlisten = function() {
    if (!this._bound_to_window_resize) {
      window.removeEventListener("resize", this.lazySpawnForWindowSize, false);
    }
    return this._bound_to_window_resize = false;
  };

  Commander.prototype._bound_to_window_resize = false;

  Commander.prototype.spawnForWindowWidth = function() {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    if (this.engine.vars["::window[width]"] !== w) {
      return this.engine.registerCommand(['suggest', ['get', "::window[width]"], ['number', w], 'required']);
    }
  };

  Commander.prototype.spawnForWindowHeight = function() {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    if (this.engine.vars["::window[height]"] !== h) {
      return this.engine.registerCommand(['suggest', ['get', "::window[height]"], ['number', h], 'required']);
    }
  };

  Commander.prototype.spawnForWindowSize = function() {
    if (this._bound_to_window_resize) {
      if (this.boundWindowProps.indexOf('width') !== -1) {
        this.spawnForWindowWidth();
      }
      if (this.boundWindowProps.indexOf('height') !== -1) {
        this.spawnForWindowHeight();
      }
      return this.engine.solve();
    }
  };

  Commander.prototype.bindToWindow = function(prop) {
    if (prop === "center-x") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[center-x]'], ['divide', ['get', '::window[width]'], 2], 'required']);
      return null;
    } else if (prop === "right") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[right]'], ['get', '::window[width]'], 'required']);
      return null;
    } else if (prop === "center-y") {
      this.bindToWindow("height");
      this.engine.registerCommand(['eq', ['get', '::window[center-y]'], ['divide', ['get', '::window[height]'], 2], 'required']);
      return null;
    } else if (prop === "bottom") {
      this.bindToWindow("width");
      this.engine.registerCommand(['eq', ['get', '::window[bottom]'], ['get', '::window[height]'], 'required']);
      return null;
    }
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
        window.addEventListener("resize", this.lazySpawnForWindowSize, false);
        return this._bound_to_window_resize = true;
      }
    } else if (prop === 'x') {
      return this.engine.registerCommand(['eq', ['get', '::window[x]'], ['number', 0], 'required']);
    } else if (prop === 'y') {
      return this.engine.registerCommand(['eq', ['get', '::window[y]'], ['number', 0], 'required']);
    }
  };

  Commander.prototype.spawnForScope = function(prop) {
    var key, thisEngine;
    key = "$" + this.engine.id + ("[" + prop + "]");
    thisEngine = this.engine;
    return GSS.on("engine:beforeDisplay", function(engine) {
      var val;
      val = engine.vars[key];
      if (val != null) {
        if (thisEngine.isDescendantOf(engine)) {
          return thisEngine.registerCommand(['suggest', ['get', key], ['number', val], 'required']);
        }
      }
    });
  };

  Commander.prototype.bindToScope = function(prop) {
    return this.spawnForScope(prop);
    /*
    if prop is 'width' or prop is 'height'
      if prop is 'width' then @spawnForScopeWidth() else @spawnForScopeHeight()
    else if prop is 'x'
      @engine.registerCommand ['eq', ['get', '::scope[x]'], ['number', 0], 'required']      
    else if prop is 'y'
      @engine.registerCommand ['eq', ['get', '::scope[y]'], ['number', 0], 'required']
    #else
    #  throw new Error "Not sure how to bind to window prop: #{prop}"
    */

  };

  Commander.prototype.handleRemoves = function(removes) {
    var varid, _i, _len;
    if (removes.length < 1) {
      return this;
    }
    this.engine.registerCommand(['remove'].concat(__slice.call(removes)));
    for (_i = 0, _len = removes.length; _i < _len; _i++) {
      varid = removes[_i];
      delete this.intrinsicRegistersById[varid];
    }
    return this;
  };

  Commander.prototype.handleSelectorsWithAdds = function(selectorsWithAdds) {
    var query, root, _i, _j, _len, _len1, _ref, _ref1;
    if (selectorsWithAdds.length < 1) {
      return this;
    }
    _ref = this.spawnableRoots;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      root = _ref[_i];
      _ref1 = root.queries;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        query = _ref1[_j];
        if (selectorsWithAdds.indexOf(query.selector) !== -1) {
          this.spawn(root);
          break;
        }
      }
    }
    return this;
  };

  Commander.prototype.validateMeasures = function() {
    var id, ids;
    ids = [];
    for (id in this.intrinsicRegistersById) {
      ids.push(id);
    }
    return this.handleInvalidMeasures(ids);
  };

  Commander.prototype.handleInvalidMeasures = function(invalidMeasures) {
    var id, prop, register, registersByProp, _i, _len;
    if (invalidMeasures.length < 1) {
      return this;
    }
    for (_i = 0, _len = invalidMeasures.length; _i < _len; _i++) {
      id = invalidMeasures[_i];
      registersByProp = this.intrinsicRegistersById[id];
      if (registersByProp) {
        for (prop in registersByProp) {
          register = registersByProp[prop];
          register.call(this);
        }
      }
    }
    return this;
  };

  /*
  getWhereCommandIfNeeded: (rule) ->    
    
    # Condtional Bound`
    if rule
      if rule.isCondtionalBound & !rule.isConditional
        whereCommand = ["where"]
        for cond in rule.boundConditionals
          whereCommand.push cond.getClauseTracker()
        return whereCommand
    else 
      return null
  */


  Commander.prototype.registerSpawn = function(node) {
    var newCommand, part, _i, _len;
    if (!node.isQueryBound) {
      newCommand = [];
      for (_i = 0, _len = node.length; _i < _len; _i++) {
        part = node[_i];
        newCommand.push(part);
      }
      return this.engine.registerCommand(newCommand);
    } else {
      this.spawnableRoots.push(node);
      return this.spawn(node);
    }
  };

  Commander.prototype.spawn = function(node) {
    var contextId, contextQuery, q, queries, ready, rule, _i, _j, _len, _len1, _ref, _results;
    queries = node.queries;
    ready = true;
    for (_i = 0, _len = queries.length; _i < _len; _i++) {
      q = queries[_i];
      if (q.lastAddedIds.length <= 0) {
        ready = false;
        break;
      }
    }
    if (ready) {
      rule = node.parentRule;
      if (node.isContextBound) {
        contextQuery = rule.getContextQuery();
        _ref = contextQuery.lastAddedIds;
        _results = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          contextId = _ref[_j];
          _results.push(this.engine.registerCommands(this.expandSpawnable(node, true, contextId)));
        }
        return _results;
      } else {
        return this.engine.registerCommands(this.expandSpawnable(node, true));
      }
    }
  };

  Commander.prototype.expandSpawnable = function(command, isRoot, contextId, tracker) {
    var commands, hasPlural, i, j, newCommand, newPart, part, plural, pluralCommand, pluralLength, pluralPartLookup, _i, _j, _k, _len, _len1;
    newCommand = [];
    commands = [];
    hasPlural = false;
    pluralPartLookup = {};
    plural = null;
    pluralLength = 0;
    for (i = _i = 0, _len = command.length; _i < _len; i = ++_i) {
      part = command[i];
      if (part) {
        if (part.spawn != null) {
          newPart = part.spawn(contextId);
          newCommand.push(newPart);
          if (part.isPlural) {
            hasPlural = true;
            pluralPartLookup[i] = newPart;
            pluralLength = newPart.length;
          }
        } else {
          newCommand.push(part);
        }
      }
    }
    if (isRoot) {
      if (tracker) {
        newCommand.push(tracker);
      }
    }
    if (hasPlural) {
      for (j = _j = 0; 0 <= pluralLength ? _j < pluralLength : _j > pluralLength; j = 0 <= pluralLength ? ++_j : --_j) {
        pluralCommand = [];
        for (i = _k = 0, _len1 = newCommand.length; _k < _len1; i = ++_k) {
          part = newCommand[i];
          if (pluralPartLookup[i]) {
            pluralCommand.push(pluralPartLookup[i][j]);
          } else {
            pluralCommand.push(part);
          }
        }
        commands.push(pluralCommand);
      }
      return commands;
    } else {
      if (isRoot) {
        return [newCommand];
      }
      return newCommand;
    }
  };

  Commander.prototype.makeNonRootSpawnableIfNeeded = function(command) {
    var isPlural, isSpawnable, part, _i, _len,
      _this = this;
    isPlural = false;
    for (_i = 0, _len = command.length; _i < _len; _i++) {
      part = command[_i];
      if (part) {
        if (part.spawn != null) {
          isSpawnable = true;
          if (part.isPlural) {
            isPlural = true;
          }
        }
      }
    }
    if (!isSpawnable) {
      return command;
    }
    return {
      isPlural: isPlural,
      spawn: function(contextId) {
        return _this.expandSpawnable(command, false, contextId);
      }
    };
  };

  Commander.prototype['get'] = function(root, varId, tracker) {
    var command;
    command = ['get', varId];
    if (tracker) {
      command.push(tracker);
    }
    return command;
  };

  Commander.prototype['get$'] = function(root, prop, queryObject) {
    var key, val;
    key = queryObject.selectorKey;
    if (!key) {
      key = queryObject.selector;
    }
    key += prop;
    val = this.get$cache[key];
    if (!val) {
      val = this._get$(root, prop, queryObject);
      this.get$cache[key] = val;
    }
    return val;
  };

  Commander.prototype['_get$'] = function(root, prop, queryObject) {
    var idProcessor, isContextBound, isMulti, isScopeBound, query, selector,
      _this = this;
    query = queryObject.query;
    selector = queryObject.selector;
    if (selector === 'window') {
      this.bindToWindow(prop);
      return ['get', "::window[" + prop + "]"];
    }
    isMulti = query.isMulti;
    isContextBound = queryObject.isContextBound;
    isScopeBound = queryObject.isScopeBound;
    if (isScopeBound) {
      this.bindToScope(prop);
    }
    if (prop.indexOf("intrinsic-") === 0) {
      query.lastAddedIds.forEach(function(id) {
        var elProp, engine, gid, k, register;
        gid = "$" + id;
        if (!_this.intrinsicRegistersById[gid]) {
          _this.intrinsicRegistersById[gid] = {};
        }
        if (!_this.intrinsicRegistersById[gid][prop]) {
          elProp = prop.split("intrinsic-")[1];
          k = "" + gid + "[" + prop + "]";
          engine = _this.engine;
          register = function() {
            var val;
            val = engine.measureByGssId(id, elProp);
            if (engine.vars[k] !== val) {
              engine.registerCommand(['suggest', ['get$', prop, gid, selector], ['number', val], 'required']);
            }
            return engine.setNeedsMeasure(true);
          };
          _this.intrinsicRegistersById[gid][prop] = register;
          return register.call(_this);
        }
      });
    }
    if (isContextBound) {
      idProcessor = queryObject.idProcessor;
      return {
        isQueryBound: true,
        isPlural: false,
        query: query,
        spawn: function(id) {
          if (idProcessor) {
            id = idProcessor(id);
          }
          return ['get$', prop, "$" + id, selector];
        }
      };
    }
    return {
      isQueryBound: true,
      isPlural: isMulti,
      query: query,
      spawn: function() {
        var id, nodes, _i, _len, _ref;
        if (!isMulti) {
          id = query.lastAddedIds[query.lastAddedIds.length - 1];
          return ['get$', prop, "$" + id, selector];
        }
        nodes = [];
        _ref = query.lastAddedIds;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          nodes.push(['get$', prop, "$" + id, selector]);
        }
        return nodes;
      }
    };
  };

  Commander.prototype['number'] = function(root, num) {
    return ['number', num];
  };

  Commander.prototype['plus'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['plus', e1, e2]);
  };

  Commander.prototype['minus'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['minus', e1, e2]);
  };

  Commander.prototype['multiply'] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(['multiply', e1, e2]);
  };

  Commander.prototype['divide'] = function(root, e1, e2, s, w) {
    return this.makeNonRootSpawnableIfNeeded(['divide', e1, e2]);
  };

  Commander.prototype["cond"] = function(self) {
    return this.registerSpawn(self);
  };

  /*
  "where": (root,name) =>
    return ['where',name]
  
  "clause": (root,cond,label) =>
    return @makeNonRootSpawnableIfNeeded ["clause",cond,label]
  */


  Commander.prototype["where"] = function(root, name) {
    var command;
    if (root.isContextBound) {
      command = [
        "where", name, {
          spawn: function(contextId) {
            return "-context-" + contextId;
          }
        }
      ];
    } else {
      command = ["where", name];
    }
    return this.makeNonRootSpawnableIfNeeded(command);
  };

  Commander.prototype["clause"] = function(root, cond, name) {
    var command;
    if (root.isContextBound) {
      command = [
        "clause", cond, {
          spawn: function(contextId) {
            if (contextId) {
              return name + "-context-" + contextId;
            }
            return name;
          }
        }
      ];
    } else {
      command = ["clause", cond, name];
    }
    return this.makeNonRootSpawnableIfNeeded(command);
  };

  Commander.prototype["?>="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?>=", e1, e2]);
  };

  Commander.prototype["?<="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?<=", e1, e2]);
  };

  Commander.prototype["?=="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?==", e1, e2]);
  };

  Commander.prototype["?!="] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?!=", e1, e2]);
  };

  Commander.prototype["?>"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?>", e1, e2]);
  };

  Commander.prototype["?<"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["?<", e1, e2]);
  };

  Commander.prototype["&&"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["&&", e1, e2]);
  };

  Commander.prototype["||"] = function(root, e1, e2) {
    return this.makeNonRootSpawnableIfNeeded(["||", e1, e2]);
  };

  Commander.prototype['strength'] = function(root, s) {
    return ['strength', s];
  };

  Commander.prototype['suggest'] = function() {
    var args;
    args = __slice.call(arguments);
    return this.engine.registerCommand(['suggest'].concat(__slice.call(args.slice(1, args.length))));
  };

  Commander.prototype['eq'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['lte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['gte'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['lt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['gt'] = function(self, e1, e2, s, w) {
    return this.registerSpawn(self);
  };

  Commander.prototype['stay'] = function(self) {
    return this.registerSpawn(self);
    /*
    if !self._is_bound then return @registerSpawn(self)
    # break up stays to allow multiple plural queries
    args = [arguments...]
    gets = args[1...args.length]    
    for get in gets
      stay = ['stay']
      stay.push get
      cloneBinds self, stay
      @registerSpawn(stay)
    */

  };

  Commander.prototype['$class'] = function(root, sel) {
    var o, query, selector,
      _this = this;
    selector = "." + sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: true,
        isLive: false,
        createNodeList: function() {
          return _this.engine.queryScope.getElementsByClassName(sel);
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRootAsMulti(root, o.query);
    return o;
  };

  Commander.prototype['$tag'] = function(root, sel) {
    var o, query, selector,
      _this = this;
    selector = sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: true,
        isLive: false,
        createNodeList: function() {
          return _this.engine.queryScope.getElementsByTagName(sel);
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRootAsMulti(root, o.query);
    return o;
  };

  Commander.prototype['$id'] = function(root, sel) {
    var o, query, selector,
      _this = this;
    selector = "#" + sel;
    o = this.queryCommandCache[selector];
    if (!o) {
      query = this.engine.registerDomQuery({
        selector: selector,
        isMulti: false,
        isLive: false,
        createNodeList: function() {
          var el;
          el = document.getElementById(sel);
          if (el) {
            return [el];
          } else {
            return [];
          }
        }
      });
      o = {
        query: query,
        selector: selector
      };
      this.queryCommandCache[selector] = o;
    }
    bindRoot(root, o.query);
    return o;
  };

  Commander.prototype['$reserved'] = function(root, sel) {
    var engine, o, parentRule, query, selector, selectorKey;
    if (sel === 'window') {
      selector = 'window';
      o = this.queryCommandCache[selector];
      if (!o) {
        o = {
          selector: selector,
          query: null
        };
        this.queryCommandCache[selector] = o;
      }
      return o;
    }
    engine = this.engine;
    if (sel === '::this' || sel === 'this') {
      parentRule = root.parentRule;
      if (!parentRule) {
        throw new Error("::this query requires parent rule for context");
      }
      query = parentRule.getContextQuery();
      selector = query.selector;
      selectorKey = selector + "::this";
      o = this.queryCommandCache[selectorKey];
      if (!o) {
        o = {
          query: query,
          selector: selector,
          selectorKey: selectorKey,
          isContextBound: true
        };
        this.queryCommandCache[selectorKey] = o;
      }
      bindRootAsContext(root, query);
      return o;
    } else if (sel === '::parent' || sel === 'parent') {
      parentRule = root.parentRule;
      if (!parentRule) {
        throw new Error("::this query requires parent rule for context");
      }
      query = parentRule.getContextQuery();
      selector = query.selector + "::parent";
      o = this.queryCommandCache[selector];
      if (!o) {
        o = {
          query: query,
          selector: selector,
          isContextBound: true,
          idProcessor: function(id) {
            return GSS.setupId(GSS.getById(id).parentElement);
          }
        };
        this.queryCommandCache[selector] = o;
      }
      bindRootAsContext(root, query);
      return o;
    } else if (sel === 'scope') {
      selector = "::" + sel;
      o = this.queryCommandCache[selector];
      if (!o) {
        query = engine.registerDomQuery({
          selector: selector,
          isMulti: false,
          isLive: true,
          createNodeList: function() {
            return [engine.scope];
          }
        });
        o = {
          query: query,
          selector: selector,
          isScopeBound: true
        };
        this.queryCommandCache[selector] = o;
      }
      bindRoot(root, o.query);
      return o;
    }
    throw new Error("$reserved selectors not yet handled: " + sel);
  };

  Commander.prototype['chain'] = function(root, queryObject, bridgessssss) {
    var args, bridge, bridges, engine, more, query, _i, _j, _len, _len1;
    query = queryObject.query;
    args = __slice.call(arguments);
    bridges = __slice.call(args.slice(2, args.length));
    engine = this.engine;
    more = null;
    for (_i = 0, _len = bridges.length; _i < _len; _i++) {
      bridge = bridges[_i];
      if (typeof bridge !== "function") {
        if (!more) {
          more = [];
        }
        more.push(bridge);
        bridges.splice(bridges.indexOf(bridge), 1);
      }
    }
    for (_j = 0, _len1 = bridges.length; _j < _len1; _j++) {
      bridge = bridges[_j];
      bridge.call(engine, query, engine, more);
    }
    return query.on('afterChange', function() {
      var _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = bridges.length; _k < _len2; _k++) {
        bridge = bridges[_k];
        _results.push(bridge.call(engine, query, engine, more));
      }
      return _results;
    });
  };

  Commander.prototype['eq-chain'] = function(root, head, tail, s, w) {
    return this._chainer('eq', head, tail, s, w);
  };

  Commander.prototype['lte-chain'] = function(root, head, tail, s, w) {
    return this._chainer('lte', head, tail, s, w);
  };

  Commander.prototype['gte-chain'] = function(root, head, tail, s, w) {
    return this._chainer('gte', head, tail, s, w);
  };

  Commander.prototype['lt-chain'] = function(root, head, tail, s, w) {
    return this._chainer('lt', head, tail, s, w);
  };

  Commander.prototype['gt-chain'] = function(root, head, tail, s, w) {
    return this._chainer('gt', head, tail, s, w);
  };

  Commander.prototype._chainer = function(op, head, tail, s, w) {
    var engine, tracker, _e_for_chain;
    tracker = "eq-chain-" + GSS.uid();
    engine = this.engine;
    _e_for_chain = this._e_for_chain;
    return function(query, e, more) {
      e.remove(tracker);
      return query.forEach(function(el) {
        var e1, e2, nextEl;
        nextEl = query.next(el);
        if (!nextEl) {
          return;
        }
        e1 = _e_for_chain(el, head, query, tracker, el, nextEl);
        e2 = _e_for_chain(nextEl, tail, query, tracker, el, nextEl);
        return e[op](e1, e2, s, w, more);
      });
    };
  };

  Commander.prototype['plus-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'plus');
  };

  Commander.prototype['minus-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'minus');
  };

  Commander.prototype['multiply-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'multiply');
  };

  Commander.prototype['divide-chain'] = function(root, head, tail) {
    return this._chainer_math(head, tail, 'divide');
  };

  Commander.prototype._chainer_math = function(head, tail, op) {
    var engine, _e_for_chain;
    engine = this.engine;
    _e_for_chain = this._e_for_chain;
    return function(el, nextEl, query, tracker) {
      var e1, e2;
      e1 = _e_for_chain(el, head, query, tracker);
      e2 = _e_for_chain(nextEl, tail, query, tracker);
      return engine[op](e1, e2);
    };
  };

  Commander.prototype._e_for_chain = function(el, exp, query, tracker, currentEl, nextEl) {
    var e1;
    if (typeof exp === "string") {
      e1 = this.engine.elVar(el, exp, query.selector);
    } else if (typeof exp === "function") {
      e1 = exp.call(this, currentEl, nextEl, query, tracker);
    } else {
      e1 = exp;
    }
    return e1;
  };

  Commander.prototype['for-each'] = function(root, queryObject, callback) {
    var el, query, _i, _len, _ref;
    query = queryObject.query;
    _ref = query.nodeList;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      callback.call(this.engine, el, query, this.engine);
    }
    return query.on('afterChange', function() {
      var _j, _len1, _ref1, _results;
      _ref1 = query.nodeList;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        el = _ref1[_j];
        _results.push(callback.call(this.engine, el, query));
      }
      return _results;
    });
  };

  Commander.prototype['for-all'] = function(root, queryObject, callback) {
    var query,
      _this = this;
    query = queryObject.query;
    callback.call(this.engine, query, this.engine);
    return query.on('afterChange', function() {
      return callback.call(_this.engine, query, _this.engine);
    });
  };

  Commander.prototype['js'] = function(root, js) {
    eval("var callback =" + js);
    return callback;
  };

  return Commander;

})();

module.exports = Commander;
