
  var attrModifiedWorks = false;

  var listener = function(){ HTMLElement.attrModifiedWorks = attrModifiedWorks = true; };
  document.documentElement.addEventListener("DOMAttrModified", listener, false);
  document.documentElement.setAttribute("___TEST___", true);
  document.documentElement.removeAttribute("___TEST___", true);
  document.documentElement.removeEventListener("DOMAttrModified", listener, false);

  if (!attrModifiedWorks ) {
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
      if (newVal != prevVal)
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
        console.log(prevVal, newVal, 777)
        evt.prevValue = prevVal
        evt.attrName = attrName
        this.dispatchEvent(evt);
      }
    }
  }