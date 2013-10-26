var LOG, observer, styleQuery, _containersToLoad,
  __slice = [].slice;

LOG = function() {
  if (GSS.config.debug) {
    return console.log.apply(console, ["Observer"].concat(__slice.call(arguments)));
  }
};

_containersToLoad = null;

styleQuery = GSS.styleQuery = new GSS.Query({
  selector: "style",
  isLive: true,
  isMulti: true,
  createNodeList: function() {
    return document.getElementsByTagName("style");
  },
  afterChange: function() {
    var container, id, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
    LOG("afterChange");
    _containersToLoad = [];
    if (this.changedLastUpdate) {
      _ref = this.lastAddedIds;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        node = GSS.getById(id);
        if (GSS.getter.isStyleNode(node)) {
          container = GSS.getter.getEngineContainerForStyleNode(node);
          if (_containersToLoad.indexOf(container) === -1 && container) {
            _containersToLoad.push(GSS.getter.getEngineContainerForStyleNode(node));
          }
        }
      }
      _ref1 = this.lastRemovedIds;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        id = _ref1[_j];
        node = GSS.getById(id);
        if (GSS.getter.isStyleNode(node)) {
          container = GSS.getter.getEngineContainerForStyleNode(node);
          if (_containersToLoad.indexOf(container) === -1 && ((container != null ? container.parentNode : void 0) != null)) {
            _containersToLoad.push(container);
          }
        }
      }
      _results = [];
      for (_k = 0, _len2 = _containersToLoad.length; _k < _len2; _k++) {
        container = _containersToLoad[_k];
        LOG("afterUpdate containerToLoad", container);
        _results.push(GSS(container).loadAndRun());
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
        if (node._gss_is_container) {
          GSS.getEngine(node).destroy();
        }
        /*
        # containers with removed ASTs
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if containersToLoad.indexOf(container) is -1 and container
            containersToLoad.push container
        */

      }
    }
    /*
    # els removed from container
    if m.addedNodes.length > 0 # nodelist are weird?
      for node in m.addedNodes        
        # containers with new ASTs        
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if containersToLoad.indexOf(container) is -1
            containersToLoad.push container
    
    for container in containersToLoad
      GSS(container).loadAndRun()
    */

  }
  return styleQuery.update();
});

GSS.loadAndRun = function() {
  var container, containersToLoad, node, _i, _j, _len, _len1, _ref, _results;
  containersToLoad = [];
  _ref = GSS.getter.getAllStyleNodes();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    node = _ref[_i];
    if (GSS.getter.isStyleNode(node)) {
      container = GSS.getter.getEngineContainerForStyleNode(node);
      if (containersToLoad.indexOf(container) === -1) {
        containersToLoad.push(container);
      }
    }
  }
  _results = [];
  for (_j = 0, _len1 = containersToLoad.length; _j < _len1; _j++) {
    container = containersToLoad[_j];
    _results.push(GSS(container).loadAndRun());
  }
  return _results;
};

document.addEventListener("DOMContentLoaded", function(e) {
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
