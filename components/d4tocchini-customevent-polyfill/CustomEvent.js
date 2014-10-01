var CustomEvent;

CustomEvent = function(event, params) {
  var evt;
  params = params || {
    bubbles: false,
    cancelable: false,
    detail: undefined
  };
  evt = document.createEvent("CustomEvent");
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

if (typeof window != 'undefined') {
  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
}