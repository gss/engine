var Command, Parser, Query, Stylesheet, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parser = require('ccss-compiler');

Command = require('../Command');

Query = require('../Query');

Stylesheet = (function(_super) {
  __extends(Stylesheet, _super);

  function Stylesheet() {
    _ref = Stylesheet.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Stylesheet.prototype.mimes = {
    "text/gss-ast": function(source) {
      return JSON.parse(source);
    },
    "text/gss": function(source) {
      var _ref1;
      return (_ref1 = Parser.parse(source)) != null ? _ref1.commands : void 0;
    }
  };

  Stylesheet.prototype.parse = function(engine, type, source) {
    var operations;
    if (type == null) {
      type = 'text/gss';
    }
    engine.console.push(type.split('/')[1], [source]);
    operations = engine.clone(this.mimes[type](source));
    if (typeof operations[0] === 'string') {
      operations = [operations];
    }
    engine.console.pop(operations);
    return operations;
  };

  Stylesheet.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command, index, _i, _len;
    this.users = (this.users || 0) + 1;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (argument != null ? argument.push : void 0) {
        if (argument.parent == null) {
          argument.parent = operation;
        }
        if (command = argument.command || engine.Command(argument)) {
          command.solve(engine, argument, continuation, scope);
        }
      }
    }
  };

  Stylesheet.operations = [['import', ['[*=]', ['tag', 'style'], 'type', 'gss']], ['import', ['[*=]', ['tag', 'link'], 'type', 'gss']]];

  Stylesheet.CanonicalizeSelectorRegExp = new RegExp("[$][a-z0-9]+[" + Command.prototype.DESCEND + "]\\s*", "gi");

  Stylesheet.prototype.update = function(engine, operation, property, value, stylesheet, rule) {
    var body, generated, index, item, needle, next, ops, other, previous, rules, selectors, sheet, text, watchers, _i, _j, _len, _ref1;
    watchers = this.getWatchers(engine, stylesheet);
    sheet = stylesheet.sheet;
    needle = this.getOperation(operation, watchers, rule);
    previous = [];
    for (index = _i = 0, _len = watchers.length; _i < _len; index = ++_i) {
      item = watchers[index];
      if (index >= needle) {
        break;
      }
      if (ops = watchers[index]) {
        other = this.getRule(watchers[ops[0]][0]);
        if (previous.indexOf(other) === -1) {
          previous.push(other);
        }
      }
    }
    if (!sheet) {
      if (stylesheet.parentNode) {
        stylesheet.parentNode.removeChild(stylesheet);
      }
      return;
    }
    rules = sheet.rules || sheet.cssRules;
    if (needle !== operation.index || value === '') {
      index = previous.length;
      generated = rules[index];
      text = generated.cssText;
      text = text.substring(0, text.lastIndexOf('}') - 1) + ';' + property + ':' + value + '}';
      sheet.deleteRule(index);
      index = sheet.insertRule(text, index);
      next = void 0;
      if (needle === operation.index) {
        needle++;
      }
      for (index = _j = needle, _ref1 = watchers.length; needle <= _ref1 ? _j < _ref1 : _j > _ref1; index = needle <= _ref1 ? ++_j : --_j) {
        if (ops = watchers[index]) {
          next = this.getRule(watchers[ops[0]][0]);
          if (next !== rule) {
            sheet.deleteRule(previous.length);
          }
          break;
        }
      }
      if (!next) {
        sheet.deleteRule(previous.length);
      }
    } else {
      body = property + ':' + value;
      selectors = this.getSelector(stylesheet, operation);
      index = sheet.insertRule(selectors + "{" + body + "}", previous.length);
    }
    return true;
  };

  Stylesheet.prototype.onClean = function(engine, operation, query, watcher, subscope) {
    if (this.users && !--this.users) {
      engine.Query.prototype.clean(engine, this.source);
      return engine.Query.prototype.unobserve(engine, this.source, this.delimit(query));
    }
  };

  Stylesheet.prototype.getRule = function(operation) {
    var rule;
    rule = operation;
    while (rule = rule.parent) {
      if (rule[0] === 'rule') {
        return rule;
      }
    }
  };

  Stylesheet.prototype.getStylesheet = function(engine, continuation) {
    var anchor, boundary, imported, index, path, prefix, sheet;
    path = continuation;
    boundary = path.lastIndexOf('@import');
    index = path.indexOf(this.DESCEND, boundary);
    if (boundary > -1) {
      prefix = this.getCanonicalSelector(path.substring(0, boundary));
      path = prefix + continuation.substring(boundary, index);
    } else {
      path = path.substring(0, index);
    }
    if (!(sheet = engine.stylesheets[path])) {
      if ((index = continuation.indexOf(this.DESCEND)) > -1) {
        continuation = continuation.substring(0, index);
      }
      sheet = engine.stylesheets[path] = document.createElement('STYLE');
      if (anchor = engine.Query.prototype.getByPath(engine, continuation)) {
        if (imported = engine.imported[anchor._gss_id]) {
          sheet.selectors = imported[path];
        }
        while (anchor = anchor.nextSibling) {
          if (!anchor.selectors) {
            break;
          }
        }
      }
      engine.stylesheets.push(sheet);
      engine.identify(sheet);
      if (anchor) {
        anchor.parentNode.insertBefore(sheet, anchor);
      } else {
        engine.scope.appendChild(sheet);
      }
    }
    return sheet;
  };

  Stylesheet.prototype.getWatchers = function(engine, stylesheet) {
    var _base, _name;
    return (_base = (stylesheet.assignments || (stylesheet.assignments = {})))[_name = stylesheet._gss_id] || (_base[_name] = []);
  };

  Stylesheet.prototype.getOperation = function(operation, watchers, rule) {
    var needle, other, _i, _len, _ref1, _ref2;
    needle = operation.index;
    _ref1 = rule.properties;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      other = _ref1[_i];
      if ((_ref2 = watchers[other]) != null ? _ref2.length : void 0) {
        needle = other;
        break;
      }
    }
    return needle;
  };

  Stylesheet.prototype.set = function(engine, operation, continuation, element, property, value) {
    var rule, stylesheet;
    if (rule = this.getRule(operation)) {
      if (stylesheet = this.getStylesheet(engine, continuation)) {
        if (this.watch(engine, operation, continuation, stylesheet)) {
          if (this.update(engine, operation, property, value, stylesheet, rule)) {
            engine.updating.restyled = true;
          }
        }
      }
      return true;
    }
  };

  Stylesheet.remove = function(engine, continuation) {
    var operation, operations, stylesheet, watchers, _i, _j, _len, _ref1;
    if (engine.stylesheets) {
      _ref1 = engine.stylesheets;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        stylesheet = _ref1[_i];
        if (watchers = this.prototype.getWatchers(engine, stylesheet)) {
          if (operations = watchers[continuation]) {
            for (_j = operations.length - 1; _j >= 0; _j += -1) {
              operation = operations[_j];
              this.prototype.unwatch(engine, operation, continuation, stylesheet, watchers);
            }
          }
        }
      }
    }
  };

  Stylesheet.prototype.watch = function(engine, operation, continuation, stylesheet) {
    var meta, watchers, _name;
    watchers = this.getWatchers(engine, stylesheet);
    meta = (watchers[_name = operation.index] || (watchers[_name] = []));
    if (meta.indexOf(continuation) > -1) {
      return;
    }
    (watchers[continuation] || (watchers[continuation] = [])).push(operation);
    return meta.push(continuation) === 1;
  };

  Stylesheet.prototype.unwatch = function(engine, operation, continuation, stylesheet, watchers) {
    var index, meta, observers;
    if (watchers == null) {
      watchers = this.getWatchers(engine, stylesheet);
    }
    index = operation.index;
    meta = watchers[index];
    meta.splice(meta.indexOf(continuation), 1);
    observers = watchers[continuation];
    observers.splice(observers.indexOf(operation), 1);
    if (!observers.length) {
      delete watchers[continuation];
    }
    if (!meta.length) {
      delete watchers[index];
      return this.update(engine, operation, operation[1], '', stylesheet, this.getRule(operation));
    }
  };

  Stylesheet["export"] = function() {
    var id, rule, sheet, style, text, _i, _len, _ref1, _ref2;
    sheet = [];
    _ref1 = engine.stylesheets;
    for (id in _ref1) {
      style = _ref1[id];
      _ref2 = style.sheet.rules || style.sheet.cssRules;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        rule = _ref2[_i];
        text = rule.cssText.replace(/\[matches~="(.*?)"\]/g, function(m, selector) {
          return selector.replace(/@[^↓]+/g, '').replace(/↓&/g, '').replace(/↓/g, ' ');
        });
        sheet.push(text);
      }
    }
    return sheet.join('');
  };

  Stylesheet.prototype.getSelector = function(stylesheet, operation) {
    return this.getSelectors(stylesheet, operation).join(', ');
  };

  Stylesheet.prototype.getSelectors = function(stylesheet, operation) {
    var custom, index, parent, result, results, wrapped, _i, _len;
    parent = operation;
    results = wrapped = custom = void 0;
    while (parent) {
      if (parent.command.type === 'Condition' && !parent.global) {
        if (results) {
          for (index = _i = 0, _len = results.length; _i < _len; index = ++_i) {
            result = results[index];
            results[index] = ' ' + this.getCustomSelector(parent.command.key, result);
          }
        }
      } else if (parent.command.type === 'Iterator') {
        results = this.combineSelectors(results, parent[1]);
      }
      if (!(parent = parent.parent) && (stylesheet != null ? stylesheet.selectors : void 0)) {
        results = this.combineSelectors(results, stylesheet);
      }
    }
    return results;
  };

  Stylesheet.empty = [''];

  Stylesheet.prototype.combineSelectors = function(results, operation) {
    var index, result, selector, update, _i, _j, _k, _len, _len1, _ref1, _ref2;
    if (results == null) {
      results = Stylesheet.empty;
    }
    update = [];
    for (index = _i = 0, _len = results.length; _i < _len; index = ++_i) {
      result = results[index];
      if (operation.selectors) {
        if (result.substring(0, 12) === ' [matches~="') {
          update.push(' ' + this.getCustomSelector(result.selector, result));
        } else {
          _ref1 = operation.selectors;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            selector = _ref1[_j];
            update.push(selector + result);
          }
        }
      } else if (result.substring(0, 12) === ' [matches~="') {
        update.push(' ' + this.getCustomSelector(operation.command.path, result));
      } else if (operation[0] === ',') {
        for (index = _k = 1, _ref2 = operation.length; _k < _ref2; index = _k += 1) {
          update.push(this.getRuleSelector(operation[index], operation.command) + result);
        }
      } else {
        update.push(this.getRuleSelector(operation) + result);
      }
    }
    return update;
  };

  Stylesheet.prototype.getRuleSelector = function(operation, parent) {
    var command, key, path;
    command = operation.command;
    path = command.path;
    if (path.charAt(0) === '&') {
      if ((key = path.substring(1)) === command.key) {
        return key;
      } else {
        return this.getCustomSelector((parent || command).path);
      }
    }
    if ((command.selector || command.key) === path) {
      return ' ' + path;
    } else {
      return ' ' + this.getCustomSelector((parent || command).path);
    }
  };

  Stylesheet.prototype.getCustomSelector = function(selector, suffix, prefix) {
    var DESCEND;
    DESCEND = this.DESCEND;
    selector = selector.replace(/\s+/g, DESCEND);
    if (suffix) {
      if (suffix.charAt(0) === ' ') {
        suffix = suffix.substring(1);
      }
      if (suffix.substring(0, 11) === '[matches~="') {
        suffix = DESCEND + suffix.substring(11);
      } else {
        suffix = DESCEND + suffix.replace(/\s+/g, DESCEND) + '"]';
      }
    } else {
      suffix = '"]';
    }
    return '[matches~="' + selector + suffix;
  };

  Stylesheet.prototype.getCanonicalSelector = function(selector) {
    selector = selector.trim();
    selector = selector.replace(Stylesheet.CanonicalizeSelectorRegExp, ' ').replace(/\s+/g, this.DESCEND);
    return selector;
  };

  Stylesheet.match = function(engine, node, continuation, value) {
    var append, i, index, remove, _base, _base1, _base2, _base3, _name, _name1, _ref1, _ref2;
    if (node.nodeType !== 1) {
      return;
    }
    if ((index = continuation.indexOf(this.prototype.DESCEND)) > -1) {
      continuation = continuation.substring(index + 1);
    }
    continuation = this.prototype.getCanonicalSelector(continuation).replace(/\s+/, this.prototype.DESCEND);
    if (value) {
      append = (_base = ((_base1 = engine.updating).matches || (_base1.matches = {})))[_name = node._gss_id] || (_base[_name] = []);
      remove = (_ref1 = engine.updating.unmatches) != null ? _ref1[node._gss_id] : void 0;
    } else {
      remove = (_ref2 = engine.updating.matches) != null ? _ref2[node._gss_id] : void 0;
      append = (_base2 = ((_base3 = engine.updating).unmatches || (_base3.unmatches = {})))[_name1 = node._gss_id] || (_base2[_name1] = []);
    }
    if (append && append.indexOf(continuation) === -1) {
      append.push(continuation);
    }
    if (remove && (i = remove.indexOf(continuation)) > -1) {
      return remove.splice(i, 1);
    }
  };

  Stylesheet.rematch = function(engine) {
    var bits, element, id, index, matches, tokens, unmatches, value, values, _i, _j, _len, _len1;
    if (matches = engine.updating.matches) {
      for (id in matches) {
        values = matches[id];
        element = engine.identity.get(id);
        if (tokens = element.getAttribute('matches')) {
          bits = tokens.split(' ');
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            if (bits.indexOf(value) === -1) {
              bits.push(value);
            }
          }
        } else {
          bits = values;
        }
        element.setAttribute('matches', bits.join(' '));
      }
      engine.matches = void 0;
    }
    if (unmatches = engine.updating.unmatches) {
      for (id in unmatches) {
        values = unmatches[id];
        element = engine.identity.get(id);
        if (tokens = element.getAttribute('matches')) {
          bits = tokens.split(' ');
          for (_j = 0, _len1 = values.length; _j < _len1; _j++) {
            value = values[_j];
            if ((index = bits.indexOf(value)) === -1) {
              bits.splice(index, 1);
            }
          }
        }
        if (matches && bits.length) {
          element.setAttribute('matches', bits.join(' '));
        } else {
          element.removeAttribute('matches');
        }
      }
      return engine.unmatches = void 0;
    }
  };

  Stylesheet.prototype.getKey = function(engine, operation, continuation, node) {
    if (!node && continuation && continuation.lastIndexOf(this.DESCEND) === -1) {
      return '';
    }
    return this.key;
  };

  Stylesheet.prototype["continue"] = function() {
    return Query.prototype["continue"].apply(this, arguments);
  };

  return Stylesheet;

})(Command.List);

