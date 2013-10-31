var LOG, observer,
  __slice = [].slice;

LOG = function() {
  return GSS.deblog.apply(GSS, ["Observer"].concat(__slice.call(arguments)));
};

if (!window.MutationObserver) {
  window.MutationObserver = window.JsMutationObserver;
}

observer = new MutationObserver(function(mutations) {
  LOG("MutationObserver");
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

document.addEventListener("DOMContentLoaded", function(e) {
  GSS.boot();
  LOG("DOMContentLoaded");
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  });
  return GSS.load();
});

module.exports = observer;
