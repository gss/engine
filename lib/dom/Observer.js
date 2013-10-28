var LOG, observer, styleQuery, _scopesToLoad,
  __slice = [].slice;

LOG = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, ["Observer"].concat(__slice.call(arguments)));
  }
};

_scopesToLoad = null;

styleQuery = GSS.styleQuery = new GSS.Query({
  selector: "style",
  isLive: true,
  isMulti: true,
  createNodeList: function() {
    return document.getElementsByTagName("style");
  },
  afterChange: function() {
    var id, node, scope, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
    LOG("afterChange");
    _scopesToLoad = [];
    if (this.changedLastUpdate) {
      _ref = this.lastAddedIds;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        node = GSS.getById(id);
        if (GSS.get.isStyleNode(node)) {
          scope = GSS.get.scopeForStyleNode(node);
          if (_scopesToLoad.indexOf(scope) === -1 && scope) {
            _scopesToLoad.push(GSS.get.scopeForStyleNode(node));
          }
        }
      }
      _ref1 = this.lastRemovedIds;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        id = _ref1[_j];
        node = GSS.getById(id);
        if (GSS.get.isStyleNode(node)) {
          scope = GSS.get.scopeForStyleNode(node);
          if (_scopesToLoad.indexOf(scope) === -1 && ((scope != null ? scope.parentNode : void 0) != null)) {
            _scopesToLoad.push(scope);
          }
        }
      }
      _results = [];
      for (_k = 0, _len2 = _scopesToLoad.length; _k < _len2; _k++) {
        scope = _scopesToLoad[_k];
        LOG("afterUpdate scopeToLoad", scope);
        _results.push(GSS(scope).loadAndRun());
      }
      return _results;
    }
  }
});

if (!window.MutationObserver) {
  window.MutationObserver = window.JsMutationObserver;
}

observer = new MutationObserver(function(mutations) {
  var m, node, _i, _j, _len, _len1, _ref;
  LOG("MutationObserver");
  for (_i = 0, _len = mutations.length; _i < _len; _i++) {
    m = mutations[_i];
    if (m.removedNodes.length > 0) {
      _ref = m.removedNodes;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        node = _ref[_j];
        if (node._gss_is_scope) {
          GSS.getEngine(node).destroy();
        }
        /*
        # scopes with removed ASTs
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if scopesToLoad.indexOf(scope) is -1 and scope
            scopesToLoad.push scope
        */

      }
    }
    /*
    # els removed from scope
    if m.addedNodes.length > 0 # nodelist are weird?
      for node in m.addedNodes        
        # scopes with new ASTs        
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if scopesToLoad.indexOf(scope) is -1
            scopesToLoad.push scope
    
    for scope in scopesToLoad
      GSS(scope).loadAndRun()
    */

  }
  return styleQuery.update();
});

GSS.loadAndRun = function() {
  var node, scope, scopesToLoad, _i, _j, _len, _len1, _ref, _results;
  scopesToLoad = [];
  _ref = GSS.get.getAllStyleNodes();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    if (GSS.get.isStyleNode(node)) {
      scope = GSS.get.scopeForStyleNode(node);
      if (scopesToLoad.indexOf(scope) === -1) {
        scopesToLoad.push(scope);
      }
    }
  }
  _results = [];
  for (_j = 0, _len1 = scopesToLoad.length; _j < _len1; _j++) {
    scope = scopesToLoad[_j];
    _results.push(GSS(scope).loadAndRun());
  }
  return _results;
};

document.addEventListener("DOMContentLoaded", function(e) {
  GSS.boot();
  LOG("DOMContentLoaded");
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  });
  return styleQuery.update();
});

module.exports = observer;
