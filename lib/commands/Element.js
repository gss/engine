var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.camelize = function(string) {
    return string.toLowerCase().replace(/-([a-z])/gi, function(match) {
      return match[1].toUpperCase();
    });
  };

  Measurements.prototype.dasherize = function(string) {
    return string.replace(/[A-Z]/g, function(match) {
      return '-' + match[0].toLowerCase();
    });
  };

  Measurements.prototype.getStyle = function(element, property) {
    var prop, value;
    prop = this.camelize(property);
    value = element.style[property];
    if (value === '') {
      value = this.measurements.getComputedStyle(element)[prop];
    }
    value = this.toPrimitive(value, null, null, null, element, prop);
    if (value.push && typeof value[0] === 'object') {
      return this.properties[property].apply(this, value);
    } else {
      return this.properties[property].call(this, value);
    }
  };

  Measurements.prototype.setStyle = function(element, property, value) {
    return element.style[property] = value;
  };

  Measurements.prototype.getCommonParent = function(a, b) {
    var ap, aps, bp, bps;
    aps = [];
    bps = [];
    ap = a;
    bp = b;
    while (ap && bp) {
      aps.push(ap);
      bps.push(bp);
      ap = ap.parentNode;
      bp = bp.parentNode;
      if (bps.indexOf(ap) > -1) {
        return ap;
      }
      if (aps.indexOf(bp) > -1) {
        return bp;
      }
    }
    return suggestions;
  };

  return Measurements;

})();

module.exports = Measurements;