Stylesheet.Import = (function(_super) {
  __extends(Import, _super);

  function Import() {
    _ref1 = Import.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Import.prototype.type = 'Import';

  Import.prototype.relative = true;

  Import.prototype.signature = [
    {
      'source': ['Selector', 'String', 'Node']
    }, [
      {
        'type': ['String'],
        'text': ['String']
      }
    ]
  ];

  Import.define({
    'directive': function(name, type, text, engine, operation, continuation, scope) {
      return Stylesheet.Import[name].prototype.execute(type, text, void 0, engine, operation, continuation, scope);
    },
    'import': function(node, type, method, engine, operation, continuation, scope) {
      var anchor, async, command, imported, index, left, path, src, stylesheet, text, _base, _name,
        _this = this;
      if (typeof node === 'string') {
        src = node;
        node = void 0;
      } else {
        if (!(src = this.getUrl(node))) {
          text = node.innerText || node.textContent;
        }
        type || (type = typeof node.getAttribute === "function" ? node.getAttribute('type') : void 0);
      }
      path = this.getGlobalPath(engine, operation, continuation, node);
      if (stylesheet = engine.queries[path]) {
        command = stylesheet.command;
        if (stylesheet.length) {
          stylesheet.splice(0);
          if (node.parentNode) {
            command.users = 0;
            this.uncontinuate(engine, path);
            if (text) {
              stylesheet.push.apply(stylesheet, command.parse(engine, type, text));
              this.continuate(engine, path);
              return;
            }
          } else {
            this.clean(engine, path);
            return;
          }
        }
      } else {
        stylesheet = [];
        command = stylesheet.command = new Stylesheet(engine, operation, continuation, node);
        command.key = this.getGlobalPath(engine, operation, continuation, node, 'import');
        command.source = path;
        if ((node != null ? node.getAttribute('scoped') : void 0) != null) {
          node.scoped = command.scoped = true;
        }
      }
      if ((index = continuation.indexOf(this.DESCEND)) > -1) {
        left = continuation.substring(0, index);
        if (anchor = engine.Query.prototype.getByPath(engine, left)) {
          if (anchor.tagName === 'STYLE') {
            left = engine.Stylesheet.prototype.getCanonicalSelector(continuation) + command.key;
            imported = (_base = engine.imported)[_name = anchor._gss_id] || (_base[_name] = {});
            imported[left] = engine.Stylesheet.prototype.getSelectors(null, operation);
          }
        }
      }
      if (text) {
        stylesheet.push.apply(stylesheet, command.parse(engine, type, text));
      } else if (!command.resolver) {
        engine.updating.block(engine);
        command.resolver = function(text) {
          command.resolver = void 0;
          stylesheet.push.apply(stylesheet, command.parse(engine, type, text));
          _this.continuate(engine, command.source);
          if (engine.updating.unblock(engine) && async) {
            return engine.engine.commit();
          }
        };
        this.resolve(src, method, command.resolver);
        async = true;
      }
      return stylesheet;
    }
  });

  Import.prototype.resolve = function(url, method, callback) {
    var xhr,
      _this = this;
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        return callback(xhr.responseText);
      }
    };
    xhr.open(method && method.toUpperCase() || 'GET', url);
    return xhr.send();
  };

  Import.prototype.after = function(args, result, engine, operation, continuation, scope) {
    var contd, node, path, _ref2;
    if (result == null) {
      return result;
    }
    node = ((_ref2 = args[0]) != null ? _ref2.nodeType : void 0) === 1 ? args[0] : scope;
    path = result.command.source;
    this.set(engine, path, result);
    contd = this.delimit(continuation, this.DESCEND);
    this.subscribe(engine, result, contd, scope, path);
    this.subscribe(engine, result, contd, scope, node);
    if (result.command.users === 0) {
      this.continuate(engine, path);
    }
    return result;
  };

  Import.prototype.ascend = function(engine, operation, continuation, scope, result) {
    if (result.length === 0) {
      return;
    }
    this.schedule(engine, result, this.delimit(continuation, this.DESCEND), scope);
  };

  Import.prototype.write = function(engine, operation, continuation, scope, node) {
    return true;
  };

  Import.prototype.getUrl = function(node) {
    return node.getAttribute('href') || node.getAttribute('src');
  };

  Import.prototype.getId = function(node) {
    return this.getUrl(node) || node._gss_id;
  };

  Import.prototype.formatId = function(id) {
    var i;
    if ((i = id.lastIndexOf('/')) > -1) {
      id = id.substring(i + 1);
    }
    return id;
  };

  Import.prototype.getLocalPath = function(engine, operation, continuation, node) {
    return this.getGlobalPath(engine, operation, continuation, node);
  };

  Import.prototype.getGlobalPath = function(engine, operation, continuation, node, command) {
    var id, index;
    if (command == null) {
      command = 'parse';
    }
    index = operation[0] === 'directive' && 2 || 1;
    if (typeof operation[index] === 'string') {
      id = operation[index];
    } else {
      if ((node == null) && continuation) {
        node = this.getByPath(engine, continuation);
      }
      id = this.getId(node);
    }
    return '@' + command + '(' + this.formatId(id) + ')';
  };

  return Import;

})(Query);

module.exports = Stylesheet;
