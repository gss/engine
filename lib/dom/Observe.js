var getter;

getter = GSS.getter;

if (!window.MutationObserver) {
  window.MutationObserver = window.JsMutationObserver;
}

document.addEventListener("DOMContentLoaded", function(e) {
  var observer;
  observer = new MutationObserver(function(mutations) {
    return getter.readAllStyleNodes();
  });
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  });
  return getter.readAllStyleNodes();
});
