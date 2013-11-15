var LOG, observer, setupObserver,
  __slice = [].slice;

LOG = function() {
  return GSS.deblog.apply(GSS, ["Observer"].concat(__slice.call(arguments)));
};

observer = null;

setupObserver = function() {
  if (!window.MutationObserver) {
    if (window.WebKitMutationObserver) {
      window.MutationObserver = window.WebKitMutationObserver;
    } else {
      window.MutationObserver = window.JsMutationObserver;
    }
  }
  return observer = new MutationObserver(function(mutations) {
    var engine, gid, invalidMeasureIds, m, needsUpdateQueries, nodesToIgnore, scope, scopesToLoad, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
    LOG("MutationObserver");
    scopesToLoad = [];
    nodesToIgnore = [];
    needsUpdateQueries = [];
    invalidMeasureIds = [];
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      m = mutations[_i];
      if (m.type === "characterData") {
        if (GSS.get.isStyleNode(m.target.parentElement)) {
          scope = GSS.get.scopeForStyleNode(m.target.parentElement);
          if (scopesToLoad.indexOf(scope) === -1) {
            scopesToLoad.push(scope);
          }
        }
      }
      if (m.type === "attributes" || m.type === "childList") {
        if (m.type === "attributes" && m.attributename === "data-gss-id") {
          nodesToIgnore.push(m.target);
        } else if (nodesToIgnore.indexOf(m.target) === -1) {
          scope = GSS.get.nearestScope(m.target);
          if (scope) {
            if (needsUpdateQueries.indexOf(scope) === -1) {
              needsUpdateQueries.push(scope);
            }
          }
        }
      }
      gid = null;
      if (m.type === "characterData" || m.type === "attributes" || m.type === "childList") {
        if (m.type === "characterData") {
          target = m.target.parentElement;
          gid = "$" + GSS.getId(m.target.parentElement);
        } else if (nodesToIgnore.indexOf(m.target) === -1) {
          gid = "$" + GSS.getId(m.target);
        }
        if (gid != null) {
          if (invalidMeasureIds.indexOf(gid) === -1) {
            invalidMeasureIds.push(gid);
          }
        }
      }
    }
    for (_j = 0, _len1 = scopesToLoad.length; _j < _len1; _j++) {
      scope = scopesToLoad[_j];
      GSS.get.engine(scope).load();
    }
    for (_k = 0, _len2 = needsUpdateQueries.length; _k < _len2; _k++) {
      scope = needsUpdateQueries[_k];
      if (scopesToLoad.indexOf(scope) === -1) {
        GSS.get.engine(scope).updateQueries();
      }
    }
    if (invalidMeasureIds.length > 0) {
      _ref = GSS.engines;
      for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
        engine = _ref[_l];
        engine.commander.handleInvalidMeasures(invalidMeasureIds);
      }
    }
    scopesToLoad = null;
    nodesToIgnore = null;
    needsUpdateQueries = null;
    invalidMeasureIds = null;
    /*
    for m in mutations
      # els removed from scope
      if m.removedNodes.length > 0 # nodelist are weird?
        for node in m.removedNodes
          # destroy engines
          if node._gss_is_scope
            GSS.get.engine(node).destroy()      
        
          ## scopes with removed ASTs
          #if GSS.get.isStyleNode node
          #  scope = GSS.get.scopeForStyleNode node
          #  if scopesToLoad.indexOf(scope) is -1 and scope
          #    scopesToLoad.push scope  
          #
        
    
      ## els removed from scope
      #if m.addedNodes.length > 0 # nodelist are weird?
      #  for node in m.addedNodes        
      #    # scopes with new ASTs        
      #    if GSS.get.isStyleNode node
      #      scope = GSS.get.scopeForStyleNode node
      #      if scopesToLoad.indexOf(scope) is -1
      #        scopesToLoad.push scope
      #
      #for scope in scopesToLoad
      #  GSS(scope).load()
    */

    return GSS.load();
  });
};

GSS.is_observing = false;

GSS.observe = function() {
  if (!GSS.is_observing && GSS.config.observe) {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });
    return GSS.is_observing = true;
  }
};

GSS.unobserve = function() {
  observer.disconnect();
  return GSS.is_observing = false;
};

document.addEventListener("DOMContentLoaded", function(e) {
  setupObserver();
  GSS.boot();
  LOG("DOMContentLoaded");
  GSS.load();
  GSS.observe();
  return GSS.trigger("afterLoaded");
});

module.exports = observer;
