var LOG, observer, setupObserver, _unobservedElements,
  __slice = [].slice;

LOG = function() {
  return GSS.deblog.apply(GSS, ["Observer"].concat(__slice.call(arguments)));
};

observer = null;

GSS.is_observing = false;

GSS.observe = function() {
  if (!GSS.is_observing && GSS.config.observe) {
    observer.observe(document.body, GSS.config.observerOptions);
    return GSS.is_observing = true;
  }
};

GSS.unobserve = function() {
  observer.disconnect();
  return GSS.is_observing = false;
};

GSS._unobservedElements = _unobservedElements = [];

GSS.observeElement = function(el) {
  if (_unobservedElements.indexOf(el) === -1) {
    return _unobservedElements.push(el);
  }
};

GSS.unobserveElement = function(el) {
  var i;
  i = _unobservedElements.indexOf(el);
  if (i > -1) {
    return _unobservedElements.splice(i, 1);
  }
};

setupObserver = function() {
  if (!window.MutationObserver) {
    if (window.WebKitMutationObserver) {
      window.MutationObserver = window.WebKitMutationObserver;
    } else {
      window.MutationObserver = window.JsMutationObserver;
    }
  }
  return observer = new MutationObserver(function(mutations) {
    var e, engine, enginesToReset, gid, i, invalidMeasureIds, m, needsUpdateQueries, nodesToIgnore, observableMutation, removed, scope, sheet, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref;
    LOG("MutationObserver", mutations);
    enginesToReset = [];
    nodesToIgnore = [];
    needsUpdateQueries = [];
    invalidMeasureIds = [];
    observableMutation = false;
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      m = mutations[_i];
      if (_unobservedElements.indexOf(m.target) !== -1) {
        continue;
      } else {
        observableMutation = true;
      }
      if (m.type === "characterData") {
        if (!m.target.parentElement) {
          continue;
        }
        sheet = m.target.parentElement.gssStyleSheet;
        if (sheet) {
          sheet.reinstall();
          e = sheet.engine;
          if (enginesToReset.indexOf(e) === -1) {
            enginesToReset.push(e);
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
    if (!observableMutation) {
      return null;
    }
    removed = GSS.styleSheets.findAllRemoved();
    for (_j = 0, _len1 = removed.length; _j < _len1; _j++) {
      sheet = removed[_j];
      sheet.destroy();
      e = sheet.engine;
      if (enginesToReset.indexOf(e) === -1) {
        enginesToReset.push(e);
      }
    }
    i = 0;
    engine = GSS.engines[i];
    while (!!engine) {
      if (i > 0) {
        if (engine.scope) {
          if (!document.documentElement.contains(engine.scope)) {
            engine.destroyChildren();
            engine.destroy();
          }
        }
      }
      i++;
      engine = GSS.engines[i];
    }
    for (_k = 0, _len2 = enginesToReset.length; _k < _len2; _k++) {
      e = enginesToReset[_k];
      if (!e.is_destroyed) {
        e.reset();
      }
    }
    for (_l = 0, _len3 = needsUpdateQueries.length; _l < _len3; _l++) {
      scope = needsUpdateQueries[_l];
      e = GSS.get.engine(scope);
      if (e) {
        if (!e.is_destroyed) {
          if (enginesToReset.indexOf(e) === -1) {
            e.updateQueries();
          }
        }
      }
    }
    if (invalidMeasureIds.length > 0) {
      _ref = GSS.engines;
      for (_m = 0, _len4 = _ref.length; _m < _len4; _m++) {
        e = _ref[_m];
        if (!e.is_destroyed) {
          e.commander.handleInvalidMeasures(invalidMeasureIds);
        }
      }
    }
    enginesToReset = null;
    nodesToIgnore = null;
    needsUpdateQueries = null;
    invalidMeasureIds = null;
    return GSS.load();
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

  });
};

GSS.isDisplayed = false;

GSS.onDisplay = function() {
  GSS.trigger("display");
  if (GSS.isDisplayed) {
    return;
  }
  GSS.isDisplayed = true;
  if (GSS.config.readyClass) {
    GSS.html.classList.add("gss-ready");
    return GSS.html.classList.remove("gss-not-ready");
  }
};

document.addEventListener("DOMContentLoaded", function(e) {
  var html;
  GSS.body = document.body || GSS.getElementsByTagName('body')[0];
  GSS.html = html = GSS.body.parentNode;
  document.dispatchEvent(new CustomEvent('GSS', {
    detail: GSS,
    bubbles: false,
    cancelable: false
  }));
  setupObserver();
  GSS.boot();
  LOG("DOMContentLoaded");
  GSS.load();
  GSS.observe();
  return GSS.trigger("afterLoaded");
});

module.exports = observer;
