var Observer;

Observer = (function() {
  function Observer(object) {
    this.object = object;
    if (!window.MutationObserver) {
      if (window.WebKitMutationObserver) {
        window.MutationObserver = window.WebKitMutationObserver;
      } else {
        window.MutationObserver = window.JsMutationObserver;
      }
    }
    if (!window.MutationObserver) {
      return;
    }
    this.watchers = {};
    this.observer = new MutationObserver(this.listen.bind(this));
    this.observer.observe(document.body, GSS.config.observerOptions);
  }

  Observer.prototype.update = function(node, command, key, added, removed) {
    var commands, group, id, index, operation, watcher, watchers, _i, _len;
    if (!(id = node._gss_id)) {
      return;
    }
    if (!(watchers = this.watchers[id])) {
      return;
    }
    return;
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 2) {
      operation = watchers[index];
      if (commands = operation.commands) {
        if (group = commands[command]) {
          return;
        }
      }
      if (watcher.name === command) {
        this.evaluate(watcher);
      }
      watcher = watcher[1];
    }
  };

  Observer.prototype.add = function(node, operation, continuation) {
    var id;
    console.log(node, operation);
    if (id = this.object.toId(node)) {
      return (this[id] || (this[id] = [])).push(operation, continuation);
    }
  };

  Observer.prototype.listen = function(mutations) {
    var add, added, allAdded, allRemoved, child, firstNext, firstPrev, klasses, kls, mutation, next, old, parent, prev, remove, removed, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _results;
    console.log('observer', mutations);
    _results = [];
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      mutation = mutations[_i];
      target = parent = mutation.target;
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName === 'class') {
            klasses = parent.classList;
            old = mutation.oldValue.split(' ');
            added = [];
            removed = [];
            for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
              kls = old[_j];
              if (!(kls && klasses.contains(kls))) {
                removed.push(kls);
              }
            }
            for (_k = 0, _len2 = klasses.length; _k < _len2; _k++) {
              kls = klasses[_k];
              if (!(kls && old.contains(kls))) {
                added.push(kls);
              }
            }
            while (parent.nodeType === 1) {
              for (_l = 0, _len3 = added.length; _l < _len3; _l++) {
                add = added[_l];
                this.update(parent, '$class', add, target, void 0);
              }
              for (_m = 0, _len4 = removed.length; _m < _len4; _m++) {
                remove = removed[_m];
                this.update(parent, '$class', remove, void 0, target);
              }
              parent = parent.parentNode;
            }
            parent = target;
          }
          _results.push((function() {
            var _results1;
            _results1 = [];
            while (parent.nodeType === 1) {
              this.update(parent, '$attribute', mutation.attributeName, target, void 0);
              _results1.push(parent = parent.parentNode);
            }
            return _results1;
          }).call(this));
          break;
        case "childList":
          added = mutation.addedNodes;
          removed = mutation.removedNodes;
          prev = next = mutation;
          firstPrev = firstNext = true;
          while ((prev = prev.previousSibling)) {
            if (prev.nodeType === 1) {
              if (!firstPrev) {
                this.update(prev, '+', added[0], removed[0]);
                this.update(prev, '++', added[0], removed[0]);
                firstPrev = false;
              }
              this.update(prev, '~', added, removed);
              this.update(prev, '~~', added, removed);
            }
          }
          while ((next = next.nextSibling)) {
            if (next.nodeType === 1) {
              if (!firstNext) {
                this.update(prev, '!+', added[added.length - 1], removed[removed.length - 1]);
                this.update(prev, '++', added[added.length - 1], removed[removed.length - 1]);
                firstNext = false;
              }
              this.update(prev, '!~', added, removed);
              this.update(prev, '~~', added, removed);
            }
          }
          this.update(parent, '>', added, removed);
          allAdded = [];
          for (_n = 0, _len5 = added.length; _n < _len5; _n++) {
            child = added[_n];
            this.update(child, '!>', parent);
            allAdded.push(child);
            allAdded.push.apply(allAdded, child.getElementsByTagName('*'));
          }
          allRemoved = [];
          for (_o = 0, _len6 = removed.length; _o < _len6; _o++) {
            child = removed[_o];
            this.update(child, '!>', void 0, parent);
            allRemoved.push(child);
            allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'));
          }
          _results.push((function() {
            var _len7, _len8, _p, _q, _results1;
            _results1 = [];
            while (parent && parent.nodeType === 1) {
              this.update(parent, ' ', allAdded, allRemoved);
              for (_p = 0, _len7 = allAdded.length; _p < _len7; _p++) {
                child = allAdded[_p];
                this.update(child, '!', parent, parent);
              }
              for (_q = 0, _len8 = allRemoved.length; _q < _len8; _q++) {
                child = allRemoved[_q];
                this.update(child, '!', parent, void 0, parent);
              }
              _results1.push(parent = parent.parentNode);
            }
            return _results1;
          }).call(this));
          break;
        default:
          _results.push(void 0);
      }
    }
    return _results;
  };

  return Observer;

})();

module.exports = Observer;
