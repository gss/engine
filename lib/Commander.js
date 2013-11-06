/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Commander, bindRoot, cloneBinds, makeTemplateFromVarId, _templateVarIdCache,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

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

cloneBinds = function(from, to) {
  var query, _i, _len, _ref;
  if (from._is_bound = true) {
    _ref = from._binds;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      query = _ref[_i];
      bindRoot(to, query);
    }
  }
  return to;
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

Commander = (function() {
  function Commander(engine) {
    this.engine = engine;
    this['$id'] = __bind(this['$id'], this);
    this['$reserved'] = __bind(this['$reserved'], this);
    this['$tag'] = __bind(this['$tag'], this);
    this['$class'] = __bind(this['$class'], this);
    this['strength'] = __bind(this['strength'], this);
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
    this['stay'] = __bind(this['stay'], this);
    this['gt'] = __bind(this['gt'], this);
    this['lt'] = __bind(this['lt'], this);
    this['gte'] = __bind(this['gte'], this);
    this['lte'] = __bind(this['lte'], this);
    this['eq'] = __bind(this['eq'], this);
    this['suggest'] = __bind(this['suggest'], this);
    this['get'] = __bind(this['get'], this);
    this['varexp'] = __bind(this['varexp'], this);
    this['var'] = __bind(this['var'], this);
    this.spawnIntrinsicSuggests = __bind(this.spawnIntrinsicSuggests, this);
    this.spawnForWindowSize = __bind(this.spawnForWindowSize, this);
    this._execute = __bind(this._execute, this);
    this._checkCache = __bind(this._checkCache, this);
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
    return this.bindCache = {};
  };

  Commander.prototype.destroy = function() {
    this.spawnableRoots = null;
    this.intrinsicRegistersById = null;
    this.boundWindowProps = null;
    this.bindCache = null;
    return this.unlisten();
  };

  Commander.prototype._checkCache = function(root, cacheKey) {
    var bind, binds, _i, _len, _results;
    binds = this.bindCache[cacheKey];
    if (binds != null) {
      _results = [];
      for (_i = 0, _len = binds.length; _i < _len; _i++) {
        bind = binds[_i];
        _results.push(bindRoot(root, bind));
      }
      return _results;
    }
  };

  Commander.prototype.execute = function(commands) {
    var command, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = commands.length; _i < _len; _i++) {
      command = commands[_i];
      _results.push(this._execute(command, command));
    }
    return _results;
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
    if (this.engine.vars["::window[width]"] !== w) {
      return this.engine.registerCommand(['suggest', ['get', "::window[width]"], ['number', w], 'required']);
    }
  };

  Commander.prototype.spawnForWindowHeight = function() {
    var h;
    h = window.innerHeight;
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

  Commander.prototype.parentEngineWithVarId = function(key) {
    var parentEngine;
    parentEngine = this.engine.parentEngine;
    while (parentEngine) {
      if (parentEngine.varKeys.indexOf(key) > -1) {
        return parentEngine;
      }
      parentEngine = parentEngine.parentEngine;
    }
    return null;
  };

  Commander.prototype.spawnForScope = function(prop) {
    var framingEngine, key,
      _this = this;
    key = "$" + GSS.getId(this.engine.scope) + ("[" + prop + "]");
    framingEngine = this.parentEngineWithVarId(key);
    if (framingEngine) {
      return framingEngine.on("beforeDisplay", function() {
        var val;
        val = framingEngine.vars[key];
        return _this.engine.registerCommand(['suggest', ['get', key], ['number', val], 'required']);
      });
    }
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

  Commander.prototype.registerSpawn = function(root, varid, prop, intrinsicQuery, checkInstrinsics) {
    if (!root._is_bound) {
      return this.engine.registerCommand(root);
    } else {
      if (varid) {
        this.bindCache[varid] = root._binds;
      }
      root._template = JSON.stringify(root);
      root._varid = varid;
      root._prop = prop;
      if (checkInstrinsics) {
        root._checkInstrinsics = checkInstrinsics;
        root._intrinsicQuery = intrinsicQuery;
      }
      this.spawnableRoots.push(root);
      return this.spawn(root);
    }
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
    var boundSelector, root, _i, _j, _len, _len1, _ref, _ref1;
    if (selectorsWithAdds.length < 1) {
      return this;
    }
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

  Commander.prototype.spawnIntrinsicSuggests = function(root) {
    var prop,
      _this = this;
    if (root._checkInstrinsics && (root._intrinsicQuery != null)) {
      prop = root._prop;
      if (prop.indexOf("intrinsic-") === 0) {
        root._intrinsicQuery.lastAddedIds.forEach(function(id) {
          var elProp, gid, k, register;
          gid = "$" + id;
          if (!_this.intrinsicRegistersById[gid]) {
            _this.intrinsicRegistersById[gid] = {};
          }
          if (!_this.intrinsicRegistersById[gid][prop]) {
            elProp = prop.split("intrinsic-")[1];
            k = "" + gid + "[" + prop + "]";
            register = function() {
              var val;
              val = this.engine.measureByGssId(id, elProp);
              if (this.engine.vars[k] !== val) {
                return this.engine.registerCommand(['suggest', ['get', k], ['number', val], 'required']);
              }
            };
            _this.intrinsicRegistersById[gid][prop] = register;
            return register.call(_this);
          }
        });
      }
    }
    return this;
  };

  Commander.prototype.spawn = function(root) {
    var command, id, joiner, q, queries, ready, replaces, rootString, splitter, template, _i, _j, _len, _len1, _ref;
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
    return this.spawnIntrinsicSuggests(root);
  };

  Commander.prototype['var'] = function(self, varId, prop, query) {
    self.splice(2, 10);
    if (self._is_bound) {
      self[1] = makeTemplateFromVarId(varId);
      self.push("%%" + query.selector + "%%");
    }
    this.registerSpawn(self, varId, prop, query, true);
    if (query) {
      if (query === 'window') {
        this.bindToWindow(prop);
        return query = null;
      } else if (query.__is_scope) {
        return this.bindToScope(prop);
      }
    }
  };

  Commander.prototype['varexp'] = function(self, varId, expression, zzz) {
    self.splice(3, 10);
    self[1] = makeTemplateFromVarId(varId);
    return this.registerSpawn(self, varId);
  };

  Commander.prototype['get'] = function(root, varId, tracker) {
    this._checkCache(root, varId);
    if (tracker && (tracker !== "::window")) {
      return ['get', makeTemplateFromVarId(varId), tracker + "%%" + tracker + "%%"];
    } else if (root._is_bound) {
      return ['get', makeTemplateFromVarId(varId)];
    } else {
      return ['get', varId];
    }
  };

  Commander.prototype['number'] = function(root, num) {
    return ['number', num];
  };

  Commander.prototype['plus'] = function(root, e1, e2) {
    return ['plus', e1, e2];
  };

  Commander.prototype['minus'] = function(root, e1, e2) {
    return ['minus', e1, e2];
  };

  Commander.prototype['multiply'] = function(root, e1, e2) {
    return ['multiply', e1, e2];
  };

  Commander.prototype['divide'] = function(root, e1, e2, s, w) {
    return ['divide', e1, e2];
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

  Commander.prototype['chain'] = function(root, query, bridgessssss) {
    var args, bridge, bridges, engine, _i, _len;
    args = __slice.call(arguments);
    bridges = __slice.call(args.slice(2, args.length));
    engine = this.engine;
    for (_i = 0, _len = bridges.length; _i < _len; _i++) {
      bridge = bridges[_i];
      bridge.call(engine, query, engine);
    }
    return query.on('afterChange', function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = bridges.length; _j < _len1; _j++) {
        bridge = bridges[_j];
        _results.push(bridge.call(engine, query, engine));
      }
      return _results;
    });
  };

  Commander.prototype['eq-chain'] = function(root, head, tail) {
    return this._chainer(head, tail, 'eq');
  };

  Commander.prototype['lte-chain'] = function(root, head, tail) {
    return this._chainer(head, tail, 'lte');
  };

  Commander.prototype['gte-chain'] = function(root, head, tail) {
    return this._chainer(head, tail, 'gte');
  };

  Commander.prototype['lt-chain'] = function(root, head, tail) {
    return this._chainer(head, tail, 'lt');
  };

  Commander.prototype['gt-chain'] = function(root, head, tail) {
    return this._chainer(head, tail, 'gt');
  };

  Commander.prototype._chainer = function(head, tail, op) {
    var engine, tracker, _e_for_chain;
    tracker = "eq-chain-" + GSS._id_counter++;
    engine = this.engine;
    _e_for_chain = this._e_for_chain;
    return function(query, e) {
      e.remove(tracker);
      return query.forEach(function(el) {
        var e1, e2, nextEl;
        nextEl = query.next(el);
        if (!nextEl) {
          return;
        }
        e1 = _e_for_chain(el, head, query, tracker, el, nextEl);
        e2 = _e_for_chain(nextEl, tail, query, tracker, el, nextEl);
        return e[op](e1, e2);
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

  Commander.prototype['for-each'] = function(root, query, callback) {
    var el, _i, _len, _ref;
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

  Commander.prototype['for-all'] = function(root, query, callback) {
    var _this = this;
    callback.call(this.engine, query, this.engine);
    return query.on('afterChange', function() {
      return callback.call(_this.engine, query, _this.engine);
    });
  };

  Commander.prototype['js'] = function(root, js) {
    eval("var callback =" + js);
    return callback;
  };

  Commander.prototype['strength'] = function(root, s) {
    return ['strength', s];
  };

  Commander.prototype['$class'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery({
      selector: "." + sel,
      isMulti: true,
      isLive: true,
      createNodeList: function() {
        return _this.engine.queryScope.getElementsByClassName(sel);
      }
    });
    bindRoot(root, query);
    return query;
  };

  Commander.prototype['$tag'] = function(root, sel) {
    var query,
      _this = this;
    query = this.engine.registerDomQuery({
      selector: sel,
      isMulti: true,
      isLive: true,
      createNodeList: function() {
        return _this.engine.queryScope.getElementsByTagName(sel);
      }
    });
    bindRoot(root, query);
    return query;
  };

  Commander.prototype['$reserved'] = function(root, sel) {
    var engine, query;
    query = null;
    if (sel === 'window') {
      return 'window';
    } else if (sel === 'this' || sel === 'scope') {
      engine = this.engine;
      query = this.engine.registerDomQuery({
        selector: "::" + sel,
        isMulti: false,
        isLive: true,
        createNodeList: function() {
          return [engine.scope];
        }
      });
      query.__is_scope = true;
      bindRoot(root, query);
      return query;
    } else {
      throw new Error("$reserved selectors not yet handled: " + sel);
    }
    return query;
  };

  Commander.prototype['$id'] = function(root, sel) {
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

  return Commander;

})();

module.exports = Commander;
