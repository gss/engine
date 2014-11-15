var Stylesheets;

Stylesheets = (function() {
  function Stylesheets(engine) {
    this.engine = engine;
    this.watchers = {};
    this.sheets = {};
  }

  Stylesheets.prototype.initialize = [['eval', ['[*=]', ['tag', 'style'], 'type', 'text/gss']], ['load', ['[*=]', ['tag', 'link'], 'type', 'text/gss']]];

  Stylesheets.prototype.compile = function() {
    this.CleanupSelectorRegExp = new RegExp(this.engine.Continuation.DESCEND, 'g');
    this.engine.engine.solve('Document', 'stylesheets', this.initialize);
    this.inline = this.engine.queries['style[type*="text/gss"]'];
    this.remote = this.engine.queries['link[type*="text/gss"]'];
    return this.collections = [this.inline, this.remote];
  };

  Stylesheets.prototype.getRule = function(operation) {
    var rule;
    rule = operation;
    while (rule = rule.parent) {
      if (rule.name === 'rule') {
        return rule;
      }
    }
  };

  Stylesheets.prototype.getStylesheet = function(stylesheet) {
    var sheet;
    if (!(sheet = this.sheets[stylesheet._gss_id])) {
      sheet = this.sheets[stylesheet._gss_id] = document.createElement('STYLE');
      stylesheet.parentNode.insertBefore(sheet, stylesheet.nextSibling);
    }
    return sheet;
  };

  Stylesheets.prototype.getWatchers = function(stylesheet) {
    var _base, _name;
    return (_base = this.watchers)[_name = stylesheet._gss_id] || (_base[_name] = []);
  };

  Stylesheets.prototype.getOperation = function(operation, watchers, rule) {
    var needle, other, _i, _len, _ref, _ref1;
    needle = operation.sourceIndex;
    _ref = rule.properties;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      other = _ref[_i];
      if ((_ref1 = watchers[other]) != null ? _ref1.length : void 0) {
        needle = other;
        break;
      }
    }
    return needle;
  };

  Stylesheets.prototype.solve = function(stylesheet, operation, continuation, element, property, value) {
    var rule;
    if (rule = this.getRule(operation)) {
      if (this.watch(operation, continuation, stylesheet)) {
        if (this.update(operation, property, value, stylesheet, rule)) {
          this.engine.engine.restyled = true;
        }
      }
      return true;
    }
  };

  Stylesheets.prototype.update = function(operation, property, value, stylesheet, rule) {
    var body, dump, generated, index, item, needle, next, ops, other, previous, rules, selectors, sheet, watchers, _i, _j, _len, _ref;
    watchers = this.getWatchers(stylesheet);
    dump = this.getStylesheet(stylesheet);
    sheet = dump.sheet;
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
      if (dump.parentNode) {
        dump.parentNode.removeChild(dump);
      }
      return;
    }
    rules = sheet.rules || sheet.cssRules;
    if (needle !== operation.sourceIndex || value === '') {
      generated = rules[previous.length];
      generated.style[property] = value;
      next = void 0;
      if (needle === operation.sourceIndex) {
        needle++;
      }
      for (index = _j = needle, _ref = watchers.length; needle <= _ref ? _j < _ref : _j > _ref; index = needle <= _ref ? ++_j : --_j) {
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
      selectors = this.getSelector(operation);
      index = sheet.insertRule(selectors + "{" + body + "}", previous.length);
    }
    return true;
  };

  Stylesheets.prototype.watch = function(operation, continuation, stylesheet) {
    var meta, watchers, _name;
    watchers = this.getWatchers(stylesheet);
    meta = (watchers[_name = operation.sourceIndex] || (watchers[_name] = []));
    if (meta.indexOf(continuation) > -1) {
      return;
    }
    (watchers[continuation] || (watchers[continuation] = [])).push(operation);
    return meta.push(continuation) === 1;
  };

  Stylesheets.prototype.unwatch = function(operation, continuation, stylesheet, watchers) {
    var index, meta, observers;
    if (watchers == null) {
      watchers = this.getWatchers(stylesheet);
    }
    index = operation.sourceIndex;
    meta = watchers[index];
    meta.splice(meta.indexOf(continuation), 1);
    observers = watchers[continuation];
    observers.splice(observers.indexOf(operation), 1);
    if (!observers.length) {
      delete watchers[continuation];
    }
    if (!meta.length) {
      delete watchers[index];
      return this.update(operation, operation[1], '', stylesheet, this.getRule(operation));
    }
  };

  Stylesheets.prototype["export"] = function() {
    var id, rule, sheet, style, text, _i, _len, _ref, _ref1;
    sheet = [];
    _ref = this.sheets;
    for (id in _ref) {
      style = _ref[id];
      _ref1 = style.sheet.rules || style.sheet.cssRules;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        rule = _ref1[_i];
        text = rule.cssText.replace(/\[matches~="(.*?)"\]/g, function(m, selector) {
          return selector.replace(/@\d+/g, '').replace(/↓/g, ' ');
        });
        sheet.push(text);
      }
    }
    return sheet.join('');
  };

  Stylesheets.prototype.remove = function(continuation, stylesheets) {
    var collection, operation, operations, stylesheet, watchers, _i, _j, _k, _len, _len1, _ref;
    if (this.collections) {
      _ref = this.collections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        collection = _ref[_i];
        for (_j = 0, _len1 = collection.length; _j < _len1; _j++) {
          stylesheet = collection[_j];
          if (watchers = this.getWatchers(stylesheet)) {
            if (operations = watchers[continuation]) {
              for (_k = operations.length - 1; _k >= 0; _k += -1) {
                operation = operations[_k];
                this.unwatch(operation, continuation, stylesheet, watchers);
              }
            }
          }
        }
      }
    }
  };

  Stylesheets.prototype.getSelector = function(operation) {
    return this.getSelectors(operation).join(', ');
  };

  Stylesheets.prototype.getSelectors = function(operation) {
    var bit, bits, custom, groups, index, parent, paths, result, results, selectors, update, wrapped, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref,
      _this = this;
    parent = operation;
    results = wrapped = custom = void 0;
    while (parent) {
      if (parent.name === 'if') {
        if (parent.uid) {
          if (results) {
            for (index = _i = 0, _len = results.length; _i < _len; index = ++_i) {
              result = results[index];
              if (result.substring(0, 11) !== '[matches~="') {
                result = this.getCustomSelector(result);
              }
              results[index] = result.substring(0, 11) + parent.uid + this.engine.Continuation.DESCEND + result.substring(11);
            }
          }
        }
      } else if (parent.name === 'rule') {
        selectors = parent[1].path;
        if (parent[1][0] === ',') {
          paths = parent[1].slice(1).map(function(item) {
            return !item.marked && item.groupped || item.path;
          });
        } else {
          paths = [parent[1].path];
        }
        groups = (_ref = parent[1].groupped && parent[1].groupped.split(',')) != null ? _ref : paths;
        if (results != null ? results.length : void 0) {
          bits = selectors.split(',');
          update = [];
          for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
            result = results[_j];
            if (result.substring(0, 11) === '[matches~="') {
              update.push(result.substring(0, 11) + selectors + this.engine.Continuation.DESCEND + result.substring(11));
            } else {
              for (index = _k = 0, _len2 = bits.length; _k < _len2; index = ++_k) {
                bit = bits[index];
                if (groups[index] !== bit) {
                  update.push(this.getCustomSelector(selectors) + ' ' + result);
                } else {
                  update.push(bit + ' ' + result);
                }
              }
            }
          }
          results = update;
        } else {
          results = selectors.split(',').map(function(path, index) {
            if (path !== groups[index]) {
              return _this.getCustomSelector(selectors);
            } else {
              return path;
            }
          });
        }
      }
      parent = parent.parent;
    }
    for (index = _l = 0, _len3 = results.length; _l < _len3; index = ++_l) {
      result = results[index];
      results[index] = results[index].replace(this.CleanupSelectorRegExp, '');
    }
    return results;
  };

  Stylesheets.prototype.getCustomSelector = function(selector) {
    return '[matches~="' + selector.replace(/\s+/, this.engine.Continuation.DESCEND) + '"]';
  };

  return Stylesheets;

})();

module.exports = Stylesheets;
