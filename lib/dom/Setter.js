var Setter;

Setter = (function() {
  function Setter(container) {
    this.container = container;
    if (!this.container) {
      this.container = document;
    }
  }

  Setter.prototype.set = function(vars) {
    var dimension, element, gid, key, val, _results;
    _results = [];
    for (key in vars) {
      val = vars[key];
      if (key[0] === "$") {
        gid = key.substring(1, key.indexOf("["));
        dimension = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        element = GSS.getById(gid);
        if (element) {
          _results.push(this.elementSet(element, dimension, val));
        } else {
          _results.push(console.log("Element wasn't found"));
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Setter.prototype.elementSet = function(element, dimension, value) {
    switch (dimension) {
      case 'width':
      case 'w':
        return this.setWidth(element, value);
      case 'height':
      case 'h':
        return this.setHeight(element, value);
      case 'left':
      case 'x':
        return this.setLeft(element, value);
      case 'top':
      case 'y':
        return this.setTop(element, value);
    }
  };

  Setter.prototype.makePositioned = function(element) {
    element.style.position = 'absolute';
    return element.style.margin = '0px';
  };

  Setter.prototype.getOffsets = function(element) {
    var offsets;
    offsets = {
      x: 0,
      y: 0
    };
    if (!element.offsetParent) {
      return offsets;
    }
    element = element.offsetParent;
    while (true) {
      offsets.x += element.offsetLeft;
      offsets.y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets;
  };

  Setter.prototype.setWidth = function(element, value) {
    return element.style.width = "" + value + "px";
  };

  Setter.prototype.setHeight = function(element, value) {
    return element.style.height = "" + value + "px";
  };

  Setter.prototype.setLeft = function(element, value) {
    var offsets;
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.left = "" + (value - offsets.x) + "px";
  };

  Setter.prototype.setTop = function(element, value) {
    var offsets;
    this.makePositioned(element);
    offsets = this.getOffsets(element);
    return element.style.top = "" + (value - offsets.y) + "px";
  };

  /*
  setwithStyleTag: (vars) =>
    if !@_has_setVars_styleTag
      @_has_setVars_styleTag = true
      @container.insertAdjacentHTML('afterbegin','<style data-gss-generated></style>')
      @generatedStyle = @container.childNodes[0]
    html = ""
    for key of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        html += "[data-gss-id=\"#{gid}\"]{#{dimension}:#{vars[key]}px !important;}"
    #@generatedStyle.textContent = html
    @generatedStyle.innerHTML = html
    #console.log @container.childNodes
    #@container.insertAdjacentHTML 'afterbegin', html
  */


  return Setter;

})();

module.exports = Setter;
