
if (typeof window != 'undefined')

(function() {

  // MO is fired, revert overrided methods
  var listener = function(e){ 
    if (e[0].attributeName != '___test___') return
    delete HTMLElement.prototype.removeAttribute
    delete HTMLElement.prototype.__removeAttribute
    delete HTMLElement.prototype.setAttribute
    delete HTMLElement.prototype.__setAttribute
  };

  var observer = new this.MutationObserver(listener);
  var dummy = document.createElement('div')
  observer.observe(dummy, {
      attributes:    true
  });
  dummy.setAttribute("___test___", true);
  setTimeout(function() {
    

    observer.disconnect()
    dummy.removeAttribute('___test___')
  }, 10);

  HTMLElement.prototype.__removeAttribute = HTMLElement.prototype.removeAttribute;
  HTMLElement.prototype.removeAttribute = function(attrName)
  {
    var prevVal = this.getAttribute(attrName);
    this.__removeAttribute(attrName);
    var evt = document.createEvent("MutationEvent");
    evt.initMutationEvent(
      "DOMAttrModified",
      true,
      false,
      this,
      prevVal,
      "",
      attrName,
      evt.REMOVAL
    );
    this.dispatchEvent(evt);
  }

  HTMLElement.prototype.__setAttribute = HTMLElement.prototype.setAttribute

  HTMLElement.prototype.setAttribute = function(attrName, newVal)
  {
    var prevVal = this.getAttribute(attrName);
    this.__setAttribute(attrName, newVal);
    newVal = this.getAttribute(attrName);
    if (newVal !== prevVal)
    {
      var evt = document.createEvent("MutationEvent");
      evt.initMutationEvent(
        "DOMAttrModified",
        true,
        false,
        this,
        prevVal || "",
        newVal || "",
        attrName,
        (prevVal == null) ? evt.ADDITION : evt.MODIFICATION
      );
      evt.prevValue = prevVal
      evt.attrName = attrName
      this.dispatchEvent(evt);
    }
  }

}).call(this);