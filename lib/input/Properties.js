var Properties;

Properties = (function() {
  function Properties() {}

  Properties.prototype['::window[width]'] = function(context) {
    var w;
    w = window.innerWidth;
    if (GSS.config.verticalScroll) {
      w = w - GSS.get.scrollbarWidth();
    }
    if (this.set(context, w)) {
      return ['suggest', ['get', "::window[width]"], ['number', w], 'required'];
    }
  };

  Properties.prototype['::window[height]'] = function(context) {
    var h;
    h = window.innerHeight;
    if (GSS.config.horizontalScroll) {
      h = h - GSS.get.scrollbarWidth();
    }
    if (this.set(context, h)) {
      return ['suggest', ['get', "::window[height]"], ['number', w], 'required'];
    }
  };

  Properties.prototype['::window[x]'] = 0;

  Properties.prototype['::window[y]'] = 0;

  Properties.prototype['::scope[x]'] = 0;

  Properties.prototype['::scope[y]'] = 0;

  Properties.prototype["[right]"] = function(path, node) {
    return this.plus(this._get(node, "x"), this._get(node, "width"));
  };

  Properties.prototype["[bottom]"] = function(path, v) {
    return this.plus(this._get(node, "y"), this._get(node, "height"));
  };

  Properties.prototype["[center-x]"] = function(path, v) {
    return this.plus(this._get(node, "x"), this.divide(this._get(node, "width"), 2));
  };

  Properties.prototype["[center-y]"] = function(path, v) {
    return this.plus(this._get(node, "y"), this.divide(this._get(node, "height"), 2));
  };

  return Properties;

})();

module.exports = Properties;
