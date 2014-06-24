var Properties;

if (!this.require) {
  this.module || (this.module = {});
  this.require = function(string) {
    var bits;
    bits = string.replace('.js', '').split('/');
    if (string === 'cassowary') {
      return c;
    }
    return this[bits[bits.length - 1]];
  };
}

Properties = (function() {
  function Properties() {}

  Properties.prototype['::window[left]'] = 0;

  Properties.prototype['::window[top]'] = 0;

  Properties.prototype["[right]"] = function(scope) {
    return this.plus(this.get("[left]", scope), this.get("[width]", scope));
  };

  Properties.prototype["[bottom]"] = function(scope) {
    return this.plus(this.get("[top]", scope), this.get("[height]", scope));
  };

  Properties.prototype["[center-x]"] = function(scope) {
    return this.plus(this.get("[left]", scope), this.divide(this.get("[width]", scope), 2));
  };

  Properties.prototype["[center-y]"] = function(scope) {
    return this.plus(this.get("[top]", scope), this.divide(this.get("[height]", scope), 2));
  };

  return Properties;

})();

module.exports = Properties;
