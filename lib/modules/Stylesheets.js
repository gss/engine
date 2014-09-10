var Stylesheets;

Stylesheets = (function() {
  function Stylesheets(engine) {
    this.engine = engine;
    this.watchers = {};
    this.sheets = {};
  }

  Stylesheets.prototype.compile = function() {
    this.engine.engine.solve('Document', 'stylesheets', [['eval', ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']], ['load', ['$attribute', ['$tag', 'link'], '*=', 'type', 'text/gss']]]);
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
      if (other !== needle) {
        if ((_ref1 = watchers[other]) != null ? _ref1.length : void 0) {
          needle = other;
          break;
        }
      }
    }
    return needle;
  };

  Stylesheets.prototype.getSelector = function(operation) {
    return this.engine.getOperationSelectors(operation).join(', ');
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
    var body, dump, index, item, needle, other, position, rules, selectors, sheet, watchers, _i, _j, _len, _len1;
    watchers = this.getWatchers(stylesheet);
    dump = this.getStylesheet(stylesheet);
    sheet = dump.sheet;
    needle = this.getOperation(operation, watchers, rule);
    position = 0;
    for (index = _i = 0, _len = watchers.length; _i < _len; index = ++_i) {
      item = watchers[index];
      if (index >= needle) {
        break;
      }
      if (item != null ? item.length : void 0) {
        position++;
      }
    }
    if (!sheet) {
      if (dump.parentNode) {
        dump.parentNode.removeChild(dump);
      }
      return;
    }
    rules = sheet.rules || sheet.cssRules;
    for (_j = 0, _len1 = rules.length; _j < _len1; _j++) {
      other = rules[_j];
      position -= other.style.length - 1;
    }
    if (needle !== operation.sourceIndex || value === '') {
      rule = rules[position];
      rule.style[property] = value;
      if (rule.style.length === 0) {
        sheet.deleteRule(position);
      }
    } else {
      body = property + ':' + value;
      selectors = this.getSelector(operation);
      index = sheet.insertRule(selectors + "{" + body + "}", position);
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
      this.update(operation, operation[1], '', stylesheet, this.getRule(operation));
      return console.log('lawl', index);
    }
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
              console.error('removeafdsdf', stylesheets, continuation, watchers.length, stylesheet, stylesheet.nextSibling);
            }
          }
        }
      }
    }
  };

  return Stylesheets;

})();

module.exports = Stylesheets;
