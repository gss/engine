var Inspector,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty;

Inspector = (function() {
  function Inspector(engine) {
    this.engine = engine;
    this.draw = __bind(this.draw, this);
    this.onMouseMove = __bind(this.onMouseMove, this);
    this.onClick = __bind(this.onClick, this);
    this.onKeyUp = __bind(this.onKeyUp, this);
    this.onKeyDown = __bind(this.onKeyDown, this);
  }

  Inspector.prototype.toExpressionString = function(operation) {
    var klass, path, _ref;
    if (operation != null ? operation.push : void 0) {
      if (operation[0] === 'get') {
        path = this.engine.Variable.getPath(operation[1], operation[2]);
        if (this.engine.values[path.replace('[', '[intrinsic-')] != null) {
          klass = 'intrinsic';
        } else if (path.indexOf('"') > -1) {
          klass = 'virtual';
        } else if (operation[2] && operation[1]) {
          if (operation[2] === 'x' || operation[2] === 'y') {
            klass = 'position';
          } else if (!((_ref = this.engine.intrinsic.properties[operation[2]]) != null ? _ref.matcher : void 0)) {
            klass = 'local';
          }
        }
        return '<strong class="' + (klass || 'variable') + '" for="' + path + '" title="' + this.engine.values[path] + '">' + path + '</strong>';
      } else if (operation[0] === 'value') {
        return '<em>' + operation[1] + '</em>';
      }
      return this.toExpressionString(operation[1]) + ' <b>' + operation[0] + '</b> ' + this.toExpressionString(operation[2]);
    } else {
      return operation != null ? operation : '';
    }
  };

  Inspector.prototype.update = function() {
    if (this.engine.console.level > 0) {
      this.domains(this.engine.domains);
    }
    if (this.engine.console.level > 1 || this.rulers) {
      return this.refresh();
    }
  };

  Inspector.prototype.stylesheet = function() {
    var sheet;
    this.sheet = sheet = document.createElement('style');
    sheet.textContent = sheet.innerText = "domains {\n  display: block;\n  position: fixed;\n  z-index: 999999;\n  top: 0;\n  left: 0;\n  background: rgba(255,255,255,0.76);\n  font-family: Helvetica, Arial;\n}\ndomain {\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n\n  user-select: none;     \n}\npanel {\n  padding: 10px;\n  left: 0\n}\npanel strong, panel b{\n  font-weight: normal;\n}\npanel em {\n  color: red;\n}\npanel strong {\n  color: MidnightBlue;\n}\npanel strong.virtual {\n  color: green;\n}\npanel strong.intrinsic {\n  color: red;\n}\npanel strong.local {\n  color: black;\n}\npanel strong.position {\n  color: olive;\n}\npanel strong[mark] {\n  text-decoration: underline;\n}\ndomains domain{\n  padding: 5px;\n  text-align: center;\n  display: inline-block;\n  cursor: pointer;\n}\ndomain[hidden] {\n  color: #999;\n  background: none;\n}\ndomain.intrinsic, domain.assumed, domain.solved, domain.document {\n  background: rgba(255, 0, 0, 0.15);\n  font: 0/0 \"0\";\n  width: 15px;\n  height: 15px;\n  display: none;\n}\ndomain, domain.active {\n  background: #fff;\n  color: #000;\n}\ndomain.active {\n  font-weight: bold;\n}\ndomains:hover domain {\n  background: none;\n}\ndomains:hover domain:hover {\n  background: #fff\n}\ndomain panel {\n  display: block;\n  position: absolute;\n  background: #fff;\n  text-align: left;\n  white-space: pre;\n  line-height: 18px;\n  font-size: 13px;\n  font-family: monospace, serif;\n}\ndomain panel {\n  display: none;\n}\ndomain:hover panel, body[reaching] panel {\n  display: block;\n}\nruler {\n  display: block;\n  position: absolute;\n  z-index: 99999;\n  border-width: 0;\n}\nruler[hidden] {\n  display: none;\n}\nruler.x {\n  border-bottom: 1px dotted orange;\n}\nruler.y {\n  border-right: 1px dotted orange;\n}\nruler.width {\n  border-bottom: 1px dashed blue;\n}\nruler.height {\n  border-right: 1px dashed blue;\n}\nruler.virtual {\n  border-color: green;\n}\nruler.virtual.height {\n  z-index: 99998;\n}\nbody:not([inspecting]) ruler.virtual.height {\n  width: 0px !important;\n}\nbody[inspecting][reaching] ruler.virtual.height:not(:hover) {\n  width: 0px !important;\n}\nruler.virtual.height:hover, body[inspecting]:not([reaching]) ruler.virtual.height {\n  background: rgba(0,255,0,0.15);\n}\nruler.constant {\n  border-style: solid;\n}\nruler.intrinsic {\n  border-color: red;\n}\nruler:before {\n  content: \"\";\n  display: block;\n  position: absolute;\n  right: 0;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  cursor: pointer;\n}\nruler.y:before, ruler.height:before, ruler.intrinsic-height:before {\n  left: -10px;\n  right: -10px;\n}\nruler.x:before, ruler.width:before, ruler.intrinsic-width:before {\n  top: -10px;\n  bottom: -10px;\n}\ndomain panel.filtered {\n  display: block\n}\nbody[reaching] ruler {\n  opacity: 0.2\n}\nbody[reaching] ruler.reached {\n  opacity: 1\n}";
    document.body.appendChild(sheet);
    document.addEventListener('mousedown', this.onClick);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
    return document.addEventListener('keyup', this.onKeyUp);
  };

  Inspector.prototype.refresh = function() {
    var bits, domain, id, ids, property, value, values, _i, _j, _len, _len1, _ref, _ref1, _ref2, _results;
    _ref = this.engine.domains;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      domain = _ref[_i];
      domain.distances = void 0;
    }
    values = {};
    _ref1 = this.engine.values;
    for (property in _ref1) {
      value = _ref1[property];
      values[property] = value;
    }
    if (this.rulers) {
      _ref2 = this.rulers;
      for (property in _ref2) {
        value = _ref2[property];
        if (!values.hasOwnProperty(property)) {
          values[property] = null;
        }
      }
    }
    ids = this.ids = [];
    for (property in values) {
      value = values[property];
      if ((bits = property.split('[')).length > 1) {
        if (ids.indexOf(bits[0]) === -1) {
          ids.push(bits[0]);
        }
      }
    }
    _results = [];
    for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
      id = ids[_j];
      _results.push(this.draw(id, values));
    }
    return _results;
  };

  Inspector.prototype.onKeyDown = function(e) {
    if (e.altKey) {
      return document.body.setAttribute('inspecting', 'inspecting');
    }
  };

  Inspector.prototype.onKeyUp = function(e) {
    if (document.body.getAttribute('inspecting') != null) {
      return document.body.removeAttribute('inspecting');
    }
  };

  Inspector.prototype.getDomains = function(ids) {
    var domain, domains, id, property, value, _i, _len, _ref, _ref1;
    domains = [];
    _ref = this.engine.domains;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      domain = _ref[_i];
      if (domain.displayName !== 'Solved' && domain.constraints.length) {
        _ref1 = domain.values;
        for (property in _ref1) {
          if (!__hasProp.call(_ref1, property)) continue;
          value = _ref1[property];
          id = property.split('[');
          if (id.length > 1) {
            if (ids.indexOf(id[0]) > -1) {
              if (domains.indexOf(domain) === -1) {
                domains.push(domain);
              }
            }
          }
        }
      }
    }
    return domains;
  };

  Inspector.prototype.onClick = function(e) {
    var distance, domain, domains, ids, inspecting, prop, properties, property, props, target, _ref, _ref1;
    if (((_ref = e.target.tagName) != null ? _ref.toLowerCase() : void 0) === 'domain') {
      if (!this.rulers) {
        this.refresh();
      }
      this.filter([e.target.getAttribute('for')], e.shiftKey || e.ctrlKey, true);
      e.preventDefault();
      return e.stopPropagation();
    } else {
      if (e.metaKey) {
        if (!this.rulers) {
          this.refresh();
        }
      }
      if (e.altKey || e.metaKey) {
        target = e.target;
        ids = [];
        inspecting = [];
        while (target) {
          if (target.nodeType === 1) {
            if (e.altKey && target._gss && target.classList.contains('virtual')) {
              inspecting.push(target.getAttribute('for'));
            } else if (target._gss_id) {
              inspecting.push(target._gss_id);
            }
          }
          target = target.parentNode;
        }
        domains = this.getDomains(inspecting);
        ids = domains.map(function(d) {
          return String(d.uid);
        });
        if (e.altKey) {
          this.remap(domains[0]);
          this.visualize(null, inspecting, e.shiftKey);
          this.constraints(ids[0], null, inspecting, e.shiftKey);
        }
        if (e.metaKey) {
          this.filter(ids, e.shiftKey);
        }
      } else if ((property = document.body.getAttribute('reaching')) && ((_ref1 = e.target.tagName) != null ? _ref1.toLowerCase() : void 0) === 'ruler') {
        domain = this.reaching;
        if (domain && (properties = domain.distances[property])) {
          props = [];
          for (prop in properties) {
            distance = properties[prop];
            if (!distance) {
              props.push(prop);
            }
          }
          this.constraints(domain.uid, null, props);
        }
      } else {
        return;
      }
      e.preventDefault();
      return e.stopPropagation();
    }
  };

  Inspector.prototype.constraints = function(id, element, props, all) {
    var diff, domain, el, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _results,
      _this = this;
    if (!this.panel) {
      this.panel = document.createElement('panel');
    } else {
      this.panel.classList.remove('filtered');
    }
    if (!element) {
      _ref = this.list.childNodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        if (el.getAttribute('for') === String(id)) {
          element = el;
          break;
        }
      }
      if (!element) {
        return;
      }
    }
    if (this.panel.parentNode !== element) {
      if ((_ref1 = this.panel.parentNode) != null) {
        _ref1.classList.remove('active');
      }
      element.appendChild(this.panel);
    }
    _ref2 = this.engine.domains;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      domain = _ref2[_j];
      if (String(domain.uid) === String(id)) {
        this.panel.innerHTML = (_ref3 = domain.constraints) != null ? _ref3.map(function(constraint) {
          return _this.toExpressionString(constraint.operation);
        }).filter(function(string) {
          var prop, _k, _len2;
          if (!props) {
            return true;
          }
          for (_k = 0, _len2 = props.length; _k < _len2; _k++) {
            prop = props[_k];
            if (string.indexOf(prop) > -1) {
              if (!all && props.length > 1) {
                props.splice(1);
              }
              return true;
            }
          }
          return false;
        }).map(function(string) {
          var prop, _k, _len2;
          if (props) {
            for (_k = 0, _len2 = props.length; _k < _len2; _k++) {
              prop = props[_k];
              prop = prop.replace(/([\[\]$])/g, '\\$1');
              debugger;
              string = string.replace(new RegExp('\\>(' + prop + '[\\[\\"])', 'g'), ' mark>$1');
            }
          }
          return string;
        }).join('\n') : void 0;
        if (props) {
          this.panel.classList.add('filtered');
        }
        diff = element.offsetLeft + element.offsetWidth + 10 - this.panel.offsetWidth;
        if (diff > 0) {
          this.panel.style.left = diff + 'px';
        } else {
          this.panel.style.left = '';
        }
        element.classList.add('active');
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Inspector.prototype.onMouseMove = function(e) {
    var target, _ref;
    target = e.target;
    if (target._gss) {
      return this.visualize(e.target.getAttribute('property'));
    }
    while (target) {
      if (target.nodeType === 1) {
        if (target.tagName.toLowerCase() === 'domain') {
          return this.constraints(target.getAttribute('for'), target);
        }
      }
      target = target.parentNode;
    }
    if ((_ref = this.panel) != null ? _ref.parentNode : void 0) {
      this.panel.parentNode.classList.remove('active');
      this.panel.parentNode.removeChild(this.panel);
    }
    if (this.reaching) {
      return this.visualize();
    }
  };

  Inspector.prototype.visualize = function(property, ids, all) {
    var distance, domain, id, key, prop, properties, props, reached, ruler, _i, _j, _k, _len, _len1, _len2, _ref, _results;
    if (!property && !ids) {
      if (this.reaching) {
        this.reaching = void 0;
        document.body.removeAttribute('reaching');
        _ref = document.getElementsByTagName('ruler');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ruler = _ref[_i];
          ruler.classList.remove('reached');
        }
      }
      return;
    }
    if (!ids && document.body.getAttribute('reaching') === property) {
      return;
    }
    if (ids) {
      props = [];
      for (property in this.rulers) {
        for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
          id = ids[_j];
          if (property.substring(0, id.length) === id) {
            if (property.substring(id.length, id.length + 1) === '[') {
              props.push(property);
              if (!all && ids.length > 1) {
                ids.splice(1);
                break;
              }
            }
          }
        }
      }
    } else {
      props = [property];
      ids = [property.split('[')[0]];
    }
    domain = this.getDomains(ids)[0];
    reached = false;
    _results = [];
    for (_k = 0, _len2 = props.length; _k < _len2; _k++) {
      prop = props[_k];
      if (domain && (properties = domain.distances[prop])) {
        _results.push((function() {
          var _ref1, _results1;
          _results1 = [];
          for (key in properties) {
            distance = properties[key];
            if (!distance) {
              reached = true;
              if ((_ref1 = this.rulers[key]) != null) {
                _ref1.classList.add('reached');
              }
              this.reaching = domain;
              _results1.push(document.body.setAttribute('reaching', prop || id));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Inspector.prototype.filter = function(ids, all, scroll) {
    var domain, i, id, index, node, offsetTop, property, ruler, top, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    this.indexes || (this.indexes = (function() {
      var _i, _len, _ref, _results;
      _ref = this.list.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (node.getAttribute('hidden') == null) {
          _results.push(node.getAttribute('for'));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }).call(this));
    if (all) {
      ids = (function() {
        var _i, _len, _ref, _results;
        _ref = this.list.childNodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(node.getAttribute('for'));
        }
        return _results;
      }).call(this);
      if (ids.toString() === this.indexes.toString()) {
        ids = [];
      }
      this.indexes = ids || [];
    } else {
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if ((i = this.indexes.indexOf(id)) === -1) {
          this.indexes.push(id);
        } else {
          this.indexes.splice(i, 1);
        }
      }
    }
    _ref = this.list.childNodes;
    for (index = _j = 0, _len1 = _ref.length; _j < _len1; index = ++_j) {
      domain = _ref[index];
      if (this.engine.domains[index] != null) {
        if (this.indexes.indexOf(String(this.engine.domains[index].uid)) === -1) {
          domain.setAttribute('hidden', 'hidden');
          if (((_ref1 = this.panel) != null ? _ref1.parentNode : void 0) === domain) {
            domain.classList.remove('active');
            domain.removeChild(this.panel);
          }
        } else {
          domain.removeAttribute('hidden');
        }
      }
    }
    top = null;
    _ref2 = this.rulers;
    for (property in _ref2) {
      ruler = _ref2[property];
      if (this.indexes.indexOf(ruler.getAttribute('domain')) === -1) {
        ruler.setAttribute('hidden', 'hidden');
      } else {
        if (ruler.getAttribute('hidden') != null) {
          ruler.removeAttribute('hidden');
          offsetTop = 0;
          while (ruler) {
            offsetTop += ruler.offsetTop;
            ruler = ruler.offsetParent;
          }
          if ((top == null) || top > offsetTop) {
            top = offsetTop;
          }
        }
      }
    }
    if ((top != null) && scroll) {
      return window.scrollTo(0, top);
    }
  };

  Inspector.prototype.domains = function(domains) {
    var innerHTML, total,
      _this = this;
    if (!this.sheet) {
      this.stylesheet();
    }
    if (!this.list) {
      this.list = document.createElement('domains');
      this.list._gss = true;
      document.body.appendChild(this.list);
    }
    total = 0;
    innerHTML = domains.map(function(d) {
      var length, _ref;
      Inspector.uid || (Inspector.uid = 0);
      d.uid || (d.uid = ++Inspector.uid);
      length = ((_ref = d.constraints) != null ? _ref.length : void 0) || 0;
      total += length;
      return "<domain for=\"" + d.uid + "\" " + (_this.engine.console.level <= 1 && 'hidden') + " class=\"" + (d.displayName.toLowerCase()) + "\">" + length + "</domain>";
    }).join('');
    innerHTML += '<label> = <strong>' + total + '</strong></label>';
    return this.list.innerHTML = innerHTML;
  };

  Inspector.prototype.remap = function(domain) {
    var a, b, constraint, distances, _i, _len, _ref, _results;
    if (!(distances = domain.distances)) {
      distances = domain.distances = {};
      _ref = domain.constraints;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (a in constraint.operation.variables) {
            if (a.match(/width\]|height\]|\[\x]|\[\y\]|/)) {
              _results1.push((function() {
                var _results2;
                _results2 = [];
                for (b in constraint.operation.variables) {
                  if (b.match(/width\]|height\]|\[\x]|\[\y\]|/)) {
                    _results2.push(this.reach(distances, a, b));
                  } else {
                    _results2.push(void 0);
                  }
                }
                return _results2;
              }).call(this));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    }
  };

  Inspector.prototype.ruler = function(element, path, value, x, y, width, height, inside) {
    var bits, constraint, domain, id, konst, other, property, ruler, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    bits = path.split('[');
    id = bits[0];
    property = bits[1].split(']')[0];
    if (!(ruler = (this.rulers || (this.rulers = {}))[path])) {
      if (value == null) {
        return;
      }
      ruler = this.rulers[path] = document.createElement('ruler');
      ruler.className = property;
      ruler._gss = true;
      id = path.split('[')[0];
      ruler.setAttribute('for', id);
      ruler.setAttribute('property', path);
      ruler.setAttribute('title', path);
      ruler.removeAttribute('hidden');
    } else if (value == null) {
      if ((_ref = ruler.parentNode) != null) {
        _ref.removeChild(ruler);
      }
      delete this.rulers[path];
      return;
    }
    domain = void 0;
    _ref1 = this.engine.domains;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      other = _ref1[_i];
      if (other.values.hasOwnProperty(path) && other.displayName !== 'Solved') {
        domain = other;
        break;
      }
    }
    if (!domain) {
      if ((_ref2 = ruler.parentNode) != null) {
        _ref2.removeChild(ruler);
      }
      return;
    }
    ruler.setAttribute('domain', domain.uid);
    this.remap(domain);
    if (!(konst = typeof this.engine.variables[path] === 'string')) {
      _ref3 = domain.constraints;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        constraint = _ref3[_j];
        if (constraint.operation.variables[path] && Object.keys(constraint.operation.variables).length === 1) {
          konst = true;
          break;
        }
      }
    }
    if (konst) {
      ruler.classList.add('constant');
    } else {
      ruler.classList.remove('constant');
    }
    if (this.engine.values[path.replace('[', '[intrinsic-')] != null) {
      ruler.classList.add('intrinsic');
    } else {
      ruler.classList.remove('intrinsic');
    }
    if (inside) {
      ruler.classList.add('virtual');
    } else {
      ruler.classList.remove('virtual');
    }
    ruler.style.top = Math.floor(y) + 'px';
    ruler.style.left = Math.floor(x) + 'px';
    ruler.style.width = width + 'px';
    ruler.style.height = height + 'px';
    if (inside) {
      element.appendChild(ruler);
      if (property === 'height' && (this.engine.values[id + '[width]'] != null)) {
        return ruler.style.width = this.engine.values[id + '[width]'] + 'px';
      }
    } else {
      return element.parentNode.appendChild(ruler);
    }
  };

  Inspector.prototype.reach = function(distances, a, b, level) {
    var bc, c, _results;
    if (level == null) {
      level = 0;
    }
    (distances[a] || (distances[a] = {}))[b] = level;
    (distances[b] || (distances[b] = {}))[a] = level;
    _results = [];
    for (c in distances[a]) {
      bc = distances[b][c];
      if ((bc == null) || bc > level + 1) {
        _results.push(this.reach(distances, b, c, level + 1));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Inspector.prototype.draw = function(id, data) {
    var bits, clientLeft, clientTop, element, left, offsetLeft, offsetTop, prop, scope, top, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    if ((bits = id.split('"')).length > 1) {
      scope = bits[0];
    } else {
      scope = id;
    }
    if (((_ref = (element = this.engine.identity[scope])) != null ? _ref.nodeType : void 0) === 1) {
      if (scope !== id) {
        top = (_ref1 = data[scope + '[y]']) != null ? _ref1 : 0;
        left = (_ref2 = data[scope + '[x]']) != null ? _ref2 : 0;
        clientTop = (_ref3 = data[id + '[y]']) != null ? _ref3 : 0;
        clientLeft = (_ref4 = data[id + '[x]']) != null ? _ref4 : 0;
        offsetTop = top + clientTop;
        offsetLeft = left + clientLeft;
      } else {
        top = element.offsetTop;
        left = element.offsetLeft;
      }
      if ((_ref5 = element.offsetWidth !== data[scope + '[width]']) != null ? _ref5 : data[scope + '[intrinsic-width]']) {
        clientLeft = left + element.clientLeft;
      }
      if ((_ref6 = element.offsetHeight !== data[scope + '[height]']) != null ? _ref6 : data[scope + '[intrinsic-height]']) {
        clientTop = top + element.clientTop;
      }
    } else {
      element = document.body;
      left = (_ref7 = data[id + '[x]']) != null ? _ref7 : 0;
      top = (_ref8 = data[id + '[y]']) != null ? _ref8 : 0;
    }
    if (data.hasOwnProperty(prop = id + '[width]')) {
      this.ruler(element, prop, data[prop], clientLeft != null ? clientLeft : left, clientTop != null ? clientTop : top, data[prop], 0, scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[height]')) {
      this.ruler(element, prop, data[prop], clientLeft != null ? clientLeft : left, clientTop != null ? clientTop : top, 0, data[prop], scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[x]')) {
      this.ruler(element, prop, data[prop], (offsetLeft != null ? offsetLeft : left) - data[prop], offsetTop != null ? offsetTop : top, data[prop], 0, scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[y]')) {
      return this.ruler(element, prop, data[prop], offsetLeft != null ? offsetLeft : left, (offsetTop != null ? offsetTop : top) - data[prop], 0, data[prop], scope !== id);
    }
  };

  return Inspector;

})();

module.exports = Inspector;
