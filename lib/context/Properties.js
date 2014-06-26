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

  Properties.prototype["[right]"] = function(scope, path) {
    return this.plus(this.get(scope, "[x]", path), this.get(scope, "[width]", path));
  };

  Properties.prototype["[bottom]"] = function(scope, path) {
    return this.plus(this.get(scope, "[y]", path), this.get(scope, "[height]", path));
  };

  Properties.prototype["[center-x]"] = function(scope, path) {
    return this.plus(this.get(scope, "[x]", path), this.divide(this.get(scope, "[width]", path), 2));
  };

  Properties.prototype["[center-y]"] = function(scope, path) {
    return this.plus(this.get(scope, "[y]", path), this.divide(this.get(scope, "[height]", path), 2));
  };

  return Properties;

})();

module.exports = Properties;
