var observer;

if (!window.MutationObserver) {
  window.MutationObserver = window.JsMutationObserver;
}

observer = new MutationObserver(function(mutations) {
  var container, containersToLoad, m, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
  containersToLoad = [];
  _results = [];
  for (_i = 0, _len = mutations.length; _i < _len; _i++) {
    m = mutations[_i];
    if (m.removedNodes.length > 0) {
      _ref = m.removedNodes;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        node = _ref[_j];
        if (node._gss_is_container) {
          GSS.getEngine(node).destroy();
        }
        if (GSS.getter.hasAST(node)) {
          container = GSS.getter.getEngineForStyleNode(node);
          if (containersToLoad.indexOf(container) === -1 && container) {
            containersToLoad.push(container);
          }
        }
      }
    }
    if (m.addedNodes.length > 0) {
      _ref1 = m.addedNodes;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        node = _ref1[_k];
        if (GSS.getter.hasAST(node)) {
          container = GSS.getter.getEngineForStyleNode(node);
          if (containersToLoad.indexOf(container) === -1) {
            containersToLoad.push(container);
          }
        }
      }
    }
    _results.push((function() {
      var _l, _len3, _results1;
      _results1 = [];
      for (_l = 0, _len3 = containersToLoad.length; _l < _len3; _l++) {
        container = containersToLoad[_l];
        console.log(container);
        _results1.push(GSS(container).loadAndRun());
      }
      return _results1;
    })());
  }
  return _results;
});

document.addEventListener("DOMContentLoaded", function(e) {
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  });
  return GSS.loadAndRun();
});

module.exports = observer;
